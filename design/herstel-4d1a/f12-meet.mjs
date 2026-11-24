const ROOT=process.argv[2],OUT=process.argv[3];
const { shootAll } = await import('/home/claude/dartsbytom/tests/visual/shoot.mjs');
const H="state.history=[];for(var i=0;i<3;i++)for(var k=0;k<2;k++)state.history.push({player:k,score:[100,60,81][i]});";
const SC=[
 {id:'2sp-begin-legs',setup:`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);`},
 {id:'2sp-begin-1leg',setup:`launchGame('501',['Tom','Henk'],true,'firstto',1,1,501,0);`},
 {id:'2sp-181-route',setup:`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.legWins=[1,2];state.scores=[181,140];${H}renderGame();`},
 {id:'2sp-sets',setup:`launchGame('501',['Christiaan','Marieke'],true,'firstto',3,3,501,0);state.setWins=[1,2];state.legsInSet=[2,0];state.scores=[181,96];${H}renderGame();`},
 {id:'2sp-121',setup:`launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.scores=[121,140];renderGame();`},
];
const measure=()=>{const gcE=document.getElementById('game-controls'),gc=gcE.getBoundingClientRect(),vis=getComputedStyle(gcE).display!=='none';
 const k=[...document.querySelectorAll('#screen-game .x01-pad .btn')].filter(x=>x.offsetParent);const mb=Math.max(...k.map(x=>x.getBoundingClientRect().bottom));
 const tr=e=>!!e&&!!e.offsetParent&&e.scrollWidth>e.clientWidth+1;const cards=[...document.querySelectorAll('#sb-players .x-card')];
 const on=document.querySelector('#sb-players .x-card.on'),im=on.querySelector('.x-imp'),meta=on.querySelector('.x-meta');
 const IMP=/niet uitgooibaar|no checkout/i;
 return {kb:vis?Math.round(gc.top-mb):null,toets:Math.round(k[0].getBoundingClientRect().height),kaart:cards.map(c=>Math.round(c.getBoundingClientRect().height)).join('/'),
  afgekapt:cards.flatMap((c,i)=>['.x-nm','.x-meta','.x-imp'].filter(s=>tr(c.querySelector(s))).map(s=>i+s)).join(' '),
  imp:IMP.test(on.textContent)?(im&&im.offsetParent?'eigen regel':'in meta'):'-',scroll:document.getElementById('screen-game').scrollHeight>document.getElementById('screen-game').clientHeight+1};};
const pw=(await import(process.env.PLAYWRIGHT)).default;const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM});
const items=[];for(const s of SC)for(const [w,h] of [[320,568],[360,640],[375,667],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1920,1080]])for(const lang of ['nl','en'])items.push({s,w,h,vn:'a',lang,theme:'dark',file:`${s.id}-${w}x${h}-${lang}.png`});
const r=await shootAll(b,ROOT,OUT,items,{jobs:4,measure});await b.close();
(await import('fs')).writeFileSync(OUT+'/meting.json',JSON.stringify(Object.fromEntries(r.map(x=>[x.file,x.measure||{fout:x.errors}])),null,1));
console.log('ok',r.length,'fouten',r.filter(x=>x.errors.length||x.setupErr).length);
