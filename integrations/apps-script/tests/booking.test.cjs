/* Sem dependências: node --test integrations/apps-script/tests/booking.test.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../Core.gs'), 'utf8'), context);
const Core = context.BookingCore;
const id = '15c0c6a5-087b-4fd1-b6ac-6102a8716e89';
const input = (extra={}) => ({action:'request',requestId:id,name:'Maria Souza',phone:'(35) 99723-8058',service:'noivas',date:'2026-11-20',time:'14:00',notes:'Pele sensível.',consent:'true',website:'',...extra});
function fixture() {
  const rows=[],events=[];
  let active='admin@example.com',locked=false,failFinalUpdate=false;
  const deps={adminEmail:'admin@example.com',activeEmail:()=>active,dailyLimit:100,
    now:()=>new Date('2026-10-21T12:00:00Z'),uuid:()=>crypto.randomUUID(),hash:value=>crypto.createHash('sha256').update(value).digest('hex'),
    parseLocal:(date,time)=>new Date(date+'T'+time+':00-03:00'),
    formatLocal:date=>new Date(date.getTime()-3*3600000).toISOString().slice(0,16).replace('T',' '),
    withLock:callback=>{assert.equal(locked,false);locked=true;try{return callback();}finally{locked=false;}},
    store:{findByRequestId:key=>{const row=rows.find(row=>row.requestId===key);return row?{...row}:null;},
      list:()=>rows.map(row=>({...row})),countCreatedOn:day=>rows.filter(row=>row.createdAt.slice(0,10)===day).length,
      append:row=>{assert.ok(locked);rows.push({...row});},update:row=>{assert.ok(locked);if(failFinalUpdate&&row.status==='APPROVED'){failFinalUpdate=false;throw Error('Sheets unavailable');}Object.assign(rows.find(r=>r.requestId===row.requestId),row);}},
    calendar:{findByMarker:(start,end,marker)=>events.find(event=>event.description.includes(marker)&&event.start<end&&event.end>start)||null,
      busy:(start,end)=>events.some(event=>event.start<end&&event.end>start),
      create:(title,start,end,description)=>{assert.ok(locked);const event={id:'event-'+(events.length+1),title,start,end,description};events.push(event);return event;}}
  };
  return {service:Core.create(deps),rows,events,deps,setActive:value=>active=value,failFinal:()=>failFinalUpdate=true};
}
test('validates Brazilian phone, UUID, consent, genuine date and service',()=>{
  const f=fixture();
  const valid=Core.validate(input(),f.deps);assert.equal(valid.phone,'+5535997238058');
  for(const extra of [{requestId:'abc'},{phone:'123'},{consent:'false'},{website:'robot'},{date:'2026-02-30'},{date:'2026-11-31'},{time:'24:00'},{service:'__proto__'},{name:'A'},{notes:'x'.repeat(1001)},{date:'2026-10-21',time:'09:30'}]) {
    assert.throws(()=>f.service.request(input(extra)),error=>error.isPublic===true);
  }
  assert.equal(f.rows.length,0);
});
test('intake stores once; retry is idempotent; reused ID with changed data fails',()=>{
  const f=fixture(),first=f.service.request(input()),retry=f.service.request(input());
  assert.equal(first.reference,retry.reference);assert.equal(f.rows.length,1);assert.equal(f.rows[0].status,'PENDING');assert.equal(f.events.length,0);
  assert.throws(()=>f.service.request(input({name:'Outra Cliente'})),/já foi usado/);
  f.deps.dailyLimit=1;assert.throws(()=>f.service.request(input({requestId:'397cfd66-afb2-4a51-88fe-ef02392689d1'})),/indisponível/);
});
test('same accepted request remains idempotent after its requested time has passed',()=>{
  const f=fixture(),first=f.service.request(input());
  f.deps.now=()=>new Date('2026-11-21T12:00:00Z');
  assert.equal(f.service.request(input()).reference,first.reference);assert.equal(f.rows.length,1);
  assert.throws(()=>f.service.request(input({requestId:'397cfd66-afb2-4a51-88fe-ef02392689d1'})),/antecedência/);
});
test('admin denies blank and wrong identity for listing, approval and decline',()=>{
  const f=fixture();f.service.request(input());
  for(const email of ['', 'visitor@example.com']){f.setActive(email);assert.throws(()=>f.service.list(),/Acesso restrito/);assert.throws(()=>f.service.approve({requestId:id}),/Acesso restrito/);assert.throws(()=>f.service.decline({requestId:id}),/Acesso restrito/);}
  assert.equal(f.events.length,0);assert.equal(f.rows[0].status,'PENDING');
});
test('approval rejects overlap; touching intervals allowed; repeat creates one event',()=>{
  const f=fixture();f.service.request(input());
  f.events.push({id:'busy',start:new Date('2026-11-20T16:30:00Z'),end:new Date('2026-11-20T17:30:00Z'),description:'Outro compromisso'});
  assert.throws(()=>f.service.approve({requestId:id,durationMinutes:90}),/outro compromisso/);assert.equal(f.rows[0].status,'PENDING');
  const result=f.service.approve({requestId:id,time:'14:30',durationMinutes:90});assert.equal(result.status,'APPROVED');
  assert.equal(f.events[1].start.toISOString(),'2026-11-20T17:30:00.000Z');
  const again=f.service.approve({requestId:id,durationMinutes:90});assert.equal(again.eventId,result.eventId);assert.equal(f.events.length,2);
});
test('recovers Calendar event when final Sheet write failed, including changed retry time',()=>{
  const f=fixture();f.service.request(input());f.failFinal();
  assert.throws(()=>f.service.approve({requestId:id,durationMinutes:90}),/Sheets unavailable/);
  assert.equal(f.events.length,1);assert.equal(f.rows[0].status,'PENDING');assert.equal(f.rows[0].confirmedTime,'14:00');
  assert.throws(()=>f.service.decline({requestId:id}),/Já existe um evento/);
  f.deps.now=()=>new Date('2026-11-21T12:00:00Z');
  const result=f.service.approve({requestId:id,time:'16:00',durationMinutes:120});assert.equal(result.status,'APPROVED');assert.equal(f.events.length,1);assert.equal(f.rows[0].confirmedTime,'14:00');assert.equal(f.rows[0].durationMinutes,'90');
});
test('decline is terminal and does not create events',()=>{
  const f=fixture();f.service.request(input());assert.equal(f.service.decline({requestId:id,adminNote:'Data indisponível'}).status,'DECLINED');
  assert.equal(f.service.decline({requestId:id}).status,'DECLINED');assert.throws(()=>f.service.approve({requestId:id,durationMinutes:90}),/encerrada/);assert.equal(f.events.length,0);
});
test('neutralizes spreadsheet formulas and preserves round trip of phones and text',()=>{
  for(const value of ['=IMPORTXML("x")','+5535997238058','-1+1','@SUM(A1:A2)',' \t=1+1']){const safe=Core.sheetSafe(value);assert.ok(safe.startsWith('\u200b'));assert.equal(Core.sheetRead(safe),value);}
  assert.equal(Core.sheetSafe('Maria Souza'),'Maria Souza');
});
function transport() {
  let called=0;
  const ctx=vm.createContext({BookingCore:Core,console,
    HtmlService:{XFrameOptionsMode:{ALLOWALL:'ALLOWALL'},createHtmlOutput:html=>({html,setXFrameOptionsMode(mode){this.mode=mode;return this;}})}});
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../Code.gs'),'utf8'),ctx);
  ctx.config_=()=>({siteOrigin:'https://example.com'});
  ctx.service_=()=>({request:()=>{called++;return {reference:'LL-123456789ABC'};}});
  return {ctx,calls:()=>called};
}
test('transport only accepts request action and single-value fields; never dispatches public admin RPC',()=>{
  const f=transport();
  for(const e of [{parameter:input({action:'adminApproveRequest'}),contentLength:300},{parameter:input(),parameters:{name:['Maria','Outra']},contentLength:300},{parameter:input(),contentLength:12001}]){
    const response=f.ctx.doPost(e);assert.match(response.html,/"ok":false/);
  }
  assert.equal(f.calls(),0);
  const response=f.ctx.doPost({parameter:input(),parameters:{name:['Maria']},contentLength:300});
  assert.equal(f.calls(),1);assert.match(response.html,/"ok":true/);assert.match(response.html,/https:\/\/example.com/);assert.match(response.html,/window.top.postMessage/);assert.equal(response.mode,'ALLOWALL');
  assert.doesNotMatch(response.html,/Maria Souza|99723/);
});
test('HTML callback serializes safely even if a validation message contains script markup',()=>{
  const f=transport();f.ctx.service_=()=>({request:()=>{throw Core.failure('</script><script>alert(1)</script>');}});
  const response=f.ctx.doPost({parameter:input(),contentLength:300});
  assert.equal((response.html.match(/<script>/g)||[]).length,1);assert.match(response.html,/\\u003c\/script\\u003e/);
  assert.doesNotMatch(response.html,/<script>alert/);
});
