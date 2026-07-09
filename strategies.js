"use strict";
/* =====================================================================
   PRISONER.DILEMMA.BAS — strategy library
   Each strategy: fn(myMoves, theirMoves, state, ctx) -> 'C' | 'D'
     state = fresh {} per match (for strategies that need memory)
     ctx   = { known: bool, total: number }  (match length info)
   era:   "1980" = Axelrod Tournament 1 era (unlocked by UNLOCK 1980)
   nasty: defects first / exploits (unlocked by UNLOCK NASTY)
   starter: unlocked from the beginning
   ===================================================================== */
const STRATEGIES=[
  { name:"TIT FOR TAT", year:"1980", era:"1980", t1:true, starter:true,
    who:"Submitted by Anatol Rapoport — winner of BOTH Axelrod tournaments",
    desc:"Cooperates on the first move, then simply copies whatever you did last round. Nice, retaliatory, forgiving, and clear — the champion.",
    fn:(me,them)=> them.length ? them[them.length-1] : "C" },

  { name:"GRUDGER", year:"1980", era:"1980", t1:true,
    who:"Submitted by James W. Friedman — Axelrod Tournament 1",
    desc:"Cooperates until you defect even once... then punishes you forever. Nice, but utterly unforgiving.",
    fn:(me,them)=> them.includes("D") ? "D" : "C" },

  { name:"JOSS", year:"1980", era:"1980", t1:true, nasty:true,
    who:"Submitted by Johann Joss — Axelrod Tournament 1",
    desc:"Tit for Tat with a nasty streak: roughly 1 time in 10 it sneaks in a defection where it would have cooperated. The sneakiness backfired — it triggered long feuds.",
    fn:(me,them)=>{ const t=them.length?them[them.length-1]:"C"; return (t==="C"&&Math.random()<0.1)?"D":t; } },

  { name:"DAVIS", year:"1980", era:"1980", t1:true,
    who:"Submitted by Morton Davis — Axelrod Tournament 1",
    desc:"Cooperates unconditionally for the first 10 rounds, then turns into Grudger: one defection from you and it never forgives.",
    fn:(me,them)=> me.length<10 ? "C" : (them.includes("D")?"D":"C") },

  { name:"FELD", year:"1980", era:"1980", t1:true, nasty:true,
    who:"Submitted by Scott Feld — Axelrod Tournament 1",
    desc:"Plays Tit for Tat, but its goodwill decays: its chance of cooperating slowly erodes from 100% toward 50% as the match wears on.",
    fn:(me,them)=>{
      if(!them.length) return "C";
      if(them[them.length-1]==="D") return "D";
      const p=Math.max(0.5, 1 - me.length*0.0025);
      return Math.random()<p ? "C" : "D";
    } },

  { name:"TULLOCK", year:"1980", era:"1980", t1:true, nasty:true,
    who:"Submitted by Gordon Tullock — Axelrod Tournament 1",
    desc:"Cooperates for 11 rounds, then cooperates 10% LESS than you did over the previous 10 rounds. Passive-aggressive by design.",
    fn:(me,them)=>{
      if(me.length<11) return "C";
      const w=them.slice(-10);
      const rate=w.filter(m=>m==="C").length/w.length;
      return Math.random() < Math.max(0,rate-0.10) ? "C" : "D";
    } },

  { name:"SHUBIK", year:"1980", era:"1980", t1:true,
    who:"Submitted by Martin Shubik — Axelrod Tournament 1",
    desc:"Escalating justice: each time you betray its cooperation, it retaliates one round LONGER than the last time.",
    fn:(me,them,st)=>{
      st.k=st.k||0; st.left=st.left||0;
      if(st.left>0){ st.left--; return "D"; }
      const n=me.length;
      if(n && them[n-1]==="D" && me[n-1]==="C"){ st.k++; st.left=st.k-1; return "D"; }
      return "C";
    } },

  { name:"GROFMAN", year:"1980", era:"1980", t1:true,
    who:"Submitted by Bernard Grofman — Axelrod Tournament 1",
    desc:"If you both did the same thing last round, it cooperates. If you disagreed, it cooperates with probability 2/7. A peculiar peace formula.",
    fn:(me,them)=>{
      if(!me.length) return "C";
      if(me[me.length-1]===them[them.length-1]) return "C";
      return Math.random()<2/7 ? "C" : "D";
    } },

  { name:"NYDEGGER", year:"1980", era:"1980", t1:true,
    who:"Submitted by Rudy Nydegger — Axelrod Tournament 1",
    desc:"A mathematical oddball: it encodes the last three rounds into a number from 0 to 63 and defects only on 19 specific patterns. Nobody fully understands its personality.",
    fn:(me,them)=>{
      const n=me.length;
      if(n===0) return "C";
      if(n===1) return them[0];
      if(n===2){
        if(me[0]==="C"&&them[0]==="D"&&me[1]==="D"&&them[1]==="C") return "D";
        return them[1];
      }
      const val=(a,b)=> a==="C" ? (b==="C"?0:2) : (b==="C"?1:3);
      const A=16*val(me[n-1],them[n-1])+4*val(me[n-2],them[n-2])+val(me[n-3],them[n-3]);
      return [1,6,7,17,22,23,26,29,30,31,33,38,39,45,49,54,55,58,61].includes(A) ? "D" : "C";
    } },

  { name:"STEIN & RAPOPORT", year:"1980", era:"1980", t1:true,
    who:"Submitted by William Stein & Amnon Rapoport — Axelrod Tournament 1 (simplified here)",
    desc:"Opens with 4 cooperations, then plays Tit for Tat — while statistically testing whether you're just random (and if so, punishing you forever). Betrays in the final 2 rounds when the end is known.",
    fn:(me,them,st,ctx)=>{
      const n=me.length;
      if(ctx&&ctx.known&&(ctx.total-n)<=2) return "D";
      if(n<4) return "C";
      if(!st.judgedRandom && n>=30 && n%15===0){
        const c=them.filter(m=>m==="C").length/them.length;
        let follow=0,chances=0;
        for(let i=1;i<them.length;i++){ chances++; if(them[i]===me[i-1]) follow++; }
        if(c>0.4 && c<0.6 && chances && follow/chances<0.6) st.judgedRandom=true;
      }
      if(st.judgedRandom) return "D";
      return them[n-1];
    } },

  { name:"TIDEMAN & CHIERUZZI", year:"1980", era:"1980", t1:true,
    who:"Submitted by T. Nicolaus Tideman & Paula Chieruzzi — Axelrod Tournament 1 (simplified here)",
    desc:"Escalating punishment like Shubik — but with a heart: if you fall far behind and behave yourself, it wipes the slate clean and offers a fresh start.",
    fn:(me,them,st)=>{
      st.k=st.k||0; st.left=st.left||0; st.myPts=st.myPts||0; st.opPts=st.opPts||0;
      const n=me.length;
      if(n){
        const a=me[n-1], b=them[n-1];
        st.myPts += a==="C" ? (b==="C"?3:0) : (b==="C"?5:1);
        st.opPts += b==="C" ? (a==="C"?3:0) : (a==="C"?5:1);
      }
      if(st.left===0 && st.k>0 && st.opPts+10<=st.myPts &&
         n>=2 && them[n-1]==="C" && them[n-2]==="C"){ st.k=0; return "C"; }
      if(st.left>0){ st.left--; return "D"; }
      if(n && them[n-1]==="D" && me[n-1]==="C"){ st.k++; st.left=st.k-1; return "D"; }
      return "C";
    } },

  { name:"GRAASKAMP", year:"1980", era:"1980", t1:true, nasty:true,
    who:"Submitted by John Graaskamp — Axelrod Tournament 1 (simplified here)",
    desc:"Plays Tit for Tat for 50 rounds, throws one probe defection on round 51, then keeps testing you with a surprise defection every 5–15 rounds. In short matches it behaves itself.",
    fn:(me,them,st)=>{
      const n=me.length;
      if(n===0) return "C";
      if(n===50) return "D";
      if(n>55){
        st.next=st.next||(n+5+Math.floor(Math.random()*11));
        if(n>=st.next){ st.next=n+5+Math.floor(Math.random()*11); return "D"; }
      }
      return them[n-1];
    } },

  { name:"DOWNING", year:"1980", era:"1980", t1:true, nasty:true,
    who:"Submitted by Leslie Downing — Axelrod Tournament 1 (simplified here)",
    desc:"The scientist: it builds a live statistical model of how YOU respond to it, then picks whichever move its model says will pay more. Its cold opening — two defections — made everyone hate it.",
    fn:(me,them,st)=>{
      const n=me.length;
      if(n<2) return "D";
      st.pc=st.pc??1; st.pt=st.pt??2;   // P(they cooperate | I cooperated)
      st.qc=st.qc??1; st.qt=st.qt??2;   // P(they cooperate | I defected)
      st.seen=st.seen??1;
      for(let i=st.seen;i<n;i++){
        if(me[i-1]==="C"){ st.pt++; if(them[i]==="C") st.pc++; }
        else { st.qt++; if(them[i]==="C") st.qc++; }
      }
      st.seen=n;
      const eC=3*(st.pc/st.pt), eD=1+4*(st.qc/st.qt);
      return eC>eD ? "C" : "D";
    } },

  { name:"NAME WITHHELD", year:"1980", era:"1980", t1:true,
    who:"Submitted anonymously — Axelrod Tournament 1",
    desc:"Its author never revealed themselves. It cooperates with a probability that drifts unpredictably between 30% and 70%. A masked stranger with a coin that isn't quite fair.",
    fn:()=> Math.random() < 0.3+Math.random()*0.4 ? "C" : "D" },

  { name:"TIT FOR TWO TATS", year:"1980", era:"1980",
    who:"Robert Axelrod's own observation — the strategy that WOULD have won Tournament 1, had anyone submitted it",
    desc:"Only retaliates after TWO defections in a row — immune to accidental feuds. Axelrod published this fact... and it still didn't win Tournament 2.",
    fn:(me,them)=>{
      const n=them.length;
      return (n>=2 && them[n-1]==="D" && them[n-2]==="D") ? "D" : "C";
    } },

  { name:"TESTER", year:"1982", era:"1982", nasty:true,
    who:"Submitted by David Gladstein — Axelrod Tournament 2 (simplified here)",
    desc:"Defects immediately to test you. If you strike back, it apologizes and plays Tit for Tat. If you don't, it exploits you every other round.",
    fn:(me,them,st)=>{
      if(me.length===0) return "D";
      if(!st.tft && them.includes("D")){ st.tft=true; st.apology=2; }
      if(st.tft){ if(st.apology>0){ st.apology--; return "C"; } return them[them.length-1]; }
      if(me.length<3) return "C";
      return me[me.length-1]==="D" ? "C" : "D";
    } },

  { name:"PAVLOV", year:"1993", era:"modern",
    who:"Nowak & Sigmund — 'Win-Stay, Lose-Shift'",
    desc:"If last round went well (opponent cooperated), it repeats its own move. If it went badly, it switches. A famous post-Axelrod discovery.",
    fn:(me,them)=>{ if(!me.length) return "C";
      return them[them.length-1]==="C" ? me[me.length-1] : (me[me.length-1]==="C"?"D":"C"); } },

  { name:"GENEROUS TIT FOR TAT", year:"1992", era:"modern",
    who:"Nowak & Sigmund — the noise-proof evolution of Tit for Tat",
    desc:"Copies your last move like Tit for Tat, but forgives a defection about 1 time in 3 — which prevents endless revenge spirals.",
    fn:(me,them)=>{
      if(!them.length) return "C";
      if(them[them.length-1]==="C") return "C";
      return Math.random()<1/3 ? "C" : "D";
    } },

  { name:"GRADUAL", year:"1996", era:"modern",
    who:"Beaufils, Delahaye & Mathieu — beat Tit for Tat in round-robin studies",
    desc:"Punishes your Nth betrayal with exactly N defections, then offers two rounds of peace. Justice with a calibrated memory.",
    fn:(me,them,st)=>{
      st.seq=st.seq||[]; st.n=st.n||0;
      if(st.seq.length) return st.seq.shift();
      if(them.length && them[them.length-1]==="D"){
        st.n++;
        st.seq=Array(st.n).fill("D").concat(["C","C"]);
        return st.seq.shift();
      }
      return "C";
    } },

  { name:"PROBER", year:"1993", era:"modern", nasty:true,
    who:"From Nowak & Sigmund's strategy studies",
    desc:"Opens D, C, C to probe you. If you didn't punish the opening defection, it exploits you forever. If you did, it politely plays Tit for Tat.",
    fn:(me,them,st)=>{
      if(me.length===0) return "D";
      if(me.length===1||me.length===2) return "C";
      if(st.decided===undefined) st.decided = (them[1]==="C" && them[2]==="C") ? "exploit" : "tft";
      return st.decided==="exploit" ? "D" : them[them.length-1];
    } },

  { name:"ALWAYS DEFECT", year:"1950", era:"classic", nasty:true, starter:true,
    who:"The 'rational' strategy of classical game theory (RAND Corporation era)",
    desc:"Never cooperates, no matter what. Provably optimal in a ONE-SHOT game — and a disaster in a repeated one.",
    fn:()=>"D" },

  { name:"ALWAYS COOPERATE", year:"1950", era:"classic", starter:true,
    who:"The saint",
    desc:"Cooperates every round regardless of your behavior. Heartwarming, and heartbreakingly exploitable.",
    fn:()=>"C" },

  { name:"RANDOM", year:"1980", era:"1980", t1:true, starter:true,
    who:"Included by Axelrod as a baseline — Tournament 1",
    desc:"Flips a coin every round. Nearly every serious strategy beat it. If your opponent seemed to make no sense... this was why.",
    fn:()=>Math.random()<0.5?"C":"D" },
];

/* ---- custom strategy factory (from the disk builder) ----
   params: { first:'C'|'D', retaliation:'never'|'immediate'|'two'|'grudge',
             punish:1..3, mercy:0..1, sneak:0..1, endK:0..3 }          */
function makeCustomFn(p){
  return (me,them,st,ctx)=>{
    if(me.length===0) return p.first;
    if(p.endK>0 && ctx && ctx.known && (ctx.total-me.length)<=p.endK) return "D";
    if(st.grudge) return "D";
    if(st.left>0){ st.left--; return "D"; }
    const n=them.length;
    const last = them[n-1]==="D";
    const two  = n>=2 && last && them[n-2]==="D";
    if(p.retaliation==="grudge" && last){ st.grudge=true; return "D"; }
    const trigger = p.retaliation==="immediate" ? last
                  : p.retaliation==="two"       ? two : false;
    if(trigger && Math.random()>=p.mercy){ st.left=p.punish-1; return "D"; }
    if(Math.random()<p.sneak) return "D";
    return "C";
  };
}
function customToStrategy(c){
  return { name:c.name, year:"CUSTOM", era:"custom",
    who:"Written by you, on this very machine",
    desc:customDescribe(c.params), fn:makeCustomFn(c.params), custom:true, params:c.params };
}
function customDescribe(p){
  const bits=[];
  bits.push(p.first==="C"?"Opens with cooperation.":"Opens with a defection.");
  bits.push({never:"Never retaliates.",immediate:"Retaliates immediately",two:"Retaliates after 2 defections in a row",grudge:"Holds a grudge forever once betrayed."}[p.retaliation]);
  if(p.retaliation==="immediate"||p.retaliation==="two"){
    bits.push(`(punishment: ${p.punish} round${p.punish>1?"s":""}${p.mercy>0?`, ${Math.round(p.mercy*100)}% mercy`:""}).`);
  }
  if(p.sneak>0) bits.push(`Sneaks in a random defection ${Math.round(p.sneak*100)}% of the time.`);
  if(p.endK>0) bits.push(`Betrays in the final ${p.endK} round${p.endK>1?"s":""} when the match length is known.`);
  return bits.join(" ");
}
