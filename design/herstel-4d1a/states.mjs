// keybar + kaarthoogtes + afkapping voor meerdere spelstanden; ROOT = argv[2]
const ROOT=process.argv[2], OUT=process.argv[3]||'/tmp/h1/st';
const { shootAll } = await import('/home/claude/dartsbytom/tests/visual/shoot.mjs');
const P3="['Tom','Henk','Imke']",P4="['Tom','Henk','Imke','Jorn']",P6="['Tom','Henk','Imke','Jorn','Anna','Bas']";
const L=(p,sc,lw,st)=>`launchGame('501',${p},true,'firstto',3,1,501,0);state.legWins=${lw};state.scores=${sc};${st||''}renderGame();`;
const SC=[
 {id:'3sp-start',setup:L(P3,'[501,501,501]','[0,0,0]')},
 {id:'3sp-mid',setup:L(P3,'[121,140,96]','[1,0,2]')},
 {id:'4sp-audit',setup:`launchGame('501',${P4},true,'firstto',1,1,501,0);state.scores=[121,301,96,501];renderGame();`},
 {id:'4sp-start',setup:L(P4,'[501,501,501,501]','[2,1,0,2]')},
 {id:'4sp-route',setup:L(P4,'[121,140,96,170]','[2,1,0,2]')},
 {id:'4sp-imp',setup:L(P4,'[181,140,96,170]','[2,1,0,2]',"state.history=[{player:0,score:60},{player:0,score:100}];state.dartCount=2;")},
 {id:'teams-start',setup:`_pendingTeams=[0,1,0,1];launchGame('501',${P4},false,'firstto',3,1,501,0);`},
 {id:'teams-route',setup:`_pendingTeams=[0,1,0,1];launchGame('501',${P4},false,'firstto',3,1,501,0);state.scores=[121,140,121,140];renderGame();`},
 {id:'6sp-start',setup:L(P6,'[501,501,501,501,501,501]','[0,1,0,2,0,0]')},
 {id:'6sp-route',setup:L(P6,'[121,301,96,170,501,40]','[0,1,0,2,0,0]')},
];
const measure=()=>{const gc=document.getElementById('game-controls').getBoundingClientRect();
 const keys=[...document.querySelectorAll('#screen-game button')].filter(b=>b.offsetParent);const maxB=Math.max(...keys.map(k=>k.getBoundingClientRect().bottom));
 const cards=[...document.querySelectorAll('#sb-players .x-card')];
 const tr=e=>!!e&&e.offsetParent&&e.scrollWidth>e.clientWidth+1;
 const on=document.querySelector('#sb-players .x-card.on');
 const vis=e=>!!e&&!!e.offsetParent&&getComputedStyle(e).display!=='none';
 const t=on.querySelector('.x-turn'),m=on.querySelector('.x-meta');
 const ri=(a,b)=>{if(!a||!b)return true;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.left>=y.left-0.5&&x.right<=y.right+0.5&&x.top>=y.top-0.5&&x.bottom<=y.bottom+0.5};
 return {kb:Math.round(gc.top-maxB),h:cards.map(c=>Math.round(c.getBoundingClientRect().height)).join('/'),
  afgekapt:cards.flatMap((c,i)=>['.x-nm','.x-meta','.x-top','.x-legs','.x-imp'].filter(s=>tr(c.querySelector(s))).map(s=>i+s)).join(' '),
  pilInKaart:ri(t,on), metaZichtbaar:vis(m), metaTxt:(m?m.innerText:'')+(on.querySelector('.x-imp')&&on.querySelector('.x-imp').offsetParent?' | '+on.querySelector('.x-imp').innerText:''), pil:vis(t), score:Math.round(parseFloat(getComputedStyle(on.querySelector('.x-score')).fontSize))};};
const pw=(await import(process.env.PLAYWRIGHT)).default;const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM});
const items=[];for(const s of SC)for(const [w,h] of [[360,640],[375,667],[390,844],[768,1024]])for(const lang of ['nl','en'])items.push({s,w,h,vn:'a',lang,theme:'dark',file:`${s.id}-${w}-${lang}.png`});
const r=await shootAll(b,ROOT,OUT,items,{jobs:4,measure});await b.close();
const o={};for(const x of r)o[x.file]=x.measure||{fout:x.errors.concat(x.setupErr||[])};
console.log(JSON.stringify(o));
