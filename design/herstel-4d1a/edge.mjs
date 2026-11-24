const ROOT=process.argv[2];
const { shootAll } = await import('/home/claude/dartsbytom/tests/visual/shoot.mjs');
const H="state.history=[];for(var i=0;i<4;i++)for(var k=0;k<state.players.length;k++)state.history.push({player:k,score:[100,60,81,45][i]});";
const SC=[
 {id:'avg-imp',setup:`launchGame('501',['Tom','Henk','Imke','Jorn'],true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[181,140,96,170];${H}renderGame();`},
 {id:'avg100',setup:`launchGame('501',['Tom','Henk','Imke','Jorn'],true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[121,140,96,170];state.history=[];for(var k=0;k<4;k++)state.history.push({player:k,score:180},{player:k,score:121});renderGame();`},
 {id:'sets',setup:`launchGame('501',['Tom','Henk','Imke'],true,'firstto',3,3,501,0);state.setWins=[1,2,0];state.legsInSet=[2,0,1];state.scores=[181,301,96];${H}renderGame();`},
 {id:'lang',setup:`launchGame('501',['Christiaan','Marieke','Annabel','Jorn'],true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[501,140,96,170];${H}renderGame();`},
];
const measure=()=>{const tr=e=>!!e&&e.offsetParent&&e.scrollWidth>e.clientWidth+1;const cards=[...document.querySelectorAll('#sb-players .x-card')];
 const gc=document.getElementById('game-controls').getBoundingClientRect();const keys=[...document.querySelectorAll('#screen-game button')].filter(b=>b.offsetParent);
 const on=document.querySelector('#sb-players .x-card.on');const lb=on.querySelector('.x-lg b'),ls=on.querySelector('.x-lg small'),im=on.querySelector('.x-imp');
 return {kb:Math.round(gc.top-Math.max(...keys.map(k=>k.getBoundingClientRect().bottom))),h:cards.map(c=>Math.round(c.getBoundingClientRect().height)).join('/'),
  afg:cards.flatMap((c,i)=>['.x-nm','.x-meta','.x-legs','.x-imp'].filter(s=>tr(c.querySelector(s))).map(s=>i+s)).join(' '),
  meta:on.querySelector('.x-meta').innerText+(im&&im.offsetParent?' | '+im.innerText:''),legsB:lb&&parseFloat(getComputedStyle(lb).fontSize),legsS:ls&&ls.getBoundingClientRect().width>2?parseFloat(getComputedStyle(ls).fontSize):'(verborgen)',over:document.documentElement.scrollWidth>innerWidth};};
const pw=(await import(process.env.PLAYWRIGHT)).default;const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM});
const items=[];for(const s of SC)for(const [w,h] of [[360,640],[375,667],[390,844],[768,1024],[1024,768],[1920,1080]])for(const lang of ['nl','en'])items.push({s,w,h,vn:'a',lang,theme:'dark',file:`${s.id}-${w}-${lang}.png`});
const r=await shootAll(b,ROOT,process.argv[3]||'/tmp/h1/edge',items,{jobs:4,measure});await b.close();
for(const x of r)console.log(x.file.padEnd(20),JSON.stringify(x.measure||x.errors));
