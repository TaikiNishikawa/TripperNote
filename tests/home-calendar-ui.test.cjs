'use strict';
// Real production HTML/scripts, isolated browser profile, synthetic data only.
// node --test tests/home-calendar-ui.test.cjs
// Optional: PLAYWRIGHT_MODULE, CHROMIUM_PATH, UI_ARTIFACT_DIR (screenshots).
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
let playwright;
for(const modulePath of [process.env.PLAYWRIGHT_MODULE,'playwright',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)){
  try{playwright=require(modulePath);break;}catch(_e){}
}
if(!playwright){
  test('Browser tests require Playwright (set PLAYWRIGHT_MODULE)',{skip:true},()=>{});
}else{
const root=path.resolve(__dirname,'../www'),origin='http://calendar-tests.invalid';
let browser,context,page,cdp,errors=[];
const dayKey=n=>`2026-10-${String(n).padStart(2,'0')}`;
function trip(id,start,end,status){
  const days=[];
  for(let n=Date.parse(start+'T00:00:00Z');n<=Date.parse(end+'T00:00:00Z');n+=86400000){
    const date=new Date(n).toISOString().slice(0,10),day=days.length+1;
    days.push({day,date,activePlanId:'a',plans:[{id:'a',name:'基本',slots:[{id:`${id}-s${day}`,startTime:'09:00',endTime:'10:00',selectedCandidateId:'c1',candidates:[{id:'c1',name:`${id}の散歩`,activity:'散歩',transportMode:'none',destination:'架空の広場',locationUnresolved:true}],v21:{status:status||'upcoming',plannedStartAt:date+'T09:00:00',plannedEndAt:date+'T10:00:00',actualStartAt:status==='active'?date+'T09:00:00':null,actualEndAt:null}}]}]});
  }
  return {id,title:`旅 ${id}`,startDate:start,endDate:end,days,records:[{id:id+'-record',tripId:id,day:1,planId:'a',slotId:id+'-s1',mediaType:'none',createdAt:start+'T09:10:00',capturedAt:start+'T09:10:00'}]};
}
const fixture={schemaVersion:6,activeTripId:'past',settings:{},trips:[trip('past','2026-09-01','2026-09-02'),trip('cross','2026-10-30','2026-11-03'),trip('overlap','2026-10-31','2026-11-01'),trip('year','2026-12-31','2027-01-02')]};
before(async()=>{
  const localChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:fs.existsSync(localChrome)?{executablePath:localChrome}:{})});
  context=await browser.newContext({viewport:{width:390,height:844},locale:'ja-JP',timezoneId:'Asia/Tokyo',hasTouch:true});
  await context.route('**/*',route=>{
    const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();
    const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript; charset=utf-8'})[path.extname(file)]||'application/octet-stream'});
  });
  await context.addInitScript(data=>localStorage.setItem('tripperNoteDataV25',JSON.stringify(data)),fixture);
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date('2026-10-24T03:00:00Z'));
  await page.goto(origin,{waitUntil:'load'});
  await page.waitForFunction(()=>V26_CORE_BOOTSTRAP_COMPLETE);
  await page.evaluate(async()=>{await V26_CORE_PERSIST_CHAIN;});
  assert.deepEqual(errors,[],'production startup');
  cdp=await context.newCDPSession(page);
});
after(async()=>{if(browser)await browser.close();});
beforeEach(async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(data=>{
    calendarCancelGesture();calendarCloseDatePicker(false);closeTripEditor();closeScheduleEditor(true);
    clearTimeout(showToast.timer);document.getElementById('saveToast').classList.remove('show');
    APP_DATA=normalizeAppData(data);RECORD_TRIP_ID=null;
    Object.assign(CALENDAR_UI,{month:'2026-10-01',selectedDate:'2026-10-24',range:null,editing:null,gesture:null,pendingCreation:false,suppressClickUntil:0});
    renderHome();showScreen('home','home');
  },fixture);
  assert.deepEqual(errors,[]);
});
async function shot(name){if(process.env.UI_ARTIFACT_DIR){fs.mkdirSync(process.env.UI_ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.UI_ARTIFACT_DIR,name+'.png')});}}
const cell=key=>page.locator(`#calendarGrid [data-date="${key}"]`);
const range=()=>page.evaluate(()=>CALENDAR_UI.range);
const open=()=>page.locator('.calendar-button').click();
async function snapshot(){return page.evaluate(async()=>({app:JSON.stringify(APP_DATA),local:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)]))),core:JSON.stringify(await coreReadFoundation())}));}
async function center(key){await cell(key).scrollIntoViewIfNeeded();const box=await cell(key).boundingBox();assert.ok(box,key);return{x:box.x+box.width/2,y:box.y+box.height/2};}
async function drag(from,to,hold=false){
  const a=await center(from),b=await center(to);
  await page.mouse.move(a.x,a.y);await page.mouse.down();if(hold)await page.waitForTimeout(450);
  await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();
}
async function touch(type,point){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:point?[{x:point.x,y:point.y,id:1}]:[]});}

test('Home CTA opens existing creator without saving; Cancel discards draft',async()=>{
  const before=await snapshot();await page.locator('#homeCreateTrip').click();
  assert.equal(await page.evaluate(()=>EDITOR_MODE),'create');assert.equal(await page.locator('#editorModal').evaluate(el=>el.classList.contains('open')),true);
  await page.evaluate(()=>closeTripEditor());assert.equal(await page.evaluate(()=>EDIT_DATA),null);assert.deepEqual(await snapshot(),before);
});
test('Home recent Trips 0,1,3,4 cap, order and Timeline destination',async()=>{
  for(const n of [0,1,3,4]){
    const trips=Array.from({length:n},(_,i)=>trip('past'+i,`2026-09-0${i+1}`,`2026-09-0${i+1}`));
    await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});renderHome();},trips);
    assert.equal(await page.locator('.home-recent-trip').count(),Math.min(n,3));
    if(n)assert.equal(await page.locator('.home-recent-trip [data-trip-id]').first().getAttribute('data-trip-id'),'past'+(n-1));
    else assert.equal(await page.locator('.home-empty').count(),1);
  }
  await shot('home-idle');await page.locator('.home-recent-trip [data-trip-id]').first().click();
  assert.equal(await page.evaluate(()=>RECORD_TRIP_ID),'past3');assert.equal(await page.locator('#record').evaluate(el=>el.classList.contains('active')),true);
  assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  assert.match(await page.locator('.record-archive-heading h2').textContent(),/past3/);
});
test('Home ongoing Trip and Active Schedule priority with Calendar access',async()=>{
  await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});renderHome();},[trip('ongoing','2026-10-24','2026-10-25')]);
  assert.equal(await page.locator('#home').getAttribute('data-home-state'),'trip');assert.match(await page.locator('#home').textContent(),/NEXT/);
  await shot('home-trip');await open();assert.equal(await page.locator('#calendar').evaluate(el=>el.classList.contains('active')),true);
  await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});showScreen('home','home');},[trip('ongoing','2026-10-24','2026-10-25'),trip('overnight','2026-10-23','2026-10-23','active')]);
  assert.equal(await page.locator('#home').getAttribute('data-home-state'),'schedule');assert.match(await page.locator('#home h1').textContent(),/overnight/);
  await shot('home-active');await open();assert.equal(await page.locator('#calendar').evaluate(el=>el.classList.contains('active')),true);
});
test('Home current DAY stays today when NEXT is on a later Trip day',async()=>{
  const upcoming=trip('ongoing','2026-10-24','2026-10-25');upcoming.days[0].plans[0].slots[0].v21.status='completed';
  await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});renderHome();},[upcoming]);
  assert.match(await page.locator('.home-live-heading p').textContent(),/DAY 1/);
  assert.match(await page.locator('.home-live-time').textContent(),/10月25日/);
});
test('Active Schedule action opens its own DAY and Plan using existing navigation',async()=>{
  const current=trip('ongoing','2026-10-24','2026-10-25');
  current.days[0].plans.push({id:'b',slots:[]});current.days[0].activePlanId='b';current.days[0].plans[0].slots[0].v21.status='active';
  await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});renderHome();},[current]);
  const slot=await page.evaluate(()=>JSON.stringify(APP_DATA.trips[0].days[0].plans[0].slots[0]));
  await page.locator('.home-live-card [data-trip-id]').click();assert.equal(await page.evaluate(()=>getActivePlan(1).id),'a');
  assert.equal(await page.evaluate(()=>JSON.stringify(APP_DATA.trips[0].days[0].plans[0].slots[0])),slot);
});
test('Calendar independent screen, 42 days, month navigation and Today',async()=>{
  await open();assert.equal(await cell('2026-10-24').getAttribute('aria-current'),'date');assert.equal(await page.locator('.calendar-day').count(),42);
  await page.locator('#calendarNext').click();assert.equal(await page.evaluate(()=>CALENDAR_UI.month),'2026-11-01');
  await page.locator('#calendarPrevious').click();assert.equal(await page.evaluate(()=>CALENDAR_UI.month),'2026-10-01');
  await page.locator('#calendarNext').click();await page.locator('.calendar-today').click();assert.equal(await page.evaluate(()=>CALENDAR_UI.selectedDate),'2026-10-24');
  assert.equal(await page.locator('#home .calendar-grid').count(),0);await shot('calendar-month');
});
test('All Trip dates marked including month/year boundaries and overlapping Trips',async()=>{
  await open();for(const key of ['2026-10-30','2026-10-31','2026-11-01','2026-11-02','2026-11-03'])assert.equal(await cell(key).locator('.calendar-trip-marker').count(),1);
  await cell('2026-10-31').click();assert.equal(await page.locator('.calendar-trip-detail').count(),2);
  assert.match(await page.locator('#calendarDetails').textContent(),/DAY 2/);
  await page.evaluate(()=>{CALENDAR_UI.month='2026-12-01';renderCalendar();});
  for(const key of ['2026-12-31','2027-01-01','2027-01-02'])assert.equal(await cell(key).locator('.calendar-trip-marker').count(),1);
});
test('Date tap opens matching Trip DAY itinerary and Timeline without damaging records',async()=>{
  await open();await cell('2026-10-31').click();const before=await page.evaluate(()=>JSON.stringify(APP_DATA.trips));
  await page.locator('#calendarDetails [data-trip-id="cross"][data-destination="itinerary"]').click();
  assert.equal(await page.evaluate(()=>getTrip().id),'cross');assert.equal(await page.evaluate(()=>editingDay),2);
  assert.equal(await page.locator('#tripDetail').evaluate(el=>el.classList.contains('active')),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(APP_DATA.trips)),before);
  await open();await page.locator('#calendarDetails [data-trip-id="overlap"][data-destination="timeline"]').click();
  assert.equal(await page.evaluate(()=>RECORD_TRIP_ID),'overlap');assert.equal(await page.locator('#record').evaluate(el=>el.classList.contains('active')),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(APP_DATA.trips)),before);
});
test('Empty date passes same-day dates to creator without creating Trip',async()=>{
  await open();await cell('2026-10-26').click();const before=await snapshot();await page.locator('[data-create-date]').click();
  assert.equal(await page.locator('#editStartDate').inputValue(),'2026-10-26');assert.equal(await page.locator('#editEndDate').inputValue(),'2026-10-26');
  assert.equal(await page.evaluate(()=>getTrip('edit').days.length),1);assert.deepEqual(await snapshot(),before);await page.evaluate(()=>closeTripEditor());
});
test('Past Calendar date opens the correct Trip Timeline DAY directly and returns to Record list',async()=>{
  await open();await page.locator('#calendarPrevious').click();await cell('2026-09-02').click();
  const before=await snapshot();await page.locator('#calendarDetails [data-trip-id="past"][data-destination="timeline"]').click();
  assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  assert.equal(await page.evaluate(()=>RECORD_TRIP_ID),'past');
  await page.waitForTimeout(500);
  const day=await page.locator('#record .b1-day-section').nth(1).boundingBox();assert.ok(day.y>=0&&day.y+day.height<744,JSON.stringify(day));
  assert.match(await page.locator('#record .b1-day-section').nth(1).textContent(),/DAY 2/);
  await page.locator('[data-record-list]').click();assert.equal(await page.locator('#record').getAttribute('data-record-view'),'list');assert.deepEqual(await snapshot(),before);
});
test('Week-row wrap drag including month boundary works forward, reverse and endpoint editing with touch',async()=>{
  await open();const before=await snapshot();
  for(const [from,to] of [['2026-10-31','2026-11-01'],['2026-11-01','2026-10-31']]){
    await page.evaluate(()=>calendarClearRange());const a=await center(from),b=await center(to);
    await touch('touchStart',a);await touch('touchMove',{x:a.x+(b.x-a.x)/2,y:a.y+(b.y-a.y)/2});await touch('touchMove',b);await touch('touchEnd');
    assert.deepEqual(await range(),{startDate:'2026-10-31',endDate:'2026-11-01'});assert.equal(await page.locator('.calendar-day.in-range').count(),2);
  }
  const a=await center('2026-11-01'),b=await center('2026-11-03');await touch('touchStart',a);await page.waitForTimeout(450);await touch('touchMove',b);await touch('touchEnd');
  assert.deepEqual(await range(),{startDate:'2026-10-31',endDate:'2026-11-03'});assert.deepEqual(await snapshot(),before);
});
test('Range drag is live; release confirms; only UI state changes',async()=>{
  await open();const before=await snapshot(),a=await center(dayKey(25)),b=await center(dayKey(28));
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});
  assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(28)});assert.equal(await page.locator('.calendar-day.in-range').count(),4);assert.equal(await page.locator('#calendarCreate').isVisible(),false);
  await page.mouse.up();assert.equal(await page.locator('#calendarCreate').isVisible(),true);assert.deepEqual(await snapshot(),before);await shot('calendar-range');
});
test('Endpoint long press extends and shortens both ends without crossing',async()=>{
  await open();await drag(dayKey(26),dayKey(29));
  await drag(dayKey(26),dayKey(25),true);assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(29)});
  await drag(dayKey(25),dayKey(27),true);assert.equal((await range()).startDate,dayKey(27));
  await drag(dayKey(29),dayKey(31),true);assert.equal((await range()).endDate,dayKey(31));
  await drag(dayKey(31),dayKey(28),true);assert.equal((await range()).endDate,dayKey(28));
  await drag(dayKey(27),dayKey(30),true);assert.deepEqual(await range(),{startDate:dayKey(28),endDate:dayKey(28)});
});
test('Endpoint editing feedback and Picker keyboard alternative allow one day',async()=>{
  await open();await drag(dayKey(25),dayKey(29));const p=await center(dayKey(25));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(450);
  assert.equal(await cell(dayKey(25)).evaluate(el=>el.classList.contains('editing-endpoint')),true);await page.mouse.up();
  await page.locator('#calendarEndDateField').click();await page.locator('[data-wheel="day"]').focus();for(let i=0;i<4;i++)await page.keyboard.press('ArrowUp');await page.locator('#calendarPickerConfirm').click();assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(25)});
});
test('Clear and new selection replace old unsaved range',async()=>{
  await open();await drag(dayKey(25),dayKey(28));await drag(dayKey(29),dayKey(31));assert.deepEqual(await range(),{startDate:dayKey(29),endDate:dayKey(31)});
  await page.locator('.calendar-range-footer button').click();assert.equal(await range(),null);assert.equal(await page.locator('#calendarCreate').isVisible(),false);
});
test('Past day drag does not begin Range; existing Trip drag does not reschedule Trip',async()=>{
  await open();const before=await snapshot();await drag(dayKey(20),dayKey(22));assert.equal(await range(),null);
  await drag(dayKey(30),'2026-11-02');assert.deepEqual(await range(),{startDate:dayKey(30),endDate:'2026-11-02'});assert.deepEqual(await snapshot(),before);
});
test('Manual month navigation retains range; Picker extends across months',async()=>{
  await open();await drag(dayKey(30),'2026-11-02');await page.locator('#calendarNext').click();
  assert.equal((await range()).endDate,'2026-11-02');await page.locator('#calendarEndDateField').click();await wheelValue('day',10);await page.locator('#calendarPickerConfirm').click();assert.deepEqual(await range(),{startDate:dayKey(30),endDate:'2026-11-10'});
});
test('pointercancel restores prior confirmed range and avoids accidental click',async()=>{
  await open();await drag(dayKey(25),dayKey(28));const a=await center(dayKey(29)),b=await center(dayKey(31));
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:3});
  await page.locator('#calendarGrid').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
  assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(28)});assert.equal(await page.evaluate(()=>CALENDAR_UI.gesture),null);
});
test('Touch taps remain taps, future touch drag selects without viewport scrolling',async()=>{
  await open();const a=await center(dayKey(25)),b=await center(dayKey(28)),scroll=await page.evaluate(()=>window.scrollY);
  await touch('touchStart',a);await touch('touchEnd');assert.equal(await range(),null);assert.equal(await page.evaluate(()=>CALENDAR_UI.selectedDate),dayKey(25));
  await touch('touchStart',a);await touch('touchMove',{x:a.x+12,y:a.y});await touch('touchMove',b);await touch('touchEnd');
  assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(28)});assert.equal(await page.evaluate(()=>window.scrollY),scroll);
});
test('A quick past-date tap after a future-date tap is not swallowed',async()=>{
  await open();await cell(dayKey(25)).click();await cell(dayKey(20)).click();
  assert.equal(await page.evaluate(()=>CALENDAR_UI.selectedDate),dayKey(20));assert.equal(await range(),null);
});
test('Touch long press edits endpoint; touchcancel rolls back',async()=>{
  await open();await drag(dayKey(25),dayKey(28));const a=await center(dayKey(28)),b=await center(dayKey(30));
  await touch('touchStart',a);await page.waitForTimeout(450);await touch('touchMove',b);assert.equal((await range()).endDate,dayKey(30));
  await touch('touchCancel');assert.equal((await range()).endDate,dayKey(28));
});
test('Compact Calendar scrolls only its grid while fields and details stay above dock',async()=>{
  await page.setViewportSize({width:320,height:568});await open();const before=await snapshot();
  const dims=await page.evaluate(()=>{const port=document.querySelector('.calendar-grid-scroll'),fields=document.querySelector('.calendar-date-fields').getBoundingClientRect(),details=document.getElementById('calendarDetails').getBoundingClientRect(),dock=document.querySelector('.bottom').getBoundingClientRect();return{scrollable:port.scrollHeight>port.clientHeight,fields:fields.bottom,details:details.bottom,dock:dock.top};});
  assert.equal(dims.scrollable,true);assert.ok(dims.fields<dims.details&&dims.details<dims.dock);
  const scroll=await page.evaluate(()=>window.scrollY);await page.locator('.calendar-grid-scroll').evaluate(el=>el.scrollTop=0);
  assert.equal(await page.evaluate(()=>window.scrollY),scroll);assert.deepEqual(await snapshot(),before);
});
test('Cancelled initial selection leaves no range; repeated binding has no duplicate handlers',async()=>{
  await open();const p=await center(dayKey(25));await touch('touchStart',p);await page.waitForTimeout(450);await touch('touchCancel');assert.equal(await range(),null);
  await page.evaluate(()=>{for(let i=0;i<5;i++)bindCalendarUi();});
  await cell(dayKey(26)).click();assert.equal(await page.evaluate(()=>CALENDAR_UI.selectedDate),dayKey(26));assert.equal(await range(),null);
});
test('Range dates reach visible native date fields and draft DAYs; Cancel preserves source',async()=>{
  await open();await drag(dayKey(30),'2026-11-02');const before=await snapshot();await page.locator('#calendarCreate').click();
  assert.equal(await page.locator('#editStartDate').inputValue(),'2026-10-30');assert.equal(await page.locator('#editEndDate').inputValue(),'2026-11-02');
  assert.equal(await page.locator('#editStartDateDisplay').textContent(),'2026/10/30');assert.equal(await page.evaluate(()=>getTrip('edit').days.length),4);
  assert.deepEqual(await snapshot(),before);await page.evaluate(()=>closeTripEditor());assert.deepEqual(await snapshot(),before);assert.equal((await range()).endDate,'2026-11-02');
});
test('Explicit creator Save adds selected Trip and refreshes Calendar; existing Trips preserved',async()=>{
  await open();await drag(dayKey(25),dayKey(27));const before=await page.evaluate(()=>JSON.stringify(APP_DATA.trips));await page.locator('#calendarCreate').click();
  await page.locator('#editTripName').fill('選択範囲の新しい旅');await page.evaluate(()=>saveTripEditor());await page.evaluate(async()=>{await V26_CORE_PERSIST_CHAIN;});
  const saved=await page.evaluate(()=>({trips:APP_DATA.trips,range:CALENDAR_UI.range}));assert.equal(saved.trips.length,5);assert.equal(JSON.stringify(saved.trips.slice(0,4)),before);
  assert.equal(saved.trips[4].startDate,dayKey(25));assert.equal(saved.trips[4].endDate,dayKey(27));assert.equal(saved.trips[4].days.length,3);assert.equal(saved.range,null);
  assert.equal(await cell(dayKey(26)).locator('.calendar-trip-marker').count(),1);
});
test('Inherited creator 370-DAY limit is guarded before opening draft',async()=>{
  await open();const before=await snapshot();await page.evaluate(()=>{CALENDAR_UI.range={startDate:'2026-10-24',endDate:'2027-10-29'};calendarCreateTrip();});
  assert.equal(await page.evaluate(()=>EDIT_DATA),null);assert.deepEqual(await snapshot(),before);
});
test('Cross-Day Step B restoration, proposal, empty end, final day, Cancel remain UI only',async()=>{
  await page.evaluate(()=>{const s=APP_DATA.trips[1].days[0].plans[0].slots[0];s.startTime='23:00';s.endTime='01:00';s.v21.plannedStartAt='2026-10-30T23:00:00';s.v21.plannedEndAt='2026-10-31T01:00:00';APP_DATA.activeTripId='cross';});
  const before=await snapshot();await page.evaluate(()=>openScheduleEditor('edit-schedule',1,'a','cross-s1','app'));
  assert.equal(await page.locator('#scheduleEndDayNext').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#scheduleTimePreview').textContent(),'23:00 → 翌1:00');
  await page.locator('#scheduleEndDaySame').click();assert.equal(await page.locator('#scheduleNextDaySuggestion').isVisible(),true);await page.locator('#scheduleNextDaySuggestion button').click();
  await page.locator('#scheduleEnd').fill('');assert.equal(await page.locator('#scheduleEndDayNext').isDisabled(),true);await page.locator('#scheduleEditorCancel').click();
  await page.evaluate(()=>openScheduleEditor('new-slot',5,'a','','app'));await page.locator('#scheduleEnd').fill('13:00');assert.equal(await page.locator('#scheduleEndDayNext').isDisabled(),true);
  await page.locator('#scheduleEditorCancel').click();assert.deepEqual(await snapshot(),before);
});
test('Calendar 320px/390px: 7 columns, no horizontal overflow, FAB above dock',async()=>{
  for(const viewport of [{width:320,height:568},{width:390,height:844}]){
    await page.setViewportSize(viewport);await open();await drag(dayKey(25),dayKey(28));
    const dims=await page.evaluate(()=>{const grid=document.getElementById('calendarGrid'),fab=document.getElementById('calendarCreate').getBoundingClientRect(),dock=document.querySelector('.bottom').getBoundingClientRect();return{cols:getComputedStyle(grid).gridTemplateColumns.split(' ').length,doc:document.documentElement.scrollWidth,win:innerWidth,fabRight:fab.right,fabBottom:fab.bottom,dockTop:dock.top};});
    assert.equal(dims.cols,7);assert.ok(dims.doc<=dims.win);assert.ok(dims.fabRight<=viewport.width);assert.ok(dims.fabBottom<=dims.dockTop);
    await shot('calendar-range-'+viewport.width);await page.evaluate(()=>calendarClearRange());
  }
});
async function wheelValue(part,value){
  const wheel=page.locator(`[data-wheel="${part}"]`);
  await wheel.evaluate((el,value)=>{const i=[...el.children].findIndex(o=>Number(o.dataset.wheelValue)===value);if(i<0)throw Error('value outside wheel window');el.scrollTop=i*44;},value);
  await page.waitForFunction(({part,value})=>Number(document.querySelector(`[data-wheel="${part}"]`).getAttribute('aria-valuenow'))===value,{part,value});
}
test('Date fields are permanent, open three independent scroll wheels, Cancel preserves range and data',async()=>{
  await open();const before=await snapshot();assert.equal(await page.locator('#calendarStartDateField').isVisible(),true);assert.match(await page.locator('#calendarEndDateField').textContent(),/未選択/);
  await page.locator('#calendarStartDateField').click();assert.equal(await page.locator('.calendar-wheel').count(),3);assert.equal(await page.locator('#calendarDatePicker input').count(),0);
  assert.equal(await page.locator('.app').evaluate(el=>el.inert),true);
  await wheelValue('year',2027);await wheelValue('month',1);await wheelValue('day',31);
  assert.equal(await range(),null);await shot('calendar-date-wheels');await page.locator('#calendarPickerCancel').click();
  assert.equal(await range(),null);assert.deepEqual(await snapshot(),before);assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'calendarStartDateField');
});
test('Wheel Confirm handles year crossing and passes both dates to existing creator without saving',async()=>{
  await open();const before=await snapshot();await page.locator('#calendarStartDateField').click();
  await wheelValue('month',12);await wheelValue('day',31);await page.locator('#calendarPickerConfirm').click();
  assert.deepEqual(await range(),{startDate:'2026-12-31',endDate:'2026-12-31'});
  await page.locator('#calendarEndDateField').click();await wheelValue('year',2027);await wheelValue('month',1);await wheelValue('day',2);await page.locator('#calendarPickerConfirm').click();
  assert.deepEqual(await range(),{startDate:'2026-12-31',endDate:'2027-01-02'});assert.equal(await page.evaluate(()=>CALENDAR_UI.month),'2027-01-01');
  assert.match(await page.locator('#calendarStartDateField').textContent(),/2026\/12\/31/);assert.equal(await page.locator('.calendar-day.in-range').count(),3);
  await page.locator('#calendarCreate').click();assert.equal(await page.locator('#editStartDate').inputValue(),'2026-12-31');assert.equal(await page.locator('#editEndDate').inputValue(),'2027-01-02');assert.deepEqual(await snapshot(),before);await page.evaluate(()=>closeTripEditor());
});
test('Picker days clamp at month end and leap years, while Cancel leaves the chosen range intact',async()=>{
  await open();await page.locator('#calendarStartDateField').click();await wheelValue('year',2028);await wheelValue('month',1);await wheelValue('day',31);await wheelValue('month',2);
  assert.equal(await page.locator('[data-wheel="day"]').getAttribute('aria-valuemax'),'29');assert.equal(await page.locator('[data-wheel="day"]').getAttribute('aria-valuenow'),'29');
  await wheelValue('year',2027);assert.equal(await page.locator('[data-wheel="day"]').getAttribute('aria-valuenow'),'28');await page.locator('#calendarPickerConfirm').click();assert.deepEqual(await range(),{startDate:'2027-02-28',endDate:'2027-02-28'});
});
test('Past and reversed picker dates cannot confirm or create; same day remains valid',async()=>{
  await open();await drag(dayKey(25),dayKey(28));const before=await snapshot(),prior=await range();
  await page.locator('#calendarEndDateField').click();await wheelValue('day',24);assert.equal(await page.locator('#calendarPickerConfirm').isDisabled(),true);assert.match(await page.locator('#calendarPickerError').textContent(),/終了日は開始日以降/);
  await page.locator('#calendarPickerCancel').click();assert.deepEqual(await range(),prior);
  await page.locator('#calendarStartDateField').click();await wheelValue('day',23);assert.equal(await page.locator('#calendarPickerConfirm').isDisabled(),true);assert.match(await page.locator('#calendarPickerError').textContent(),/今日以降/);await page.keyboard.press('Escape');
  await page.evaluate(()=>calendarCreateTrip('2026-10-23'));assert.equal(await page.evaluate(()=>EDIT_DATA),null);assert.deepEqual(await snapshot(),before);
  await page.locator('#calendarEndDateField').click();await wheelValue('day',25);await page.locator('#calendarPickerConfirm').click();assert.deepEqual(await range(),{startDate:dayKey(25),endDate:dayKey(25)});
});
test('Drag updates permanent fields during movement; Picker then updates range; re-drag remains functional',async()=>{
  await open();const a=await center(dayKey(25)),b=await center(dayKey(28));await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});
  assert.match(await page.locator('#calendarEndDateField').textContent(),/2026\/10\/28/);await page.mouse.up();
  await page.locator('#calendarEndDateField').click();await wheelValue('day',30);await page.locator('#calendarPickerConfirm').click();assert.equal((await range()).endDate,dayKey(30));
  await drag(dayKey(30),dayKey(29),true);assert.match(await page.locator('#calendarEndDateField').textContent(),/2026\/10\/29/);
  await page.locator('.calendar-range-footer button').click();assert.match(await page.locator('#calendarStartDateField').textContent(),/未選択/);
});
test('Touch scroll changes one drum column only; keyboard and focus remain inside modal',async()=>{
  await open();await page.locator('#calendarStartDateField').click();const wheel=page.locator('[data-wheel="year"]'),box=await wheel.boundingBox();
  const x=box.x+box.width/2,y=box.y+box.height/2;await touch('touchStart',{x,y});
  for(let n=1;n<=4;n++){await touch('touchMove',{x,y:y-n*12});await page.waitForTimeout(40);}await touch('touchEnd');await page.waitForTimeout(700);
  const year=Number(await wheel.getAttribute('aria-valuenow'));assert.ok(year>2026);assert.equal(await page.locator('[data-wheel="month"]').getAttribute('aria-valuenow'),'10');
  await wheel.focus();await page.keyboard.press('ArrowDown');assert.equal(Number(await wheel.getAttribute('aria-valuenow')),year+1);
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'calendarPickerConfirm');await page.keyboard.press('Escape');assert.equal(await page.locator('#calendarDatePicker').isHidden(),true);
});
test('Six-week past calendar keeps Trip name and Record action visible above dock, including safe areas',async()=>{
  const trips=[trip('one','2026-08-01','2026-08-31'),trip('two','2026-08-31','2026-08-31')];
  for(const viewport of [{width:390,height:844},{width:320,height:568}]){
    await page.setViewportSize(viewport);await page.evaluate(trips=>{APP_DATA=normalizeAppData({trips});CALENDAR_UI.month='2026-08-01';CALENDAR_UI.selectedDate='2026-08-01';openCalendar();},trips);
    // Emulate an extra bottom safe-area inset; real WKWebView remains a device check.
    await page.addStyleTag({content:'.bottom{padding-bottom:34px!important}#calendar.active{bottom:112px!important}'});
    await cell('2026-08-31').click();assert.equal(await page.locator('.calendar-day').count(),42);assert.equal(await page.locator('.calendar-trip-detail').count(),2);
    assert.equal(await cell('2026-08-31').evaluate(el=>el.classList.contains('has-past-trip')),true);
    const action=page.locator('#calendarDetails [data-trip-id="one"][data-destination="timeline"]'),box=await action.boundingBox(),dock=await page.locator('.bottom').boundingBox(),fields=await page.locator('.calendar-date-fields').boundingBox();
    assert.ok(box.y>=fields.y+fields.height&&box.y+box.height<dock.y,JSON.stringify({box,dock,fields}));assert.equal(await page.evaluate(()=>window.scrollY),0);await shot('calendar-past-hotfix-'+viewport.width);
    await page.locator('#calendarDetails [data-trip-id="two"][data-destination="timeline"]').click();assert.equal(await page.evaluate(()=>RECORD_TRIP_ID),'two');assert.equal(await page.locator('#record').getAttribute('data-record-view'),'timeline');
  }
});

}
