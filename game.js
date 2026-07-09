"use strict";
/* =====================================================================
   PRISONER.DILEMMA.BAS — game shell v0.2
   Screens: boot → title → menu → { match | duel | sim | shelf | builder | prompt } → reveal
   ===================================================================== */
const $=id=>document.getElementById(id);

/* ================= SAVE / LOAD ================= */
const SAVE_KEY="gtg_save_v1";
let save={ unlocked:[], customs:[], phos:"green", loud:false };
function loadSave(){
  try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)); if(s) save=Object.assign(save,s); }catch(e){}
  STRATEGIES.filter(s=>s.starter).forEach(s=>{ if(!save.unlocked.includes(s.name)) save.unlocked.push(s.name); });
}
function persist(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(save)); }catch(e){} }
function applyPhos(){ document.body.dataset.phos=save.phos; }

/* ================= CHEAT STATE (session only) ================= */
const cheats={ xray:false, oracle:false, turbo:false, rapoport:false, payoffHacked:false };
let cheatsDirty=false;   // gameplay cheats used → unlocks disabled this session
function markDirty(){ cheatsDirty=true; refreshCheatTags(); }
function refreshCheatTags(){
  document.querySelectorAll(".cheatTag").forEach(el=>{
    el.textContent=cheatsDirty?"CHEAT MODE — COLLECTING DISABLED":"";
  });
}

/* ================= PAYOFFS ================= */
let PAYOFFS={ T:5, R:3, P:1, S:0 };
function payoff(a,b){
  if(a==="C"&&b==="C") return [PAYOFFS.R,PAYOFFS.R];
  if(a==="C") return [PAYOFFS.S,PAYOFFS.T];
  if(b==="C") return [PAYOFFS.T,PAYOFFS.S];
  return [PAYOFFS.P,PAYOFFS.P];
}
function legendText(){
  return `PAYOFFS &nbsp; BOTH COOPERATE: ${PAYOFFS.R}/${PAYOFFS.R} &nbsp;·&nbsp; BOTH DEFECT: ${PAYOFFS.P}/${PAYOFFS.P} &nbsp;·&nbsp; SUCKER'S PAYOFF: DEFECTOR ${PAYOFFS.T}, COOPERATOR ${PAYOFFS.S}`;
}

/* ================= SOUND ================= */
let actx=null, muted=false;
function ensureAudio(){ if(!actx){ try{ actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
function beep(freq, dur=0.07, when=0, type="square", vol=0.05){
  if(muted||!actx) return;
  const t=actx.currentTime+when, o=actx.createOscillator(), g=actx.createGain();
  o.type=type; o.frequency.value=freq;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+dur+0.02);
}
const drv=()=>save.loud?0.22:0.05;
const sfx={
  key:   ()=>beep(1200,0.02,0,"square",0.02),
  blip:  ()=>beep(880,0.04,0,"square",0.03),
  err:   ()=>{ beep(140,0.15,0,"sawtooth",0.06); },
  coop:  ()=>{ beep(523,0.08); beep(784,0.10,0.08); },
  defect:()=>{ beep(196,0.12,0,"sawtooth",0.06); beep(147,0.16,0.10,"sawtooth",0.06); },
  boot:  ()=>{ [262,330,392,523].forEach((f,i)=>beep(f,0.09,i*0.09)); },
  eject: ()=>{ beep(90,0.25,0,"sawtooth",drv()); beep(70,0.3,0.2,"sawtooth",drv()); },
  write: ()=>{ [110,90,120,95,110].forEach((f,i)=>beep(f,0.12,i*0.13,"sawtooth",drv())); },
  jingle:()=>{ [523,659,784,1047,784,1047].forEach((f,i)=>beep(f,0.11,i*0.11)); },
  unlock:()=>{ [659,880,1319].forEach((f,i)=>beep(f,0.1,i*0.1,"triangle",0.06)); }
};

/* ================= SCREENS ================= */
let phase="boot";
const SCREENS=["boot","title","menu","match","duel","sim","shelf","builder","prompt","reveal","standings"];
function goto(id){
  SCREENS.forEach(s=>$(s).classList.toggle("hidden",s!==id));
  phase=id;
  if(id==="menu") renderMenu();
  if(id==="shelf") renderShelf();
  if(id==="sim") renderSimSetup();
  if(id==="prompt") setTimeout(()=>$("promptIn").focus(),50);
}
function renderMenu(){
  $("menuTotal").textContent=STRATEGIES.length;
  const t=save.tourney;
  $("mTour").innerHTML='<span class="k">G&gt;</span> '+((t&&t.active)
    ? (t.idx>=t.order.length
        ? "RESUME TOURNAMENT ...... FINAL STANDINGS AWAIT"
        : `RESUME TOURNAMENT ...... MATCH ${t.idx+1} OF ${t.order.length}`)
    : "TOURNAMENT ............. THE 1980 LADDER — 15 RIVALS");
}

/* ================= BOOT ================= */
let skipBoot=false;
const bootSleep=ms=>new Promise(r=>{
  const t0=Date.now();
  (function poll(){ (skipBoot||Date.now()-t0>=ms) ? r() : setTimeout(poll,20); })();
});
async function typeLine(el,text,cps=4){
  for(const ch of text){
    el.textContent+=ch;
    if(!skipBoot){ if(Math.random()<0.3) sfx.key(); await bootSleep(cps); }
  }
  el.textContent+="\n";
}
async function bootSequence(){
  const el=$("bootText");
  await bootSleep(400);
  await typeLine(el,"GTG SYSTEMS PC-8800 BIOS  v2.4  (C) 1986");
  await typeLine(el,"CPU: 8088 @ 4.77 MHZ ............... OK");
  el.textContent+="MEMORY TEST: ";
  for(let k=64;k<=640;k+=64){
    el.textContent=el.textContent.replace(/\d*K?$/,"")+k+"K";
    if(!skipBoot){ sfx.key(); await bootSleep(90); }
  }
  el.textContent+=" OK\n";
  await typeLine(el,"FLOPPY DRIVE A: 5.25\" ............. OK");
  await typeLine(el,"CRT PHOSPHOR ................ "+save.phos.toUpperCase());
  await typeLine(el,"");
  await bootSleep(300);
  await typeLine(el,"LOADING DOS...");
  await bootSleep(500);
  await typeLine(el,"");
  await typeLine(el,"C:\\>RUN DILEMMA.BAS",30);
  await bootSleep(600);
  sfx.boot();
  goto("title");
}

/* ================= QUICK MATCH (1P) + TOURNAMENT MATCHES ================= */
let cpu=null, cpuState={}, pendingCpu=null, ctx=null, totalRounds=0;
let pMoves=[], cMoves=[], pScore=0, cScore=0, busy=false;
let matchMode="quick", matchNo=0;

function mysteryPool(){
  if(cheats.rapoport){
    const fam=["TIT FOR TAT","GENEROUS TIT FOR TAT","TIT FOR TWO TATS","JOSS"];
    return STRATEGIES.filter(s=>fam.includes(s.name));
  }
  return STRATEGIES;
}
function glyph(m){ return `<span class="m${m}">${m}</span>`; }

function startMatch(opts={}){
  matchMode=opts.tourney?"tourney":"quick";
  if(matchMode==="tourney"){
    const t=save.tourney;
    cpu=STRATEGIES.find(s=>s.name===t.order[t.idx]);
    totalRounds=T_ROUNDS;
    ctx={ known:true, total:totalRounds };
    matchNo=t.idx+1;
  }else{
    const pool=mysteryPool();
    cpu=pool[Math.floor(Math.random()*pool.length)];
    totalRounds=15+Math.floor(Math.random()*11);
    ctx={ known:false, total:totalRounds };
  }
  cpuState={}; pendingCpu=null;
  pMoves=[]; cMoves=[]; pScore=0; cScore=0; busy=false;
  $("roundNum").textContent="1";
  $("roundTotal").textContent = matchMode==="tourney" ? String(totalRounds) : "???";
  $("pScore").textContent="0"; $("cScore").textContent="0";
  $("pHist").innerHTML=""; $("cHist").innerHTML="";
  $("oppName").textContent=cheats.xray?cpu.name:"???";
  $("matchLegend").innerHTML=legendText()+"<br>"+
    (matchMode==="tourney"
      ? `TOURNAMENT MATCH ${matchNo} OF ${save.tourney.order.length} · LENGTH KNOWN: ${totalRounds} ROUNDS. KEYS: C / D · ESC = PAUSE TOURNAMENT`
      : "MATCH LENGTH IS SECRET. KEYS: C / D · ESC = ABANDON");
  $("roundMsg").innerHTML = matchMode==="tourney"
    ? `CHALLENGER ${matchNo} OF ${save.tourney.order.length} HAS CONNECTED.<br>MAKE YOUR CHOICE.`
    : "A MYSTERY OPPONENT HAS CONNECTED.<br>MAKE YOUR CHOICE.";
  refreshCheatTags();
  setButtons(true);
  goto("match");
  primeCpuMove();
}
function primeCpuMove(){
  pendingCpu=cpu.fn(cMoves.slice(),pMoves.slice(),cpuState,ctx);
  $("oracleMsg").textContent=cheats.oracle?`ORACLE: THEY WILL PLAY [${pendingCpu}]`:"";
}
function setButtons(on){ $("coopBtn").disabled=!on; $("defectBtn").disabled=!on; }

async function playRound(pMove){
  if(busy||phase!=="match") return;
  busy=true; setButtons(false);
  const cMove=pendingCpu;
  pMoves.push(pMove); cMoves.push(cMove);
  const [pp,cp]=payoff(pMove,cMove);
  pScore+=pp; cScore+=cp;
  $("pHist").innerHTML+=glyph(pMove);
  $("cHist").innerHTML+=glyph(cMove);
  $("pScore").textContent=pScore; $("cScore").textContent=cScore;
  const lines={
    CC:[`MUTUAL COOPERATION. +${PAYOFFS.R} / +${PAYOFFS.R}`,"coop"],
    DD:[`MUTUAL DEFECTION. +${PAYOFFS.P} / +${PAYOFFS.P}`,"defect"],
    CD:[`YOU WERE BETRAYED! +${PAYOFFS.S} / +${PAYOFFS.T}`,"defect"],
    DC:[`YOU BETRAYED THEM! +${PAYOFFS.T} / +${PAYOFFS.S}`,"coop"],
  }[pMove+cMove];
  $("roundMsg").textContent=lines[0];
  $("oracleMsg").textContent="";
  sfx[lines[1]]();
  await new Promise(r=>setTimeout(r,900));
  if(pMoves.length>=totalRounds){ endQuickMatch(); return; }
  $("roundNum").textContent=pMoves.length+1;
  $("roundMsg").textContent="MAKE YOUR CHOICE.";
  setButtons(true); busy=false;
  primeCpuMove();
}
function endQuickMatch(){
  if(matchMode==="tourney"){
    const t=save.tourney;
    t.results.push({ opp:cpu.name, you:pScore, them:cScore });
    t.idx++; persist();
  }
  showReveal({
    mode:matchMode, opp:cpu, rounds:totalRounds,
    youScore:pScore, oppScore:cScore, youLabel:"YOU", oppLabel:"THEM"
  });
}

/* ================= REVEAL (quick + sim + duel results) ================= */
let lastMode="quick", lastSimDisk=null;
function showReveal(r){
  lastMode=r.mode;
  const isDuel=r.mode==="duel";
  $("revealTop").textContent=isDuel
    ? "*** MATCH COMPLETE ***"
    : r.mode==="tourney"
      ? `*** TOURNAMENT MATCH ${save.tourney.idx} OF ${save.tourney.order.length} COMPLETE — EJECTING OPPONENT DISK ***`
      : "*** CONNECTION TERMINATED — EJECTING OPPONENT DISK ***";
  $("againBtn").textContent =
    r.mode==="tourney" ? (save.tourney.idx>=save.tourney.order.length ? "[ FINAL STANDINGS ]" : "[ NEXT MATCH ]")
    : r.mode==="sim" ? "[ RUN AGAIN ]" : "[ AGAIN ]";
  $("revealFloppy").classList.toggle("hidden",isDuel);
  $("revealPlaque").classList.toggle("hidden",isDuel);
  let unlockLine="";
  if(!isDuel){
    $("revName").textContent=r.opp.name;
    $("revYear").textContent=r.opp.year;
    $("revWho").textContent=r.opp.who;
    $("revDesc").textContent=r.opp.desc;
    // restart eject animation
    const f=$("revealFloppy"); f.style.animation="none"; void f.offsetWidth; f.style.animation="";
    const par=r.rounds*PAYOFFS.R;
    const pct=Math.round(100*r.youScore/par);
    const earned = r.youScore>=r.oppScore || pct>=85;
    if(!cheatsDirty && earned && !r.opp.custom && !save.unlocked.includes(r.opp.name)){
      save.unlocked.push(r.opp.name); persist();
      unlockLine=`NEW DISK ADDED TO YOUR SHELF: ${r.opp.name}`;
      setTimeout(()=>sfx.unlock(),1200);
    } else if(cheatsDirty){
      unlockLine="(CHEAT MODE — NO DISKS COLLECTED)";
    }
  }
  $("unlockNote").textContent=unlockLine;
  $("verdict").innerHTML=buildVerdict(r);
  sfx.eject(); setTimeout(()=>sfx.jingle(),900);
  goto("reveal");
}
function buildVerdict(r){
  const par=r.rounds*PAYOFFS.R;
  const gy=Math.round(100*r.youScore/par), go=Math.round(100*r.oppScore/par);
  const grade=p=> p>=100?"PERFECT TRUST":p>=85?"EXCELLENT":p>=60?"DECENT":p>=40?"ROUGH":"CARNAGE";
  const h2h= r.youScore>r.oppScore?`${r.youLabel} OUTSCORED ${r.oppLabel}`
           : r.youScore<r.oppScore?`${r.oppLabel} OUTSCORED ${r.youLabel}`:"DEAD TIE";
  let html=`MATCH LENGTH WAS <b>${r.rounds}</b> ROUNDS<br>`+
    `FINAL SCORE — ${r.youLabel}: <b>${r.youScore}</b> &nbsp; ${r.oppLabel}: <b>${r.oppScore}</b> &nbsp; (${h2h})<br>`;
  if(r.mode==="duel"){
    html+=`PAR (MUTUAL COOPERATION): <b>${par}</b><br>`+
      `${r.youLabel}: <b>${gy}%</b> OF PAR — ${grade(gy)} &nbsp;·&nbsp; ${r.oppLabel}: <b>${go}%</b> OF PAR — ${grade(go)}<br>`+
      `<span class="dim">UNDER "MAXIMIZE POINTS" RULES, YOU CAN BOTH WIN.</span>`;
  }else{
    html+=`PAR (MUTUAL COOPERATION EVERY ROUND): <b>${par}</b> — ${r.youLabel} SCORED <b>${gy}%</b> OF PAR<br>`+
      `RATING: <b>${grade(gy)}</b>`;
    if(r.mode==="tourney"){
      const t=save.tourney;
      const tot=t.results.reduce((s,x)=>s+x.you,0);
      html+=`<br>YOUR TOURNAMENT TOTAL: <b>${tot}</b> AFTER ${t.idx} OF ${t.order.length} MATCHES`;
    }
  }
  return html;
}
function revealAgain(){
  if(lastMode==="quick") startMatch();
  else if(lastMode==="tourney") tourneyNext();
  else if(lastMode==="duel") startDuel();
  else if(lastMode==="sim") runSim();
}

/* ================= TOURNAMENT ================= */
const T_ROUNDS=20;
let standTimer=null;
function t1Field(){ return STRATEGIES.filter(s=>s.t1); }
function startTournament(){
  if(!(save.tourney&&save.tourney.active)){
    const order=t1Field().map(s=>s.name);
    for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
    save.tourney={ active:true, order, idx:0, results:[] };
    persist();
  }
  tourneyNext();
}
function tourneyNext(){
  const t=save.tourney;
  if(!t||!t.active){ goto("menu"); return; }
  if(t.idx>=t.order.length){ showStandings(); return; }
  startMatch({tourney:true});
}
function simPair(A,B,rounds){
  const stA={}, stB={}, MA=[], MB=[]; let sa=0, sb=0;
  const c={ known:true, total:rounds };
  for(let r=0;r<rounds;r++){
    const a=A.fn(MA.slice(),MB.slice(),stA,c);
    const b=B.fn(MB.slice(),MA.slice(),stB,c);
    MA.push(a); MB.push(b);
    const [pa,pb]=payoff(a,b); sa+=pa; sb+=pb;
  }
  return [sa,sb];
}
function showStandings(){
  const t=save.tourney;
  const field=t1Field();
  const totals={ "YOU":0 };
  field.forEach(s=>totals[s.name]=0);
  t.results.forEach(r=>{ totals["YOU"]+=r.you; totals[r.opp]+=r.them; });
  for(let i=0;i<field.length;i++) for(let j=i+1;j<field.length;j++){
    const [sa,sb]=simPair(field[i],field[j],T_ROUNDS);
    totals[field[i].name]+=sa; totals[field[j].name]+=sb;
  }
  const rows=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  const youRank=rows.findIndex(r=>r[0]==="YOU")+1;
  const lines=[
    "GTG SYSTEMS LINE PRINTER — BATCH JOB #1980",
    "AXELROD MEMORIAL ROUND-ROBIN — FINAL STANDINGS",
    `${rows.length} ENTRANTS · ${T_ROUNDS} ROUNDS PER PAIRING · EVERYONE PLAYS EVERYONE`,
    "=".repeat(52),
    "RANK  ENTRANT                  POINTS"
  ];
  rows.forEach(([name,pts],i)=>{
    lines.push(`${String(i+1).padStart(3)}.  ${name.padEnd(22)} ${String(pts).padStart(6)}${name==="YOU"?"  ◄ YOU":""}`);
  });
  lines.push("=".repeat(52));
  lines.push( youRank===1 ? "YOU WON THE TOURNAMENT. RAPOPORT WOULD BE PROUD."
    : youRank<=3 ? "PODIUM FINISH — THE PROFESSORS ARE IMPRESSED."
    : youRank<=8 ? "MID-TABLE. RESPECTABLE. TIT FOR TAT SMIRKS."
    : "THE FIELD ATE YOU ALIVE. STUDY THE PLAQUES AND TRY AGAIN.");
  save.tourney={ active:false }; persist();
  $("standingsOut").textContent="";
  $("tBtns").classList.add("hidden");
  goto("standings");
  let i=0;
  standTimer=setInterval(()=>{
    if(i>=lines.length){
      clearInterval(standTimer); standTimer=null;
      $("tBtns").classList.remove("hidden"); sfx.jingle(); return;
    }
    $("standingsOut").textContent+=lines[i++]+"\n";
    sfx.key();
    $("standingsOut").scrollTop=$("standingsOut").scrollHeight;
  },140);
}

/* ================= 2-PLAYER DUEL ================= */
const duel={ m1:[], m2:[], s1:0, s2:0, lock1:null, lock2:null, total:0, busy:false };
function startDuel(){
  duel.m1=[]; duel.m2=[]; duel.s1=0; duel.s2=0;
  duel.lock1=null; duel.lock2=null;
  duel.total=15+Math.floor(Math.random()*11);
  duel.busy=false;
  $("dRound").textContent="1";
  $("d1Score").textContent="0"; $("d2Score").textContent="0";
  $("d1Hist").innerHTML=""; $("d2Hist").innerHTML="";
  $("duelMsg").innerHTML="MATCH LENGTH IS SECRET.<br>P1: A=COOPERATE S=DEFECT &nbsp;·&nbsp; P2: K=COOPERATE L=DEFECT";
  $("duelLegend").innerHTML=legendText()+"<br>ESC = ABANDON";
  updateLockRow();
  goto("duel");
}
function updateLockRow(){
  $("lock1").innerHTML="P1: "+(duel.lock1?'<span class="locked">LOCKED IN</span>':"CHOOSING...");
  $("lock2").innerHTML="P2: "+(duel.lock2?'<span class="locked">LOCKED IN</span>':"CHOOSING...");
}
function duelLock(player,move){
  if(duel.busy||phase!=="duel") return;
  if(player===1){ if(duel.lock1) return; duel.lock1=move; }
  else{ if(duel.lock2) return; duel.lock2=move; }
  sfx.key(); updateLockRow();
  if(duel.lock1&&duel.lock2) resolveDuelRound();
}
async function resolveDuelRound(){
  duel.busy=true;
  const a=duel.lock1, b=duel.lock2;
  duel.m1.push(a); duel.m2.push(b);
  const [pa,pb]=payoff(a,b);
  duel.s1+=pa; duel.s2+=pb;
  $("d1Hist").innerHTML+=glyph(a); $("d2Hist").innerHTML+=glyph(b);
  $("d1Score").textContent=duel.s1; $("d2Score").textContent=duel.s2;
  $("duelMsg").textContent=`P1 PLAYED ${a} · P2 PLAYED ${b} — P1 +${pa} / P2 +${pb}`;
  sfx[a==="C"&&b==="C"?"coop":"defect"]();
  await new Promise(r=>setTimeout(r,1100));
  if(duel.m1.length>=duel.total){
    showReveal({ mode:"duel", rounds:duel.total,
      youScore:duel.s1, oppScore:duel.s2, youLabel:"P1", oppLabel:"P2" });
    return;
  }
  duel.lock1=null; duel.lock2=null; duel.busy=false;
  $("dRound").textContent=duel.m1.length+1;
  $("duelMsg").textContent="MAKE YOUR CHOICES.";
  updateLockRow();
}

/* ================= SIMULATION (Mode 2 lite) ================= */
let simTimer=null;
function allPlayerDisks(){
  const classics=STRATEGIES.filter(s=>save.unlocked.includes(s.name));
  const customs=save.customs.map(customToStrategy);
  return classics.concat(customs);
}
function renderSimSetup(){
  const sel=$("simDisk");
  const disks=allPlayerDisks();
  sel.innerHTML=disks.map((d,i)=>`<option value="${i}">${d.custom?"[CUSTOM] ":""}${d.name}</option>`).join("");
  $("simStatus").innerHTML="CHOOSE YOUR DISK AND PRESS RUN.<br><span class='dim'>YOUR STRATEGY WILL FACE A MYSTERY OPPONENT.</span>";
  $("simLegend").innerHTML=legendText()+"<br>ESC = MENU"+(cheats.turbo?" · <span class='cheatTag'>TURBO</span>":"");
  $("sRound").textContent="0"; $("s1Score").textContent="0"; $("s2Score").textContent="0";
  $("s1Hist").innerHTML=""; $("s2Hist").innerHTML="";
  $("simYouName").textContent="—"; $("simLenLabel").textContent="";
  refreshCheatTags();
}
function runSim(){
  if(simTimer){ clearInterval(simTimer); simTimer=null; }
  const disks=allPlayerDisks();
  const mine=disks[Number($("simDisk").value)]||disks[0];
  lastSimDisk=mine;
  const classic=$("simLen").value==="classic";
  const total= classic?200 : 150+Math.floor(Math.random()*151);
  const simCtx={ known:classic, total:total };
  const pool=mysteryPool().filter(s=>s.name!==mine.name);
  const opp=pool[Math.floor(Math.random()*pool.length)];
  const stA={}, stB={}, A=[], B=[];
  let sA=0, sB=0;
  $("simYouName").textContent=mine.name;
  $("simLenLabel").textContent=classic?"— 200 ROUNDS (KNOWN)":"— SECRET LENGTH";
  $("s1Hist").innerHTML=""; $("s2Hist").innerHTML="";
  $("simStatus").textContent="RUNNING BATCH JOB...";
  const step=()=>{
    const a=mine.fn(A.slice(),B.slice(),stA,simCtx);
    const b=opp.fn(B.slice(),A.slice(),stB,simCtx);
    A.push(a); B.push(b);
    const [pa,pb]=payoff(a,b);
    sA+=pa; sB+=pb;
    return { a,b };
  };
  const draw=()=>{
    $("sRound").textContent=A.length;
    $("s1Score").textContent=sA; $("s2Score").textContent=sB;
    $("s1Hist").innerHTML=A.slice(-40).map(m=>glyph(m).replace("<span","<span")).join("");
    $("s2Hist").innerHTML=B.slice(-40).map(m=>glyph(m)).join("");
  };
  const finish=()=>{
    if(simTimer){ clearInterval(simTimer); simTimer=null; }
    draw();
    showReveal({ mode:"sim", opp:opp, rounds:total,
      youScore:sA, oppScore:sB, youLabel:`YOUR DISK (${mine.name})`, oppLabel:"THEM" });
  };
  if(cheats.turbo){
    while(A.length<total) step();
    finish();
  }else{
    simTimer=setInterval(()=>{
      for(let i=0;i<2 && A.length<total;i++) step();
      draw();
      if(Math.random()<0.15) sfx.key();
      if(A.length>=total) finish();
    },100);
  }
}

/* ================= DISK SHELF ================= */
function renderShelf(){
  const total=STRATEGIES.length;
  const got=save.unlocked.length;
  $("shelfCount").textContent=`${got}/${total} CLASSIC DISKS COLLECTED`;
  const grid=$("classicGrid");
  grid.innerHTML="";
  STRATEGIES.forEach(s=>{
    const has=save.unlocked.includes(s.name);
    const d=document.createElement("div");
    d.className="mini"+(has?"":" locked");
    d.innerHTML=`<div class="lbl">${has?s.name:"?????"}</div><div class="hub2"></div>`;
    d.addEventListener("click",()=>{
      sfx.blip();
      $("plaquePanel").innerHTML = has
        ? `<b>${s.name}</b> (${s.year})<br><span class="dim">${s.who}</span><br>${s.desc}`
        : `<b>UNKNOWN DISK</b><br><span class="dim">FACE IT IN A MATCH AND DO WELL TO COLLECT IT.</span>`;
    });
    grid.appendChild(d);
  });
  const cg=$("customGrid");
  cg.innerHTML="";
  if(!save.customs.length){
    cg.innerHTML=`<div class="dim" style="grid-column:1/-1">NO CUSTOM DISKS YET — WRITE ONE IN THE STRATEGY LAB.</div>`;
  }
  save.customs.forEach((c,idx)=>{
    const d=document.createElement("div");
    d.className="mini custom";
    d.innerHTML=`<div class="lbl">${c.name}</div><div class="hub2"></div>`;
    d.addEventListener("click",()=>{
      sfx.blip();
      $("plaquePanel").innerHTML=`<b>${c.name}</b> (CUSTOM)<br>${customDescribe(c.params)}<br>`+
        `<a class="smallBtn" style="font-size:.8em;display:inline-block;margin-top:.5em" id="delDisk">[ ERASE DISK ]</a>`;
      $("delDisk").addEventListener("click",()=>{
        save.customs.splice(idx,1); persist(); sfx.err(); renderShelf();
        $("plaquePanel").innerHTML=`<span class="dim">DISK ERASED.</span>`;
      });
    });
    cg.appendChild(d);
  });
}

/* ================= STRATEGY BUILDER ================= */
function writeDisk(){
  const name=$("bName").value.trim().toUpperCase().slice(0,14);
  if(!name){ $("builderMsg").textContent="ERROR: DISK NEEDS A LABEL."; sfx.err(); return; }
  if(save.customs.some(c=>c.name===name)||STRATEGIES.some(s=>s.name===name)){
    $("builderMsg").textContent="ERROR: A DISK WITH THAT LABEL EXISTS."; sfx.err(); return;
  }
  const params={
    first:$("bFirst").value,
    retaliation:$("bRetal").value,
    punish:Number($("bPunish").value),
    mercy:Number($("bMercy").value),
    sneak:Number($("bSneak").value),
    endK:Number($("bEnd").value)
  };
  save.customs.push({name,params}); persist();
  sfx.write();
  $("builderMsg").textContent=`WRITING ${name}.USR TO DISK... DONE. CHECK YOUR SHELF.`;
  $("bName").value="";
}

/* ================= C:\> PROMPT ================= */
function promptPrint(text){ $("promptOut").textContent+=text+"\n"; $("promptOut").scrollTop=$("promptOut").scrollHeight; }
function fileName(n,ext){ return n.replace(/[^A-Z0-9]/g,"").slice(0,8)+"."+ext; }
function runCommand(raw){
  const cmd=raw.trim().toUpperCase().replace(/\s+/g," ");
  promptPrint("C:\\>"+raw);
  if(!cmd) return;
  const arg=cmd.split(" ").slice(1).join(" ");
  switch(cmd.split(" ")[0]){
    case "HELP":
      promptPrint(
`DILEMMA DOS 2.4 — COMMANDS:
 HELP  DIR  CLS  EXIT
 RUN DILEMMA.BAS ......... PLAY
 GREEN / AMBER / WHITE ... CRT PHOSPHOR
 TURBO ................... FAST SIMULATIONS
 LOUD .................... DRIVE VOLUME

SOME COMMANDS ARE NOT LISTED.
MAGAZINES USED TO PRINT THEM. ASK AROUND.`); sfx.blip(); break;
    case "DIR":{
      const rows=save.unlocked.map(n=>" "+fileName(n,"STR"))
        .concat(save.customs.map(c=>" "+fileName(c.name,"USR")));
      promptPrint("VOLUME IN DRIVE A IS STRATEGIES\n"+rows.join("\n")+`\n ${rows.length} FILE(S)`); sfx.blip(); break; }
    case "CLS": $("promptOut").textContent=""; break;
    case "EXIT": sfx.blip(); goto("menu"); break;
    case "RUN": sfx.boot(); startMatch(); break;
    case "GREEN": case "AMBER": case "WHITE":
      save.phos=cmd.toLowerCase(); persist(); applyPhos();
      promptPrint("CRT PHOSPHOR SET: "+cmd); sfx.blip(); break;
    case "TURBO":
      cheats.turbo=!cheats.turbo;
      promptPrint("TURBO "+(cheats.turbo?"ON — SIMULATIONS RUN INSTANTLY":"OFF")); sfx.blip(); break;
    case "LOUD":
      save.loud=!save.loud; persist();
      promptPrint("DRIVE VOLUME: "+(save.loud?"ABSURD":"NORMAL")); if(save.loud) sfx.eject(); break;
    case "UNLOCK":{
      let add=[];
      if(arg==="ALL") add=STRATEGIES.map(s=>s.name);
      else if(arg==="1980") add=STRATEGIES.filter(s=>s.era==="1980").map(s=>s.name);
      else if(arg==="NASTY") add=STRATEGIES.filter(s=>s.nasty).map(s=>s.name);
      else{ promptPrint("UNLOCK WHAT? TRY: ALL / 1980 / NASTY"); sfx.err(); break; }
      const fresh=add.filter(n=>!save.unlocked.includes(n));
      fresh.forEach(n=>save.unlocked.push(n)); persist();
      promptPrint(fresh.length? fresh.length+" DISK(S) ADDED TO YOUR SHELF.":"NOTHING NEW TO UNLOCK.");
      if(fresh.length) sfx.unlock(); else sfx.blip(); break; }
    case "XRAY":
      cheats.xray=!cheats.xray; if(cheats.xray) markDirty();
      promptPrint("XRAY "+(cheats.xray?"ON — OPPONENT IDENTITY VISIBLE. COLLECTING DISABLED THIS SESSION.":"OFF")); sfx.blip(); break;
    case "ORACLE":
      cheats.oracle=!cheats.oracle; if(cheats.oracle) markDirty();
      promptPrint("ORACLE "+(cheats.oracle?"ON — YOU WILL SEE THEIR NEXT MOVE. COLLECTING DISABLED THIS SESSION.":"OFF")); sfx.blip(); break;
    case "PAYOFF":{
      const nums=arg.split(/[ ,]+/).map(Number);
      if(nums.length!==4||nums.some(isNaN)){ promptPrint("USAGE: PAYOFF T,R,P,S   (DEFAULT: 5,3,1,0)"); sfx.err(); break; }
      PAYOFFS={T:nums[0],R:nums[1],P:nums[2],S:nums[3]}; markDirty();
      promptPrint(`PAYOFF MATRIX REWRITTEN: T=${nums[0]} R=${nums[1]} P=${nums[2]} S=${nums[3]}. COLLECTING DISABLED THIS SESSION.`); sfx.blip(); break; }
    case "RAPOPORT":
      cheats.rapoport=true; markDirty();
      promptPrint("THE PROFESSOR SMILES. OPPONENT POOL: THE TIT FOR TAT FAMILY. COLLECTING DISABLED THIS SESSION."); sfx.jingle(); break;
    default:
      promptPrint("BAD COMMAND OR FILE NAME"); sfx.err();
  }
}

/* ================= INPUT WIRING ================= */
document.addEventListener("keydown",e=>{
  ensureAudio();
  if(phase==="prompt") return;             // handled by the input field
  const k=e.key.toLowerCase();
  if(phase==="boot"){ skipBoot=true; return; }
  if(phase==="title"){ sfx.boot(); goto("menu"); return; }
  if(phase==="menu"){
    const map={a:()=>startMatch(),b:()=>startDuel(),c:()=>goto("shelf"),d:()=>goto("builder"),e:()=>goto("sim"),f:()=>goto("prompt"),g:()=>startTournament()};
    if(map[k]){ sfx.blip(); map[k](); }
    return;
  }
  if(k==="escape"){
    if(["match","duel","sim","shelf","builder","reveal","standings"].includes(phase)){
      if(simTimer){ clearInterval(simTimer); simTimer=null; }
      if(standTimer){ clearInterval(standTimer); standTimer=null; }
      sfx.blip(); goto("menu");
    }
    return;
  }
  if(phase==="match"){
    if(k==="c") playRound("C");
    if(k==="d") playRound("D");
  }
  if(phase==="duel"){
    if(k==="a") duelLock(1,"C");
    if(k==="s") duelLock(1,"D");
    if(k==="k") duelLock(2,"C");
    if(k==="l") duelLock(2,"D");
  }
  if(phase==="reveal" && (k==="enter"||k===" ")) revealAgain();
});
document.addEventListener("click",e=>{
  ensureAudio();
  if(phase==="boot"){ skipBoot=true; return; }
  if(phase==="title" && !e.target.closest("#mute")){ sfx.boot(); goto("menu"); }
});

function wire(){
  $("mute").addEventListener("click",e=>{
    muted=!muted; e.target.textContent="SND: "+(muted?"OFF":"ON");
  });
  // menu
  $("mQuick").addEventListener("click",()=>{ sfx.blip(); startMatch(); });
  $("mDuel").addEventListener("click",()=>{ sfx.blip(); startDuel(); });
  $("mShelf").addEventListener("click",()=>{ sfx.blip(); goto("shelf"); });
  $("mBuild").addEventListener("click",()=>{ sfx.blip(); goto("builder"); });
  $("mSim").addEventListener("click",()=>{ sfx.blip(); goto("sim"); });
  $("mPrompt").addEventListener("click",()=>{ sfx.blip(); goto("prompt"); });
  $("mTour").addEventListener("click",()=>{ sfx.blip(); startTournament(); });
  // standings
  $("tNew").addEventListener("click",()=>{ sfx.blip(); startTournament(); });
  $("tMenu").addEventListener("click",()=>{ sfx.blip(); goto("menu"); });
  // match
  $("coopBtn").addEventListener("click",e=>{ e.stopPropagation(); playRound("C"); });
  $("defectBtn").addEventListener("click",e=>{ e.stopPropagation(); playRound("D"); });
  // duel touch buttons
  $("d1c").addEventListener("click",()=>duelLock(1,"C"));
  $("d1d").addEventListener("click",()=>duelLock(1,"D"));
  $("d2c").addEventListener("click",()=>duelLock(2,"C"));
  $("d2d").addEventListener("click",()=>duelLock(2,"D"));
  // sim
  $("simRun").addEventListener("click",()=>{ sfx.blip(); runSim(); });
  // builder
  $("writeDisk").addEventListener("click",writeDisk);
  // reveal
  $("againBtn").addEventListener("click",e=>{ e.stopPropagation(); revealAgain(); });
  $("menuBtn").addEventListener("click",e=>{ e.stopPropagation(); sfx.blip(); goto("menu"); });
  // prompt input
  $("promptIn").addEventListener("keydown",e=>{
    ensureAudio();
    if(e.key==="Enter"){ runCommand($("promptIn").value); $("promptIn").value=""; }
    else if(e.key==="Escape"){ sfx.blip(); goto("menu"); }
    else sfx.key();
  });
  // back links
  document.querySelectorAll(".goMenu").forEach(a=>a.addEventListener("click",()=>{
    if(simTimer){ clearInterval(simTimer); simTimer=null; }
    sfx.blip(); goto("menu");
  }));
}

/* ================= INIT ================= */
loadSave(); applyPhos();
document.addEventListener("DOMContentLoaded",()=>{ wire(); bootSequence(); });
