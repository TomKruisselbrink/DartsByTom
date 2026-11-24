const { shootAll } = await import('/home/claude/dartsbytom/tests/visual/shoot.mjs');
const P4="['Tom','Henk','Imke','Jorn']";
const SC=[{id:'w',setup:`launchGame('501',${P4},true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[501,301,96,170];renderGame();`}];
const measure=()=>{const meta=document.querySelector('#sb-players .x-card.on .x-meta');
 const tw=t=>{const s=document.createElement('span');s.style.cssText='white-space:pre';s.textContent=t;meta.appendChild(s);const w=s.getBoundingClientRect().width;s.remove();return +w.toFixed(1)};
 const pill=document.querySelector('#sb-players .x-card.on .x-turn');
 const c=document.querySelector('#sb-players .x-card.on');const cs=getComputedStyle(c);
 return {inner:c.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),pill:pill.getBoundingClientRect().width,
   sep:tw(' · '),imp:tw(document.documentElement.lang==='en'||localStorage.lang==='en'?'no checkout':'niet uitgooibaar'),
   gemD:tw(localStorage.lang==='en'?'avg —':'gem. —'),gem60:tw(localStorage.lang==='en'?'avg 60.0':'gem. 60.0'),gem100:tw(localStorage.lang==='en'?'avg 100.5':'gem. 100.5'),
   legs:document.querySelector('#sb-players .x-card.on .x-legs').getBoundingClientRect().width,
   score:document.querySelector('#sb-players .x-card.on .x-score').getBoundingClientRect().width,
   nm:['Tom','Henk','Imke','Jorn','Anna','Bas','Marieke','Christiaan'].map(n=>{const s=document.createElement('span');s.className='x-nm';s.textContent=n;s.style.cssText='white-space:pre';document.querySelector('#sb-players .x-card.on .x-name').appendChild(s);const w=s.getBoundingClientRect().width;s.remove();return n+':'+w.toFixed(0)}).join(' ')};};
const pw=(await import(process.env.PLAYWRIGHT)).default;const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM});
const items=[];for(const [w,h] of [[360,640],[375,667],[390,844]])for(const lang of ['nl','en'])items.push({s:SC[0],w,h,vn:'a',lang,theme:'dark',file:`w-${w}-${lang}.png`});
const r=await shootAll(b,'/home/claude/dartsbytom','/tmp/h1/shots',items,{jobs:3,measure});await b.close();
for(const x of r)console.log(x.file,JSON.stringify(x.measure));
