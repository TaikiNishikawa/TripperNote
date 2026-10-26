'use strict';
// Production HTML/scripts in an isolated browser, generated photos and Trips only.
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
let playwright;
for(const modulePath of [process.env.PLAYWRIGHT_MODULE,'playwright',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)){
  try{playwright=require(modulePath);break;}catch(_e){}
}
if(!playwright){test('Browser suite requires Playwright (set PLAYWRIGHT_MODULE)',{skip:true},()=>{});}
else{
const root=path.resolve(__dirname,'../www'),origin='http://record-inline-tests.invalid';
let browser,context,page,errors=[];
const svg=(id,color='#66816a')=>`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="600" height="450" fill="${color}"/><path d="M0 390L210 130L380 380L500 220L600 450H0" fill="#c8d3b7"/><text x="35" y="60" font-size="30" fill="white">${id}</text></svg>`;
const dataUrl=id=>'data:image/svg+xml;base64,'+Buffer.from(svg(id)).toString('base64');
const slot=(id,name)=>({id,startTime:'09:00',endTime:'10:00',selectedCandidateId:'c',candidates:[{id:'c',name,activity:'散策',transportMode:'none'}],v21:{status:'completed',actualStartAt:'2026-10-20T09:02:00',actualEndAt:'2026-10-20T10:10:00'}});
const photo=(id,slotId,extra={})=>({id,tripId:'past',day:1,planId:'a',slotId,kind:'entry',mediaType:'image',mediaKey:id,previewDataUrl:dataUrl(id),mimeType:'image/svg+xml',capturedAt:'2026-10-20T09:15:00',createdAt:'2026-10-20T09:15:01',captureSource:'tripper_camera',...extra});
const past={id:'past',title:'秋の小さな旅',startDate:'2026-10-20',endDate:'2026-10-21',days:[{day:1,date:'2026-10-20',activePlanId:'a',plans:[{id:'a',slots:[slot('A','湖畔を歩く'),slot('B','午後の喫茶店'),slot('C','静かな森'),{...slot('D','選んだ庭園'),candidates:[{id:'c',name:'選んだ庭園'},{id:'other',name:'別の候補'}]}]},{id:'b',slots:[slot('A','別Planの予定')]}]},{day:2,date:'2026-10-21',activePlanId:'a',plans:[{id:'a',slots:[]}]}],records:[photo('A1','A'),photo('A2','A'),photo('A3','A'),photo('B1','B'),photo('D1','D'),photo('loose',''),photo('other-plan','A',{planId:'b'}),photo('movie','A',{mediaType:'video',mimeType:'video/mp4'})]};
const live={id:'live',title:'今日の旅',startDate:'2026-10-25',endDate:'2026-10-26',days:[{day:1,date:'2026-10-25',activePlanId:'a',plans:[{id:'a',slots:[{...slot('live-A','今日の散歩'),v21:{status:'upcoming'}}]}]}],records:[]};
const single={...past,id:'single',title:'春の海辺',startDate:'2026-05-01',endDate:'2026-05-02',days:[],records:[photo('single-photo','',{tripId:'single'})]};
const empty={...single,id:'empty',title:'冬の一日',startDate:'2026-01-02',endDate:'2026-01-02',records:[]};
const fixture={activeTripId:'past',trips:[empty,past,single,live],settings:{},coreV21:{blocks:[]}};
before(async()=>{
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:fs.existsSync(chrome)?{executablePath:chrome}:{})});
  context=await browser.newContext({viewport:{width:390,height:844},locale:'ja-JP',timezoneId:'Asia/Tokyo',hasTouch:true});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
    const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'})[path.extname(file)]||'application/octet-stream'});
  });
  await context.addInitScript(data=>localStorage.setItem('tripperNoteDataV25',JSON.stringify(data)),fixture);
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-25T03:00:00Z'));
  await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>V26_CORE_BOOTSTRAP_COMPLETE);
  await page.evaluate(async()=>{await V26_CORE_PERSIST_CHAIN;});
  await page.evaluate(async sources=>{for(const [id,source] of sources)await mediaPut(id,new Blob([source],{type:'image/svg+xml'}));},fixture.trips.flatMap(t=>t.records.map(r=>[r.id,svg(r.id)])));
  assert.deepEqual(errors,[]);
});
after(async()=>{if(browser)await browser.close();});
beforeEach(async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(data=>{
    recordArchiveStop();delete document.hidden;clearTimeout(showToast.timer);document.getElementById('saveToast').classList.remove('show');APP_DATA=normalizeAppData(data);RECORD_TRIP_ID=null;
    Object.assign(RECORD_ARCHIVE_UI,{view:'list',tripId:'',pendingDetail:false,returnScroll:0,returnTrip:''});
    showScreen('home','home');window.scrollTo({top:0,behavior:'instant'});
  },fixture);assert.deepEqual(errors,[]);
});
const card=id=>page.locator(`.record-trip-card[data-record-open="${id}"]`);
const open=()=>page.locator('.nav-btn[data-tab="record"]').click();
const shown=async id=>{await card(id).scrollIntoViewIfNeeded();await page.waitForFunction(id=>{const p=RECORD_ARCHIVE_UI.players.find(p=>p.element.dataset.recordOpen===id);return p?.visible&&p.element.dataset.photoState==='ready';},id);};
const snapshot=()=>page.evaluate(async()=>({app:JSON.stringify(APP_DATA),local:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)]))),core:JSON.stringify(await coreReadFoundation()),media:await Promise.all(APP_DATA.trips.flatMap(t=>t.records).map(async r=>{const blob=await mediaGet(r.mediaKey);return[r.mediaKey,blob?await blob.text():null];}))}));
async function shot(name){if(process.env.UI_ARTIFACT_DIR){fs.mkdirSync(process.env.UI_ARTIFACT_DIR,{recursive:true});await page.waitForTimeout(300);await page.screenshot({path:path.join(process.env.UI_ARTIFACT_DIR,name+'.png')});}}

test('Record tab opens newest-first Trip archive, compact current Trip, no chips/live/debug controls',async()=>{
  await open();assert.equal(await page.locator('#record').getAttribute('data-record-view'),'list');
  assert.deepEqual(await page.locator('.record-trip-card').evaluateAll(els=>els.map(el=>el.dataset.recordOpen)),['past','single','empty']);
  assert.match(await page.locator('.record-archive-heading').textContent(),/RECORD.*旅の記憶。.*その日の景色を、もう一度。/s);
  assert.equal(await page.locator('.record-current-trips [data-record-open="live"]').count(),1);
  assert.equal(await page.locator('#record .trip-tabs, #record .record-camera-main, #record .record-role-actions, #record .b1-phase-note, #record .b2-quick-record-bar').count(),0);
  await shown('past');await shot('record-archive-v2');
});
test('No Trips is a natural empty archive; bootstrap loading is distinct from empty',async()=>{
  await page.evaluate(()=>{APP_DATA.trips=[];});await open();assert.equal(await page.locator('.record-trip-card').count(),0);assert.match(await page.locator('#record').textContent(),/旅の記憶は、これから。/);
  await page.evaluate(()=>{V26_CORE_BOOTSTRAP_COMPLETE=false;renderRecordScreen();});
  assert.match(await page.locator('#record [role="status"]').textContent(),/読み込み中/);assert.doesNotMatch(await page.locator('#record').textContent(),/旅の記憶は、これから/);
  await page.evaluate(()=>{V26_CORE_BOOTSTRAP_COMPLETE=true;});
});
test('Trip photos include unlinked and other-plan, exclude foreign and duplicate photos; reading is non-saving',async()=>{
  await page.evaluate(()=>{const t=getTripById('past');t.records.push({...t.records[0],id:'duplicate'},{...t.records[0],id:'foreign',mediaKey:'foreign',tripId:'single'});});
  const before=await snapshot();await open();await shown('past');
  assert.deepEqual(await page.evaluate(()=>RECORD_ARCHIVE_UI.players[0].photos.map(p=>p.id)),['A1','A2','A3','B1','D1','loose','other-plan']);
  assert.equal(await card('past').locator('.record-card-count').textContent(),'7枚の写真');
  assert.match(await card('past').locator('img.is-current').getAttribute('src'),/^blob:/);assert.deepEqual(await snapshot(),before);
});
test('Three-second shuffle visits all photos before repeat, avoids boundary repeat and holds card size',async()=>{
  await page.evaluate(()=>{getTripById('past').records=getTripById('past').records.slice(0,3);});
  const before=await snapshot();await open();await shown('past');
  const seen=[await card('past').getAttribute('data-photo-key')],size=await card('past').boundingBox();
  const delay=await page.evaluate(()=>RECORD_ARCHIVE_UI.players[0].nextAt-performance.now());assert.ok(delay>2700&&delay<=3000);
  await page.waitForTimeout(700);assert.equal(await card('past').getAttribute('data-photo-key'),seen[0]);
  for(let i=0;i<3;i++){
    await page.waitForFunction(previous=>document.querySelector('.record-trip-card').dataset.photoKey!==previous,seen.at(-1),{timeout:4000});seen.push(await card('past').getAttribute('data-photo-key'));
  }
  assert.equal(new Set(seen.slice(0,3)).size,3);assert.notEqual(seen[2],seen[3]);assert.ok(seen.every(id=>['A1','A2','A3'].includes(id)));
  assert.equal((await card('past').boundingBox()).height,size.height);assert.deepEqual(await snapshot(),before);
  assert.match(await card('past').locator('img.is-current').evaluate(el=>getComputedStyle(el).transition),/opacity.*0.26s/);
});
test('Zero-photo placeholder and singleton are static and preserve image proportions',async()=>{
  await open();await shown('single');assert.match(await card('empty').textContent(),/この旅の余韻/);assert.equal(await card('empty').locator('img:not([hidden])').count(),0);
  assert.deepEqual(await page.evaluate(()=>{const p=RECORD_ARCHIVE_UI.players.find(p=>p.element.dataset.recordOpen==='single');return{next:p.nextAt,key:p.element.dataset.photoKey,fit:getComputedStyle(p.layers[p.active]).objectFit};}),{next:0,key:'single-photo',fit:'contain'});
  await page.waitForTimeout(3200);assert.equal(await card('single').getAttribute('data-photo-key'),'single-photo');
});
test('Trip card opens existing Timeline including unlinked photos; back restores archive and focus',async()=>{
  const before=await snapshot();await open();await card('past').click();
  assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  assert.match(await page.locator('.record-archive-heading h2').textContent(),/秋の小さな旅/);
  assert.equal(await page.locator('[data-record-item="schedule:past:1:a:A"]').count(),1);
  assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.filter(p=>p.photos[0]?.mediaKey==='loose'&&p.element.closest('.b1-unplanned-group')).length),1);
  assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.every(p=>p.nextAt===0)),true);
  await page.locator('[data-record-list]').click();await page.waitForFunction(()=>document.activeElement?.dataset.recordOpen==='past');
  assert.equal(await page.locator('.record-trip-card').count(),3);assert.deepEqual(await snapshot(),before);
});
test('Leaving Record revokes URLs and scheduler; tab returns to list, not previous detail',async()=>{
  await open();await shown('past');const url=await card('past').locator('img.is-current').getAttribute('src');
  await page.locator('.nav-btn[data-tab="home"]').click();
  assert.deepEqual(await page.evaluate(()=>({players:RECORD_ARCHIVE_UI.players.length,observer:RECORD_ARCHIVE_UI.observer,timer:RECORD_ARCHIVE_UI.timer})),{players:0,observer:null,timer:null});
  assert.equal(await page.evaluate(async url=>{try{await fetch(url);return true;}catch(_e){return false;}},url),false);
  await open();await card('past').click();await page.locator('.nav-btn[data-tab="home"]').click();await open();await shown('past');assert.equal(await page.locator('#record').getAttribute('data-record-view'),'list');
});
test('Offscreen releases URLs; background/pagehide stop; resume loads visible cards only',async()=>{
  await page.setViewportSize({width:390,height:568});
  await open();await shown('past');assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players[1].visible),false);
  await card('empty').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>{const p=RECORD_ARCHIVE_UI.players[0];return{visible:p.visible,next:p.nextAt,urls:p.urls.filter(Boolean).length};}),{visible:false,next:0,urls:0});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.length),0);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await shown('past');
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.timer),null);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await shown('past');
});
test('Two visible cards have independent queues and a shared scheduler, at most two URLs per card',async()=>{
  await page.setViewportSize({width:390,height:1600});
  await page.evaluate(()=>{const t=getTripById('single');t.records.push({...t.records[0],id:'second',mediaKey:'',previewDataUrl:t.records[0].previewDataUrl});});
  await open();await shown('past');await shown('single');
  const initial=await page.evaluate(()=>RECORD_ARCHIVE_UI.players.slice(0,2).map(p=>p.element.dataset.photoKey));
  await page.waitForFunction(keys=>RECORD_ARCHIVE_UI.players.slice(0,2).every((p,i)=>p.element.dataset.photoKey!==keys[i]),initial,{timeout:4200});
  assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.timer!==null),true);
  assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.every(p=>p.urls.filter(Boolean).length<=2)),true);
  assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players[1].photos.every(p=>p.tripId==='single')),true);
});
test('Current Trip and overnight durable Active keep Live Timeline, START/FIN and Quick Record',async()=>{
  await open();await page.locator('.record-current-trips [data-record-open="live"]').click();
  assert.equal(await page.locator('#record').getAttribute('data-record-view'),'live');assert.equal(await page.locator('#record .b2-quick-record-bar').count(),1);assert.equal(await page.locator('#record .b3-start-button').count(),1);
  await page.evaluate(()=>{const s=getTripById('past').days[0].plans[0].slots[0];s.v21.status='active';s.v21.actualEndAt=null;openRecordArchive();});
  assert.equal(await card('past').count(),0);await page.locator('.record-current-trips [data-record-open="past"]').click();assert.equal(await page.locator('#record .b3-finish-button').count(),1);
  await page.locator('[data-record-list]').click();assert.equal(await page.locator('#record').getAttribute('data-record-view'),'list');
});
test('Pending media cannot update another Trip; repeated install creates no duplicate back controls',async()=>{
  await page.evaluate(()=>{window.inlineRealGet=mediaGet;window.inlineReads=[];mediaGet=key=>new Promise(resolve=>inlineReads.push({key,resolve}));});
  await open();await page.waitForFunction(()=>inlineReads.length>0);
  assert.equal(await card('past').getAttribute('data-photo-state'),'loading');assert.equal(await card('past').locator('.record-card-count').textContent(),'7枚の写真');
  await page.evaluate(()=>{setRecordTrip('live');for(const read of inlineReads)read.resolve(new Blob(['stale'],{type:'image/svg+xml'}));mediaGet=inlineRealGet;installRecordArchiveUi();installRecordArchiveUi();});
  await page.waitForTimeout(100);assert.equal(await page.locator('.record-trip-card').count(),0);assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.length),0);
  await open();await card('single').click();assert.equal(await page.locator('[data-record-list]').count(),1);
});
test('Missing or unreadable original uses preview, missing source is not reported as zero photos',async()=>{
  await page.evaluate(()=>{getTripById('single').records[0].mediaKey='missing';});await open();await shown('single');assert.match(await card('single').locator('img.is-current').getAttribute('src'),/^data:image/);
  await page.evaluate(async()=>{await mediaPut('broken',new Blob(['not an image'],{type:'image/png'}));getTripById('single').records[0].mediaKey='broken';renderRecordScreen();});await shown('single');assert.match(await card('single').locator('img.is-current').getAttribute('src'),/^data:image/);
  await page.evaluate(()=>{const r=getTripById('single').records[0];r.mediaKey='missing';r.previewDataUrl='';renderRecordScreen();});await card('single').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-record-open="single"]').dataset.photoState==='unavailable');assert.equal(await card('single').locator('.record-card-count').textContent(),'1枚の写真');assert.match(await card('single').textContent(),/写真を表示できません/);
});
test('Touch scroll does not open a card; tap and keyboard open Timeline; 320px layout fits',async()=>{
  await open();await shown('past');const cdp=await context.newCDPSession(page),box=await card('past').boundingBox(),x=box.x+box.width/2,y=Math.min(box.y+box.height/2,600);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*35,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#record').getAttribute('data-record-view'),'list');
  await card('single').tap();assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  await page.locator('[data-record-list]').click();await card('empty').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  await page.locator('[data-record-list]').click();await page.setViewportSize({width:320,height:568});await shown('past');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('record-archive-v2-320');await cdp.detach();
});
test('Archive with absent coreV21 never initializes data or rewrites Schedule metadata',async()=>{
  await page.evaluate(()=>{delete APP_DATA.coreV21;delete getTripById('past').days[0].plans[0].slots[0].v21;});const before=await snapshot();await open();await card('past').click();assert.deepEqual(await snapshot(),before);
});
test('Existing photo detail and past Trip add menu remain accessible without saving on Cancel',async()=>{
  await open();await card('past').click();const before=await snapshot();
  await page.locator('.record-archive-add').click();assert.match(await page.locator('#saveToast').textContent(),/＋メニュー/);
  await page.locator('[data-record-item="schedule:past:1:a:A"] .b1-record-actions button').first().click();
  assert.equal(await page.locator('#recordDetailModal').evaluate(el=>el.classList.contains('open')),true);
  assert.equal(await page.evaluate(()=>TRIPPER_CAMERA_STATE.editRecordId),'A1');
  assert.equal(await page.locator('#capturedRecordPreview img').count(),1);
  await page.locator('#recordDetailModal .modal-close').click();assert.deepEqual(await snapshot(),before);
});
test('Unselected ChoiceSlot is not duplicated or guessed in existing Timeline',async()=>{
  await page.evaluate(()=>{getTripById('past').days[0].plans[0].slots[3].selectedCandidateId=null;});const before=await snapshot();await open();assert.equal(await card('past').count(),1);await card('past').click();
  const detail=page.locator('[data-record-item="schedule:past:1:a:D"]');assert.equal(await detail.count(),1);assert.doesNotMatch(await detail.textContent(),/選んだ庭園|別の候補/);assert.deepEqual(await snapshot(),before);
});
test('Ambiguous Schedule links stay once in unplanned Timeline and still belong to Trip archive',async()=>{
  await page.evaluate(()=>{const t=getTripById('past');t.records.push({...t.records[0],id:'ambiguous',mediaKey:'ambiguous',day:null,planId:''});});const before=await snapshot();await open();assert.equal(await card('past').locator('.record-card-count').textContent(),'8枚の写真');await card('past').click();
  assert.deepEqual(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.filter(p=>p.photos[0]?.mediaKey==='ambiguous').map(p=>!!p.element.closest('.b1-unplanned-group'))),[true]);assert.deepEqual(await snapshot(),before);
});
test('Archive Timeline pending media is cancelled on leave without creating stale object URLs',async()=>{
  await open();await shown('past');await page.evaluate(()=>{window.inlineRealGet=mediaGet;window.inlineReads=[];window.inlineRealUrl=URL.createObjectURL;window.inlineUrls=0;URL.createObjectURL=blob=>{inlineUrls++;return inlineRealUrl(blob);};mediaGet=key=>new Promise(resolve=>inlineReads.push({key,resolve}));recordArchiveOpenTrip('past');});
  await page.waitForFunction(()=>inlineReads.length>0);await page.evaluate(()=>{showScreen('home','home');for(const r of inlineReads)r.resolve(new Blob(['stale'],{type:'image/svg+xml'}));mediaGet=inlineRealGet;});await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>inlineUrls),0);assert.equal(await page.evaluate(()=>RECORD_ARCHIVE_UI.players.length),0);await page.evaluate(()=>{URL.createObjectURL=inlineRealUrl;});
});
test('No browser runtime errors after archive and existing Timeline interactions',()=>{assert.deepEqual(errors,[]);});
test('Portrait and landscape photos keep sharp full foreground over the same blurred image with fixed dimensions',async()=>{
  await page.evaluate(async sources=>{
    const t=getTripById('past');t.records=t.records.slice(0,2);
    for(let i=0;i<2;i++){const key='aspect-'+i;t.records[i].mediaKey=key;await mediaPut(key,new Blob([sources[i]],{type:'image/svg+xml'}));}
  },[svg('portrait').replace('width="600" height="450"','width="300" height="900" viewBox="0 0 600 450" preserveAspectRatio="none"'),svg('landscape').replace('width="600" height="450"','width="900" height="500" viewBox="0 0 600 450" preserveAspectRatio="none"')]);
  const before=await snapshot();await open();await shown('past');const dims=[];
  for(let i=0;i<2;i++){
    await page.waitForTimeout(320);
    const state=await card('past').evaluate(el=>{const image=el.querySelector('img.is-current'),back=el.querySelector('.record-photo-backdrop.is-current'),box=el.querySelector('.record-card-photo').getBoundingClientRect();return{width:box.width,height:box.height,ratio:image.naturalWidth/image.naturalHeight,fit:getComputedStyle(image).objectFit,filter:getComputedStyle(image).filter,back:getComputedStyle(back).backgroundImage,blur:getComputedStyle(back).filter,url:image.src};});
    assert.equal(state.fit,'contain');assert.equal(state.filter,'none');assert.match(state.blur,/blur\(18px\)/);assert.ok(state.back.includes(state.url));dims.push(state);
    await shot(state.ratio<1?'record-portrait-blur':'record-landscape-blur');
    if(i===0){const key=await card('past').getAttribute('data-photo-key');await page.waitForFunction(key=>document.querySelector('.record-trip-card').dataset.photoKey!==key,key,{timeout:4000});}
  }
  assert.equal(dims[0].height,dims[1].height);assert.ok(dims.some(x=>x.ratio<1)&&dims.some(x=>x.ratio>1));assert.deepEqual(await snapshot(),before);
  await page.evaluate(()=>{window.hotfixPlayers=RECORD_ARCHIVE_UI.players.slice();showScreen('home','home');});
  assert.equal(await page.evaluate(()=>hotfixPlayers.every(p=>p.backgrounds.every(b=>b.style.backgroundImage===''))),true);
});

}
