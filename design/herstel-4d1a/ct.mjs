// exacte contrastwaarden actieve kaart: "legs", meta, naam, label; 4 themastanden; ROOT=argv[2]
process.env.ROOT=process.argv[2];
const { browser, page, open } = await import('/home/claude/dartsbytom/tests/core/h.mjs');
const src=(await import('fs')).readFileSync('/home/claude/dartsbytom/tests/core/contrast-beurt.mjs','utf8');
const MEASURE=eval('('+src.match(/const MEASURE = (\(\) => \{[\s\S]*?\n\};)/)[1].replace(/;$/,'')+')');
const b=await browser();const out={};
for(const [t,[sch,ls]] of Object.entries({donker:['dark','dark'],licht:['light','light'],'auto-donker':['dark',null],'auto-licht':['light',null]})){
 const {p,ctx}=await page(b,{colorScheme:sch,ls:ls?{theme:ls}:{}}); if(!ls)await p.addInitScript(()=>localStorage.removeItem('theme'));
 await open(p,900); await p.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
 for(const [w,h] of [[390,844],[1920,1080]]){await p.setViewportSize({width:w,height:h});
  await p.evaluate("launchGame('501',['Tom','Henk'],true,'firstto',3,1,501,0);state.legWins=[1,0];state.scores=[121,140];renderGame();");await p.waitForTimeout(250);
  const r=await p.evaluate(MEASURE); out[t+' '+w]=r.filter(x=>x.actief).map(x=>x.tekst+'='+x.v).join(', ');}
 await ctx.close();}
await b.close();console.log(JSON.stringify(out,null,1));
