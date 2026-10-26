/* Home + Calendar v1. Calendar dates and ranges are civil dates, not instants.
   All selection state is UI-only. Trip creation uses the existing draft/save flow. */
const CALENDAR_UI={month:'',selectedDate:'',range:null,editing:null,gesture:null,suppressClickUntil:0,pendingCreation:false,picker:null};

function calendarDayNumber(key){
  return isSchedulePlannedDateKey(key)?new Date(`${key}T00:00:00Z`).getTime()/86400000:null;
}
function calendarDateFromDay(number){
  if(!Number.isInteger(number)) return '';
  const date=new Date(number*86400000);
  if(!Number.isFinite(date.getTime())) return '';
  const key=date.toISOString().slice(0,10);
  return isSchedulePlannedDateKey(key)?key:'';
}
function calendarShiftMonth(key,amount){
  if(calendarDayNumber(key)===null||!Number.isInteger(amount)) return '';
  const date=new Date(`${key.slice(0,7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth()+amount);
  return calendarDateFromDay(date.getTime()/86400000);
}
function calendarMonthCells(key){
  const first=calendarShiftMonth(key,0); if(!first) return [];
  const day=calendarDayNumber(first),weekday=new Date(`${first}T00:00:00Z`).getUTCDay();
  return Array.from({length:42},(_,index)=>calendarDateFromDay(day-weekday+index));
}
function calendarTripsOnDate(trips,key){
  if(calendarDayNumber(key)===null) return [];
  return (trips||[]).filter(trip=>isSchedulePlannedDateKey(trip.startDate)&&isSchedulePlannedDateKey(trip.endDate)&&trip.startDate<=key&&key<=trip.endDate)
    .slice().sort((a,b)=>a.startDate.localeCompare(b.startDate)||String(a.id).localeCompare(String(b.id)))
    .map(trip=>({trip,day:(trip.days||[]).find(day=>day.date===key)||null}));
}
function calendarRangeBetween(anchor,key,today){
  if([anchor,key,today].some(date=>calendarDayNumber(date)===null)||anchor<today) return null;
  const target=key<today?today:key;
  return {startDate:anchor<target?anchor:target,endDate:anchor>target?anchor:target};
}
function calendarMoveRangeEndpoint(range,edge,key,today){
  if(!range||!['start','end'].includes(edge)||[range.startDate,range.endDate,key,today].some(date=>calendarDayNumber(date)===null)) return range?{...range}:null;
  if(range.startDate<today||range.endDate<range.startDate) return null;
  return edge==='start'
    ?{startDate:key<today?today:key>range.endDate?range.endDate:key,endDate:range.endDate}
    :{startDate:range.startDate,endDate:key<range.startDate?range.startDate:key};
}

function homeCalendarState(data,now=new Date()){
  const today=localDateKey(now),trips=data?.trips||[];
  const recent=trips.filter(trip=>trip.endDate<today).slice().sort((a,b)=>b.endDate.localeCompare(a.endDate)||b.startDate.localeCompare(a.startDate)).slice(0,3);
  // Keep the existing Camera/Quick Record getHomeTrip policy unchanged.
  for(const trip of trips){
    const ref=b32DurableActiveScheduleRef(trip); if(!ref) continue;
    const day=(trip.days||[]).find(day=>Number(day.day)===ref.day);
    const plan=day?.plans?.find(plan=>String(plan.id)===ref.planId);
    const slot=plan?.slots?.find(slot=>String(slot.id)===ref.slotId);
    if(slot) return {mode:'schedule',trip,active:{day,plan,slot,ref},next:null,recent};
  }
  const trip=trips.filter(trip=>trip.startDate<=today&&today<=trip.endDate).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate))[0]||null;
  if(!trip) return {mode:'idle',trip:null,active:null,next:null,recent};
  const upcoming=[];
  for(const day of trip.days||[]){
    if(day.date<today) continue;
    const plan=day.plans?.find(plan=>plan.id===day.activePlanId)||day.plans?.[0];
    for(const slot of plan?.slots||[]){
      const status=slot.v21?.status;
      if(slot.completedAt||['completed','skipped'].includes(status)) continue;
      upcoming.push({day,plan,slot});
    }
  }
  upcoming.sort((a,b)=>a.day.date.localeCompare(b.day.date)||timeToMinutes(a.slot.startTime)-timeToMinutes(b.slot.startTime));
  return {mode:'trip',trip,active:null,next:upcoming[0]||null,recent};
}

function calendarDisplayDate(key){ return key?`${Number(key.slice(0,4))}年${Number(key.slice(5,7))}月${Number(key.slice(8,10))}日`:''; }
function homeTripAction(trip,day,label,kind='itinerary',planId=''){
  return `<button type="button" class="home-trip-action" data-trip-id="${escapeHtml(trip.id)}" data-day="${day||1}" data-destination="${kind}" data-plan-id="${escapeHtml(planId)}">${escapeHtml(label)}<span aria-hidden="true">↗</span></button>`;
}
function renderHomeOverview(){
  const home=document.getElementById('home'); if(!home) return;
  const state=homeCalendarState(APP_DATA),trip=state.trip;
  home.dataset.homeState=state.mode;
  if(state.mode==='idle'){
    home.innerHTML=`<div class="home-welcome"><div class="page-kicker">A LITTLE JOURNEY</div><h1>次は、どこへ行こう。</h1><p>楽しみな予定を、ひとつずつ。</p><button id="homeCreateTrip" type="button" class="home-create" onclick="openNewTripEditor()">＋ 予定を立てる</button></div><div class="home-recent"><h2>最近の旅</h2>${state.recent.length?state.recent.map(trip=>`<article class="home-recent-trip"><p>${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))}</p>${homeTripAction(trip,1,cleanDisplayName(trip.title),'timeline')}</article>`).join(''):'<p class="home-empty">旅の記録は、ここに残っていきます。</p>'}</div>`;
    return;
  }
  const current=state.active||state.next,day=current?.day||trip.days?.find(day=>day.date===localDateKey())||trip.days?.[0];
  const candidate=current?selectedCandidate(current.slot):null;
  const headingDay=state.active?.day||trip.days?.find(day=>day.date===localDateKey())||trip.days?.[0];
  home.innerHTML=`<div class="home-live-heading"><div class="page-kicker">${state.mode==='schedule'?'NOW · いまの予定':'ON YOUR JOURNEY · 旅の途中'}</div><h1>${escapeHtml(state.mode==='schedule'?cleanDisplayName(candidate?.name||candidate?.destination||'現在の予定'):cleanDisplayName(trip.title))}</h1><p>${escapeHtml(state.mode==='schedule'?trip.title:calendarDisplayDate(localDateKey()))}${headingDay?` · DAY ${headingDay.day}`:''}</p></div><article class="home-live-card">${state.mode==='schedule'?`<span class="home-live-badge">進行中</span><p class="home-live-time">${escapeHtml(slotTimeLabel(current.slot))}</p><p>${escapeHtml(candidate?.activity||candidate?.destination||'この時間を、ゆっくり楽しもう。')}</p>`:current?`<div class="page-kicker">NEXT</div><p class="home-live-time">${escapeHtml(formatJP(day.date))} · ${escapeHtml(slotTimeLabel(current.slot))}</p><h2>${escapeHtml(cleanDisplayName(candidate?.name||'次の予定'))}</h2><p>${escapeHtml(candidate?.activity||candidate?.destination||'')}</p>`:'<h2>予定のない時間も、旅のひとつ。</h2><p>次の予定はまだありません。</p>'}${homeTripAction(trip,day?.day||1,state.mode==='schedule'?'現在の予定を開く':'旅程を見る','itinerary',current?.plan?.id||'')}</article>${homeTripAction(trip,day?.day||1,'旅の記録を見る','timeline')}`;
}
function calendarOpenTrip(tripId,dayNum=1,destination='itinerary',planId=''){
  const trip=getTripById(tripId); if(!trip) return;
  const day=(trip.days||[]).find(day=>day.day===Number(dayNum))||trip.days?.[0];
  if(destination==='timeline'){
    setRecordTrip(tripId); showScreen('record','record');
    const index=(trip.days||[]).indexOf(day);
    requestAnimationFrame(()=>document.querySelectorAll('#record .b1-day-section')[index]?.scrollIntoView({block:'start',behavior:'smooth'}));
  }else {
    openHomeTripDetail(tripId,day?.day||1);
    // An explicit Home Schedule action opens its Plan via existing navigation.
    if(planId&&day?.activePlanId!==planId&&day?.plans?.some(plan=>plan.id===planId)) setPlan(day.day,planId);
  }
}
function openCalendar(){
  if(!CALENDAR_UI.selectedDate) CALENDAR_UI.selectedDate=localDateKey();
  if(!CALENDAR_UI.month) CALENDAR_UI.month=calendarShiftMonth(CALENDAR_UI.selectedDate,0);
  showScreen('calendar','home');
}
function calendarMoveMonth(amount){
  calendarCancelGesture();
  const next=calendarShiftMonth(CALENDAR_UI.month,amount); if(!next) return;
  CALENDAR_UI.month=next; renderCalendar();
}
function calendarGoToday(){
  calendarCancelGesture();
  CALENDAR_UI.selectedDate=localDateKey(); CALENDAR_UI.month=calendarShiftMonth(CALENDAR_UI.selectedDate,0); renderCalendar();
}
function renderCalendar(){
  const grid=document.getElementById('calendarGrid'); if(!grid) return;
  if(!CALENDAR_UI.month) CALENDAR_UI.month=calendarShiftMonth(localDateKey(),0);
  if(!CALENDAR_UI.selectedDate) CALENDAR_UI.selectedDate=localDateKey();
  const today=localDateKey(),month=CALENDAR_UI.month;
  document.getElementById('calendarMonthTitle').textContent=`${Number(month.slice(0,4))}年 ${Number(month.slice(5,7))}月`;
  document.getElementById('calendarPrevious').disabled=!calendarShiftMonth(month,-1);
  document.getElementById('calendarNext').disabled=!calendarShiftMonth(month,1);
  grid.innerHTML=calendarMonthCells(month).map(key=>{
    if(!key) return '<span></span>';
    const trips=calendarTripsOnDate(APP_DATA.trips,key),outside=key.slice(0,7)!==month.slice(0,7);
    return `<button type="button" class="calendar-day${outside?' is-outside':''}${trips.length?' has-trip':''}${trips.length&&key<today?' has-past-trip':''}${key===today?' is-today':''}" data-date="${key}" data-range-eligible="${key>=today}" aria-label="${calendarDisplayDate(key)}${trips.length?`、旅行${trips.length}件`:''}"${key===today?' aria-current="date"':''}><span class="calendar-day-number">${Number(key.slice(8,10))}</span>${trips.length?'<span class="calendar-trip-marker" aria-hidden="true"></span>':''}</button>`;
  }).join('');
  calendarPaintSelection(); calendarRenderDetails();
  requestAnimationFrame(()=>{
    const port=document.querySelector('.calendar-grid-scroll');
    const target=grid.querySelector(`[data-date="${CALENDAR_UI.selectedDate}"]`)||grid.querySelector(`[data-date="${CALENDAR_UI.month}"]`);
    if(!target||!document.getElementById('calendar').classList.contains('active')||CALENDAR_UI.gesture)return;
    const view=port.getBoundingClientRect(),cell=target.getBoundingClientRect();
    if(cell.top<view.top||cell.bottom>view.bottom)port.scrollTop+=cell.top-view.top-(view.height-cell.height)/2;
  });
}
function calendarPaintSelection(){
  const ui=CALENDAR_UI,range=ui.range;
  document.querySelectorAll('#calendarGrid [data-date]').forEach(button=>{
    const key=button.dataset.date,selected=key===ui.selectedDate,inRange=!!range&&range.startDate<=key&&key<=range.endDate;
    button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected));
    button.classList.toggle('in-range',inRange);
    button.classList.toggle('range-start',!!range&&key===range.startDate);
    button.classList.toggle('range-end',!!range&&key===range.endDate);
    button.classList.toggle('editing-endpoint',!!range&&((ui.editing==='start'&&key===range.startDate)||(ui.editing==='end'&&key===range.endDate)));
  });
  const summary=document.getElementById('calendarRangeSummary'); summary.hidden=!range;
  for(const edge of ['start','end']){
    document.querySelector(`#calendar${edge==='start'?'Start':'End'}DateField strong`).textContent=range?formatSlash(range[edge+'Date']):'未選択';
  }
  if(range){
    const days=calendarDayNumber(range.endDate)-calendarDayNumber(range.startDate)+1;
    summary.innerHTML=`<div class="calendar-range-footer"><span>${days}日間${ui.editing?' · 日付を選んで調整':''}</span><button type="button" onclick="calendarClearRange()">解除</button></div>`;
  }else summary.innerHTML='';
  document.getElementById('calendarCreate').hidden=!range||!!ui.gesture;
}
function calendarRenderDetails(){
  const key=CALENDAR_UI.selectedDate,items=calendarTripsOnDate(APP_DATA.trips,key),box=document.getElementById('calendarDetails');
  box.innerHTML=`<h3>${escapeHtml(calendarDisplayDate(key))}</h3>${items.length?`${items.length>1?'<span class="calendar-trip-count">横にスワイプして旅行を選択</span>':''}<div class="calendar-trip-choices">${items.map(({trip,day})=>`<article class="calendar-trip-detail"><p>${escapeHtml(cleanDisplayName(trip.title))}</p><span>${day?`DAY ${day.day}`:'旅行期間内'}</span><div>${homeTripAction(trip,day?.day||1,'予定を見る')}${homeTripAction(trip,day?.day||1,'記録を見る','timeline')}</div></article>`).join('')}</div>`:`<p class="calendar-detail-note">この日の予定はまだありません。</p><button type="button" class="calendar-day-create" data-create-date="${key}"${key<localDateKey()?' disabled':''}>この日から予定を立てる</button>`}`;
}
function calendarAnnounceRange(){
  const range=CALENDAR_UI.range;
  document.getElementById('calendarRangeStatus').textContent=range?`${calendarDisplayDate(range.startDate)}から${calendarDisplayDate(range.endDate)}を選択`:'範囲選択を解除しました';
}
function calendarSelectDate(key){
  if(calendarDayNumber(key)===null) return;
  const ui=CALENDAR_UI;
  if(ui.editing&&ui.range){
    ui.range=calendarMoveRangeEndpoint(ui.range,ui.editing,key,localDateKey()); ui.editing=null; calendarAnnounceRange();
  }
  ui.selectedDate=key;
  if(key.slice(0,7)!==ui.month.slice(0,7)) ui.month=calendarShiftMonth(key,0);
  renderCalendar();
}
function calendarClearRange(){
  calendarCancelGesture(); CALENDAR_UI.range=null; CALENDAR_UI.editing=null;
  calendarPaintSelection(); calendarAnnounceRange();
}
function calendarCreateTrip(date=''){
  const range=date?{startDate:date,endDate:date}:CALENDAR_UI.range;
  if(!range||range.startDate<localDateKey()||[range.startDate,range.endDate].some(key=>calendarDayNumber(key)===null)||range.endDate<range.startDate) return;
  // dateRange in the existing Trip creator generates at most 370 DAYs.
  if(calendarDayNumber(range.endDate)-calendarDayNumber(range.startDate)>=370){ showToast('日程を370日以内にして作成してください。'); return; }
  calendarCancelGesture();
  openNewTripEditor({startDate:range.startDate,endDate:range.endDate});
  CALENDAR_UI.pendingCreation=true;
}

function calendarCancelGesture(){
  const gesture=CALENDAR_UI.gesture; if(!gesture) return;
  clearTimeout(gesture.timer); CALENDAR_UI.gesture=null;
  CALENDAR_UI.range=gesture.previousRange; CALENDAR_UI.editing=gesture.previousEditing;
  CALENDAR_UI.selectedDate=gesture.previousSelected;
  CALENDAR_UI.suppressClickUntil=Date.now()+500;
  const grid=document.getElementById('calendarGrid');
  if(grid?.hasPointerCapture(gesture.id)) grid.releasePointerCapture(gesture.id);
  calendarPaintSelection(); calendarRenderDetails();
}
function calendarBeginDrag(gesture,phase){
  clearTimeout(gesture.timer); gesture.phase=phase;
  if(phase==='edit') CALENDAR_UI.editing=gesture.edge;
  else { CALENDAR_UI.editing=null; CALENDAR_UI.range=calendarRangeBetween(gesture.anchor,gesture.anchor,localDateKey()); }
  calendarPaintSelection();
}
function bindCalendarUi(){
  const grid=document.getElementById('calendarGrid'); if(!grid||grid.dataset.bound) return;
  grid.dataset.bound='1';
  grid.addEventListener('pointerdown',event=>{
    if(CALENDAR_UI.gesture){ calendarCancelGesture(); return; }
    if(event.isPrimary===false||event.button!==0) return;
    const cell=event.target.closest('[data-date]'); if(!cell) return;
    // A new tap is not the synthetic click left over from the previous drag.
    CALENDAR_UI.suppressClickUntil=0;
    if(cell.dataset.date<localDateKey()) return;
    // Stop an in-flight navigation scroll before hit-testing a drag.
    window.scrollTo({top:window.scrollY,behavior:'instant'});
    const ui=CALENDAR_UI,key=cell.dataset.date,range=ui.range;
    const edge=ui.editing||(range&&key===range.endDate?'end':range&&key===range.startDate?'start':null);
    const gesture={id:event.pointerId,anchor:key,x:event.clientX,y:event.clientY,phase:'pending',edge,explicitEdge:!!ui.editing,previousRange:range?{...range}:null,previousEditing:ui.editing,previousSelected:ui.selectedDate,timer:null};
    ui.gesture=gesture; grid.setPointerCapture(event.pointerId);
    gesture.timer=setTimeout(()=>{ if(ui.gesture===gesture) calendarBeginDrag(gesture,edge?'edit':'new'); },400);
  });
  grid.addEventListener('pointermove',event=>{
    const gesture=CALENDAR_UI.gesture; if(!gesture||gesture.id!==event.pointerId) return;
    if(gesture.phase==='pending'){
      if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<9) return;
      calendarBeginDrag(gesture,gesture.explicitEdge?'edit':'new');
    }
    const cell=document.elementFromPoint(event.clientX,event.clientY)?.closest('#calendarGrid [data-date]'); if(!cell) return;
    CALENDAR_UI.range=gesture.phase==='edit'
      ?calendarMoveRangeEndpoint(CALENDAR_UI.range,gesture.edge,cell.dataset.date,localDateKey())
      :calendarRangeBetween(gesture.anchor,cell.dataset.date,localDateKey());
    calendarPaintSelection();
  });
  grid.addEventListener('pointerup',event=>{
    const ui=CALENDAR_UI,gesture=ui.gesture; if(!gesture||gesture.id!==event.pointerId) return;
    clearTimeout(gesture.timer); ui.gesture=null; ui.suppressClickUntil=Date.now()+500;
    if(grid.hasPointerCapture(event.pointerId)) grid.releasePointerCapture(event.pointerId);
    if(gesture.phase==='pending') calendarSelectDate(gesture.anchor);
    else {ui.editing=null; calendarPaintSelection(); calendarAnnounceRange(); calendarRenderDetails();}
  });
  grid.addEventListener('pointercancel',calendarCancelGesture);
  grid.addEventListener('lostpointercapture',calendarCancelGesture);
  grid.addEventListener('contextmenu',event=>event.preventDefault());
  grid.addEventListener('click',event=>{
    if(event.detail&&Date.now()<CALENDAR_UI.suppressClickUntil){ event.preventDefault(); return; }
    const cell=event.target.closest('[data-date]'); if(cell) calendarSelectDate(cell.dataset.date);
  });
  document.querySelectorAll('[data-picker-edge]').forEach(button=>button.addEventListener('click',()=>calendarOpenDatePicker(button.dataset.pickerEdge)));
  calendarBindDatePicker();
  document.getElementById('calendarDetails').addEventListener('click',event=>{
    const button=event.target.closest('[data-create-date]'); if(button) calendarCreateTrip(button.dataset.createDate);
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('#home [data-trip-id], #calendar [data-trip-id]');
    if(button) calendarOpenTrip(button.dataset.tripId,Number(button.dataset.day),button.dataset.destination,button.dataset.planId);
  });
  window.addEventListener('blur',calendarCancelGesture);
  document.addEventListener('visibilitychange',()=>{if(document.hidden) calendarCancelGesture();});
}
if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',bindCalendarUi);

// Gregorian components only; picker choices never interpret a local datetime.
function calendarPickerDate(year,month,day){
  if(![year,month,day].every(Number.isInteger)||year<1||year>9999||month<1||month>12||day<1) return '';
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
  return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(Math.min(day,days)).padStart(2,'0')}`;
}
function calendarPickerRange(range,edge,key,today){
  if(!['start','end'].includes(edge)||[key,today].some(date=>calendarDayNumber(date)===null)) return {range:null,error:'日付を確認してください。'};
  if(key<today) return {range:null,error:'今日以降の日付を選んでください。'};
  const next=range?{...range,[edge+'Date']:key}:{startDate:key,endDate:key};
  if([next.startDate,next.endDate].some(date=>calendarDayNumber(date)===null)||next.startDate<today) return {range:null,error:'今日以降の日付を選んでください。'};
  if(next.endDate<next.startDate) return {range:null,error:'終了日は開始日以降にしてください。'};
  return {range:next,error:''};
}
function calendarScreenChanged(id){
  document.body.classList.toggle('calendar-view',id==='calendar');
  if(id!=='calendar') calendarCloseDatePicker(false);
}
function calendarOpenDatePicker(edge){
  if(!['start','end'].includes(edge)) return;
  calendarCancelGesture();calendarCloseDatePicker(false);
  const ui=CALENDAR_UI,today=localDateKey();
  const key=ui.range?.[edge+'Date']||(ui.selectedDate>=today?ui.selectedDate:today);
  const [year,month,day]=key.split('-').map(Number);
  const app=document.querySelector('.app');
  ui.picker={edge,year,month,day,focus:document.activeElement,wasInert:app.inert};
  app.inert=true;
  document.getElementById('calendarDatePicker').hidden=false;
  document.body.classList.add('calendar-picker-open');
  calendarRenderPicker();document.querySelector('[data-wheel="year"]').focus({preventScroll:true});
}
function calendarCloseDatePicker(restoreFocus=true){
  const picker=CALENDAR_UI.picker;if(!picker) return;
  CALENDAR_UI.picker=null;
  document.querySelectorAll('.calendar-wheel').forEach(wheel=>{clearTimeout(wheel.calendarScrollTimer);wheel.calendarTouching=false;});
  document.getElementById('calendarDatePicker').hidden=true;
  document.querySelector('.app').inert=picker.wasInert;
  document.body.classList.remove('calendar-picker-open');
  if(restoreFocus&&picker.focus?.isConnected)picker.focus.focus({preventScroll:true});
}
function calendarRenderPicker(){
  const picker=CALENDAR_UI.picker;if(!picker)return;
  const key=calendarPickerDate(picker.year,picker.month,picker.day);
  picker.day=Number(key.slice(8,10));
  document.getElementById('calendarPickerTitle').textContent=picker.edge==='start'?'開始日':'終了日';
  document.getElementById('calendarPickerPreview').textContent=calendarDisplayDate(key);
  const result=calendarPickerRange(CALENDAR_UI.range,picker.edge,key,localDateKey());
  document.getElementById('calendarPickerError').textContent=result.error;
  document.getElementById('calendarPickerConfirm').disabled=!!result.error;
  document.querySelectorAll('.calendar-wheel').forEach(wheel=>{
    clearTimeout(wheel.calendarScrollTimer);
    const part=wheel.dataset.wheel,min=part==='year'?Number(localDateKey().slice(0,4)):1;
    const max=part==='year'?9999:part==='month'?12:Number(calendarPickerDate(picker.year,picker.month,31).slice(8,10));
    // Keep the year DOM small and extend its window as the wheel moves.
    const start=part==='year'?Math.max(min,picker.year-10):min,end=part==='year'?Math.min(max,picker.year+10):max;
    const values=Array.from({length:end-start+1},(_,i)=>start+i),suffix={year:'年',month:'月',day:'日'}[part];
    wheel.innerHTML=values.map(value=>`<div class="calendar-wheel-option${value===picker[part]?' is-chosen':''}" data-wheel-value="${value}">${value}${suffix}</div>`).join('');
    wheel.setAttribute('aria-valuemin',min);wheel.setAttribute('aria-valuemax',max);
    wheel.setAttribute('aria-valuenow',picker[part]);wheel.setAttribute('aria-valuetext',`${picker[part]}${suffix}`);
    wheel.scrollTop=Math.max(0,values.indexOf(picker[part]))*44;
  });
}
function calendarPickerSetPart(part,value){
  const picker=CALENDAR_UI.picker;if(!picker||!Number.isInteger(value)||!['year','month','day'].includes(part))return;
  const min=part==='year'?Number(localDateKey().slice(0,4)):1;
  const max=part==='year'?9999:part==='month'?12:Number(calendarPickerDate(picker.year,picker.month,31).slice(8,10));
  picker[part]=Math.min(max,Math.max(min,value));calendarRenderPicker();
}
function calendarWheelValue(wheel){
  const options=wheel.querySelectorAll('[data-wheel-value]');
  return Number(options[Math.max(0,Math.min(options.length-1,Math.round(wheel.scrollTop/44)))]?.dataset.wheelValue);
}
function calendarConfirmDatePicker(){
  const picker=CALENDAR_UI.picker;if(!picker)return;
  // Read the visible rows even when Confirm follows an unfinished scroll.
  for(const wheel of document.querySelectorAll('.calendar-wheel')) picker[wheel.dataset.wheel]=calendarWheelValue(wheel);
  const key=calendarPickerDate(picker.year,picker.month,picker.day);
  const result=calendarPickerRange(CALENDAR_UI.range,picker.edge,key,localDateKey());
  if(result.error){calendarRenderPicker();return;}
  CALENDAR_UI.range=result.range;CALENDAR_UI.editing=null;CALENDAR_UI.selectedDate=key;CALENDAR_UI.month=calendarShiftMonth(key,0);
  calendarCloseDatePicker();renderCalendar();calendarAnnounceRange();
}
function calendarBindDatePicker(){
  const overlay=document.getElementById('calendarDatePicker');if(overlay.dataset.bound)return;overlay.dataset.bound='1';
  document.getElementById('calendarPickerCancel').addEventListener('click',()=>calendarCloseDatePicker());
  document.getElementById('calendarPickerConfirm').addEventListener('click',calendarConfirmDatePicker);
  overlay.addEventListener('click',event=>{if(event.target===overlay)calendarCloseDatePicker();});
  for(const wheel of overlay.querySelectorAll('.calendar-wheel')){
    const settle=()=>{
      const picker=CALENDAR_UI.picker;if(!picker||wheel.calendarTouching)return;
      const value=calendarWheelValue(wheel);
      if(Number.isFinite(value)&&value!==picker[wheel.dataset.wheel])calendarPickerSetPart(wheel.dataset.wheel,value);
    };
    wheel.addEventListener('scroll',()=>{clearTimeout(wheel.calendarScrollTimer);wheel.calendarScrollTimer=setTimeout(settle,140);},{passive:true});
    const release=()=>{wheel.calendarTouching=false;clearTimeout(wheel.calendarScrollTimer);wheel.calendarScrollTimer=setTimeout(settle,180);};
    wheel.addEventListener('touchstart',()=>{wheel.calendarTouching=true;},{passive:true});
    for(const event of ['touchend','touchcancel'])wheel.addEventListener(event,release,{passive:true});
    wheel.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')wheel.calendarTouching=true;});
    for(const event of ['pointerup','pointercancel'])wheel.addEventListener(event,e=>{if(e.pointerType!=='touch')release();});
    wheel.addEventListener('click',event=>{
      const option=event.target.closest('[data-wheel-value]');if(option)calendarPickerSetPart(wheel.dataset.wheel,Number(option.dataset.wheelValue));
    });
    wheel.addEventListener('keydown',event=>{
      const changes={ArrowUp:-1,ArrowDown:1,PageUp:-10,PageDown:10};
      if(changes[event.key]&&CALENDAR_UI.picker){event.preventDefault();calendarPickerSetPart(wheel.dataset.wheel,CALENDAR_UI.picker[wheel.dataset.wheel]+changes[event.key]);}
    });
  }
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();calendarCloseDatePicker();}
    if(event.key==='Tab'){
      const elements=[...overlay.querySelectorAll('[tabindex="0"],button:not(:disabled)')],index=elements.indexOf(document.activeElement);
      event.preventDefault();elements[(index+(event.shiftKey?-1:1)+elements.length)%elements.length]?.focus({preventScroll:true});
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)calendarCloseDatePicker(false);});
}
