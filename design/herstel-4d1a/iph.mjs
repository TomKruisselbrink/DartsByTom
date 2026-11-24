const ROOT=process.argv[2];
const { shootAll } = await import('/home/claude/dartsbytom/tests/visual/shoot.mjs');
const P4="['Tom','Henk','Imke','Jorn']";
const SC=[{id:'imp4',setup:`launchGame('501',${P4},true,'firstto',3,1,501,0);state.legWins=[2,1,0,2];state.scores=[501,501,501,501];renderGame();`},
          {id:'imp3',setup:`launchGame('501',['Tom','Henk','Imke'],true,'firstto',1,1,501,0);renderGame();`}];
const measure=()=>{const c=document.querySelector('#sb-players .x-card.on'),im=c.querySelector('.x-imp'),cs=getComputedStyle(c);
 const inner=c.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
 const cols=cs.gridTemplateColumns;const sc=c.querySelector('.x-score').getBoundingClientRect().width;
 const s=document.createElement('span');s.style.cssText='position:absolute;display:inline-block;white-space:pre;font-size:'+getComputedStyle(im).fontSize+';font-family:'+getComputedStyle(im).fontFamily;s.textContent=im.textContent;document.body.appendChild(s);const need=s.getBoundingClientRect().width;s.remove();
 return {inner:Math.round(inner),cols,imp:Math.round(im.getBoundingClientRect().width),need:+need.toFixed(1),naastScore:Math.round(inner-sc-8),tekst:im.textContent};};
const pw=(await import(process.env.PLAYWRIGHT)).default;const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM});
const items=[];for(const s of SC)for(const [w,h] of [[375,667],[375,812],[390,844],[393,852],[402,874],[414,896],[430,932],[440,956]])for(const lang of ['nl','en'])items.push({s,w,h,vn:'a',lang,theme:'dark',file:`${s.id}-${w}x${h}-${lang}.png`});
const r=await shootAll(b,ROOT,process.argv[3]||'/tmp/h1/iph',items,{jobs:4,measure});await b.close();
for(const x of r)console.log(x.file.padEnd(22),JSON.stringify(x.measure));
