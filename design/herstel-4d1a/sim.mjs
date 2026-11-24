process.env.ROOT=process.argv[2];
const { browser, page, open } = await import('/home/claude/dartsbytom/tests/core/h.mjs');
const b=await browser();
for(const lang of ['nl','en']){const {p,ctx}=await page(b,{ls:{lang}});await open(p,900);
 await p.addStyleTag({content:'#sb-players .x-card .x-imp{grid-column:1/3 !important;grid-row:4 !important}'}); // nabootsing: alleen de kolommen naast de score
 for(const [w,h] of [[375,812],[390,844],[402,874],[430,932]]){await p.setViewportSize({width:w,height:h});
  await p.evaluate("launchGame('501',['Tom','Henk','Imke','Jorn'],true,'firstto',3,1,501,0);renderGame();");await p.waitForTimeout(100);
  const r=await p.evaluate(()=>{const e=document.querySelector('#sb-players .x-card.on .x-imp');const rg=document.createRange();rg.selectNodeContents(e);const lines=rg.getClientRects().length;
   return {w:Math.round(e.getBoundingClientRect().width),afgekapt:e.scrollWidth>e.clientWidth+1,regels:new Set([...rg.getClientRects()].map(x=>Math.round(x.top))).size,h:Math.round(e.getBoundingClientRect().height)}});
  await p.screenshot({path:`/tmp/h1/sim-${process.argv[3]}-${lang}-${w}.png`,clip:{x:0,y:40,width:w,height:190}});
  console.log(process.argv[3],lang,w+'x'+h,JSON.stringify(r));}
 await ctx.close();}
await b.close();
