// Test van de diagnose met kunstmatige data waarvan de uitkomst bekend is.
// Draaien: PLAYWRIGHT=/pad/naar/playwright node tests/security/diag-legacy.test.mjs
import fs from 'fs';const pw=(await import(process.env.PLAYWRIGHT||'playwright')).default;
const scrubSrc=fs.readFileSync(new URL('./v245-filter-snippet.js',import.meta.url),'utf8');const S=new Function(scrubSrc+';return {_scrub,_remoteNameOk};')();
const E=(gid,x)=>Object.assign({gid,ts:Date.parse('2026-11-10T20:00:00Z')+gid.length*60000,date:'10-11-2026',gameType:'501',won:true,darts:20,score:300,opponents:['Henk Visser']},x||{});
const remote={
 'Henk Visser':{games:3,wins:1,totalDarts:60,totalScore:900,nickname:'The "Hammer"',doubleStats:{'D20':2,'D"20':1},gameHistory:[
    E('g1',{hiRoundHistory:[{label:'3 "dezelfde"',pts:20}]}), E('g2'), E('g3',{note:'x'.repeat(4100)}), E('g4',{detailedStats:{avg3:NaN}})]},
 'Tom ':{games:1,wins:0,totalDarts:1,totalScore:1,gameHistory:[E('g9')]},
 'Annelies de Groot':{games:1,wins:1,totalDarts:1,totalScore:1,nickname:'n'.repeat(45),gameHistory:[E('g7',{opponents:['Henk Visser'],legResult:'2<1'})]},
};
// T1 = v245-telefoon: alles van Firestore ingekort ontvangen, 'Tom ' overgeslagen; g2 heeft een andere score (andere wijziging); g8 alleen lokaal; 'Kees/Jan' lokaal
const T1={'Henk Visser':S._scrub(remote['Henk Visser']),'Annelies de Groot':S._scrub(remote['Annelies de Groot']),'Kees/Jan':{games:1,wins:0,gameHistory:[E('g8')]}};
T1['Henk Visser'].gameHistory[1].score=301;T1['Henk Visser'].gameHistory.push(E('g8b'));
// T2 = telefoon met origineel, terwijl Firestore voor Annelies al ingekort is (overschreven)
const remote2=JSON.parse(JSON.stringify(remote,(k,v)=>typeof v==='number'&&!isFinite(v)?'__NaN':v),(k,v)=>v==='__NaN'?NaN:v);
const T2={'Annelies de Groot':JSON.parse(JSON.stringify(remote['Annelies de Groot']))};
remote2['Annelies de Groot']=S._scrub(remote['Annelies de Groot']);
// naar Firestore REST-formaat
const fv=v=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:isFinite(v)?v:String(v)}):Array.isArray(v)?{arrayValue:{values:v.map(fv)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,fv(x)]))}};
const docs=Object.entries(remote2).map(([n,p])=>({name:'projects/ons-app-65e13/databases/(default)/documents/groups/GEHEIMCODE/players/'+encodeURIComponent(n),fields:fv(p).mapValue.fields}));
docs[0].fields.created={timestampValue:'2026-01-01T00:00:00Z'};
fs.writeFileSync('/tmp/fs-page1.json',JSON.stringify({documents:docs}));
fs.writeFileSync('/tmp/fs-group.json',JSON.stringify({name:'projects/ons-app-65e13/databases/(default)/documents/groups/GEHEIMCODE',fields:{hidden:{arrayValue:{values:[{stringValue:'Annelies de Groot'}]}},naam:{stringValue:'Club'}}}));
const enc=o=>Buffer.from(JSON.stringify({v:1,ts:Date.now(),data:o},(k,v)=>typeof v==='number'&&!isFinite(v)?null:v),'utf8').toString('base64');
const b=await pw.chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const reqs=[];p.on('request',r=>{if(!r.url().startsWith('file:'))reqs.push(r.url());});
await p.goto(''+new URL('./diag-legacy.html',import.meta.url).href+'');
await p.fill('#code','GEHEIMCODE');
await p.setInputFiles('#fsFiles',['/tmp/fs-page1.json','/tmp/fs-group.json']);await p.waitForTimeout(300);
console.log('fsStatus:',await p.textContent('#fsStatus'));
await p.fill('.expcode',enc(T1));await p.fill('.explabel','Telefoon Tom');
await p.click('#addExp');const rows=await p.$$('.exp');await (await rows[1].$('.expcode')).fill(enc(T2));await (await rows[1].$('.explabel')).fill('Kantine');
await p.click('#runBtn');await p.waitForTimeout(300);
const rep=await p.textContent('#report');console.log(rep);
const leaks=['Henk','Visser','Annelies','Groot','Tom ','Kees','GEHEIMCODE','Hammer','dezelfde','Club','Kantine','Telefoon Tom'].filter(x=>new RegExp('(^|[^\\p{L}])'+x.trim()+'($|[^\\p{L}])','u').test(rep));
console.log('\nLEKKEN IN RAPPORT:',leaks,'| netwerkverzoeken:',reqs,'| pageerrors:',errs);
console.log('SLEUTEL:\n'+await p.textContent('#key'));
await b.close();
