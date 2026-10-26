/* Tripper Note v2.5.3 Editorial UI
   Focus: schema/migration, multiple trips, native date/time inputs, navigation preferences.
   Visual design intentionally stays close to v2.4.1 and will be redesigned separately.
*/
let APP_DATA = loadAppDataV26();
let EDIT_DATA = null;
let EDITOR_MODE = 'edit';
let editingDay = 1;
let editingPlanDay = 1;
let candidateContext = null;
let candidateFormMode = null;
let coverPhotoContext = null;

/* Phase 4B.2 diagnostics. Timeline now accepts lightweight Text Blocks via Quick Record Bar. */
if(typeof window!=='undefined'){
  window.TripperV21Foundation={
    version:'2.6.0-B.3.2',
    schemaVersion:SCHEMA_VERSION,
    inspect:()=>buildV21FoundationReport(APP_DATA),
    validate:()=>validateV21Integrity(APP_DATA),
    schedules:(tripId=null)=>getV21ScheduleProjection(APP_DATA,tripId),
    timeline:(tripId=null)=>{ const trip=(APP_DATA?.trips||[]).find(t=>!tripId||t.id===tripId)||(tripId?null:getRecordTrip?.()); return trip?b1BuildTimelineSkeleton(trip):null; },
    storage:()=>typeof coreStorageDiagnostics==='function'?coreStorageDiagnostics():Promise.resolve(null)
  };
}

function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function cleanDisplayName(value=''){
  return String(value).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'').trim();
}
function iconSvg(name){
  const paths={
    car:'<path d="M5 16h14l-1.2-5.2A2 2 0 0 0 15.85 9H8.15a2 2 0 0 0-1.95 1.55L5 16Zm0 0H3v3h2m14-3h2v3h-2M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 12h8"/>',
    walk:'<path d="M13 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-1 2 2.2 2.1 2.8 1.1M11.8 7.5 9 11l-3 .8m6.2-.4-1.3 4.1L8.5 21m4.2-6 3 2.3 2.8 3.7"/>',
    train:'<path d="M7 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 5h10M8 21l2-3m6 3-2-3M8.5 14h.01M15.5 14h.01"/>',
    pin:'<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>',
    route:'<path d="M4 18c2.5-6 5.5-2 8-8 1.8-4.3 4.5-4.3 8-4M17 3l3 3-3 3"/>',
    edit:'<path d="m4 16-.7 4.7L8 20l10.8-10.8-4-4L4 16Zm9.4-9.4 4 4"/>',
    hotel:'<path d="M4 20V6h16v14M4 12h16M8 9h2m4 0h2M7 20v-5h10v5"/>',
    shuffle:'<path d="M4 7h3c4 0 4 10 8 10h5M17 14l3 3-3 3M4 17h3c1.3 0 2.1-1 3-2.5M14 9.5C15.1 8 16.2 7 18 7h2M17 4l3 3-3 3"/>',
    record:'<path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4M8 11h6M8 15h6"/>',
    camera:'<path d="M4 7h3l1.2-2h7.6L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>',
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6m4-6v6"/>'
  };
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.pin}</svg>`;
}
function formatJP(key){ const d=parseLocalDate(key); return `${d.getMonth()+1}月${d.getDate()}日`; }
function formatSlash(key){ const d=parseLocalDate(key); return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`; }
function diffDays(fromKey,toKey){ return Math.round((parseLocalDate(toKey)-parseLocalDate(fromKey))/86400000); }
function timeToMinutes(hhmm='23:59'){ const m=String(hhmm).match(/(\d{1,2}):(\d{2})/); return m?Number(m[1])*60+Number(m[2]):1439; }
function slotTimeLabel(slot){
  if(slot?.timeNote) return slot.timeNote;
  if(slot?.startTime&&slot?.endTime) return `${slot.startTime} - ${slot.endTime}`;
  if(slot?.startTime) return `${slot.startTime}〜`;
  return '時間未定';
}
function slotSortMinutes(slot){ return timeToMinutes(slot?.startTime||'23:59'); }
function formatDateTime(date,time){ return [date?formatJP(date):'',time||''].filter(Boolean).join(' '); }

function persistAppData(){ APP_DATA=normalizeAppData(APP_DATA); persistAppDataV26(APP_DATA); }
function dataRoot(source='app'){ return source==='edit'&&EDIT_DATA?EDIT_DATA:APP_DATA; }
function getTrip(source='app'){ const root=dataRoot(source); return root.trips.find(t=>t.id===root.activeTripId)||root.trips[0]||null; }
function getTripById(id,source='app'){ return dataRoot(source).trips.find(t=>t.id===id)||null; }
function getDay(day,source='app'){ return getTrip(source)?.days.find(d=>d.day===Number(day))||null; }
function getPlan(day,planId,source='app'){ const d=getDay(day,source); return d?.plans.find(p=>p.id===planId)||d?.plans[0]||null; }
function getActivePlan(day,source='app'){ const d=getDay(day,source); return d?getPlan(day,d.activePlanId,source):null; }
function getSlot(day,planId,slotId,source='app'){ return getPlan(day,planId,source)?.slots.find(s=>s.id===slotId)||null; }
function selectedCandidate(slot){ return slot?.candidates.find(c=>c.id===slot.selectedCandidateId)||slot?.candidates[0]||null; }

function getDayFromTrip(trip,day){ return trip?.days?.find(d=>d.day===Number(day))||null; }
function getPlanFromTrip(trip,day,planId){ const d=getDayFromTrip(trip,day); return d?.plans?.find(p=>p.id===planId)||d?.plans?.[0]||null; }
function getActivePlanFromTrip(trip,day){ const d=getDayFromTrip(trip,day); return d?getPlanFromTrip(trip,day,d.activePlanId):null; }
function getSlotFromTrip(trip,day,planId,slotId){ return getPlanFromTrip(trip,day,planId)?.slots?.find(s=>s.id===slotId)||null; }
function getHomeTrip(now=new Date()){
  const trips=(APP_DATA?.trips||[]).slice(); if(!trips.length) return null;
  const today=localDateKey(now);
  const current=trips.filter(t=>t.startDate<=today&&today<=t.endDate).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  if(current.length) return current[0];
  const upcoming=trips.filter(t=>t.startDate>today).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  if(upcoming.length) return upcoming[0];
  return trips.filter(t=>t.endDate<today).sort((a,b)=>b.endDate.localeCompare(a.endDate))[0]||trips[0];
}

function setActiveTab(tab){ document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); }
function showScreen(id,tab){
  if(id!=='calendar') calendarCancelGesture();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  if(tab) setActiveTab(tab);
  calendarScreenChanged(id);
  if(id==='home') renderHome();
  if(id==='calendar') renderCalendar();
  if(typeof recordArchiveScreenChanged==='function') recordArchiveScreenChanged(id);
  window.scrollTo({top:0,behavior:id==='calendar'?'instant':'smooth'});
}
function activateTrip(tripId,openDetail=false){
  if(!getTripById(tripId)) return;
  APP_DATA.activeTripId=tripId; persistAppData(); editingDay=1; renderAll();
  if(openDetail) openTripDetail(1);
}
function openTripDetail(day){
  const trip=getTrip(); if(!trip) return;
  editingDay=Math.min(Math.max(Number(day||getHomeDayNumber()),1),trip.days.length);
  showScreen('tripDetail','trips'); renderTripDetail();
}
function setDay(day){ editingDay=Number(day); renderTripDetail(); }
function setPlan(day,planId){
  const d=getDay(day); if(!d) return; d.activePlanId=planId; persistAppData(); renderTripDetail(); renderHome();
}

function openNearby(query){ const q=encodeURIComponent(`${query} 近く`); openExternal(`https://www.google.com/maps/search/?api=1&query=${q}`); }
function saveNote(){ const text=document.getElementById('quickNote').value.trim(); localStorage.setItem('tripQuickNote',text); document.getElementById('noteSaved').textContent=text?'✓ この端末に保存しました':'メモを空にしました'; }
function loadNote(){ const saved=localStorage.getItem('tripQuickNote'); if(saved) document.getElementById('quickNote').value=saved; }

function transportIcon(mode){ return iconSvg(mode==='car'?'car':mode==='walk'?'walk':mode==='train'?'train':'pin'); }
function navPreferenceLabel(mode){
  const id=getNavigationPreference(mode),opt=(NAV_APP_OPTIONS[mode]||[]).find(x=>x.id===id);
  return opt?.label||'ナビ';
}
function candidateSummary(c){ return c?.activity||c?.description||c?.destination||''; }
function navigateCandidate(day,planId,slotId){ const c=selectedCandidate(getSlot(day,planId,slotId)); if(c&&c.transportMode!=='none') navigateByPreference(c,c.transportMode); }
function mapCandidate(day,planId,slotId){ const c=selectedCandidate(getSlot(day,planId,slotId)); const url=c?buildMapSearchUrl(c):''; if(url) openExternal(url); else alert('目的地を登録してください。'); }
function openLodgingMap(day){ const l=getDay(day)?.lodging; if(!l) return; const c={name:l.name,destination:l.name,address:l.address,googleMapsUrl:l.googleMapsUrl,lat:l.lat,lon:l.lon}; const url=buildMapSearchUrl(c); if(url) openExternal(url); }
function navToLodging(day){ const l=getDay(day)?.lodging; if(!l) return; l.destination=l.destination||l.name; navigateByPreference(l,'car'); }

function getHomeDayNumber(now=new Date(),trip=getHomeTrip(now)){
  if(!trip) return 1; const today=localDateKey(now);
  if(today<trip.startDate) return 1; if(today>trip.endDate) return trip.days.length;
  return trip.days.find(d=>d.date===today)?.day||1;
}
function findNextSlotForTrip(trip,day,now=new Date()){
  const slots=(getActivePlanFromTrip(trip,day.day)?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  const current=now.getHours()*60+now.getMinutes();
  for(let i=0;i<slots.length;i++){
    const start=slotSortMinutes(slots[i]);
    const inferredEnd=slots[i].endTime?timeToMinutes(slots[i].endTime):(slots[i+1]?Math.max(start+1,slotSortMinutes(slots[i+1])):Math.min(1439,start+60));
    if(current>=start&&current<inferredEnd) return slots[i];
  }
  return slots.find(s=>slotSortMinutes(s)>current)||null;
}
function getHomeContext(now=new Date(),trip=getHomeTrip(now)){
  if(!trip) return {phase:'empty',trip:null,day:1,label:'旅行なし',dateLabel:'',next:null};
  const today=localDateKey(now);
  if(today<trip.startDate){ const days=diffDays(today,trip.startDate),d=trip.days[0],first=getActivePlanFromTrip(trip,d.day)?.slots.slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b))[0]||null; return {phase:'before',trip,day:d.day,label:days===1?'出発まであと1日':`出発まであと${days}日`,dateLabel:formatJP(trip.startDate),next:first}; }
  if(today>trip.endDate) return {phase:'after',trip,day:trip.days.length,label:'最近の旅行',dateLabel:`${formatJP(trip.startDate)}〜${formatJP(trip.endDate)}`,next:null};
  const d=trip.days.find(x=>x.date===today)||trip.days[0]; return {phase:'during',trip,day:d.day,label:`DAY ${d.day}`,dateLabel:formatJP(d.date),next:findNextSlotForTrip(trip,d,now)};
}

function renderHeader(){
  document.title='Tripper Note';
}
function tripPhaseLabel(trip){ const today=localDateKey(); if(today<trip.startDate) return '予定'; if(today>trip.endDate) return '過去'; return '旅行中'; }
function renderTrips(){
  const list=document.getElementById('tripList'); if(!list) return;
  const trips=APP_DATA.trips.slice().sort((a,b)=>a.startDate.localeCompare(b.startDate));
  list.innerHTML=trips.map(trip=>{
    const active=trip.id===APP_DATA.activeTripId;
    return `<div class="trip-list-item ${active?'active-trip':''}"><div class="card trip-card" onclick="activateTrip('${trip.id}',true)" role="button" tabindex="0"><div class="trip-icon">${iconSvg('route')}</div><div><div class="trip-name">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="trip-date">${formatSlash(trip.startDate)}〜${formatSlash(trip.endDate).slice(5)} · ${Math.max(0,trip.days.length-1)}泊${trip.days.length}日 · ${tripPhaseLabel(trip)}</div></div><div class="chev">›</div></div><div class="trip-actions-row"><button class="btn ghost" onclick="event.stopPropagation();openTripEditor('basic','${trip.id}')">編集</button>${active?' <span class="active-trip-label">閲覧中</span>':''}</div></div>`;
  }).join('')||'<div class="coming">旅行がありません。右上の「＋旅行を追加」から登録できます。</div>';
}
function navigateHomeCandidate(tripId,day,planId,slotId){
  const trip=getTripById(tripId); const c=selectedCandidate(getSlotFromTrip(trip,day,planId,slotId)); if(c&&c.transportMode!=='none') navigateByPreference(c,c.transportMode,trip);
}
function mapHomeCandidate(tripId,day,planId,slotId){
  const trip=getTripById(tripId); const c=selectedCandidate(getSlotFromTrip(trip,day,planId,slotId)); const url=c?buildMapSearchUrl(c):''; if(url) openExternal(url); else alert('目的地を登録してください。');
}
function openHomeTripDetail(tripId,day){ activateTrip(tripId,false); openTripDetail(day); }
function renderHome(){ renderHomeOverview(); }
function renderTransportBooking(trip=getHomeTrip()){
  const box=document.getElementById('transportBookingCard'),bookings=trip?.transportBookings||[]; if(!bookings.length){ box.style.display='none'; return; }
  const now=new Date(),future=bookings.map(b=>({...b,_dt:new Date(`${b.date}T${b.departure||'00:00'}:00`)})).filter(b=>b._dt>now).sort((a,b)=>a._dt-b._dt)[0];
  if(!future){ box.style.display='none'; return; } box.style.display='block'; box.innerHTML=`<div class="time">NEXT TRANSPORT</div><div class="title">${escapeHtml(future.name||'移動予定')}</div><div class="desc">${escapeHtml(future.from||'')} → ${escapeHtml(future.to||'')}<br>${escapeHtml(future.date)} ${escapeHtml(future.departure||'')} 発</div>`;
}
function renderLodgingCard(dayNum){
  const box=document.getElementById('currentLodging'),l=getDay(dayNum)?.lodging; if(!box) return;
  if(!l){ box.innerHTML=`<div class="card lodging-card empty"><div class="time">DAY ${dayNum} 宿泊</div><div class="title">宿泊なし</div><div class="desc">この日は宿泊先が登録されていません。</div><button class="btn ghost" onclick="openTripEditor('lodging-editor')">＋ 宿泊先を追加</button></div>`; return; }
  box.innerHTML=`<div class="card lodging-card"><div class="lodging-head"><div><div class="time">DAY ${dayNum} 宿泊</div><div class="title">${iconSvg('hotel')} ${escapeHtml(cleanDisplayName(l.name))}</div></div><button class="tiny-edit" onclick="openTripEditor('lodging-editor')">編集</button></div><div class="lodging-address">${escapeHtml(l.address||'住所未入力')}</div><div class="lodging-info"><div><span>CHECK IN</span><strong>${escapeHtml(formatDateTime(l.checkInDate,l.checkInTime)||'未入力')}</strong></div><div><span>CHECK OUT</span><strong>${escapeHtml(formatDateTime(l.checkOutDate,l.checkOutTime)||'未入力')}</strong></div><div><span>ROOM</span><strong>${escapeHtml(l.room||'未入力')}</strong></div></div>${l.memo?`<div class="lodging-memo">${escapeHtml(l.memo)}</div>`:''}<div class="actions"><button class="btn nav" onclick="navToLodging(${dayNum})">${iconSvg('car')} 宿へナビ</button><button class="btn secondary" onclick="openLodgingMap(${dayNum})">${iconSvg('pin')} Google Maps</button></div></div>`;
}
function slotStatus(trip,dayNum,slot,now=new Date()){
  if(!trip||!slot) return 'upcoming';
  const day=getDayFromTrip(trip,dayNum); if(!day) return 'upcoming';
  const today=localDateKey(now);
  if(day.date<today) return 'completed';
  if(day.date>today) return 'upcoming';
  const current=now.getHours()*60+now.getMinutes();
  const plan=getPlanFromTrip(trip,dayNum,getDayFromTrip(trip,dayNum)?.activePlanId);
  const ordered=(plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  const idx=ordered.findIndex(s=>s.id===slot.id),start=slotSortMinutes(slot);
  const next=idx>=0?ordered[idx+1]:null;
  const end=slot.endTime?timeToMinutes(slot.endTime):(next?Math.max(start+1,slotSortMinutes(next)):Math.min(1439,start+60));
  if(current>=end) return 'completed';
  if(current>=start&&current<end) return 'active';
  return 'upcoming';
}
function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip(),c=selectedCandidate(slot),count=slot.candidates.length,hasStack=count>1,actionButtons=[];
  const status=slotStatus(trip,dayNum,slot),hasCover=status==='completed'&&!!slot.coverPhoto?.dataUrl;
  if(c?.transportMode!=='none') actionButtons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
  if(c?.destination||c?.address||c?.googleMapsUrl||c?.name) actionButtons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
  const stackButton=hasStack?`<button class="candidate-stack-hit" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app')" aria-label="${count}件の候補を表示"><span>${count}</span></button>`:`<button class="candidate-add-mini" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app',true)">＋候補</button>`;
  const photoBtn='';
  const coverStyle=hasCover?` style="--slot-cover-photo:url('${slot.coverPhoto.dataUrl}')"`:'';
  return `<div class="slot-wrap ${hasStack?'has-stack':''}"><div class="card slot-card status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="time">${escapeHtml(slotTimeLabel(slot))}${status==='completed'?' · ✓ 終了':''}</div><div class="title">${escapeHtml(cleanDisplayName(c?.name||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:''}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${actionButtons.length?`<div class="actions ${actionButtons.length===1?'one':''}">${actionButtons.join('')}</div>`:''}${photoBtn}</div>${stackButton}</div></div>`;
}
function chooseSlotCoverPhoto(dayNum,planId,slotId){
  const slot=getSlot(dayNum,planId,slotId); if(!slot) return;
  coverPhotoContext={dayNum:Number(dayNum),planId,slotId}; const input=document.getElementById('slotCoverPhotoInput'); if(input){ input.value=''; input.click(); }
}
function clearSlotCoverPhoto(dayNum,planId,slotId){
  const slot=getSlot(dayNum,planId,slotId); if(!slot||!slot.coverPhoto) return;
  if(!confirm('この予定の背景写真を削除しますか？')) return; slot.coverPhoto=null; persistAppData(); renderTripDetail(); showToast('✓ 背景写真を削除しました');
}
async function compressImageFile(file){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader(); reader.onerror=()=>reject(reader.error); reader.onload=()=>{
      const img=new Image(); img.onerror=()=>reject(new Error('画像を読み込めませんでした')); img.onload=()=>{
        const maxSide=1280,scale=Math.min(1,maxSide/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',0.76));
      }; img.src=reader.result;
    }; reader.readAsDataURL(file);
  });
}
async function handleSlotCoverPhotoSelected(event){
  const file=event.target.files?.[0],ctx=coverPhotoContext; coverPhotoContext=null; if(!file||!ctx) return;
  const slot=getSlot(ctx.dayNum,ctx.planId,ctx.slotId); if(!slot) return;
  try{
    showToast('写真を準備しています…'); const dataUrl=await compressImageFile(file);
    slot.coverPhoto={dataUrl,name:file.name||'',capturedAt:file.lastModified?new Date(file.lastModified).toISOString():'',addedAt:new Date().toISOString()};
    persistAppData(); renderTripDetail(); showToast('✓ お気に入り写真を設定しました');
  }catch(err){ console.warn(err); alert('写真を読み込めませんでした。別の写真でお試しください。'); }
}
function renderDayPlans(dayNum){
  const day=getDay(dayNum),switchBox=document.getElementById('currentPlanSwitch'),body=document.getElementById('currentPlanBody'),shuffle=document.getElementById('currentPlanShuffle'); if(!day||!switchBox||!body) return;
  if(!day.activePlanId||!day.plans.some(p=>p.id===day.activePlanId)) day.activePlanId=day.plans[0]?.id;
  switchBox.innerHTML=day.plans.map(p=>`<button class="${p.id===day.activePlanId?'active':''}" onclick="setPlan(${dayNum},'${p.id}')">${p.id.toUpperCase()} ${escapeHtml(p.name)}</button>`).join('');
  const plan=getActivePlan(dayNum); body.innerHTML=plan?plan.slots.slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b)).map(s=>renderSlotCard(s,dayNum,plan.id)).join(''):'<div class="coming">プランがありません。</div>';
  if(shuffle){ shuffle.style.display=day.plans.length>1?'inline-flex':'none'; shuffle.onclick=()=>shufflePlan(dayNum); }
}
function renderTripDetail(){
  const trip=getTrip(); if(!trip) return;
  if(editingDay>trip.days.length) editingDay=trip.days.length; if(editingDay<1) editingDay=1;
  document.getElementById('tripDetailTitle').textContent=`${trip.title}｜旅程`;
  document.getElementById('tripDayChips').innerHTML=trip.days.map(d=>`<button class="chip ${d.day===editingDay?'active':''}" onclick="setDay(${d.day})">DAY ${d.day} · ${formatJP(d.date)}</button>`).join('');
  const day=getDay(editingDay); document.getElementById('tripDayContent').innerHTML=`<div class="day-summary card compact"><div class="time">DAY ${day.day} · ${formatJP(day.date)}</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">予定ごとに目的地と移動手段を登録できます。</div></div><div id="currentLodging"></div><div class="plan-toolbar"><div id="currentPlanSwitch" class="plan-switch"></div><button id="currentPlanShuffle" class="shuffle-btn">${iconSvg('shuffle')} プラン</button></div><div id="currentPlanBody"></div>`;
  renderLodgingCard(editingDay); renderDayPlans(editingDay);
}
function shufflePlan(dayNum){ const day=getDay(dayNum); if(!day||day.plans.length<2) return; const choices=day.plans.filter(p=>p.id!==day.activePlanId),picked=choices[Math.floor(Math.random()*choices.length)]||day.plans[Math.floor(Math.random()*day.plans.length)]; day.activePlanId=picked.id; persistAppData(); renderTripDetail(); renderHome(); showToast(`Plan ${picked.id.toUpperCase()}「${cleanDisplayName(picked.name)}」を選びました`); }
function shuffleCurrentSlot(){
  const slot=candidateSlot(); if(!slot||slot.candidates.length<2) return; const choices=slot.candidates.filter(c=>c.id!==slot.selectedCandidateId),picked=choices[Math.floor(Math.random()*choices.length)]||slot.candidates[Math.floor(Math.random()*slot.candidates.length)]; slot.selectedCandidateId=picked.id;
  if(candidateContext.source==='app'){ persistAppData(); renderTripDetail(); renderHome(); renderCandidateModal(); } else { renderPlanEditor(); renderCandidateModal(); } showToast(`「${cleanDisplayName(picked.name)}」を選びました`);
}

/* ---------- Trip editor / creation ---------- */
function openTripEditor(focusSection='basic',tripId=null){
  EDIT_DATA=deepClone(APP_DATA); EDITOR_MODE='edit'; if(tripId) EDIT_DATA.activeTripId=tripId;
  const deleteBtn=document.getElementById('tripDeleteBtn'); if(deleteBtn) deleteBtn.style.display='block';
  const trip=getTrip('edit'); if(!trip) return;
  document.getElementById('editorModeLabel').textContent='EDIT TRIP'; document.getElementById('editorTitle').textContent='旅行を編集';
  document.getElementById('editTripName').value=trip.title; document.getElementById('editStartDate').value=trip.startDate; document.getElementById('editEndDate').value=trip.endDate;
  editingPlanDay=Math.min(editingDay||1,trip.days.length); renderEditorDay(); openEditorModal(focusSection);
}
function openNewTripEditor(initialDates={}){
  EDIT_DATA=deepClone(APP_DATA); EDITOR_MODE='create'; const blank=createBlankTrip(initialDates); EDIT_DATA.trips.push(blank); EDIT_DATA.activeTripId=blank.id;
  const deleteBtn=document.getElementById('tripDeleteBtn'); if(deleteBtn) deleteBtn.style.display='none';
  document.getElementById('editorModeLabel').textContent='NEW TRIP'; document.getElementById('editorTitle').textContent='旅行を追加';
  document.getElementById('editTripName').value=blank.title; document.getElementById('editStartDate').value=blank.startDate; document.getElementById('editEndDate').value=blank.endDate;
  editingPlanDay=1; renderEditorDay(); openEditorModal('basic');
}
function openEditorModal(focusSection){
  const modal=document.getElementById('editorModal');
  modal.classList.add('open'); document.body.classList.add('modal-open');
  setTimeout(()=>{
    document.getElementById(focusSection)?.scrollIntoView({block:'start'});
    if(focusSection==='lodging-editor') openLodgingEditorModal();
  },60);
}
function closeTripEditor(){
  CALENDAR_UI.pendingCreation=false;
  EDIT_DATA=null;
  document.getElementById('lodgingEditorModal')?.classList.remove('open');
  document.getElementById('editorModal').classList.remove('open');
  document.body.classList.remove('modal-open');
}
function updateEditorTripDates(){
  if(!EDIT_DATA) return; const trip=getTrip('edit'); const start=document.getElementById('editStartDate').value,end=document.getElementById('editEndDate').value;
  if(!start||!end||end<start) return; saveCurrentLodgingToEdit(); syncTripDays(trip,start,end); editingPlanDay=Math.min(editingPlanDay,trip.days.length); renderEditorDay();
}
function renderEditorDay(){
  if(!EDIT_DATA) return; const trip=getTrip('edit'); if(!trip) return; if(editingPlanDay>trip.days.length) editingPlanDay=trip.days.length;
  const tabs=document.getElementById('editorDayTabs'); tabs.innerHTML=trip.days.map(d=>`<button class="chip ${d.day===editingPlanDay?'active':''}" onclick="setPlanEditorDay(${d.day})">DAY ${d.day} · ${formatJP(d.date)}</button>`).join('');
  document.getElementById('lodgingEditorTitle').textContent=`DAY ${editingPlanDay} 宿泊先`;
  const lodgingModalTitle=document.getElementById('lodgingEditorModalTitle'); if(lodgingModalTitle) lodgingModalTitle.textContent=`DAY ${editingPlanDay} 宿泊先を編集`;
  fillLodgingEditor(editingPlanDay); renderPlanEditor();
}
function setPlanEditorDay(dayNum){ saveCurrentLodgingToEdit(); editingPlanDay=Number(dayNum); renderEditorDay(); }
function fillLodgingEditor(dayNum){
  const d=getDay(dayNum,'edit'),l=d?.lodging||{},has=!!d?.lodging; document.getElementById('lodgingEnabled').checked=has;
  const values={lodgingName:l.name||'',lodgingAddress:l.address||'',lodgingCheckInDate:l.checkInDate||d?.date||'',lodgingCheckInTime:l.checkInTime||'',lodgingCheckOutDate:l.checkOutDate||addDaysKey(d?.date||localDateKey(),1),lodgingCheckOutTime:l.checkOutTime||'',lodgingRoom:l.room||'',lodgingReservation:l.reservationNumber||'',lodgingParking:l.parking||'',lodgingMaps:l.googleMapsUrl||'',lodgingMemo:l.memo||''};
  Object.entries(values).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
  syncLodgingPickerDisplays();
  toggleLodgingFields(); renderLodgingEditorSummary(dayNum);
}
function syncLodgingPickerDisplays(){
  const pairs=[
    ['lodgingCheckInDate','lodgingCheckInDateDisplay','date'],
    ['lodgingCheckInTime','lodgingCheckInTimeDisplay','time'],
    ['lodgingCheckOutDate','lodgingCheckOutDateDisplay','date'],
    ['lodgingCheckOutTime','lodgingCheckOutTimeDisplay','time']
  ];
  pairs.forEach(([inputId,displayId,type])=>{
    const input=document.getElementById(inputId),display=document.getElementById(displayId);
    if(!input||!display) return;
    const value=input.value||'';
    display.textContent=type==='date'&&value?value.replaceAll('-','/'):value;
    display.classList.toggle('is-empty',!value);
  });
}

function toggleLodgingFields(){ const enabled=document.getElementById('lodgingEnabled').checked; document.getElementById('lodgingFields').classList.toggle('disabled',!enabled); document.querySelectorAll('#lodgingFields input,#lodgingFields textarea').forEach(el=>el.disabled=!enabled); }
function renderLodgingEditorSummary(dayNum=editingPlanDay){
  const box=document.getElementById('lodgingEditorSummary'); if(!box||!EDIT_DATA) return;
  const day=getDay(dayNum,'edit'),l=day?.lodging;
  if(!l){ box.innerHTML=`<strong>未登録</strong><small>タップして宿泊先を追加</small>`; return; }
  const inText=l.checkInTime?`IN ${l.checkInTime}`:'';
  const outText=l.checkOutTime?`OUT ${l.checkOutTime}`:'';
  box.innerHTML=`<strong>${escapeHtml(cleanDisplayName(l.name||'宿泊先'))}</strong><small>${escapeHtml([inText,outText].filter(Boolean).join(' · ')||l.address||'タップして詳細を編集')}</small>`;
}
function openLodgingEditorModal(){
  if(!EDIT_DATA) return;
  fillLodgingEditor(editingPlanDay);
  const modal=document.getElementById('lodgingEditorModal'); if(!modal) return;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  const body=modal.querySelector('.lodging-editor-body'); if(body) body.scrollTop=0;
  if(document.activeElement instanceof HTMLElement) document.activeElement.blur();
}
function closeLodgingEditorModal(){
  const modal=document.getElementById('lodgingEditorModal'); if(!modal) return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
  /* Cancel must not leak unsaved field values into the parent editor. */
  if(EDIT_DATA) fillLodgingEditor(editingPlanDay);
  if(!document.getElementById('editorModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
}
function saveLodgingEditorModal(){
  if(!EDIT_DATA) return;
  saveCurrentLodgingToEdit(); renderLodgingEditorSummary(editingPlanDay);
  const modal=document.getElementById('lodgingEditorModal'); if(modal){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
  if(!document.getElementById('editorModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
  showToast(document.getElementById('lodgingEnabled').checked?'✓ 宿泊先を更新しました':'✓ 宿泊先を解除しました');
}
function readCurrentLodgingEditor(){
  if(!document.getElementById('lodgingEnabled').checked) return null;
  const d=getDay(editingPlanDay,'edit'),old=d?.lodging||{};
  return {name:document.getElementById('lodgingName').value.trim(),address:document.getElementById('lodgingAddress').value.trim(),checkInDate:document.getElementById('lodgingCheckInDate').value,checkInTime:document.getElementById('lodgingCheckInTime').value,checkOutDate:document.getElementById('lodgingCheckOutDate').value,checkOutTime:document.getElementById('lodgingCheckOutTime').value,room:document.getElementById('lodgingRoom').value.trim(),reservationNumber:document.getElementById('lodgingReservation').value.trim(),parking:document.getElementById('lodgingParking').value.trim(),memo:document.getElementById('lodgingMemo').value.trim(),googleMapsUrl:document.getElementById('lodgingMaps').value.trim(),lat:old.lat??null,lon:old.lon??null};
}
function saveCurrentLodgingToEdit(){ const d=getDay(editingPlanDay,'edit'); if(d) d.lodging=readCurrentLodgingEditor(); }
function renderPlanEditor(){
  if(!EDIT_DATA) return; const day=getDay(editingPlanDay,'edit'),box=document.getElementById('planEditorContent'); if(!day) return;
  box.innerHTML=day.plans.map(plan=>{
    const slots=plan.slots.map(slot=>{ const c=selectedCandidate(slot); return `<div class="slot-editor-row"><div class="slot-time-grid"><label>開始<input class="time-edit" type="time" value="${escapeHtml(slot.startTime||'')}" onchange="updateSlotStart(${editingPlanDay},'${plan.id}','${slot.id}',this.value)"></label><label>終了（任意）<input class="time-edit" type="time" value="${escapeHtml(slot.endTime||'')}" onchange="updateSlotEnd(${editingPlanDay},'${plan.id}','${slot.id}',this.value)"></label></div><label class="slot-note-label">時刻メモ（任意）<input value="${escapeHtml(slot.timeNote||'')}" placeholder="例：チェックイン後" onchange="updateSlotTimeNote(${editingPlanDay},'${plan.id}','${slot.id}',this.value)"></label><div class="slot-editor-top"><div class="slot-editor-name">${escapeHtml(c?.name||'未設定')} <span>候補 ${slot.candidates.length}/${MAX_CANDIDATES}</span></div><button class="delete-btn" onclick="deleteSlotEditor(${editingPlanDay},'${plan.id}','${slot.id}')">削除</button></div><button class="btn ghost full compact-btn" onclick="openCandidateModal(${editingPlanDay},'${plan.id}','${slot.id}','edit')">候補・目的地・移動手段を編集</button></div>`; }).join('');
    return `<div class="plan-editor-card"><div class="plan-editor-head"><div class="plan-code">Plan ${plan.id.toUpperCase()}</div><button class="delete-btn" onclick="deletePlanEditor(${editingPlanDay},'${plan.id}')" ${day.plans.length<=1?'disabled':''}>プラン削除</button></div><label>プラン名<input value="${escapeHtml(plan.name)}" onchange="updatePlanName(${editingPlanDay},'${plan.id}',this.value)"></label>${slots||'<div class="small">予定枠がありません。</div>'}<button class="btn ghost full" onclick="addSlotEditor(${editingPlanDay},'${plan.id}')">＋ 予定枠を追加</button></div>`;
  }).join('');
  const add=document.getElementById('addPlanBtn'); add.disabled=day.plans.length>=MAX_PLANS; add.textContent=day.plans.length>=MAX_PLANS?'プランは最大4つです':'＋ プランを追加';
}
function updatePlanName(dayNum,planId,value){ const p=getPlan(dayNum,planId,'edit'); if(p) p.name=value.trim()||p.name; }
function updateSlotStart(dayNum,planId,slotId,value){ const s=getSlot(dayNum,planId,slotId,'edit'); if(s) s.startTime=value; }
function updateSlotEnd(dayNum,planId,slotId,value){ const s=getSlot(dayNum,planId,slotId,'edit'); if(s) s.endTime=value; }
function updateSlotTimeNote(dayNum,planId,slotId,value){ const s=getSlot(dayNum,planId,slotId,'edit'); if(s) s.timeNote=value.trim(); }
function addSlotEditor(dayNum,planId){ const p=getPlan(dayNum,planId,'edit'),sid=uid(`d${dayNum}${planId}-slot`),cid=uid('candidate'); p.slots.push({id:sid,startTime:'12:00',endTime:'',timeNote:'',selectedCandidateId:cid,candidates:[blankCandidate(cid)]}); renderPlanEditor(); }
function deleteSlotEditor(dayNum,planId,slotId){ const p=getPlan(dayNum,planId,'edit'); if(confirm('この予定枠を削除しますか？')){ p.slots=p.slots.filter(s=>s.id!==slotId); renderPlanEditor(); } }
function nextPlanId(day){ return ['a','b','c','d'].find(id=>!day.plans.some(p=>p.id===id)); }
function addPlanEditor(){ const day=getDay(editingPlanDay,'edit'); if(day.plans.length>=MAX_PLANS) return; const id=nextPlanId(day); day.plans.push(blankPlan(id)); renderPlanEditor(); }
function deletePlanEditor(dayNum,planId){ const day=getDay(dayNum,'edit'); if(day.plans.length<=1) return; if(confirm(`Plan ${planId.toUpperCase()}を削除しますか？`)){ day.plans=day.plans.filter(p=>p.id!==planId); if(day.activePlanId===planId) day.activePlanId=day.plans[0].id; renderPlanEditor(); } }
function saveTripEditor(){
  if(!EDIT_DATA) return; saveCurrentLodgingToEdit(); const trip=getTrip('edit'),start=document.getElementById('editStartDate').value,end=document.getElementById('editEndDate').value;
  if(!start||!end||end<start){ alert('旅行日程を確認してください。終了日は開始日以降にしてください。'); return; }
  trip.title=document.getElementById('editTripName').value.trim()||'名称未設定の旅行'; syncTripDays(trip,start,end);
  APP_DATA=normalizeAppData(EDIT_DATA); EDIT_DATA=null; persistAppData(); editingDay=1;
  if(EDITOR_MODE==='create'&&CALENDAR_UI.pendingCreation) calendarClearRange();
  closeTripEditor(); renderAll(); showToast(EDITOR_MODE==='create'?'✓ 旅行を追加しました':'✓ 旅行を保存しました');
}
function resetAllData(){ if(!confirm('この端末のTripper Noteデータを初期状態に戻しますか？')) return; APP_DATA=normalizeAppData(DEFAULT_APP_DATA); persistAppData(); closeTripEditor(); renderAll(); }

function deleteCurrentTrip(){
  if(EDITOR_MODE!=='edit'||!EDIT_DATA) return;
  const trip=getTrip('edit'); if(!trip) return;
  if(!confirm(`「${trip.title}」を削除しますか？

旅程・候補・宿泊情報・この旅行に保存した背景写真もこの端末から削除されます。`)) return;
  APP_DATA.trips=(APP_DATA.trips||[]).filter(t=>t.id!==trip.id);
  APP_DATA.activeTripId=null; APP_DATA=normalizeAppData(APP_DATA);
  const home=getHomeTrip(); if(home) APP_DATA.activeTripId=home.id;
  persistAppData(); closeTripEditor(); renderAll(); showScreen('trips','trips'); showToast('✓ 旅行を削除しました');
}

/* ---------- Candidate modal ---------- */
function openCandidateModal(dayNum,planId,slotId,source='app',openAdd=false){ candidateContext={dayNum:Number(dayNum),planId,slotId,source}; candidateFormMode=null; document.getElementById('candidateModal').classList.add('open'); document.body.classList.add('modal-open'); renderCandidateModal(); if(openAdd) showCandidateForm('add'); }
function closeCandidateModal(){ candidateContext=null; candidateFormMode=null; document.getElementById('candidateModal').classList.remove('open'); if(!document.getElementById('editorModal').classList.contains('open')) document.body.classList.remove('modal-open'); }
function candidateSlot(){ if(!candidateContext) return null; return getSlot(candidateContext.dayNum,candidateContext.planId,candidateContext.slotId,candidateContext.source); }
function renderCandidateModal(){
  const slot=candidateSlot(); if(!slot) return; document.getElementById('candidateModalTitle').textContent=`${slotTimeLabel(slot)} の候補`; document.getElementById('candidateCount').textContent=`${slot.candidates.length}/${MAX_CANDIDATES}`;
  document.getElementById('candidateList').innerHTML=slot.candidates.map((c,i)=>`<div class="candidate-choice ${c.id===slot.selectedCandidateId?'selected':''}"><div class="candidate-choice-main" role="button" tabindex="0" onclick="selectCandidate('${c.id}')"><div class="candidate-index">${i+1}</div><div><div class="candidate-name">${escapeHtml(cleanDisplayName(c.name))}</div><div class="candidate-meta">${transportIcon(c.transportMode)} ${escapeHtml(c.destination||'目的地未入力')} ${c.activity?`· ${escapeHtml(c.activity)}`:''}</div></div></div><div class="candidate-choice-actions"><button class="tiny-edit" onclick="selectCandidate('${c.id}')">${c.id===slot.selectedCandidateId?'✓ 選択中':'この候補を選ぶ'}</button><button class="tiny-edit" onclick="showCandidateForm('edit','${c.id}')">編集</button><button class="delete-btn" onclick="deleteCandidate('${c.id}')" ${slot.candidates.length<=1?'disabled':''}>削除</button></div></div>`).join('');
  const add=document.getElementById('candidateAddBtn'); add.disabled=slot.candidates.length>=MAX_CANDIDATES; add.textContent=slot.candidates.length>=MAX_CANDIDATES?'候補は最大4つです':'＋ 候補を追加'; document.getElementById('slotShuffleBtn').disabled=slot.candidates.length<2;
}
function selectCandidate(candidateId){ const slot=candidateSlot(); if(!slot||!slot.candidates.some(c=>c.id===candidateId)) return; slot.selectedCandidateId=candidateId; if(candidateContext.source==='app'){ persistAppData(); renderTripDetail(); renderHome(); renderCandidateModal(); } else { renderPlanEditor(); renderCandidateModal(); } showToast('✓ 候補を選択しました'); }
function deleteCandidate(candidateId){ const slot=candidateSlot(); if(!slot||slot.candidates.length<=1) return; if(!confirm('この候補を削除しますか？')) return; slot.candidates=slot.candidates.filter(c=>c.id!==candidateId); if(slot.selectedCandidateId===candidateId) slot.selectedCandidateId=slot.candidates[0].id; if(candidateContext.source==='app'){ persistAppData(); renderTripDetail(); renderHome(); renderCandidateModal(); } else { renderPlanEditor(); hideCandidateForm(); renderCandidateModal(); } }
function showCandidateForm(mode,candidateId=null){
  const slot=candidateSlot(); if(!slot||mode==='add'&&slot.candidates.length>=MAX_CANDIDATES) return; candidateFormMode={mode,candidateId}; const c=mode==='edit'?slot.candidates.find(x=>x.id===candidateId):blankCandidate('TEMP');
  document.getElementById('candidateFormTitle').textContent=mode==='edit'?'候補を編集':'候補を追加';
  const fields={candidateName:c.name,candidateDestination:c.destination,candidateActivity:c.activity,candidateMaps:c.googleMapsUrl,candidateAddress:c.address,candidateLat:c.lat??'',candidateLon:c.lon??'',candidateStation:c.stationName,candidateMemo:c.memo,candidateDescription:c.description}; Object.entries(fields).forEach(([id,val])=>document.getElementById(id).value=val||'');
  document.getElementById('candidateTransport').value=c.transportMode||'car'; document.getElementById('coordHint').textContent=''; document.getElementById('candidateForm').classList.add('show'); setTimeout(()=>document.getElementById('candidateForm').scrollIntoView({behavior:'smooth',block:'start'}),60);
}
function hideCandidateForm(){ candidateFormMode=null; document.getElementById('candidateForm').classList.remove('show'); }
function extractCoordinatesFromMapsUrl(url){ const text=decodeURIComponent(String(url||'')),patterns=[/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,/[?&](?:query|destination)=(-?\d{1,3}\.\d+)%?2C(-?\d{1,3}\.\d+)/i,/[?&](?:query|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/i]; for(const re of patterns){ const m=text.match(re); if(m) return {lat:Number(m[1]),lon:Number(m[2])}; } return null; }
async function autoFillCandidateCoords(){
  const url=document.getElementById('candidateMaps').value.trim();
  const dest=document.getElementById('candidateDestination').value.trim();
  const address=document.getElementById('candidateAddress').value.trim();
  const name=document.getElementById('candidateName').value.trim();
  const hint=document.getElementById('coordHint');
  hint.textContent='位置情報を検索中…'; hint.className='coord-hint';

  let point=extractCoordinatesFromMapsUrl(url);
  if(!point){ const known=findNavPoint(dest||name); if(known) point={lat:known.lat,lon:known.lon,address:''}; }
  if(!point){
    point=await resolvePlaceWithNativeSearch({destination:dest,name,address,googleMapsUrl:url});
  }

  if(point){
    document.getElementById('candidateLat').value=point.lat;
    document.getElementById('candidateLon').value=point.lon;
    if(!address&&point.address) document.getElementById('candidateAddress').value=point.address;
    hint.textContent='✓ 施設名/住所から緯度・経度を取得しました'; hint.className='coord-hint ok';
  } else {
    hint.textContent=nativePlaceResolverAvailable()
      ?'場所を特定できませんでした。施設名をより具体的にするか、住所・緯度経度を入力してください。'
      :'Macのブラウザでは施設名検索は使えません。iPhone実機ではMapKit検索を利用できます。';
    hint.className='coord-hint warn';
  }
}
function saveCandidateForm(){
  const slot=candidateSlot(); if(!slot||!candidateFormMode) return; const obj={id:candidateFormMode.mode==='edit'?candidateFormMode.candidateId:uid('candidate'),name:document.getElementById('candidateName').value.trim()||'名称未設定',destination:document.getElementById('candidateDestination').value.trim(),activity:document.getElementById('candidateActivity').value.trim(),description:document.getElementById('candidateDescription').value.trim(),transportMode:document.getElementById('candidateTransport').value,googleMapsUrl:document.getElementById('candidateMaps').value.trim(),address:document.getElementById('candidateAddress').value.trim(),lat:numericCoord(document.getElementById('candidateLat').value),lon:numericCoord(document.getElementById('candidateLon').value),stationName:document.getElementById('candidateStation').value.trim(),memo:document.getElementById('candidateMemo').value.trim(),tags:[]};
  if(candidateFormMode.mode==='edit'){ const idx=slot.candidates.findIndex(c=>c.id===obj.id); if(idx>=0) slot.candidates[idx]={...slot.candidates[idx],...obj}; } else { if(slot.candidates.length>=MAX_CANDIDATES) return; slot.candidates.push(obj); slot.selectedCandidateId=obj.id; }
  if(candidateContext.source==='app'){ persistAppData(); renderTripDetail(); renderHome(); } else { renderPlanEditor(); } hideCandidateForm(); renderCandidateModal(); showToast('✓ 候補を保存しました');
}

/* ---------- Navigation preferences ---------- */
function renderNavigationSettings(){
  ['car','walk','train'].forEach(mode=>{ const select=document.getElementById(`navPref_${mode}`); if(!select) return; select.innerHTML=(NAV_APP_OPTIONS[mode]||[]).map(o=>`<option value="${o.id}">${escapeHtml(o.label)}</option>`).join(''); select.value=getNavigationPreference(mode); });
}
function changeNavPreference(mode,value){ setNavigationPreference(mode,value); renderHome(); renderTripDetail(); showToast('✓ ナビ設定を保存しました'); }

function showToast(message,duration=1900){ const el=document.getElementById('saveToast'); el.textContent=message; el.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.remove('show'),duration); }
function renderAll(){ renderHeader(); renderTrips(); renderHome(); renderTripDetail(); renderNavigationSettings(); }
function preventAccidentalZoom(){ let lastTouchEnd=0; document.addEventListener('touchend',e=>{ if(e.target.closest?.('#calendar, #calendarDatePicker, #record .record-archive-page')) return; const now=Date.now(); if(now-lastTouchEnd<=300) e.preventDefault(); lastTouchEnd=now; },{passive:false}); document.addEventListener('dblclick',e=>{if(!e.target.closest?.('#calendar, #calendarDatePicker, #record .record-archive-page')) e.preventDefault();},{passive:false}); }

document.addEventListener('DOMContentLoaded',()=>{ loadNote(); preventAccidentalZoom(); const photoInput=document.getElementById('slotCoverPhotoInput'); if(photoInput) photoInput.addEventListener('change',handleSlotCoverPhotoSelected); renderAll(); });

/* =========================================================
   v2.5.4 Editorial System Expansion
   Extend the adopted design language to Trips / Itinerary /
   Candidate modal / Record / My Page / Spots.
   ========================================================= */
function v254TripPhaseClass(trip){
  const today=localDateKey();
  if(today<trip.startDate) return 'phase-upcoming';
  if(today>trip.endDate) return 'phase-past';
  return 'phase-live';
}
function v254TripDurationLabel(trip){
  const days=trip?.days?.length||0;
  const nights=Math.max(0,days-1);
  return `${nights}泊${days}日`;
}
function v254CountSlots(trip){
  return (trip?.days||[]).reduce((sum,day)=>sum + (getActivePlanFromTrip(trip,day.day)?.slots?.length||0),0);
}
function v254FlattenTripSlots(trip){
  return (trip?.days||[]).flatMap(day=>{
    const plan=getActivePlanFromTrip(trip,day.day);
    return (plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b)).map(slot=>({day,plan,slot,candidate:selectedCandidate(slot)}));
  });
}
function v254RecentTripForRecord(){
  const now=new Date();
  const current=getHomeTrip(now);
  if(current) return current;
  const trips=(APP_DATA?.trips||[]).slice();
  if(!trips.length) return null;
  const today=localDateKey(now);
  return trips.filter(t=>t.endDate<today).sort((a,b)=>b.endDate.localeCompare(a.endDate))[0]
    || trips.filter(t=>t.startDate>today).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0]
    || trips[0];
}

function renderTrips(){
  const section=document.getElementById('trips');
  if(!section) return;
  const trips=(APP_DATA?.trips||[]).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const today=localDateKey();
  const currentCount=trips.filter(t=>t.startDate<=today&&today<=t.endDate).length;
  const upcomingCount=trips.filter(t=>t.startDate>today).length;
  const activeId=APP_DATA.activeTripId;
  section.innerHTML=`
    <div class="editorial-page-shell">
      <div class="page-intro-row">
        <div>
          <div class="page-kicker">TRIPS</div>
          <h2 class="section-title no-margin">旅行</h2>
          <p class="section-sub">現在・未来・過去の旅を、一冊のトラベルノートのように保存します。</p>
        </div>
        <button class="pill-action" onclick="openNewTripEditor()">＋ 旅行を追加</button>
      </div>
      <div class="trip-overview-grid">
        <div class="overview-kpi card compact"><span>保存中の旅</span><strong>${trips.length}</strong></div>
        <div class="overview-kpi card compact"><span>進行中</span><strong>${currentCount}</strong></div>
        <div class="overview-kpi card compact"><span>これから</span><strong>${upcomingCount}</strong></div>
      </div>
      <div id="tripList" class="trip-list-editorial"></div>
      <div class="travel-note">ホームは常に「進行中の旅行」または「最も近い旅行」を自動で表示します。旅行ページでは、個別に確認・編集したい旅を選べます。</div>
    </div>`;

  const list=section.querySelector('#tripList');
  list.innerHTML=trips.map(trip=>{
    const phaseLabel=tripPhaseLabel(trip);
    const phaseClass=v254TripPhaseClass(trip);
    const active=trip.id===activeId;
    const slotCount=v254CountSlots(trip);
    const firstDay=trip.days?.[0];
    const lead=getActivePlanFromTrip(trip,1)?.slots?.[0];
    const leadCandidate=selectedCandidate(lead);
    return `
      <article class="trip-editorial-card ${active?'active-trip':''}">
        <button class="trip-card-main" onclick="activateTrip('${trip.id}',true)">
          <div class="trip-editorial-head">
            <div class="trip-card-badges">
              <span class="trip-phase-badge ${phaseClass}">${phaseLabel}</span>
              <span class="trip-mini-badge">${v254TripDurationLabel(trip)}</span>
            </div>
            ${active?'<span class="trip-current-pill">閲覧中</span>':''}
          </div>
          <div class="trip-editorial-name">${escapeHtml(cleanDisplayName(trip.title))}</div>
          <div class="trip-editorial-dates">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))}</div>
          <div class="trip-editorial-summary">${slotCount}件の予定 · ${(trip.records||[]).length}件の記録 · ${trip.days.length} DAYS${leadCandidate?.name?` · 最初の予定「${escapeHtml(cleanDisplayName(leadCandidate.name))}」`:''}</div>
          <div class="trip-editorial-footer">
            <span>${firstDay?`DAY 1 · ${escapeHtml(formatJP(firstDay.date))}`:''}</span>
            <span>旅程を見る 〉</span>
          </div>
        </button>
        <div class="trip-editorial-actions">
          <button class="btn ghost compact-btn" onclick="openTripEditor('basic','${trip.id}')">旅行を編集</button>
          <button class="btn secondary compact-btn" onclick="activateTrip('${trip.id}',true)">旅程を見る</button>
        </div>
      </article>`;
  }).join('') || '<div class="record-empty">まだ旅行がありません。「＋ 旅行を追加」から最初の旅を登録してください。</div>';
}

function renderRecordScreen(){
  const section=document.getElementById('record');
  if(!section) return;
  const trip=v254RecentTripForRecord();
  const memories=v254FlattenTripSlots(trip).slice(0,6);
  const savedNote=localStorage.getItem('tripQuickNote')||'';
  const tripStatus=trip ? (localDateKey()<trip.startDate?'これからの旅' : localDateKey()>trip.endDate ? '旅の記録' : '進行中の旅') : 'RECORD';
  section.innerHTML=`
    <div class="editorial-page-shell">
      <div class="page-intro-row single">
        <div>
          <div class="page-kicker">RECORD</div>
          <h2 class="section-title no-margin">記録</h2>
          <p class="section-sub">旅の余韻を、写真・メモ・タイムラインとして残していくページです。</p>
        </div>
      </div>
      <div class="record-hero-card card">
        <div class="time">${tripStatus}</div>
        <div class="title">${trip?escapeHtml(cleanDisplayName(trip.title)):'次の旅の記録をはじめよう'}</div>
        <div class="desc">${trip?`${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))} · ${v254TripDurationLabel(trip)}`:'旅程を登録すると、ここにSTART / FIN / Time Diary の入口が並びます。'}</div>
      </div>
      <div class="record-feature-grid">
        <div class="feature-mini-card card compact"><span>START / FIN</span><strong>次工程</strong><p>旅の開始・終了を写真や動画で残す入口。</p></div>
        <div class="feature-mini-card card compact"><span>Time Diary</span><strong>準備中</strong><p>写真・動画・感想を時系列で保存するタイムライン。</p></div>
      </div>
      <div class="card record-note-card">
        <div class="time">QUICK NOTE</div>
        <div class="title">旅メモ</div>
        <div class="desc">今のひらめきや感想を先に保存できます。本格的な写真記録は次工程でここに統合します。</div>
        <textarea id="quickNote" class="note-box" placeholder="例：景色が想像以上によかった。次回は朝のカフェにも行きたい。">${escapeHtml(savedNote)}</textarea>
        <div class="spacer-8"></div>
        <button class="btn nav full" onclick="saveNote()">保存する</button>
        <div id="noteSaved" class="small note-status">${savedNote?'この端末に保存済みです。':''}</div>
      </div>
      <div class="card record-timeline-card">
        <div class="list-header"><div class="title">タイムラインのイメージ</div><span class="trip-mini-badge">${trip?`${memories.length} ITEMS`:'PREVIEW'}</span></div>
        <div class="record-timeline">${memories.length?memories.map(item=>`<div class="record-entry"><div class="record-day-badge">DAY ${item.day.day}</div><div class="record-entry-main"><div class="record-entry-title">${escapeHtml(slotTimeLabel(item.slot))} · ${escapeHtml(cleanDisplayName(item.candidate?.name||'予定'))}</div><div class="record-entry-meta">${escapeHtml(item.candidate?.activity||item.candidate?.destination||'記録を追加予定')}</div></div></div>`).join(''):'<div class="record-empty">旅程から記録候補を生成すると、ここに縦方向のタイムラインが並びます。</div>'}</div>
      </div>
    </div>`;
}

function renderSpotsScreen(){
  const section=document.getElementById('spots');
  if(!section) return;
  const spotCards=[
    {label:'観光',query:'観光地',icon:iconSvg('pin')},
    {label:'グルメ',query:'人気 飲食店',icon:iconSvg('route')},
    {label:'カフェ',query:'カフェ',icon:iconSvg('record')},
    {label:'コンビニ',query:'コンビニ',icon:iconSvg('pin')},
    {label:'ガソリン',query:'ガソリンスタンド',icon:iconSvg('car')},
    {label:'宿',query:'ホテル 宿',icon:iconSvg('hotel')}
  ];
  section.innerHTML=`
    <div class="editorial-page-shell">
      <div class="page-intro-row single">
        <div>
          <div class="page-kicker">SPOTS</div>
          <h2 class="section-title no-margin">スポット</h2>
          <p class="section-sub">旅の途中で立ち寄りたい場所を、外部マップ検索へすばやくつなぎます。</p>
        </div>
      </div>
      <div class="spots-hero-card card compact">
        <div class="title">今いる場所の近くを探す</div>
        <div class="desc">カテゴリーを選ぶと、Google Maps の検索結果を開きます。将来的には現在地連携とアプリ内表示も追加予定です。</div>
      </div>
      <div class="spot-grid-editorial">${spotCards.map(card=>`<button class="spot-card" onclick="openNearby('${card.query}')"><span class="spot-card-icon">${card.icon}</span><span class="spot-card-label">${card.label}</span></button>`).join('')}</div>
      <div class="travel-note">この画面も、ホームと同じ「静かな余白 + 雑誌風タイポグラフィ」で統一しています。</div>
    </div>`;
}

function renderProfileScreen(){
  const section=document.getElementById('profile');
  if(!section) return;
  const tripCount=(APP_DATA?.trips||[]).length;
  const activeTrip=getTrip();
  const itineraryCount=APP_DATA.trips.reduce((sum,trip)=>sum+v254CountSlots(trip),0);
  section.innerHTML=`
    <div class="editorial-page-shell">
      <div class="page-intro-row single">
        <div>
          <div class="page-kicker">MY PAGE</div>
          <h2 class="section-title no-margin">マイページ</h2>
          <p class="section-sub">アプリ全体の設定と、今後の拡張に向けたベースを管理します。</p>
        </div>
      </div>
      <div class="profile-grid">
        <div class="card settings-card">
          <div class="time">NAVIGATION</div>
          <div class="title">ナビゲーション設定</div>
          <div class="desc">移動方法ごとに、予定カードから開くアプリを選択できます。</div>
          <div class="settings-list">
            <label>車<select id="navPref_car" onchange="changeNavPreference('car',this.value)"></select></label>
            <label>徒歩<select id="navPref_walk" onchange="changeNavPreference('walk',this.value)"></select></label>
            <label>電車<select id="navPref_train" onchange="changeNavPreference('train',this.value)"></select></label>
          </div>
        </div>
        <div class="card compact">
          <div class="title">保存状況</div>
          <div class="profile-stat-row"><span>保存中の旅行</span><strong>${tripCount}</strong></div>
          <div class="profile-stat-row"><span>予定の合計</span><strong>${itineraryCount}</strong></div>
          <div class="profile-stat-row"><span>現在の閲覧旅行</span><strong>${activeTrip?escapeHtml(cleanDisplayName(activeTrip.title)):'なし'}</strong></div>
        </div>
        <div class="card compact">
          <div class="title">今後の展開</div>
          <div class="desc">共有しおり、共同編集、AIによる提案、AI chat による予定作成、Vlog 編集を見据えた土台です。</div>
        </div>
        <div class="card compact">
          <div class="title">Tripper Note v2.6.0-B.3.4</div>
          <div class="desc">Text Time Picker UX Hotfix。作成時刻から30分前まで、表示時刻を選択できます。</div>
        </div>
      </div>
    </div>`;
}

function renderLodgingCard(dayNum){
  const box=document.getElementById('currentLodging'),l=getDay(dayNum)?.lodging;
  if(!box) return;
  if(!l){
    box.innerHTML=`<div class="card lodging-card empty editorial-lodging-empty"><div class="time">STAY</div><div class="title">宿泊先はまだ未登録です</div><div class="desc">この日の旅程にホテルや宿を追加すると、ここに表示されます。</div><button class="btn ghost" onclick="openTripEditor('lodging-editor')">＋ 宿泊先を追加</button></div>`;
    return;
  }
  box.innerHTML=`
    <div class="card lodging-card editorial-lodging-card">
      <div class="lodging-head">
        <div>
          <div class="time">STAY / DAY ${dayNum}</div>
          <div class="title">${escapeHtml(cleanDisplayName(l.name||'宿泊先'))}</div>
        </div>
        <button class="tiny-edit" onclick="openTripEditor('lodging-editor')">編集</button>
      </div>
      <div class="lodging-address">${escapeHtml(l.address||'住所未入力')}</div>
      <div class="lodging-info">
        <div><span>CHECK IN</span><strong>${escapeHtml(formatDateTime(l.checkInDate,l.checkInTime)||'未入力')}</strong></div>
        <div><span>CHECK OUT</span><strong>${escapeHtml(formatDateTime(l.checkOutDate,l.checkOutTime)||'未入力')}</strong></div>
        <div><span>ROOM</span><strong>${escapeHtml(l.room||'未入力')}</strong></div>
      </div>
      ${l.memo?`<div class="lodging-memo">${escapeHtml(l.memo)}</div>`:''}
      <div class="actions">
        <button class="btn nav" onclick="navToLodging(${dayNum})">${iconSvg('car')} 宿へナビ</button>
        <button class="btn secondary" onclick="openLodgingMap(${dayNum})">${iconSvg('pin')} 地図で見る</button>
      </div>
    </div>`;
}

function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip();
  const c=selectedCandidate(slot);
  const count=slot.candidates.length;
  const hasStack=count>1;
  const status=slotStatus(trip,dayNum,slot);
  const hasCover=status==='completed'&&!!slot.coverPhoto?.dataUrl;
  const actionButtons=[];
  if(c?.transportMode!=='none') actionButtons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
  if(c?.destination||c?.address||c?.googleMapsUrl||c?.name) actionButtons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
  const stackButton=hasStack
    ? `<button class="candidate-stack-hit" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app')" aria-label="${count}件の候補を表示"><span>${count}</span></button>`
    : `<button class="candidate-add-mini" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app',true)">＋候補</button>`;
  const coverStyle=hasCover?` style="--slot-cover-photo:url('${slot.coverPhoto.dataUrl}')"`:'';
  const stateLabel=status==='completed'?'完了':status==='active'?'進行中':'予定';
  return `
    <div class="slot-wrap ${hasStack?'has-stack':''}">
      <div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}>
        <div class="slot-cover-overlay"></div>
        <div class="slot-main">
          <div class="slot-meta-row">
            <div class="slot-meta-left">
              <span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>
              ${count>1?`<span class="slot-option-chip">${count} OPTIONS</span>`:''}
            </div>
            <span class="slot-state-badge ${status}">${stateLabel}</span>
          </div>
          <div class="title">${escapeHtml(cleanDisplayName(c?.name||'未設定の予定'))}</div>
          ${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}
          ${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}
          ${c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:''}
          ${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}
          ${actionButtons.length?`<div class="actions ${actionButtons.length===1?'one':''}">${actionButtons.join('')}</div>`:''}
        </div>
        ${stackButton}
      </div>
    </div>`;
}

function renderTripDetail(){
  const trip=getTrip();
  if(!trip) return;
  if(editingDay>trip.days.length) editingDay=trip.days.length;
  if(editingDay<1) editingDay=1;
  document.getElementById('tripDetailTitle').textContent=`${cleanDisplayName(trip.title)}｜旅程`;
  document.getElementById('tripDayChips').innerHTML=trip.days.map(d=>`<button class="chip ${d.day===editingDay?'active':''}" onclick="setDay(${d.day})">DAY ${d.day} · ${formatJP(d.date)}</button>`).join('');
  const day=getDay(editingDay);
  const plan=getActivePlan(editingDay);
  document.getElementById('tripDayContent').innerHTML=`
    <div class="itinerary-editorial-head card compact">
      <div class="time">ITINERARY</div>
      <div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div>
      <div class="desc">DAY ${day.day} · ${escapeHtml(formatJP(day.date))} · Plan ${plan?.id?.toUpperCase()||'A'} を表示しています。</div>
      <div class="itinerary-kpis">
        <div><span>日数</span><strong>${trip.days.length}</strong></div>
        <div><span>予定数</span><strong>${plan?.slots?.length||0}</strong></div>
        <div><span>状態</span><strong>${tripPhaseLabel(trip)}</strong></div>
      </div>
    </div>
    <div id="currentLodging"></div>
    <div class="plan-toolbar"><div id="currentPlanSwitch" class="plan-switch"></div><button id="currentPlanShuffle" class="shuffle-btn">${iconSvg('shuffle')} プラン</button></div>
    <div id="currentPlanBody"></div>`;
  renderLodgingCard(editingDay);
  renderDayPlans(editingDay);
}

function renderCandidateModal(){
  const slot=candidateSlot();
  if(!slot) return;
  document.getElementById('candidateModalTitle').textContent=`${slotTimeLabel(slot)} の候補`;
  document.getElementById('candidateCount').textContent=`${slot.candidates.length}/${MAX_CANDIDATES}`;
  const lead=selectedCandidate(slot);
  document.getElementById('candidateList').innerHTML=`
    <div class="candidate-context-note">候補を切り替えると、この予定枠の表示とナビ先が更新されます。現在の選択：${escapeHtml(cleanDisplayName(lead?.name||'未設定'))}</div>
    ${slot.candidates.map((c,i)=>`<div class="candidate-choice ${c.id===slot.selectedCandidateId?'selected':''}"><div class="candidate-choice-main" role="button" tabindex="0" onclick="selectCandidate('${c.id}')"><div class="candidate-index">${i+1}</div><div><div class="candidate-name">${escapeHtml(cleanDisplayName(c.name))}</div><div class="candidate-meta">${escapeHtml(c.destination||'目的地未入力')}${c.activity?` · ${escapeHtml(c.activity)}`:''}</div></div></div><div class="candidate-choice-actions"><button class="tiny-edit" onclick="selectCandidate('${c.id}')">${c.id===slot.selectedCandidateId?'✓ 選択中':'この候補を選ぶ'}</button><button class="tiny-edit" onclick="showCandidateForm('edit','${c.id}')">編集</button><button class="delete-btn" onclick="deleteCandidate('${c.id}')" ${slot.candidates.length<=1?'disabled':''}>削除</button></div></div>`).join('')}`;
  const add=document.getElementById('candidateAddBtn');
  add.disabled=slot.candidates.length>=MAX_CANDIDATES;
  add.textContent=slot.candidates.length>=MAX_CANDIDATES?'候補は最大4つです':'＋ 候補を追加';
  document.getElementById('slotShuffleBtn').disabled=slot.candidates.length<2;
}

function renderAll(){
  renderHeader();
  renderTrips();
  renderHome();
  renderTripDetail();
  renderRecordScreen();
  renderSpotsScreen();
  renderProfileScreen();
  renderNavigationSettings();
  loadNote();
}

/* =========================================================
   v2.5.5 Record Linkage
   Record page owns photo capture/import. Photos can link to a
   real itinerary slot and one linked photo can be its cover.
   ========================================================= */
let RECORD_TRIP_ID = null;
let PENDING_RECORD = null;

function getRecordTrip(){
  if(RECORD_TRIP_ID){
    const saved=getTripById(RECORD_TRIP_ID);
    if(saved) return saved;
  }
  const home=getHomeTrip();
  if(home){ RECORD_TRIP_ID=home.id; return home; }
  const first=APP_DATA?.trips?.[0]||null;
  if(first) RECORD_TRIP_ID=first.id;
  return first;
}
function setRecordTrip(tripId){
  if(!getTripById(tripId)) return;
  RECORD_TRIP_ID=tripId;
  renderRecordScreen();
}
function recordRoleLabel(role){ return role==='start'?'START':role==='fin'?'FIN':'TIME DIARY'; }
function formatRecordDateTime(value){
  const d=new Date(value||Date.now());
  if(Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toDateTimeLocal(value){
  const d=new Date(value||Date.now());
  if(Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function itineraryRecordOptions(trip){
  if(!trip) return [];
  return (trip.days||[]).flatMap(day=>{
    const plan=getActivePlanFromTrip(trip,day.day);
    return (plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b)).map(slot=>({day,plan,slot,candidate:selectedCandidate(slot)}));
  });
}
function findLinkedSlot(trip,record){
  if(!trip||!record?.slotId) return null;
  const day=getDayFromTrip(trip,record.day);
  const plan=getPlanFromTrip(trip,record.day,record.planId||day?.activePlanId);
  const slot=plan?.slots?.find(s=>s.id===record.slotId)||null;
  return slot?{day,plan,slot,candidate:selectedCandidate(slot)}:null;
}
function findRecordById(recordId){
  for(const trip of APP_DATA?.trips||[]){
    const record=(trip.records||[]).find(r=>r.id===recordId);
    if(record) return {trip,record};
  }
  return null;
}
function getSlotCoverRecord(trip,slot){
  if(!trip||!slot?.coverRecordId) return null;
  return (trip.records||[]).find(r=>r.id===slot.coverRecordId&&r.kind==='photo'&&r.dataUrl)||null;
}
function isRecordCover(trip,record){
  const link=findLinkedSlot(trip,record);
  return !!(link&&link.slot.coverRecordId===record.id);
}
function suggestRecordLink(trip,capturedAt,role='diary'){
  if(!trip||role!=='diary') return '';
  const d=new Date(capturedAt||Date.now());
  if(Number.isNaN(d.getTime())) return '';
  const dateKey=localDateKey(d), day=trip.days.find(x=>x.date===dateKey);
  if(!day) return '';
  const plan=getActivePlanFromTrip(trip,day.day);
  if(!plan?.slots?.length) return '';
  const current=d.getHours()*60+d.getMinutes();
  const best=plan.slots.slice().sort((a,b)=>Math.abs(slotSortMinutes(a)-current)-Math.abs(slotSortMinutes(b)-current))[0];
  return best?`${day.day}|${plan.id}|${best.id}`:'';
}
function populateRecordSlotSelect(trip,selectedValue=''){
  const select=document.getElementById('recordSlotSelect');
  if(!select) return;
  const options=itineraryRecordOptions(trip);
  select.innerHTML=`<option value="">予定に紐付けない</option>`+options.map(item=>{
    const val=`${item.day.day}|${item.plan.id}|${item.slot.id}`;
    return `<option value="${escapeHtml(val)}">DAY ${item.day.day} · ${escapeHtml(slotTimeLabel(item.slot))} · ${escapeHtml(cleanDisplayName(item.candidate?.name||'予定'))}</option>`;
  }).join('');
  select.value=options.some(item=>`${item.day.day}|${item.plan.id}|${item.slot.id}`===selectedValue)?selectedValue:'';
  updateRecordCoverAvailability();
}
function updateRecordCoverAvailability(){
  const row=document.getElementById('recordCoverToggleRow');
  const select=document.getElementById('recordSlotSelect');
  if(!row||!select) return;
  row.classList.toggle('disabled-row',!select.value);
  document.getElementById('recordMakeCover').disabled=!select.value;
  if(!select.value) document.getElementById('recordMakeCover').checked=false;
}
function openRecordCapture(role='diary',source='camera'){
  const trip=getRecordTrip();
  if(!trip){ alert('先に旅行を登録してください。'); return; }
  PENDING_RECORD={mode:'new',role,tripId:trip.id,dataUrl:'',fileName:'',capturedAt:new Date().toISOString(),createdAt:new Date().toISOString()};
  const input=document.getElementById(source==='library'?'recordLibraryInput':'recordCameraInput');
  if(input){ input.value=''; input.click(); }
}
async function handleRecordPhotoInput(event){
  const file=event.target.files?.[0];
  if(!file||!PENDING_RECORD) return;
  try{
    showToast('写真を準備しています…');
    const dataUrl=await compressImageFile(file);
    PENDING_RECORD.dataUrl=dataUrl;
    PENDING_RECORD.fileName=file.name||'';
    PENDING_RECORD.capturedAt=file.lastModified?new Date(file.lastModified).toISOString():new Date().toISOString();
    openRecordModal(PENDING_RECORD);
  }catch(err){
    console.warn(err);
    PENDING_RECORD=null;
    alert('写真を読み込めませんでした。別の写真でお試しください。');
  }
}
function openRecordModal(pending){
  const trip=getTripById(pending.tripId)||getRecordTrip();
  if(!trip) return;
  document.getElementById('recordModalTitle').textContent=pending.mode==='edit'?'記録を編集':'写真を記録';
  document.getElementById('recordPreview').innerHTML=pending.dataUrl?`<img src="${pending.dataUrl}" alt="記録写真プレビュー">`:'<div class="record-preview-empty">写真がありません</div>';
  document.getElementById('recordRole').value=pending.role||'diary';
  document.getElementById('recordCapturedAt').value=toDateTimeLocal(pending.capturedAt);
  document.getElementById('recordNote').value=pending.note||'';
  let selected='';
  if(pending.slotId) selected=`${pending.day}|${pending.planId}|${pending.slotId}`;
  if(!selected) selected=suggestRecordLink(trip,pending.capturedAt,pending.role);
  populateRecordSlotSelect(trip,selected);
  const existing=pending.mode==='edit'?findRecordById(pending.recordId):null;
  document.getElementById('recordMakeCover').checked=!!(existing&&isRecordCover(existing.trip,existing.record));
  updateRecordCoverAvailability();
  document.getElementById('recordModal').classList.add('open');
  document.body.classList.add('modal-open');
}
function closeRecordModal(){
  const modal=document.getElementById('recordModal');
  modal?.classList.remove('open');
  PENDING_RECORD=null;
  if(!document.getElementById('editorModal')?.classList.contains('open')&&!document.getElementById('candidateModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
}
function parseRecordSlotValue(value){
  if(!value) return {day:null,planId:'',slotId:''};
  const [day,planId,slotId]=String(value).split('|');
  return {day:Number(day)||null,planId:planId||'',slotId:slotId||''};
}
function savePendingRecord(){
  if(!PENDING_RECORD) return;
  const trip=getTripById(PENDING_RECORD.tripId);
  if(!trip) return;
  const snapshot=deepClone(APP_DATA);
  const link=parseRecordSlotValue(document.getElementById('recordSlotSelect').value);
  const localValue=document.getElementById('recordCapturedAt').value;
  const capturedAt=localValue?new Date(localValue).toISOString():(PENDING_RECORD.capturedAt||new Date().toISOString());
  const values={
    kind:'photo', role:document.getElementById('recordRole').value||'diary', dataUrl:PENDING_RECORD.dataUrl||'',
    fileName:PENDING_RECORD.fileName||'', capturedAt, createdAt:PENDING_RECORD.createdAt||new Date().toISOString(),
    note:document.getElementById('recordNote').value.trim(), day:link.day, planId:link.planId, slotId:link.slotId, lat:null, lon:null
  };
  if(!values.dataUrl){ alert('写真がありません。'); return; }
  let record;
  if(PENDING_RECORD.mode==='edit'){
    record=(trip.records||[]).find(r=>r.id===PENDING_RECORD.recordId);
    if(!record) return;
    Object.assign(record,values);
  }else{
    record={id:uid('record'),...values};
    trip.records=trip.records||[];
    trip.records.push(record);
  }
  // A record can only be the cover of its currently linked slot.
  (trip.days||[]).forEach(day=>(day.plans||[]).forEach(plan=>(plan.slots||[]).forEach(slot=>{
    if(slot.coverRecordId===record.id && slot.id!==record.slotId) slot.coverRecordId='';
  })));
  if(document.getElementById('recordMakeCover').checked&&link.slotId){
    const slot=getSlotFromTrip(trip,link.day,link.planId,link.slotId);
    if(slot) slot.coverRecordId=record.id;
  }else{
    const linked=findLinkedSlot(trip,record);
    if(linked?.slot.coverRecordId===record.id) linked.slot.coverRecordId='';
  }
  try{
    persistAppData();
  }catch(err){
    console.warn(err);
    APP_DATA=snapshot;
    alert('写真を保存できませんでした。端末内の保存容量が不足している可能性があります。別の写真にするか、不要な記録を削除してください。');
    return;
  }
  document.getElementById('recordModal').classList.remove('open');
  PENDING_RECORD=null;
  document.body.classList.remove('modal-open');
  renderAll();
  showToast('✓ 写真と記録を保存しました');
}
function editRecord(recordId){
  const found=findRecordById(recordId);
  if(!found) return;
  RECORD_TRIP_ID=found.trip.id;
  PENDING_RECORD={mode:'edit',recordId:found.record.id,tripId:found.trip.id,...deepClone(found.record)};
  openRecordModal(PENDING_RECORD);
}
function toggleRecordCover(recordId){
  const found=findRecordById(recordId);
  if(!found) return;
  const link=findLinkedSlot(found.trip,found.record);
  if(!link){ alert('代表写真にするには、先にこの記録を予定へ紐付けてください。'); return; }
  if(link.slot.coverRecordId===recordId){
    link.slot.coverRecordId='';
    persistAppData();
    renderAll();
    showToast('代表写真を解除しました');
    return;
  }
  link.slot.coverRecordId=recordId;
  persistAppData();
  renderAll();
  showToast('✓ 予定の代表写真に設定しました');
}
function deleteRecord(recordId){
  const found=findRecordById(recordId);
  if(!found) return;
  if(!confirm('この写真と記録を削除しますか？')) return;
  (found.trip.days||[]).forEach(day=>(day.plans||[]).forEach(plan=>(plan.slots||[]).forEach(slot=>{ if(slot.coverRecordId===recordId) slot.coverRecordId=''; })));
  found.trip.records=(found.trip.records||[]).filter(r=>r.id!==recordId);
  persistAppData();
  renderAll();
  showToast('記録を削除しました');
}
function linkedScheduleLabel(trip,record){
  const link=findLinkedSlot(trip,record);
  if(!link) return '予定には紐付いていません';
  return `DAY ${link.day.day} · ${slotTimeLabel(link.slot)} · ${cleanDisplayName(link.candidate?.name||'予定')}`;
}
function renderRecordScreen(){
  const section=document.getElementById('record');
  if(!section) return;
  const trip=getRecordTrip();
  const trips=(APP_DATA?.trips||[]).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const records=(trip?.records||[]).slice().sort((a,b)=>new Date(a.capturedAt||a.createdAt)-new Date(b.capturedAt||b.createdAt));
  const savedNote=localStorage.getItem('tripQuickNote')||'';
  section.innerHTML=`
    <div class="editorial-page-shell record-page-v255">
      <div class="page-intro-row single">
        <div>
          <div class="page-kicker">RECORD</div>
          <h2 class="section-title no-margin">記録</h2>
          <p class="section-sub">写真はここから撮影・追加し、旅程と結びつけてTime Diaryに残します。</p>
        </div>
      </div>
      ${trips.length>1?`<div class="record-trip-switch chip-row">${trips.map(t=>`<button class="chip ${trip?.id===t.id?'active':''}" onclick="setRecordTrip('${t.id}')">${escapeHtml(cleanDisplayName(t.title))}</button>`).join('')}</div>`:''}
      <div class="record-cover-hero card">
        <div class="record-cover-copy">
          <div class="time">${trip?`${formatSlash(trip.startDate)} — ${formatSlash(trip.endDate)}`:'NO TRIP'}</div>
          <div class="title">${trip?escapeHtml(cleanDisplayName(trip.title)):'旅を登録してください'}</div>
          <div class="desc">${trip?`${records.length}件の記録 · 写真は予定へ紐付け可能です。`:'旅行を追加すると写真記録を始められます。'}</div>
        </div>
        <div class="record-primary-actions">
          <button class="record-action-primary" onclick="openRecordCapture('diary','camera')">${iconSvg('camera')}<span>カメラで撮る</span></button>
          <button class="record-action-secondary" onclick="openRecordCapture('diary','library')">${iconSvg('record')}<span>写真を選ぶ</span></button>
        </div>
        <div class="record-role-actions">
          <button onclick="openRecordCapture('start','camera')">STARTを撮る</button>
          <button onclick="openRecordCapture('fin','camera')">FINを撮る</button>
        </div>
      </div>
      <div class="record-data-link-note"><strong>旅程との連携</strong><span>写真を保存するときに「関連する予定」を選べます。代表写真に設定した1枚は、予定終了後にその予定カードの背景へ反映されます。</span></div>
      <div class="card record-note-card">
        <div class="time">QUICK NOTE</div><div class="title">写真を撮らない旅メモ</div>
        <textarea id="quickNote" class="note-box" placeholder="例：次は朝の時間帯にも来てみたい。">${escapeHtml(savedNote)}</textarea>
        <div class="spacer-8"></div><button class="btn ghost full" onclick="saveNote()">メモを保存</button><div id="noteSaved" class="small note-status">${savedNote?'この端末に保存済みです。':''}</div>
      </div>
      <div class="record-timeline-head"><div><div class="page-kicker">TIME DIARY</div><div class="title">旅のタイムライン</div></div><span class="trip-mini-badge">${records.length} RECORDS</span></div>
      <div class="record-actual-timeline">${records.length?records.map(record=>{
        const cover=isRecordCover(trip,record);
        const note=record.note?escapeHtml(record.note):'コメントなし';
        return `<article class="record-photo-entry ${cover?'is-cover':''}">
          <div class="record-photo-time"><span>${recordRoleLabel(record.role)}</span><strong>${escapeHtml(formatRecordDateTime(record.capturedAt))}</strong></div>
          <div class="record-photo-media"><img src="${record.dataUrl}" alt="旅の記録写真"></div>
          <div class="record-photo-body">
            <div class="record-linked-slot">${iconSvg('pin')} ${escapeHtml(linkedScheduleLabel(trip,record))}</div>
            <div class="record-photo-note">${note}</div>
            ${cover?'<div class="cover-record-badge">代表写真</div>':''}
            <div class="record-photo-actions">
              <button class="btn ghost compact-btn" onclick="editRecord('${record.id}')">編集</button>
              ${record.slotId?`<button class="btn secondary compact-btn" onclick="toggleRecordCover('${record.id}')">${iconSvg('star')} ${cover?'代表写真を解除':'代表写真に設定'}</button>`:''}
              <button class="btn secondary compact-btn danger-soft" onclick="deleteRecord('${record.id}')">${iconSvg('trash')} 削除</button>
            </div>
          </div>
        </article>`;
      }).join(''):'<div class="record-empty large">まだ写真記録がありません。上の「カメラで撮る」または「写真を選ぶ」から、最初のTime Diaryを作れます。</div>'}</div>
    </div>`;
}

function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip(),c=selectedCandidate(slot),count=slot.candidates.length,hasStack=count>1,status=slotStatus(trip,dayNum,slot);
  const recordCover=getSlotCoverRecord(trip,slot);
  const legacyCover=slot.coverPhoto?.dataUrl||'';
  const coverData=recordCover?.dataUrl||legacyCover;
  const hasCover=status==='completed'&&!!coverData;
  const actionButtons=[];
  if(c?.transportMode!=='none') actionButtons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
  if(c?.destination||c?.address||c?.googleMapsUrl||c?.name) actionButtons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
  const stackButton=hasStack?`<button class="candidate-stack-hit" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app')" aria-label="${count}件の候補を表示"><span>${count}</span></button>`:`<button class="candidate-add-mini" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app',true)">＋候補</button>`;
  const coverStyle=hasCover?` style="--slot-cover-photo:url('${coverData}')"`:'';
  const stateLabel=status==='completed'?'完了':status==='active'?'進行中':'予定';
  return `<div class="slot-wrap ${hasStack?'has-stack':''}"><div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="slot-meta-row"><div class="slot-meta-left"><span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>${count>1?`<span class="slot-option-chip">${count} OPTIONS</span>`:''}${recordCover?'<span class="slot-record-chip">PHOTO</span>':''}</div><span class="slot-state-badge ${status}">${stateLabel}</span></div><div class="title">${escapeHtml(cleanDisplayName(c?.name||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:''}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${actionButtons.length?`<div class="actions ${actionButtons.length===1?'one':''}">${actionButtons.join('')}</div>`:''}</div>${stackButton}</div></div>`;
}

function renderTripDetail(){
  const trip=getTrip(); if(!trip) return;
  if(editingDay>trip.days.length) editingDay=trip.days.length; if(editingDay<1) editingDay=1;
  document.getElementById('tripDetailTitle').textContent=`${cleanDisplayName(trip.title)}｜旅程`;
  document.getElementById('tripDayChips').innerHTML=trip.days.map(d=>`<button class="chip ${d.day===editingDay?'active':''}" onclick="setDay(${d.day})">DAY ${d.day} · ${formatJP(d.date)}</button>`).join('');
  const day=getDay(editingDay),plan=getActivePlan(editingDay);
  const recordCount=(trip.records||[]).filter(r=>r.day===day.day).length;
  document.getElementById('tripDayContent').innerHTML=`<div class="itinerary-editorial-head card compact"><div class="time">ITINERARY</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">DAY ${day.day} · ${escapeHtml(formatJP(day.date))} · Plan ${plan?.id?.toUpperCase()||'A'} を表示しています。</div><div class="itinerary-kpis"><div><span>この日の予定</span><strong>${plan?.slots?.length||0}</strong></div><div><span>この日の記録</span><strong>${recordCount}</strong></div><div><span>状態</span><strong>${tripPhaseLabel(trip)}</strong></div></div></div><div id="currentLodging"></div><div class="plan-toolbar"><div id="currentPlanSwitch" class="plan-switch"></div><button id="currentPlanShuffle" class="shuffle-btn">${iconSvg('shuffle')} プラン</button></div><div id="currentPlanBody"></div>`;
  renderLodgingCard(editingDay); renderDayPlans(editingDay);
}

function renderAll(){
  renderHeader(); renderTrips(); renderHome(); renderTripDetail(); renderRecordScreen(); renderSpotsScreen(); renderProfileScreen(); renderNavigationSettings(); loadNote();
  if(document.getElementById('calendar')?.classList.contains('active')) renderCalendar();
}

document.addEventListener('DOMContentLoaded',()=>{
  const camera=document.getElementById('recordCameraInput');
  const library=document.getElementById('recordLibraryInput');
  camera?.addEventListener('change',handleRecordPhotoInput);
  library?.addEventListener('change',handleRecordPhotoInput);
});

/* =========================================================
   v2.5.5 Record / Media / Cover linkage
   ========================================================= */
let RECORD_COMPOSER={kind:'entry',file:null,mediaType:'none',previewUrl:'',capturedAt:''};
const RECORD_VIDEO_URLS=new Set();
function recordDateTimeText(iso){
  if(!iso) return '時刻不明';
  const d=new Date(iso); if(Number.isNaN(d.getTime())) return '時刻不明';
  return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function recordKindLabel(kind){ return kind==='start'?'START':kind==='fin'?'FIN':'TIME DIARY'; }
function recordTripById(id){ return APP_DATA.trips.find(t=>t.id===id)||null; }
function recordSlotLink(record){
  const trip=recordTripById(record.tripId); if(!trip||!record.day||!record.slotId) return {trip,day:null,plan:null,slot:null,candidate:null};
  const day=getDayFromTrip(trip,record.day); const plan=getPlanFromTrip(trip,record.day,record.planId||day?.activePlanId); const slot=plan?.slots?.find(s=>s.id===record.slotId)||null;
  return {trip,day,plan,slot,candidate:selectedCandidate(slot)};
}
function revokeRecordPreview(){
  if(RECORD_COMPOSER.previewUrl){ URL.revokeObjectURL(RECORD_COMPOSER.previewUrl); RECORD_COMPOSER.previewUrl=''; }
}
function openRecordComposer(kind='entry'){
  RECORD_COMPOSER={kind:'entry',file:null,mediaType:'none',previewUrl:'',capturedAt:''};
  setRecordKind(kind);
  const trip=getHomeTrip()||getTrip()||APP_DATA.trips[0]||null;
  const tripSelect=document.getElementById('recordTripSelect');
  tripSelect.innerHTML=(APP_DATA.trips||[]).map(t=>`<option value="${t.id}">${escapeHtml(cleanDisplayName(t.title))}</option>`).join('');
  if(trip) tripSelect.value=trip.id;
  document.getElementById('recordComment').value=''; document.getElementById('recordPlaceName').value='';
  renderRecordLinkSelectors(); renderRecordMediaPreview();
  document.getElementById('recordModal').classList.add('open'); document.body.classList.add('modal-open');
}
function closeRecordComposer(){ revokeRecordPreview(); RECORD_COMPOSER={kind:'entry',file:null,mediaType:'none',previewUrl:'',capturedAt:''}; document.getElementById('recordModal').classList.remove('open'); document.body.classList.remove('modal-open'); }
function setRecordKind(kind){
  RECORD_COMPOSER.kind=['start','entry','fin'].includes(kind)?kind:'entry';
  document.querySelectorAll('.record-kind-chip').forEach(b=>b.classList.toggle('active',b.dataset.kind===RECORD_COMPOSER.kind));
  const title=document.getElementById('recordModalTitle'); if(title) title.textContent=RECORD_COMPOSER.kind==='start'?'旅のSTARTを残す':RECORD_COMPOSER.kind==='fin'?'旅のFINを残す':'Time Diaryを追加';
}
function renderRecordLinkSelectors(dayChanged=false){
  const trip=recordTripById(document.getElementById('recordTripSelect')?.value)||getHomeTrip()||getTrip(); if(!trip) return;
  const daySelect=document.getElementById('recordDaySelect'),slotSelect=document.getElementById('recordSlotSelect');
  const previousDay=Number(daySelect.value)||null;
  daySelect.innerHTML=trip.days.map(d=>`<option value="${d.day}">DAY ${d.day} · ${formatJP(d.date)}</option>`).join('');
  const today=localDateKey(); const smartDay=trip.days.find(d=>d.date===today)?.day||1;
  daySelect.value=String(dayChanged&&previousDay?Math.min(previousDay,trip.days.length):smartDay);
  const day=getDayFromTrip(trip,Number(daySelect.value)); const plan=getActivePlanFromTrip(trip,day.day); const slots=(plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(s=>{const c=selectedCandidate(s);return `<option value="${s.id}">${escapeHtml(slotTimeLabel(s))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`}).join('');
}
function syncRecordPlaceFromSlot(){ const trip=recordTripById(document.getElementById('recordTripSelect')?.value); if(!trip) return; const dayNum=Number(document.getElementById('recordDaySelect')?.value)||1; const plan=getActivePlanFromTrip(trip,dayNum); const slot=plan?.slots?.find(s=>s.id===document.getElementById('recordSlotSelect')?.value); const c=selectedCandidate(slot); if(c&&document.getElementById('recordPlaceName')&&!document.getElementById('recordPlaceName').value.trim()) document.getElementById('recordPlaceName').value=c.destination||cleanDisplayName(c.name||''); }
function pickRecordMedia(type){ const input=document.getElementById(type==='video'?'recordVideoInput':'recordImageInput'); if(input){ input.value=''; input.click(); } }
function handleRecordFileSelected(file,type){
  if(!file) return; revokeRecordPreview(); RECORD_COMPOSER.file=file; RECORD_COMPOSER.mediaType=type; RECORD_COMPOSER.previewUrl=URL.createObjectURL(file); RECORD_COMPOSER.capturedAt=file.lastModified?new Date(file.lastModified).toISOString():new Date().toISOString(); renderRecordMediaPreview();
}
function renderRecordMediaPreview(){
  const box=document.getElementById('recordMediaPreview'); if(!box) return;
  if(!RECORD_COMPOSER.file){ box.className='record-media-preview empty'; box.innerHTML='メディア未選択'; return; }
  box.className='record-media-preview';
  box.innerHTML=RECORD_COMPOSER.mediaType==='video'?`<video src="${RECORD_COMPOSER.previewUrl}" controls playsinline></video><button class="record-media-remove" onclick="clearRecordMedia()">削除</button>`:`<img src="${RECORD_COMPOSER.previewUrl}" alt="選択した写真"><button class="record-media-remove" onclick="clearRecordMedia()">削除</button>`;
}
function clearRecordMedia(){ revokeRecordPreview(); RECORD_COMPOSER.file=null; RECORD_COMPOSER.mediaType='none'; RECORD_COMPOSER.capturedAt=''; renderRecordMediaPreview(); }
async function createImageStoragePayload(file){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader(); reader.onerror=()=>reject(reader.error); reader.onload=()=>{ const img=new Image(); img.onerror=()=>reject(new Error('画像読込エラー')); img.onload=()=>{
      const fullMax=1800,scale=Math.min(1,fullMax/Math.max(img.width,img.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale)); const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>{ if(!blob) return reject(new Error('画像変換エラー'));
        const previewMax=620,pScale=Math.min(1,previewMax/Math.max(img.width,img.height)); const pc=document.createElement('canvas'); pc.width=Math.max(1,Math.round(img.width*pScale)); pc.height=Math.max(1,Math.round(img.height*pScale)); pc.getContext('2d').drawImage(img,0,0,pc.width,pc.height); const previewDataUrl=pc.toDataURL('image/jpeg',0.68); resolve({blob,previewDataUrl,mimeType:'image/jpeg'});
      },'image/jpeg',0.82);
    }; img.src=reader.result; }; reader.readAsDataURL(file);
  });
}
async function saveRecordComposer(){
  const trip=recordTripById(document.getElementById('recordTripSelect').value); if(!trip){ alert('旅行を選択してください。'); return; }
  const dayNum=Number(document.getElementById('recordDaySelect').value)||1; const day=getDayFromTrip(trip,dayNum); const plan=getActivePlanFromTrip(trip,dayNum); const slotId=document.getElementById('recordSlotSelect').value||''; const slot=slotId?plan?.slots.find(s=>s.id===slotId):null; const c=selectedCandidate(slot);
  const now=new Date().toISOString(); let mediaKey='',previewDataUrl='',mimeType='';
  try{
    if(RECORD_COMPOSER.file){
      mediaKey=uid('media');
      if(RECORD_COMPOSER.mediaType==='image'){
        showToast('写真を保存しています…'); const payload=await createImageStoragePayload(RECORD_COMPOSER.file); previewDataUrl=payload.previewDataUrl; mimeType=payload.mimeType; await mediaPut(mediaKey,payload.blob);
      }else{
        showToast('動画を保存しています…'); mimeType=RECORD_COMPOSER.file.type||'video/mp4'; await mediaPut(mediaKey,RECORD_COMPOSER.file);
      }
    }
    const record={id:uid('record'),tripId:trip.id,day:dayNum,planId:plan?.id||'',slotId,kind:RECORD_COMPOSER.kind,mediaType:RECORD_COMPOSER.file?RECORD_COMPOSER.mediaType:'none',mediaKey,mimeType,previewDataUrl,comment:document.getElementById('recordComment').value.trim(),placeName:document.getElementById('recordPlaceName').value.trim()||c?.destination||cleanDisplayName(c?.name||''),capturedAt:RECORD_COMPOSER.capturedAt||now,createdAt:now,isCover:false};
    trip.records=trip.records||[]; trip.records.push(record); persistAppData(); closeRecordComposer(); renderRecordScreen(); showToast('✓ Time Diaryに保存しました');
  }catch(err){ console.warn(err); alert('記録を保存できませんでした。空き容量を確認してもう一度お試しください。'); }
}
function allRecordsSorted(trip){ return (trip?.records||[]).slice().sort((a,b)=>String(b.capturedAt||b.createdAt).localeCompare(String(a.capturedAt||a.createdAt))); }
async function hydrateRecordMedia(){
  document.querySelectorAll('[data-record-media-key]').forEach(async el=>{
    if(el.dataset.hydrated==='1') return; const key=el.dataset.recordMediaKey; if(!key) return;
    try{ const blob=await mediaGet(key); if(!blob) return; const url=URL.createObjectURL(blob); RECORD_VIDEO_URLS.add(url); el.dataset.hydrated='1'; if(el.tagName==='VIDEO') el.src=url; else if(el.tagName==='IMG') el.src=url; }catch(e){ console.warn('media hydrate failed',e); }
  });
}
function setRecordAsCover(recordId){
  const trip=(APP_DATA.trips||[]).find(t=>(t.records||[]).some(r=>r.id===recordId)); if(!trip) return; const record=(trip.records||[]).find(r=>r.id===recordId); if(!record||record.mediaType!=='image'||!record.slotId||!record.previewDataUrl){ alert('代表写真にするには、予定に紐付いた写真記録が必要です。'); return; }
  const link=recordSlotLink(record); if(!link.slot){ alert('紐付け先の予定が見つかりません。'); return; }
  (trip.records||[]).forEach(r=>{ if(r.slotId===record.slotId&&r.day===record.day) r.isCover=false; }); record.isCover=true;
  link.slot.coverPhoto={dataUrl:record.previewDataUrl,addedAt:new Date().toISOString(),capturedAt:record.capturedAt||'',name:'Time Diary代表写真'};
  persistAppData(); renderRecordScreen(); if(getTrip()?.id===trip.id) renderTripDetail(); showToast('✓ 予定の代表写真に設定しました');
}
async function deleteRecordEntry(recordId){
  const trip=(APP_DATA.trips||[]).find(t=>(t.records||[]).some(r=>r.id===recordId)); if(!trip) return; const record=(trip.records||[]).find(r=>r.id===recordId); if(!record||!confirm('この記録を削除しますか？')) return;
  if(record.isCover&&record.slotId){ const link=recordSlotLink(record); if(link.slot) link.slot.coverPhoto=null; }
  trip.records=trip.records.filter(r=>r.id!==recordId); persistAppData(); try{ if(record.mediaKey) await mediaDelete(record.mediaKey); }catch(e){console.warn(e)} renderRecordScreen(); if(getTrip()?.id===trip.id) renderTripDetail(); showToast('✓ 記録を削除しました');
}
function recordLinkedLabel(record){ const link=recordSlotLink(record); if(link.slot){ const c=link.candidate; return `DAY ${record.day} · ${slotTimeLabel(link.slot)} · ${cleanDisplayName(c?.name||'予定')}`; } return record.day?`DAY ${record.day} · 予定に未紐付け`:'予定に未紐付け'; }
function renderRecordScreen(){
  const section=document.getElementById('record'); if(!section) return;
  const trip=v254RecentTripForRecord(); const records=allRecordsSorted(trip); const savedNote=localStorage.getItem('tripQuickNote')||'';
  section.innerHTML=`<div class="editorial-page-shell">
    <div class="page-intro-row"><div><div class="page-kicker">RECORD</div><h2 class="section-title no-margin">記録</h2><p class="section-sub">撮る、書く、予定と結ぶ。旅の記憶をTime Diaryとして残します。</p></div><button class="pill-action" onclick="openRecordComposer('entry')">＋ 記録する</button></div>
    ${trip?`<div class="record-hero-card card"><div class="record-hero-top"><div><div class="time">${localDateKey()<trip.startDate?'NEXT JOURNEY':localDateKey()>trip.endDate?'TRIP ARCHIVE':'ON THE ROAD'}</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))} · ${records.length} records</div></div><button class="tiny-edit" onclick="activateTrip('${trip.id}',true)">旅程を見る</button></div></div>`:'<div class="record-empty">旅行を登録するとTime Diaryを始められます。</div>'}
    ${trip?`<div class="record-capture-row"><button class="record-capture-card start" onclick="openRecordComposer('start')"><span>START</span><strong>旅の始まりを残す</strong><small>写真・動画・ひとこと</small></button><button class="record-capture-card diary" onclick="openRecordComposer('entry')"><span>TIME DIARY</span><strong>今を記録する</strong><small>予定と写真を紐付ける</small></button><button class="record-capture-card fin" onclick="openRecordComposer('fin')"><span>FIN</span><strong>旅の終わりを残す</strong><small>最後の一枚・動画</small></button></div>`:''}
    <div class="card record-timeline-card"><div class="list-header"><div><div class="time">TIMELINE</div><div class="title">Time Diary</div></div><span class="trip-mini-badge">${records.length} RECORDS</span></div><div class="record-timeline real-records">${records.length?records.map(record=>{ const media=record.mediaType==='image'?(record.previewDataUrl?`<img class="record-media-thumb" src="${record.previewDataUrl}" alt="記録写真">`:`<img class="record-media-thumb" data-record-media-key="${record.mediaKey}" alt="記録写真">`):record.mediaType==='video'?`<video class="record-media-video" data-record-media-key="${record.mediaKey}" controls playsinline></video>`:''; return `<article class="record-card-entry ${record.kind}"><div class="record-entry-time"><span>${recordKindLabel(record.kind)}</span><strong>${recordDateTimeText(record.capturedAt||record.createdAt)}</strong></div>${media?`<div class="record-media-wrap">${media}${record.isCover?'<span class="record-cover-label">代表写真</span>':''}</div>`:''}<div class="record-entry-content"><div class="record-entry-title">${escapeHtml(record.placeName||'旅の記録')}</div><div class="record-entry-link">${escapeHtml(recordLinkedLabel(record))}</div>${record.comment?`<div class="record-comment">${escapeHtml(record.comment)}</div>`:''}<div class="record-entry-actions">${record.mediaType==='image'&&record.slotId?`<button class="tiny-edit" onclick="setRecordAsCover('${record.id}')">${record.isCover?'✓ 代表写真':'代表写真にする'}</button>`:''}<button class="delete-btn" onclick="deleteRecordEntry('${record.id}')">削除</button></div></div></article>`; }).join(''):'<div class="record-empty">まだ記録がありません。「＋ 記録する」から写真・動画・感想を残せます。</div>'}</div></div>
    <div class="card record-note-card"><div class="time">QUICK NOTE</div><div class="title">旅メモ</div><div class="desc">予定に紐付けないちょっとしたメモも残せます。</div><textarea id="quickNote" class="note-box" placeholder="例：次は朝早くここに来たい。">${escapeHtml(savedNote)}</textarea><div class="spacer-8"></div><button class="btn secondary full" onclick="saveNote()">メモを保存</button><div id="noteSaved" class="small note-status">${savedNote?'この端末に保存済みです。':''}</div></div>
  </div>`;
  setTimeout(hydrateRecordMedia,0);
}

function syncRecordsWithTripStructure(trip){
  if(!trip||!Array.isArray(trip.records)) return;
  trip.records.forEach(r=>{ r.tripId=trip.id; const day=getDayFromTrip(trip,r.day); if(!day){r.day=null;r.planId='';r.slotId='';r.isCover=false;return;} const plan=getPlanFromTrip(trip,r.day,r.planId||day.activePlanId); if(!plan){r.planId='';r.slotId='';r.isCover=false;return;} r.planId=plan.id; if(r.slotId&&!plan.slots.some(s=>s.id===r.slotId)){r.slotId='';r.isCover=false;} });
}
const _v255SaveTripEditor=saveTripEditor;
saveTripEditor=function(){
  if(EDIT_DATA){ const trip=getTrip('edit'); if(trip) syncRecordsWithTripStructure(trip); }
  return _v255SaveTripEditor();
};
const _v255DeleteCurrentTrip=deleteCurrentTrip;
deleteCurrentTrip=async function(){
  if(EDITOR_MODE!=='edit'||!EDIT_DATA) return;
  const trip=getTrip('edit'); if(!trip) return;
  const recordKeys=(trip.records||[]).map(r=>r.mediaKey).filter(Boolean);
  const before=(APP_DATA.trips||[]).length;
  _v255DeleteCurrentTrip();
  if((APP_DATA.trips||[]).length<before){ for(const key of recordKeys){ try{await mediaDelete(key)}catch(e){console.warn(e)} } }
};

document.addEventListener('DOMContentLoaded',()=>{
  const imageInput=document.getElementById('recordImageInput'),videoInput=document.getElementById('recordVideoInput');
  if(imageInput) imageInput.addEventListener('change',e=>handleRecordFileSelected(e.target.files?.[0],'image'));
  if(videoInput) videoInput.addEventListener('change',e=>handleRecordFileSelected(e.target.files?.[0],'video'));
});

/* =========================================================
   v2.5.6 Camera-only records
   - no photo library / upload path
   - photo captured inside Tripper Note via getUserMedia
   - capturedAt fixed at shutter time and never editable
   ========================================================= */
let TRIPPER_CAMERA_STATE={stream:null,role:'entry',facingMode:'environment',blob:null,previewDataUrl:'',capturedAt:'',tripId:'',editRecordId:''};

function cameraRoleLabel(role){ return role==='start'?'START':role==='fin'?'FIN':'TIME DIARY'; }
function stopTripperCameraStream(){
  const stream=TRIPPER_CAMERA_STATE.stream;
  if(stream){ stream.getTracks().forEach(track=>track.stop()); }
  TRIPPER_CAMERA_STATE.stream=null;
  const video=document.getElementById('recordCameraVideo');
  if(video) video.srcObject=null;
}
async function startInAppCamera(role='entry'){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip()||APP_DATA.trips?.[0];
  if(!trip){ alert('先に旅行を登録してください。'); return; }
  TRIPPER_CAMERA_STATE={stream:null,role:['start','entry','fin'].includes(role)?role:'entry',facingMode:'environment',blob:null,previewDataUrl:'',capturedAt:'',tripId:trip.id,editRecordId:''};
  const modal=document.getElementById('recordCameraModal');
  if(!modal) return;
  document.getElementById('cameraRoleTitle').textContent=cameraRoleLabel(TRIPPER_CAMERA_STATE.role);
  modal.classList.add('open'); document.body.classList.add('modal-open');
  await openTripperCameraStream();
}
async function openTripperCameraStream(){
  const loading=document.getElementById('cameraLoading');
  const video=document.getElementById('recordCameraVideo');
  if(loading){ loading.textContent='カメラを起動しています…'; loading.classList.remove('hidden'); }
  stopTripperCameraStream();
  if(!navigator.mediaDevices?.getUserMedia){
    if(loading) loading.textContent='この端末ではアプリ内カメラを利用できません。';
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode:{ideal:TRIPPER_CAMERA_STATE.facingMode},
        width:{ideal:1920},height:{ideal:1080}
      }
    });
    TRIPPER_CAMERA_STATE.stream=stream;
    if(video){ video.srcObject=stream; await video.play(); }
    if(loading) loading.classList.add('hidden');
    const label=document.getElementById('cameraFacingLabel');
    if(label) label.textContent=TRIPPER_CAMERA_STATE.facingMode==='environment'?'背面カメラ':'前面カメラ';
  }catch(err){
    console.warn('camera open failed',err);
    if(loading) loading.textContent='カメラを起動できません。iPhoneの設定でカメラ権限を確認してください。';
  }
}
async function flipInAppCamera(){
  TRIPPER_CAMERA_STATE.facingMode=TRIPPER_CAMERA_STATE.facingMode==='environment'?'user':'environment';
  await openTripperCameraStream();
}
function closeInAppCamera(){
  stopTripperCameraStream();
  document.getElementById('recordCameraModal')?.classList.remove('open');
  if(!document.getElementById('recordDetailModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
}
function canvasToBlob(canvas,type='image/jpeg',quality=.86){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('画像を作成できませんでした')),type,quality));
}
async function captureInAppPhoto(){
  const video=document.getElementById('recordCameraVideo');
  if(!video||!video.videoWidth||!video.videoHeight){ showToast('カメラの準備中です'); return; }
  const capturedAt=new Date().toISOString();
  try{
    const maxSide=1800;
    const scale=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale)); canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    const ctx=canvas.getContext('2d');
    if(TRIPPER_CAMERA_STATE.facingMode==='user'){
      ctx.translate(canvas.width,0); ctx.scale(-1,1);
    }
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const blob=await canvasToBlob(canvas,'image/jpeg',.86);
    const previewMax=720,ps=Math.min(1,previewMax/Math.max(canvas.width,canvas.height));
    const pc=document.createElement('canvas'); pc.width=Math.max(1,Math.round(canvas.width*ps)); pc.height=Math.max(1,Math.round(canvas.height*ps));
    pc.getContext('2d').drawImage(canvas,0,0,pc.width,pc.height);
    TRIPPER_CAMERA_STATE.blob=blob;
    TRIPPER_CAMERA_STATE.previewDataUrl=pc.toDataURL('image/jpeg',.72);
    TRIPPER_CAMERA_STATE.capturedAt=capturedAt;
    stopTripperCameraStream();
    document.getElementById('recordCameraModal')?.classList.remove('open');
    openCapturedRecordDetail();
  }catch(err){ console.warn(err); alert('写真を撮影できませんでした。もう一度お試しください。'); }
}
function localKeyFromIso(iso){ const d=new Date(iso); return Number.isNaN(d.getTime())?localDateKey():localDateKey(d); }
function capturedTimeLabel(iso){
  const d=new Date(iso); if(Number.isNaN(d.getTime())) return '時刻不明';
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function suggestCapturedDay(trip,iso){
  const key=localKeyFromIso(iso);
  return trip.days.find(d=>d.date===key)?.day || trip.days[0]?.day || 1;
}
function suggestCapturedSlot(trip,dayNum,iso){
  const plan=getActivePlanFromTrip(trip,dayNum); if(!plan?.slots?.length) return '';
  const d=new Date(iso),minute=d.getHours()*60+d.getMinutes();
  const ordered=plan.slots.slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  let best=ordered[0],bestDiff=Infinity;
  ordered.forEach(slot=>{ const diff=Math.abs(slotSortMinutes(slot)-minute); if(diff<bestDiff){best=slot;bestDiff=diff;} });
  return best?.id||'';
}
function openCapturedRecordDetail(recordId=''){
  const modal=document.getElementById('recordDetailModal'); if(!modal) return;
  let trip=null,record=null;
  if(recordId){
    const found=(APP_DATA.trips||[]).map(t=>({trip:t,record:(t.records||[]).find(r=>r.id===recordId)})).find(x=>x.record);
    if(!found) return; trip=found.trip; record=found.record;
    TRIPPER_CAMERA_STATE={stream:null,role:record.kind||'entry',facingMode:'environment',blob:null,previewDataUrl:record.previewDataUrl||'',capturedAt:record.capturedAt||record.createdAt||'',tripId:trip.id,editRecordId:record.id};
  }else{
    trip=recordTripById?.(TRIPPER_CAMERA_STATE.tripId)||getRecordTrip?.()||getHomeTrip()||getTrip();
  }
  if(!trip) return;
  document.getElementById('recordDetailTitle').textContent=recordId?'記録を編集':`${cameraRoleLabel(TRIPPER_CAMERA_STATE.role)}を記録`;
  document.getElementById('capturedRecordPreview').innerHTML=TRIPPER_CAMERA_STATE.previewDataUrl?`<img src="${TRIPPER_CAMERA_STATE.previewDataUrl}" alt="Tripper Noteで撮影した写真">`:'<div class="record-preview-empty">写真がありません</div>';
  document.getElementById('capturedRecordTime').textContent=capturedTimeLabel(TRIPPER_CAMERA_STATE.capturedAt);
  const tripSelect=document.getElementById('capturedTripSelect');
  tripSelect.innerHTML=(APP_DATA.trips||[]).map(t=>`<option value="${t.id}">${escapeHtml(cleanDisplayName(t.title))}</option>`).join('');
  tripSelect.value=trip.id;
  tripSelect.disabled=!!recordId;
  document.getElementById('capturedComment').value=record?.comment||record?.note||'';
  document.getElementById('capturedPlaceName').value=record?.placeName||'';
  renderCapturedLinkSelectors(false,record);
  document.getElementById('capturedMakeCover').checked=record?!!record.isCover:false;
  updateCapturedCoverAvailability();
  modal.classList.add('open'); document.body.classList.add('modal-open');
}
function closeCapturedRecordDetail(){
  document.getElementById('recordDetailModal')?.classList.remove('open');
  TRIPPER_CAMERA_STATE.blob=null; TRIPPER_CAMERA_STATE.previewDataUrl=''; TRIPPER_CAMERA_STATE.editRecordId='';
  document.body.classList.remove('modal-open');
}
function renderCapturedLinkSelectors(dayChanged=false,existingRecord=null){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip(); if(!trip) return;
  const daySelect=document.getElementById('capturedDaySelect'),slotSelect=document.getElementById('capturedSlotSelect');
  const requestedDay=existingRecord?.day || (!dayChanged?(Number(daySelect.value)||suggestCapturedDay(trip,TRIPPER_CAMERA_STATE.capturedAt)):Number(daySelect.value));
  daySelect.innerHTML=trip.days.map(d=>`<option value="${d.day}">DAY ${d.day} · ${formatJP(d.date)}</option>`).join('');
  daySelect.value=trip.days.some(d=>d.day===requestedDay)?String(requestedDay):String(trip.days[0]?.day||1);
  const dayNum=Number(daySelect.value)||1,plan=getActivePlanFromTrip(trip,dayNum);
  const slots=plan?.slots||[];
  slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(slot=>{ const c=selectedCandidate(slot); return `<option value="${slot.id}">${escapeHtml(slotTimeLabel(slot))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`; }).join('');
  const wantedSlot=existingRecord?.slotId || (!dayChanged?(slotSelect.value||suggestCapturedSlot(trip,dayNum,TRIPPER_CAMERA_STATE.capturedAt)):'');
  if(slots.some(s=>s.id===wantedSlot)) slotSelect.value=wantedSlot; else slotSelect.value='';
  syncCapturedPlaceFromSlot(existingRecord?.placeName||''); updateCapturedCoverAvailability();
}
function syncCapturedPlaceFromSlot(forcePlace=''){
  const place=document.getElementById('capturedPlaceName'); if(!place) return;
  if(forcePlace){ place.value=forcePlace; return; }
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value),dayNum=Number(document.getElementById('capturedDaySelect')?.value)||1,plan=getActivePlanFromTrip(trip,dayNum),slot=plan?.slots?.find(s=>s.id===document.getElementById('capturedSlotSelect')?.value),c=selectedCandidate(slot);
  if(c) place.value=c.destination||cleanDisplayName(c.name||'');
}
function updateCapturedCoverAvailability(){
  const slotId=document.getElementById('capturedSlotSelect')?.value||'';
  const row=document.getElementById('capturedCoverRow'),check=document.getElementById('capturedMakeCover');
  if(row) row.classList.toggle('disabled-row',!slotId); if(check){check.disabled=!slotId;if(!slotId)check.checked=false;}
}
async function saveCapturedRecord(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value); if(!trip) return;
  const dayNum=Number(document.getElementById('capturedDaySelect')?.value)||1,day=getDayFromTrip(trip,dayNum),plan=getActivePlanFromTrip(trip,dayNum),slotId=document.getElementById('capturedSlotSelect')?.value||'',slot=plan?.slots?.find(s=>s.id===slotId),c=selectedCandidate(slot);
  const isEdit=!!TRIPPER_CAMERA_STATE.editRecordId;
  let record=isEdit?(trip.records||[]).find(r=>r.id===TRIPPER_CAMERA_STATE.editRecordId):null;
  let mediaKey=record?.mediaKey||'';
  try{
    if(!isEdit){
      if(!TRIPPER_CAMERA_STATE.blob||!TRIPPER_CAMERA_STATE.previewDataUrl||!TRIPPER_CAMERA_STATE.capturedAt){ alert('撮影した写真がありません。'); return; }
      mediaKey=uid('media'); await mediaPut(mediaKey,TRIPPER_CAMERA_STATE.blob);
      record={id:uid('record'),tripId:trip.id,day:dayNum,planId:plan?.id||'',slotId,kind:TRIPPER_CAMERA_STATE.role,mediaType:'image',mediaKey,mimeType:'image/jpeg',previewDataUrl:TRIPPER_CAMERA_STATE.previewDataUrl,comment:'',placeName:'',capturedAt:TRIPPER_CAMERA_STATE.capturedAt,createdAt:new Date().toISOString(),isCover:false,captureSource:'tripper_camera'};
      trip.records=trip.records||[]; trip.records.push(record);
    }
    // capturedAt is deliberately NOT read from the UI and is never reassigned here.
    record.tripId=trip.id; record.day=dayNum; record.planId=plan?.id||''; record.slotId=slotId;
    record.comment=document.getElementById('capturedComment').value.trim();
    record.placeName=document.getElementById('capturedPlaceName').value.trim()||c?.destination||cleanDisplayName(c?.name||'');
    record.captureSource=record.captureSource||'tripper_camera';
    (trip.records||[]).forEach(r=>{ if(r.id!==record.id&&r.day===dayNum&&r.slotId===slotId&&r.isCover) r.isCover=false; });
    record.isCover=!!(slotId&&document.getElementById('capturedMakeCover').checked);
    if(slot){
      if(record.isCover) slot.coverPhoto={dataUrl:record.previewDataUrl,addedAt:new Date().toISOString(),capturedAt:record.capturedAt,name:'Tripper Note Camera'};
      else if(slot.coverPhoto?.capturedAt===record.capturedAt) slot.coverPhoto=null;
    }
    persistAppData(); closeCapturedRecordDetail(); renderAll(); showToast(isEdit?'✓ 記録を更新しました':'✓ 写真をTime Diaryに保存しました');
  }catch(err){ console.warn(err); if(!isEdit&&mediaKey) try{await mediaDelete(mediaKey)}catch(_){} alert('写真を保存できませんでした。端末の空き容量を確認してください。'); }
}
function editCameraRecord(recordId){ openCapturedRecordDetail(recordId); }

function renderRecordScreen(){
  const section=document.getElementById('record'); if(!section) return;
  const trip=getRecordTrip?.()||v254RecentTripForRecord?.()||getHomeTrip()||getTrip();
  const records=(trip?.records||[]).filter(r=>r.captureSource==='tripper_camera').slice().sort((a,b)=>String(b.capturedAt||'').localeCompare(String(a.capturedAt||'')));
  section.innerHTML=`<div class="editorial-page-shell record-camera-only-page">
    <div class="page-intro-row single"><div><div class="page-kicker">RECORD</div><h2 class="section-title no-margin">記録</h2><p class="section-sub">Tripper Noteのカメラで撮った写真だけを、撮影時刻そのままでTime Diaryに残します。</p></div></div>
    ${trip?`<div class="record-hero-card card"><div class="record-hero-top"><div><div class="time">${localDateKey()<trip.startDate?'NEXT JOURNEY':localDateKey()>trip.endDate?'TRIP ARCHIVE':'ON THE ROAD'}</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))} · ${records.length} photos</div></div></div>
      <button class="record-camera-main" onclick="startInAppCamera('entry')">${iconSvg('camera')}<span><strong>写真を撮る</strong><small>Tripper Note内のカメラを起動</small></span></button>
      <div class="record-role-actions camera-only"><button onclick="startInAppCamera('start')"><span>START</span><strong>旅の始まりを撮る</strong></button><button onclick="startInAppCamera('fin')"><span>FIN</span><strong>旅の終わりを撮る</strong></button></div>
    </div>`:'<div class="record-empty">旅行を登録すると、アプリ内カメラからTime Diaryを始められます。</div>'}
    <div class="record-data-link-note"><strong>Camera Only</strong><span>写真ライブラリからの追加・画像アップロードはありません。撮影時刻はシャッターを押した瞬間に固定され、あとから変更できません。</span></div>
    <div class="record-timeline-head"><div><div class="page-kicker">TIME DIARY</div><div class="title">旅のタイムライン</div></div><span class="trip-mini-badge">${records.length} PHOTOS</span></div>
    <div class="record-actual-timeline">${records.length?records.map(record=>{ const link=recordSlotLink?.(record); const cover=!!record.isCover; return `<article class="record-photo-entry ${cover?'is-cover':''}"><div class="record-photo-time"><span>${cameraRoleLabel(record.kind)}</span><strong>${escapeHtml(capturedTimeLabel(record.capturedAt))}</strong></div><div class="record-photo-media"><img src="${record.previewDataUrl}" alt="Tripper Noteで撮影した写真"></div><div class="record-photo-body"><div class="record-linked-slot">${iconSvg('pin')} ${escapeHtml(record.placeName||recordLinkedLabel?.(record)||'場所未設定')}</div>${record.comment?`<div class="record-photo-note">${escapeHtml(record.comment)}</div>`:''}${cover?'<div class="cover-record-badge">代表写真</div>':''}<div class="record-photo-actions"><button class="btn ghost compact-btn" onclick="editCameraRecord('${record.id}')">記録を編集</button>${record.slotId?`<button class="btn secondary compact-btn" onclick="setRecordAsCover('${record.id}')">${cover?'✓ 代表写真':'代表写真にする'}</button>`:''}<button class="btn secondary compact-btn danger-soft" onclick="deleteRecordEntry('${record.id}')">削除</button></div></div></article>`; }).join(''):'<div class="record-empty large">まだ写真がありません。「写真を撮る」からTripper Noteカメラを起動してください。</div>'}</div>
  </div>`;
}


/* =========================================================
   v2.5.7 Photo Linker
   - explicit post-capture linking screen
   - schedule / comment / representative-photo linkage
   - capture time remains immutable
   ========================================================= */
function updateCapturedLinkSummary(){
  const el=document.getElementById('capturedLinkSummary'); if(!el) return;
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value);
  const dayNum=Number(document.getElementById('capturedDaySelect')?.value)||1;
  const plan=getActivePlanFromTrip(trip,dayNum);
  const slotId=document.getElementById('capturedSlotSelect')?.value||'';
  const slot=plan?.slots?.find(s=>s.id===slotId);
  if(!slot){
    el.classList.add('unlinked');
    el.innerHTML='<span>UNLINKED</span><strong>予定に紐付けない</strong><small>写真はTime Diaryには残ります。</small>';
    return;
  }
  const c=selectedCandidate(slot);
  el.classList.remove('unlinked');
  el.innerHTML=`<span>LINKED</span><strong>DAY ${dayNum} · ${escapeHtml(slotTimeLabel(slot))}</strong><small>${escapeHtml(cleanDisplayName(c?.name||'予定'))}${c?.activity?` · ${escapeHtml(c.activity)}`:''}</small>`;
}

function openCapturedRecordDetail(recordId=''){
  const modal=document.getElementById('recordDetailModal'); if(!modal) return;
  let trip=null,record=null;
  if(recordId){
    const found=(APP_DATA.trips||[]).map(t=>({trip:t,record:(t.records||[]).find(r=>r.id===recordId)})).find(x=>x.record);
    if(!found) return;
    trip=found.trip; record=found.record;
    TRIPPER_CAMERA_STATE={stream:null,role:record.kind||'entry',facingMode:'environment',blob:null,previewDataUrl:record.previewDataUrl||'',capturedAt:record.capturedAt||record.createdAt||'',tripId:trip.id,editRecordId:record.id};
  }else{
    trip=recordTripById?.(TRIPPER_CAMERA_STATE.tripId)||getRecordTrip?.()||getHomeTrip()||getTrip();
  }
  if(!trip) return;
  document.getElementById('recordDetailTitle').textContent=recordId?'写真の紐付けを編集':'写真を旅程に紐付ける';
  document.getElementById('capturedRecordPreview').innerHTML=TRIPPER_CAMERA_STATE.previewDataUrl?`<img src="${TRIPPER_CAMERA_STATE.previewDataUrl}" alt="Tripper Noteで撮影した写真">`:'<div class="record-preview-empty">写真がありません</div>';
  document.getElementById('capturedRecordTime').textContent=capturedTimeLabel(TRIPPER_CAMERA_STATE.capturedAt);
  const tripSelect=document.getElementById('capturedTripSelect');
  tripSelect.innerHTML=(APP_DATA.trips||[]).map(t=>`<option value="${t.id}">${escapeHtml(cleanDisplayName(t.title))}</option>`).join('');
  tripSelect.value=trip.id;
  tripSelect.disabled=!!recordId;
  document.getElementById('capturedComment').value=record?.comment||record?.note||'';
  document.getElementById('capturedPlaceName').value=record?.placeName||'';
  renderCapturedLinkSelectors(false,record);
  document.getElementById('capturedMakeCover').checked=record?!!record.isCover:false;
  updateCapturedCoverAvailability();
  updateCapturedLinkSummary();
  modal.classList.add('open');
  document.body.classList.add('modal-open');
}

function renderCapturedLinkSelectors(dayChanged=false,existingRecord=null){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip(); if(!trip) return;
  const daySelect=document.getElementById('capturedDaySelect'),slotSelect=document.getElementById('capturedSlotSelect');
  const requestedDay=existingRecord?.day || (!dayChanged?(Number(daySelect.value)||suggestCapturedDay(trip,TRIPPER_CAMERA_STATE.capturedAt)):Number(daySelect.value));
  daySelect.innerHTML=trip.days.map(d=>`<option value="${d.day}">DAY ${d.day} · ${formatJP(d.date)}</option>`).join('');
  daySelect.value=trip.days.some(d=>d.day===requestedDay)?String(requestedDay):String(trip.days[0]?.day||1);
  const dayNum=Number(daySelect.value)||1,plan=getActivePlanFromTrip(trip,dayNum);
  const slots=plan?.slots||[];
  slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(slot=>{ const c=selectedCandidate(slot); return `<option value="${slot.id}">${escapeHtml(slotTimeLabel(slot))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`; }).join('');
  const wantedSlot=existingRecord?.slotId || (!dayChanged?(slotSelect.value||suggestCapturedSlot(trip,dayNum,TRIPPER_CAMERA_STATE.capturedAt)):'');
  slotSelect.value=slots.some(s=>s.id===wantedSlot)?wantedSlot:'';
  syncCapturedPlaceFromSlot(existingRecord?.placeName||'');
  updateCapturedCoverAvailability();
  updateCapturedLinkSummary();
}

function updateCapturedCoverAvailability(){
  const slotId=document.getElementById('capturedSlotSelect')?.value||'';
  const row=document.getElementById('capturedCoverRow'),check=document.getElementById('capturedMakeCover');
  if(row) row.classList.toggle('disabled-row',!slotId);
  if(check){ check.disabled=!slotId; if(!slotId) check.checked=false; }
  updateCapturedLinkSummary();
}

function v257FindSlot(trip,dayNum,planId,slotId){
  const day=getDayFromTrip(trip,dayNum); if(!day) return null;
  const plan=(day.plans||[]).find(p=>p.id===planId)||getActivePlanFromTrip(trip,dayNum);
  return plan?.slots?.find(s=>s.id===slotId)||null;
}
function v257ClearCoverIfOwned(slot,record){
  if(!slot||!record) return;
  const cp=slot.coverPhoto;
  if(cp && (cp.capturedAt===record.capturedAt || cp.dataUrl===record.previewDataUrl)) slot.coverPhoto=null;
}

async function saveCapturedRecord(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value); if(!trip) return;
  const dayNum=Number(document.getElementById('capturedDaySelect')?.value)||1;
  const plan=getActivePlanFromTrip(trip,dayNum);
  const slotId=document.getElementById('capturedSlotSelect')?.value||'';
  const slot=plan?.slots?.find(s=>s.id===slotId)||null;
  const c=selectedCandidate(slot);
  const isEdit=!!TRIPPER_CAMERA_STATE.editRecordId;
  let record=isEdit?(trip.records||[]).find(r=>r.id===TRIPPER_CAMERA_STATE.editRecordId):null;
  let mediaKey=record?.mediaKey||'';
  const oldLink=record?{day:record.day,planId:record.planId,slotId:record.slotId,isCover:!!record.isCover}:null;
  const oldSlot=oldLink?.slotId?v257FindSlot(trip,oldLink.day,oldLink.planId,oldLink.slotId):null;
  try{
    if(!isEdit){
      if(!TRIPPER_CAMERA_STATE.blob||!TRIPPER_CAMERA_STATE.previewDataUrl||!TRIPPER_CAMERA_STATE.capturedAt){ alert('撮影した写真がありません。'); return; }
      mediaKey=uid('media'); await mediaPut(mediaKey,TRIPPER_CAMERA_STATE.blob);
      record={id:uid('record'),tripId:trip.id,day:dayNum,planId:plan?.id||'',slotId,kind:TRIPPER_CAMERA_STATE.role,mediaType:'image',mediaKey,mimeType:'image/jpeg',previewDataUrl:TRIPPER_CAMERA_STATE.previewDataUrl,comment:'',placeName:'',capturedAt:TRIPPER_CAMERA_STATE.capturedAt,createdAt:new Date().toISOString(),isCover:false,captureSource:'tripper_camera'};
      trip.records=trip.records||[];
      trip.records.push(record);
    }

    // capturedAt is never read from form controls. It remains the shutter timestamp.
    const wantsCover=!!(slotId&&document.getElementById('capturedMakeCover').checked);
    if(oldLink?.isCover && (oldLink.day!==dayNum || oldLink.planId!==(plan?.id||'') || oldLink.slotId!==slotId || !wantsCover)){
      v257ClearCoverIfOwned(oldSlot,record);
    }

    record.tripId=trip.id;
    record.day=dayNum;
    record.planId=plan?.id||'';
    record.slotId=slotId;
    record.comment=document.getElementById('capturedComment').value.trim();
    record.placeName=document.getElementById('capturedPlaceName').value.trim()||c?.destination||cleanDisplayName(c?.name||'');
    record.captureSource='tripper_camera';

    if(wantsCover){
      (trip.records||[]).forEach(r=>{
        if(r.id!==record.id&&r.day===dayNum&&r.slotId===slotId&&r.isCover) r.isCover=false;
      });
      record.isCover=true;
      if(slot) slot.coverPhoto={dataUrl:record.previewDataUrl,addedAt:new Date().toISOString(),capturedAt:record.capturedAt,name:'Tripper Note Camera'};
    }else{
      record.isCover=false;
      if(slot) v257ClearCoverIfOwned(slot,record);
    }

    persistAppData();
    closeCapturedRecordDetail();
    renderAll();
    showToast(isEdit?'✓ 紐付けを更新しました':'✓ 写真をTime Diaryに保存しました');
  }catch(err){
    console.warn(err);
    if(!isEdit&&mediaKey) try{ await mediaDelete(mediaKey); }catch(_){}
    alert('写真を保存できませんでした。端末の空き容量を確認してください。');
  }
}

function v257PhotoCount(n){ return n===1?'1 PHOTO':`${n} PHOTOS`; }
function renderRecordScreen(){
  const section=document.getElementById('record'); if(!section) return;
  const trip=getRecordTrip?.()||v254RecentTripForRecord?.()||getHomeTrip()||getTrip();
  const records=(trip?.records||[]).filter(r=>r.captureSource==='tripper_camera').slice().sort((a,b)=>String(b.capturedAt||'').localeCompare(String(a.capturedAt||'')));
  section.innerHTML=`<div class="editorial-page-shell record-camera-only-page">
    <div class="page-intro-row single"><div><div class="page-kicker">RECORD</div><h2 class="section-title no-margin">記録</h2><p class="section-sub">Tripper Noteのカメラで撮影し、予定・感想・代表写真までひと続きでTime Diaryに残します。</p></div></div>
    ${trip?`<div class="record-hero-card card"><div class="record-hero-top"><div><div class="time">${localDateKey()<trip.startDate?'NEXT JOURNEY':localDateKey()>trip.endDate?'TRIP ARCHIVE':'ON THE ROAD'}</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))} · ${v257PhotoCount(records.length)}</div></div></div>
      <button class="record-camera-main" onclick="startInAppCamera('entry')">${iconSvg('camera')}<span><strong>写真を撮る</strong><small>撮影後に予定・感想・代表写真を設定</small></span></button>
      <div class="record-role-actions camera-only"><button onclick="startInAppCamera('start')"><span>START</span><strong>旅の始まりを撮る</strong></button><button onclick="startInAppCamera('fin')"><span>FIN</span><strong>旅の終わりを撮る</strong></button></div>
    </div>`:'<div class="record-empty">旅行を登録すると、アプリ内カメラからTime Diaryを始められます。</div>'}
    <div class="record-data-link-note"><strong>Camera Only</strong><span>撮影日時はシャッターを押した瞬間で固定。写真ライブラリからの追加・画像アップロードはありません。</span></div>
    <div class="record-timeline-head"><div><div class="page-kicker">TIME DIARY</div><div class="title">旅のタイムライン</div></div><span class="trip-mini-badge">${v257PhotoCount(records.length)}</span></div>
    <div class="record-actual-timeline">${records.length?records.map(record=>{ const cover=!!record.isCover; const linked=!!record.slotId; return `<article class="record-photo-entry ${cover?'is-cover':''}"><div class="record-photo-time"><span>${cameraRoleLabel(record.kind)}</span><strong>${escapeHtml(capturedTimeLabel(record.capturedAt))}</strong></div><div class="record-photo-media"><img src="${record.previewDataUrl}" alt="Tripper Noteで撮影した写真"></div><div class="record-photo-body"><div class="record-linked-slot">${iconSvg('pin')} ${escapeHtml(record.placeName||recordLinkedLabel?.(record)||'場所未設定')}</div><div class="record-link-status ${linked?'linked':'unlinked'}">${linked?'旅程に紐付け済み':'予定に未紐付け'}</div>${record.comment?`<div class="record-photo-note">${escapeHtml(record.comment)}</div>`:''}${cover?'<div class="cover-record-badge">代表写真</div>':''}<div class="record-photo-actions"><button class="btn ghost compact-btn" onclick="editCameraRecord('${record.id}')">予定・感想を編集</button>${record.slotId?`<button class="btn secondary compact-btn" onclick="setRecordAsCover('${record.id}')">${cover?'✓ 代表写真':'代表写真にする'}</button>`:''}<button class="btn secondary compact-btn danger-soft" onclick="deleteRecordEntry('${record.id}')">削除</button></div></div></article>`; }).join(''):'<div class="record-empty large">まだ写真がありません。「写真を撮る」からTripper Noteカメラを起動してください。</div>'}</div>
  </div>`;
}

/* =========================================================
   v2.5.8-A Stability Hotfix
   A-01 data protection
   A-02 photo quality / full-quality hydration
   A-03 truthful storage errors
   A-04 non-mirrored front-camera saves
   A-05 location refresh overwrite
   A-06 true random candidate shuffle
   A-07 candidate-stack count hardening
   A-08 dock hydration hook (layout in CSS)
   ========================================================= */
const V258A_VERSION='2.5.8-A';
const V258A_BACKUP_KEY='tripperNoteBackupBeforeV258A';
const V258A_MEDIA_URLS=new Set();

function ensureV258ABackup(){
  /* A.2: keep the safety backup, but move it out of localStorage so it cannot
     consume the same small WebView quota as the live planner document. */
  try{
    const legacyKey=typeof V258A_LEGACY_BACKUP_KEY!=='undefined'?V258A_LEGACY_BACKUP_KEY:V258A_BACKUP_KEY;
    const existingLocal=localStorage.getItem(legacyKey);
    const liveRaw=localStorage.getItem(typeof STORAGE_KEY_V25!=='undefined'?STORAGE_KEY_V25:'tripperNoteDataV25');
    const raw=existingLocal||liveRaw;
    if(!raw) return;
    if(typeof coreWriteBackupOnce==='function'){
      coreWriteBackupOnce('pre-v258a-localstorage',raw).then(()=>{
        try{ if(localStorage.getItem(legacyKey)!==null) localStorage.removeItem(legacyKey); }catch(_e){}
      }).catch(err=>console.warn('v2.5.8-A Core DB backup skipped',err));
    }
  }catch(err){ console.warn('v2.5.8-A backup skipped',err); }
}

function v258AStorageErrorName(err){ return String(err?.name||err?.constructor?.name||'Error'); }
async function v258AStorageErrorMessage(err){
  const name=v258AStorageErrorName(err);
  const detail=String(err?.message||'').trim();
  if(name==='QuotaExceededError'){
    const estimate=typeof mediaStorageEstimate==='function'?await mediaStorageEstimate():null;
    if(estimate?.quota){
      const mb=n=>Math.round(n/1024/1024);
      return `写真を保存できませんでした。iPhone本体の空き容量ではなく、Tripper Noteに割り当てられた保存領域の上限に達した可能性があります。\n\n使用量 約${mb(estimate.usage)}MB / 上限 約${mb(estimate.quota)}MB`;
    }
    return '写真を保存できませんでした。iPhone本体の空き容量ではなく、Tripper Noteに割り当てられた保存領域の上限に達した可能性があります。';
  }
  if(name==='NotAllowedError'||name==='SecurityError') return '写真の保存領域へアクセスできませんでした。アプリを一度終了して再起動し、もう一度お試しください。';
  if(name==='InvalidStateError'||name==='AbortError') return '写真の保存処理が途中で中断されました。数秒待ってから、もう一度保存してください。';
  return `写真を保存できませんでした。空き容量不足とは限りません。\n\nエラー: ${name}${detail?`\n${detail}`:''}`;
}

function v258ARevokeMediaUrls(){
  V258A_MEDIA_URLS.forEach(url=>{ try{URL.revokeObjectURL(url)}catch(_e){} });
  V258A_MEDIA_URLS.clear();
}
async function hydrateV258AFullQualityMedia(root=document){
  const imageEls=[...root.querySelectorAll('img[data-v258-media-key]')];
  const coverEls=[...root.querySelectorAll('[data-v258-cover-key]')];
  for(const el of imageEls){
    if(el.dataset.v258Hydrated==='1') continue;
    const key=el.dataset.v258MediaKey; if(!key) continue;
    try{
      const blob=await mediaGet(key); if(!blob) continue;
      const url=URL.createObjectURL(blob); V258A_MEDIA_URLS.add(url);
      el.src=url; el.dataset.v258Hydrated='1';
    }catch(err){ console.warn('v2.5.8-A full photo hydrate failed',err); }
  }
  for(const el of coverEls){
    if(el.dataset.v258CoverHydrated==='1') continue;
    const key=el.dataset.v258CoverKey; if(!key) continue;
    try{
      const blob=await mediaGet(key); if(!blob) continue;
      const url=URL.createObjectURL(blob); V258A_MEDIA_URLS.add(url);
      el.style.setProperty('--slot-cover-photo',`url("${url}")`);
      el.dataset.v258CoverHydrated='1';
    }catch(err){ console.warn('v2.5.8-A cover hydrate failed',err); }
  }
}

/* A-02: ask WebKit for a higher-resolution stream where the device permits it. */
async function openTripperCameraStream(){
  const loading=document.getElementById('cameraLoading');
  const video=document.getElementById('recordCameraVideo');
  if(loading){ loading.textContent='カメラを起動しています…'; loading.classList.remove('hidden'); }
  stopTripperCameraStream();
  if(!navigator.mediaDevices?.getUserMedia){
    if(loading) loading.textContent='この端末ではアプリ内カメラを利用できません。';
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode:{ideal:TRIPPER_CAMERA_STATE.facingMode},
        width:{ideal:3840},height:{ideal:2880},aspectRatio:{ideal:4/3},frameRate:{ideal:30,max:30}
      }
    });
    TRIPPER_CAMERA_STATE.stream=stream;
    if(video){ video.srcObject=stream; await video.play(); }
    if(loading) loading.classList.add('hidden');
    const label=document.getElementById('cameraFacingLabel');
    if(label) label.textContent=TRIPPER_CAMERA_STATE.facingMode==='environment'?'背面カメラ':'前面カメラ';
  }catch(err){
    console.warn('camera open failed',err);
    if(loading) loading.textContent='カメラを起動できません。iPhoneの設定でカメラ権限を確認してください。';
  }
}

/* A-02 + A-04: higher quality JPEG, small metadata thumbnail, never mirror the saved front-camera photo. */
async function captureInAppPhoto(){
  const video=document.getElementById('recordCameraVideo');
  if(!video||!video.videoWidth||!video.videoHeight){ showToast('カメラの準備中です'); return; }
  const capturedAt=new Date().toISOString();
  try{
    const maxSide=3200;
    const scale=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
    canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    // Intentionally no scaleX(-1): saved image keeps the camera's real orientation.
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const blob=await canvasToBlob(canvas,'image/jpeg',.94);

    // Keep localStorage light. Full quality stays in IndexedDB and is hydrated for display.
    const previewMax=960,ps=Math.min(1,previewMax/Math.max(canvas.width,canvas.height));
    const pc=document.createElement('canvas');
    pc.width=Math.max(1,Math.round(canvas.width*ps)); pc.height=Math.max(1,Math.round(canvas.height*ps));
    const pctx=pc.getContext('2d',{alpha:false}); pctx.imageSmoothingEnabled=true; pctx.imageSmoothingQuality='high';
    pctx.drawImage(canvas,0,0,pc.width,pc.height);

    TRIPPER_CAMERA_STATE.blob=blob;
    TRIPPER_CAMERA_STATE.previewDataUrl=pc.toDataURL('image/jpeg',.80);
    TRIPPER_CAMERA_STATE.capturedAt=capturedAt;
    stopTripperCameraStream();
    document.getElementById('recordCameraModal')?.classList.remove('open');
    openCapturedRecordDetail();
  }catch(err){ console.warn(err); alert('写真を撮影できませんでした。もう一度お試しください。'); }
}

/* A-05: explicit refresh means replace stale address/coordinates instead of retaining them. */
async function autoFillCandidateCoords(){
  const url=document.getElementById('candidateMaps').value.trim();
  const dest=document.getElementById('candidateDestination').value.trim();
  const name=document.getElementById('candidateName').value.trim();
  const previousAddress=document.getElementById('candidateAddress').value.trim();
  const hint=document.getElementById('coordHint');
  hint.textContent='位置情報を更新しています…'; hint.className='coord-hint';

  // An explicit refresh must never silently keep the old destination coordinates.
  document.getElementById('candidateAddress').value='';
  document.getElementById('candidateLat').value='';
  document.getElementById('candidateLon').value='';

  let point=extractCoordinatesFromMapsUrl(url);
  if(!point){
    const known=findNavPoint(dest||name);
    if(known) point={lat:known.lat,lon:known.lon,address:known.address||'',name:known.name||dest||name};
  }
  if(!point){
    // Prefer the newly-entered place name. Only fall back to the old address when no name exists.
    point=await resolvePlaceWithNativeSearch({destination:dest,name,address:(dest||name)?'':previousAddress,googleMapsUrl:url});
  }

  if(point){
    document.getElementById('candidateLat').value=point.lat;
    document.getElementById('candidateLon').value=point.lon;
    document.getElementById('candidateAddress').value=point.address||'';
    hint.textContent='✓ 新しい位置情報で住所・緯度・経度を更新しました'; hint.className='coord-hint ok';
  }else{
    hint.textContent=nativePlaceResolverAvailable()
      ?'新しい場所を特定できませんでした。古い住所・緯度経度は誤ナビ防止のためクリアしました。施設名を具体的にして再度取得してください。'
      :'Macのブラウザでは施設名検索は使えません。iPhone実機ではMapKit検索を利用できます。';
    hint.className='coord-hint warn';
  }
}

/* A-06: current selection remains in the lottery. Two options are truly 1/2 each. */
function shuffleCurrentSlot(){
  const slot=candidateSlot(); if(!slot||slot.candidates.length<2) return;
  const picked=slot.candidates[Math.floor(Math.random()*slot.candidates.length)];
  if(!picked) return;
  slot.selectedCandidateId=picked.id;
  if(candidateContext.source==='app'){
    persistAppData(); renderTripDetail(); renderHome(); renderCandidateModal();
  }else{
    renderPlanEditor(); renderCandidateModal();
  }
  showToast(`「${cleanDisplayName(picked.name)}」を選びました`);
}

function v258ACoverRecord(trip,slot,dayNum){
  return (trip?.records||[]).find(r=>r.mediaType==='image'&&r.isCover&&r.slotId===slot?.id&&Number(r.day)===Number(dayNum))||null;
}

/* A-07 + A-02: strict stack count and high-quality representative-photo hydration. */
function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip(),c=selectedCandidate(slot);
  const count=Array.isArray(slot?.candidates)?slot.candidates.length:0;
  const hasStack=count>=2;
  const status=slotStatus(trip,dayNum,slot);
  const coverRecord=v258ACoverRecord(trip,slot,dayNum);
  const fallbackCover=slot?.coverPhoto?.dataUrl||coverRecord?.previewDataUrl||'';
  const coverKey=coverRecord?.mediaKey||slot?.coverPhoto?.mediaKey||'';
  const hasCover=status==='completed'&&!!(fallbackCover||coverKey);
  const actionButtons=[];
  if(c?.transportMode!=='none') actionButtons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
  if(c?.destination||c?.address||c?.googleMapsUrl||c?.name) actionButtons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
  const stackButton=hasStack
    ? `<button class="candidate-stack-hit v258-stack" data-candidate-count="${count}" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app')" aria-label="${count}件の候補を表示"><span>${count}</span></button>`
    : `<button class="candidate-add-mini" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app',true)">＋候補</button>`;
  const coverStyle=hasCover&&fallbackCover?` style="--slot-cover-photo:url('${fallbackCover}')"`:'';
  const coverAttr=hasCover&&coverKey?` data-v258-cover-key="${escapeHtml(coverKey)}"`:'';
  const stateLabel=status==='completed'?'完了':status==='active'?'進行中':'予定';
  return `<div class="slot-wrap ${hasStack?'has-stack':''}" data-candidate-count="${count}"><div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}${coverAttr}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="slot-meta-row"><div class="slot-meta-left"><span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>${hasStack?`<span class="slot-option-chip">${count} OPTIONS</span>`:''}${coverRecord?'<span class="slot-record-chip">PHOTO</span>':''}</div><span class="slot-state-badge ${status}">${stateLabel}</span></div><div class="title">${escapeHtml(cleanDisplayName(c?.name||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:''}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${actionButtons.length?`<div class="actions ${actionButtons.length===1?'one':''}">${actionButtons.join('')}</div>`:''}</div>${stackButton}</div></div>`;
}

/* A-03 + A-02: use mediaKey for the representative photo and report the real failure class. */
async function saveCapturedRecord(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value); if(!trip) return;
  const dayNum=Number(document.getElementById('capturedDaySelect')?.value)||1;
  const plan=getActivePlanFromTrip(trip,dayNum);
  const slotId=document.getElementById('capturedSlotSelect')?.value||'';
  const slot=plan?.slots?.find(s=>s.id===slotId)||null;
  const c=selectedCandidate(slot);
  const isEdit=!!TRIPPER_CAMERA_STATE.editRecordId;
  let record=isEdit?(trip.records||[]).find(r=>r.id===TRIPPER_CAMERA_STATE.editRecordId):null;
  let mediaKey=record?.mediaKey||'';
  const oldLink=record?{day:record.day,planId:record.planId,slotId:record.slotId,isCover:!!record.isCover}:null;
  const oldSlot=oldLink?.slotId?v257FindSlot(trip,oldLink.day,oldLink.planId,oldLink.slotId):null;
  try{
    if(!isEdit){
      if(!TRIPPER_CAMERA_STATE.blob||!TRIPPER_CAMERA_STATE.previewDataUrl||!TRIPPER_CAMERA_STATE.capturedAt){ alert('撮影した写真がありません。'); return; }
      mediaKey=uid('media');
      await mediaPut(mediaKey,TRIPPER_CAMERA_STATE.blob);
      record={id:uid('record'),tripId:trip.id,day:dayNum,planId:plan?.id||'',slotId,kind:TRIPPER_CAMERA_STATE.role,mediaType:'image',mediaKey,mimeType:'image/jpeg',previewDataUrl:TRIPPER_CAMERA_STATE.previewDataUrl,comment:'',placeName:'',capturedAt:TRIPPER_CAMERA_STATE.capturedAt,createdAt:new Date().toISOString(),isCover:false,captureSource:'tripper_camera'};
      trip.records=trip.records||[]; trip.records.push(record);
    }

    const wantsCover=!!(slotId&&document.getElementById('capturedMakeCover').checked);
    if(oldLink?.isCover && (oldLink.day!==dayNum || oldLink.planId!==(plan?.id||'') || oldLink.slotId!==slotId || !wantsCover)) v257ClearCoverIfOwned(oldSlot,record);

    record.tripId=trip.id; record.day=dayNum; record.planId=plan?.id||''; record.slotId=slotId;
    record.comment=document.getElementById('capturedComment').value.trim();
    record.placeName=document.getElementById('capturedPlaceName').value.trim()||c?.destination||cleanDisplayName(c?.name||'');
    record.captureSource='tripper_camera';

    if(wantsCover){
      (trip.records||[]).forEach(r=>{ if(r.id!==record.id&&r.day===dayNum&&r.slotId===slotId&&r.isCover) r.isCover=false; });
      record.isCover=true;
      if(slot) slot.coverPhoto={dataUrl:'',mediaKey:record.mediaKey||'',recordId:record.id,addedAt:new Date().toISOString(),capturedAt:record.capturedAt,name:'Tripper Note Camera'};
    }else{
      record.isCover=false;
      if(slot) v257ClearCoverIfOwned(slot,record);
    }

    persistAppData();
    closeCapturedRecordDetail(); renderAll();
    showToast(isEdit?'✓ 紐付けを更新しました':'✓ 写真をTime Diaryに保存しました');
  }catch(err){
    console.warn('v2.5.8-A photo save failed',err);
    if(!isEdit&&mediaKey) try{ await mediaDelete(mediaKey); }catch(_e){}
    alert(await v258AStorageErrorMessage(err));
  }
}

/* Full-quality timeline rendering: thumbnail first, then IndexedDB original. */
function b1TimelineIsoTime(iso){
  if(!iso) return '';
  const d=new Date(iso); if(Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function b1TimelineStatusLabel(status){
  return ({active:'NOW',extended:'延長中',completed:'完了',skipped:'スキップ',upcoming:'予定'})[status]||'予定';
}
function b1RecordKind(record){
  return record?.kind||record?.role||'entry';
}
function b1RecordIsImage(record){
  return record?.mediaType==='image'||!!record?.previewDataUrl||!!record?.dataUrl;
}
function b1RecordSortAt(record){
  const raw=record?.capturedAt||record?.createdAt||'';
  const t=raw?new Date(raw).getTime():NaN;
  return Number.isFinite(t)?t:0;
}
function b1RecordDayNumber(trip,record){
  const explicit=Number(record?.day);
  if(Number.isInteger(explicit)&&trip?.days?.some(d=>d.day===explicit)) return explicit;
  const raw=record?.capturedAt||record?.createdAt;
  if(raw){
    const d=new Date(raw);
    if(!Number.isNaN(d.getTime())){
      const key=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const found=trip?.days?.find(day=>day.date===key); if(found) return found.day;
    }
  }
  return trip?.days?.[0]?.day||1;
}
function b1RecordMatchesSchedule(record,day,plan,slot){
  if(!record||!slot) return false;
  if(String(record.slotId||'')!==String(slot.id)) return false;
  const recordDay=Number(record.day);
  if(recordDay&&recordDay!==Number(day.day)) return false;
  if(record.planId&&String(record.planId)!==String(plan.id)) return false;
  return true;
}

/* =========================================================
   v2.6.0-B.2 Phase 4B.2 Schedule Progression Core
   Text facts stay strict: createdAt is immutable; timelineTime
   defaults to now and may only be moved up to 30 min earlier.
   ========================================================= */
function b2CoreBlocks(){
  APP_DATA.coreV21=APP_DATA.coreV21||{};
  APP_DATA.coreV21.blocks=Array.isArray(APP_DATA.coreV21.blocks)?APP_DATA.coreV21.blocks:[];
  return APP_DATA.coreV21.blocks;
}
function b2TripTextBlocks(trip){
  return b2CoreBlocks().filter(block=>block?.type==='text'&&String(block.tripId||'')===String(trip?.id||''));
}
function b2BlockSortAt(block){
  const raw=block?.timelineTime||block?.createdAt||'';
  const t=raw?new Date(raw).getTime():NaN;
  return Number.isFinite(t)?t:0;
}
function b2DayNumberForTime(trip,iso){
  const d=new Date(iso||'');
  if(Number.isNaN(d.getTime())) return null;
  const key=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return trip?.days?.find(day=>day.date===key)?.day||null;
}
function b2FindActiveScheduleRef(trip,now=new Date()){
  const today=localDateKey(now);
  const day=trip?.days?.find(d=>d.date===today); if(!day) return null;
  const plan=getActivePlanFromTrip(trip,day.day); if(!plan) return null;
  const candidates=(plan.slots||[]).filter(slot=>{
    const status=slot?.v21?.status||slotStatus(trip,day.day,slot,now);
    return status==='active'||status==='extended';
  }).sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  const slot=candidates[0];
  return slot?{day:day.day,planId:plan.id,slotId:slot.id}:null;
}
function b2CanQuickRecordNow(trip,now=new Date()){
  if(!trip) return {ok:false,phase:'none',message:'旅行を選択してください。'};
  const today=localDateKey(now);
  if(today<trip.startDate) return {ok:false,phase:'before',message:'この旅行はまだ始まっていないため、今の記録は追加できません。'};
  if(today>trip.endDate) return {ok:false,phase:'after',message:'この旅行は終了しているため、今の記録は追加できません。'};
  return {ok:true,phase:'during'};
}
function b2QuickTextInput(){ return document.getElementById('b2QuickTextInput'); }
function b2SyncQuickSendState(){
  const input=b2QuickTextInput(),button=document.getElementById('b2QuickSend');
  if(button) button.disabled=!input?.value?.trim();
}
function b2SubmitQuickText(){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip();
  const input=b2QuickTextInput(); const text=input?.value?.trim()||'';
  if(!text) return;
  const eligibility=b2CanQuickRecordNow(trip,new Date());
  if(!eligibility.ok){ showToast(eligibility.message); return; }
  const now=new Date(); const iso=now.toISOString(); const ref=b2FindActiveScheduleRef(trip,now);
  const block={
    id:uid('text'),tripId:trip.id,type:'text',text,createdAt:iso,timelineTime:iso,
    day:b2DayNumberForTime(trip,iso),scheduleRef:ref?{...ref}:null,
    displaySettings:{showTime:true},sortOrder:Date.now()
  };
  b2CoreBlocks().push(block);
  persistAppData();
  if(input) input.value='';
  renderRecordScreen();
  showToast(ref?'✓ 今の予定にメモを追加しました':'✓ 寄り道にメモを追加しました');
}
function b2QuickTextKeydown(event){
  if(event.key==='Enter'&&!event.shiftKey){ event.preventDefault(); b2SubmitQuickText(); }
}
function b2OpenQuickAddMenu(){
  showToast('＋メニュー：写真・動画Import / Free Canvas / Mapは後続Phaseで追加します');
}
function b2TimelineTimeMin(block){
  const created=new Date(block?.createdAt||'');
  if(Number.isNaN(created.getTime())) return '';
  return new Date(created.getTime()-30*60000).toISOString();
}
function b2EditTextBlock(blockId){
  const block=b2CoreBlocks().find(x=>x.id===blockId&&x.type==='text'); if(!block) return;
  const currentText=block.text||'';
  const next=prompt('テキストを編集',currentText);
  if(next===null) return;
  const trimmed=next.trim();
  if(!trimmed){ showToast('空のテキストは保存できません'); return; }
  block.text=trimmed;
  persistAppData(); renderRecordScreen(); showToast('✓ テキストを更新しました');
}
/* B.3.4: keep exact timestamps separate from the minute-only picker labels.
   Draft selection never touches the Block or the storage layer. */
let B34_TEXT_TIME_PICKER=null;
function b34BuildTextTimeOptions(block){
  const createdMs=new Date(block?.createdAt||'').getTime();
  if(!Number.isFinite(createdMs)) return [];
  const currentMs=new Date(block.timelineTime||block.createdAt).getTime();
  const options=Array.from({length:31},(_,minutesAgo)=>({timestamp:createdMs-minutesAgo*60000,minutesAgo,current:false}));
  if(Number.isFinite(currentMs)&&currentMs>=createdMs-1800000&&currentMs<=createdMs){
    const current=options.find(option=>option.timestamp===currentMs);
    if(current) current.current=true;
    else options.push({timestamp:currentMs,minutesAgo:null,current:true});
  }
  return options.sort((a,b)=>b.timestamp-a.timestamp);
}
function b34SameScheduleRef(a,b){
  if(!a||!b) return !a&&!b;
  return Number(a.day)===Number(b.day)&&String(a.planId||'')===String(b.planId||'')&&String(a.slotId||'')===String(b.slotId||'');
}
function b34TextTimeContext(block,activeRef){
  return JSON.stringify({tripId:block.tripId,createdAt:block.createdAt,timelineTime:block.timelineTime,
    day:block.day,scheduleRef:block.scheduleRef,
    active:activeRef?{day:activeRef.day,planId:activeRef.planId,slotId:activeRef.slotId,actualStartAt:activeRef.actualStartAt}:null});
}
function b2EditTextTime(blockId){
  const block=(APP_DATA.coreV21?.blocks||[]).find(x=>x.id===blockId&&x.type==='text');
  if(!block){ showToast('対象のテキストが見つかりません。記録を確認してください',4000); return; }
  const options=b34BuildTextTimeOptions(block);
  if(!options.length){ showToast('作成時刻を確認できないため、時刻を編集できません',4000); return; }
  const trip=(APP_DATA.trips||[]).find(t=>t.id===block.tripId);
  if(!trip){ showToast('対象の旅行が見つかりません。記録を確認してください',4000); return; }
  const activeRef=b31ActiveScheduleRef(trip);
  const sheet=document.getElementById('b34TextTimeSheet');
  const list=document.getElementById('b34TextTimeOptions');
  const selected=options.find(option=>option.current);
  B34_TEXT_TIME_PICKER={blockId,options,selectedMs:selected?.timestamp??null,
    context:b34TextTimeContext(block,activeRef),returnFocus:document.activeElement};
  const created=new Date(block.createdAt);
  list.innerHTML=options.map((option,index)=>{
    const date=new Date(option.timestamp);
    const label=`${localDateKey(date)!==localDateKey(created)?'前日 ':''}${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const relative=option.minutesAgo===0?'作成時刻':option.minutesAgo===null?'':`${option.minutesAgo}分前`;
    const detail=[relative,option.current?'現在の設定':''].filter(Boolean).join(' · ');
    return `<button type="button" class="b34-time-option" data-option-index="${index}" aria-pressed="${option===selected}" onclick="b34SelectTextTime(${index})"><span class="b34-time-label">${escapeHtml(label)}</span><span class="b34-time-detail">${escapeHtml(detail)}</span><span class="b34-time-check" aria-hidden="true">✓</span></button>`;
  }).join('');
  document.getElementById('b34TextTimeSave').disabled=!selected;
  sheet.hidden=false;
  document.body.classList.add('b34-time-picker-open');
  const focusTarget=list.querySelector('[aria-pressed="true"]')||list.querySelector('button');
  focusTarget?.focus({preventScroll:true});
  if(focusTarget) list.scrollTop=Math.max(0,focusTarget.offsetTop-list.clientHeight/2+focusTarget.offsetHeight/2);
}
function b34SelectTextTime(index){
  const state=B34_TEXT_TIME_PICKER;
  const option=state?.options[index]; if(!option) return;
  state.selectedMs=option.timestamp;
  document.querySelectorAll('#b34TextTimeOptions button').forEach(button=>{
    button.setAttribute('aria-pressed',String(Number(button.dataset.optionIndex)===index));
  });
  document.getElementById('b34TextTimeSave').disabled=false;
}
function b34CloseTextTimePicker(){
  const returnFocus=B34_TEXT_TIME_PICKER?.returnFocus;
  B34_TEXT_TIME_PICKER=null;
  document.getElementById('b34TextTimeSheet').hidden=true;
  document.body.classList.remove('b34-time-picker-open');
  if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
}
function b34TextTimeKeydown(event){
  if(event.key==='Escape'){ event.preventDefault(); b34CloseTextTimePicker(); return; }
  if(event.key!=='Tab') return;
  const buttons=Array.from(document.querySelectorAll('#b34TextTimeSheet button:not(:disabled)'));
  const first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey&&document.activeElement===first){ event.preventDefault(); last?.focus(); }
  else if(!event.shiftKey&&document.activeElement===last){ event.preventDefault(); first?.focus(); }
}
function b34SaveTextTime(){
  const state=B34_TEXT_TIME_PICKER; if(!state) return;
  const block=(APP_DATA.coreV21?.blocks||[]).find(x=>x.id===state.blockId&&x.type==='text');
  if(!block){ showToast('対象のテキストが見つかりません。記録を確認してください',4000); return; }
  const createdMs=new Date(block.createdAt||'').getTime(),selectedMs=state.selectedMs;
  if(!Number.isFinite(createdMs)||!Number.isFinite(selectedMs)){
    showToast('時刻を確認してください',4000); return;
  }
  /* Validate independently of the displayed options, using the original precision. */
  if(selectedMs<createdMs-1800000||selectedMs>createdMs){
    showToast('テキスト時刻は作成時刻から過去30分以内で設定できます',4000); return;
  }
  const trip=(APP_DATA.trips||[]).find(t=>t.id===block.tripId);
  if(!trip){ showToast('対象の旅行が見つかりません。記録を確認してください',4000); return; }
  const activeRef=b31ActiveScheduleRef(trip);
  if(state.context!==b34TextTimeContext(block,activeRef)){
    showToast('予定の進行状態または記録が変わりました。キャンセルして時刻を開き直してください',4000); return;
  }
  const keepActive=!!block.scheduleRef&&b34SameScheduleRef(block.scheduleRef,activeRef)&&b31ActiveRefStillValid(trip,block.scheduleRef);
  const chosen=new Date(selectedMs);
  // An unchanged selection is a no-op, including legacy timestamp spelling and ownership.
  if(selectedMs!==new Date(block.timelineTime||block.createdAt).getTime()){
    block.timelineTime=chosen.toISOString();
    if(!keepActive) b34ReassignTextTimeAsBefore(trip,block,chosen);
    persistAppData();
  }
  b34CloseTextTimePicker(); renderRecordScreen(); showToast('✓ Timeline時刻を変更しました');
}
function b34ReassignTextTimeAsBefore(trip,block,chosen){
  // Original b2EditTextTime assignment, used only outside the current Active Schedule.
  block.day=b2DayNumberForTime(trip,block.timelineTime);
  if(block.day===null) block.scheduleRef=null;
  else{
    const day=trip?.days?.find(d=>d.day===block.day),plan=day?getActivePlanFromTrip(trip,day.day):null;
    let matched=null;
    if(plan){
      const mins=chosen.getHours()*60+chosen.getMinutes();
      const slots=(plan.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
      slots.forEach((slot,index)=>{
        const start=slotSortMinutes(slot),next=slots[index+1],end=slot.endTime?timeToMinutes(slot.endTime):(next?slotSortMinutes(next):Math.min(1439,start+60));
        if(!matched&&mins>=start&&mins<end) matched={day:day.day,planId:plan.id,slotId:slot.id};
      });
    }
    block.scheduleRef=matched;
  }
}
function b2DeleteTextBlock(blockId){
  const blocks=b2CoreBlocks(),idx=blocks.findIndex(x=>x.id===blockId&&x.type==='text'); if(idx<0) return;
  if(!confirm('このテキスト記録を削除しますか？')) return;
  blocks.splice(idx,1); persistAppData(); renderRecordScreen(); showToast('テキスト記録を削除しました');
}
function b2TextBlockHtml(block){
  const time=b1TimelineIsoTime(block.timelineTime||block.createdAt)||'時刻不明';
  return `<article class="b2-text-block"><div class="b2-text-meta"><span>TEXT</span><strong>${escapeHtml(time)}</strong></div><p>${escapeHtml(block.text||'')}</p><div class="b1-record-actions"><button onclick="b2EditTextBlock('${block.id}')">編集</button><button onclick="b2EditTextTime('${block.id}')">時刻</button><button class="danger-soft" onclick="b2DeleteTextBlock('${block.id}')">削除</button></div></article>`;
}
function b1BuildTimelineSkeleton(trip,{readOnly=false,recordMatches=b1RecordMatchesSchedule}={}){
  if(!trip) return {days:[],recordCount:0,scheduleCount:0,unplannedCount:0};
  const records=(trip.records||[]).slice().sort((a,b)=>b1RecordSortAt(a)-b1RecordSortAt(b));
  const textBlocks=(readOnly?(APP_DATA.coreV21?.blocks||[]).filter(block=>block?.type==='text'&&String(block.tripId||'')===String(trip.id)):b2TripTextBlocks(trip)).slice().sort((a,b)=>b2BlockSortAt(a)-b2BlockSortAt(b));
  const consumed=new Set(),consumedBlocks=new Set();
  const result={days:[],recordCount:records.length+textBlocks.length,scheduleCount:0,unplannedCount:0};
  (trip.days||[]).forEach(day=>{
    const plan=getActivePlanFromTrip(trip,day.day);
    const slots=(plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
    const items=[];
    slots.forEach((slot,index)=>{
      const linked=records.filter(record=>recordMatches(record,day,plan,slot)).sort((a,b)=>b1RecordSortAt(a)-b1RecordSortAt(b));
      linked.forEach(record=>consumed.add(record.id));
      const linkedBlocks=textBlocks.filter(block=>String(block?.scheduleRef?.slotId||'')===String(slot.id)&&Number(block?.scheduleRef?.day)===Number(day.day)&&(!block?.scheduleRef?.planId||String(block.scheduleRef.planId)===String(plan.id))).sort((a,b)=>b2BlockSortAt(a)-b2BlockSortAt(b));
      linkedBlocks.forEach(block=>consumedBlocks.add(block.id));
      const candidate=readOnly?(slot.candidates?.find(candidate=>candidate.id===slot.selectedCandidateId)||(slot.candidates?.length===1?slot.candidates[0]:null)):selectedCandidate(slot);
      const meta=slot.v21||{};
      const next=slots[index+1]||null;
      const inferredEnd=slot.endTime||next?.startTime||'';
      const startAt=meta.plannedStartAt||`${day.date}T${slot.startTime||'12:00'}:00`;
      const endAt=meta.plannedEndAt||(inferredEnd?`${day.date}T${inferredEnd}:00`:null);
      items.push({
        type:'schedule',id:`schedule:${trip.id}:${day.day}:${plan?.id||'a'}:${slot.id}`,day,plan,slot,candidate,records:linked,blocks:linkedBlocks,
        startAt,endAt,sortAt:new Date(startAt).getTime()||0,status:meta.status||slotStatus(trip,day.day,slot),meta
      });
      result.scheduleCount++;
    });

    const loose=records.filter(record=>!consumed.has(record.id)&&b1RecordDayNumber(trip,record)===Number(day.day)).sort((a,b)=>b1RecordSortAt(a)-b1RecordSortAt(b));
    const looseGroups=[];
    loose.forEach(record=>{
      const at=b1RecordSortAt(record);
      const prev=looseGroups[looseGroups.length-1];
      const prevRecord=prev?.records?.[prev.records.length-1];
      const gap=prevRecord?(at-b1RecordSortAt(prevRecord))/60000:Infinity;
      const samePlace=!!(prevRecord?.placeName&&record?.placeName&&String(prevRecord.placeName).trim()===String(record.placeName).trim());
      const threshold=samePlace?30:15;
      if(prev&&gap>=0&&gap<=threshold){ prev.records.push(record); prev.endAt=record.capturedAt||record.createdAt||prev.endAt; }
      else looseGroups.push({type:'unplanned',id:`unplanned:${trip.id}:${day.day}:${record.id}`,day,records:[record],startAt:record.capturedAt||record.createdAt||'',endAt:record.capturedAt||record.createdAt||'',sortAt:at});
      consumed.add(record.id);
    });
    const looseBlocks=textBlocks.filter(block=>!consumedBlocks.has(block.id)&&Number(block.day)===Number(day.day)).sort((a,b)=>b2BlockSortAt(a)-b2BlockSortAt(b));
    looseBlocks.forEach(block=>{
      items.push({type:'unplanned',id:`unplanned-text:${trip.id}:${day.day}:${block.id}`,day,records:[],blocks:[block],startAt:block.timelineTime||block.createdAt||'',endAt:block.timelineTime||block.createdAt||'',sortAt:b2BlockSortAt(block)});
      consumedBlocks.add(block.id); result.unplannedCount++;
    });
    looseGroups.forEach(group=>{ items.push(group); result.unplannedCount++; });
    items.sort((a,b)=>{
      if(a.sortAt===b.sortAt) return a.type==='schedule'?-1:1;
      return a.sortAt-b.sortAt;
    });
    result.days.push({day,plan,items});
  });

  const leftoverBlocks=textBlocks.filter(block=>!consumedBlocks.has(block.id));
  if(leftoverBlocks.length&&result.days.length){
    leftoverBlocks.forEach(block=>{
      result.days[result.days.length-1].items.push({type:'unplanned',id:`unplanned-text:${trip.id}:other:${block.id}`,day:result.days[result.days.length-1].day,records:[],blocks:[block],startAt:block.timelineTime||'',endAt:block.timelineTime||'',sortAt:b2BlockSortAt(block)});
      result.unplannedCount++;
    });
    result.days[result.days.length-1].items.sort((a,b)=>a.sortAt-b.sortAt);
  }
  const leftovers=records.filter(record=>!consumed.has(record.id));
  if(leftovers.length&&result.days.length){
    result.days[0].items.unshift({type:'unplanned',id:`unplanned:${trip.id}:other`,day:result.days[0].day,records:leftovers.sort((a,b)=>b1RecordSortAt(a)-b1RecordSortAt(b)),startAt:leftovers[0]?.capturedAt||'',endAt:leftovers[leftovers.length-1]?.capturedAt||'',sortAt:-1});
    result.unplannedCount++;
  }
  return result;
}
function b1RecordMediaHtml(record){
  if(!b1RecordIsImage(record)) return '';
  const src=record.previewDataUrl||record.dataUrl||'';
  const key=record.mediaKey||'';
  const hydrate=key?` data-v258-media-key="${escapeHtml(key)}"`:'';
  return `<div class="b1-timeline-photo"><img src="${src}"${hydrate} alt="旅の記録写真"></div>`;
}
function b1RecordActionsHtml(record){
  const cameraRecord=record.captureSource==='tripper_camera';
  const editAction=cameraRecord?`editCameraRecord('${record.id}')`:`editRecord('${record.id}')`;
  const deleteAction=cameraRecord?`deleteRecordEntry('${record.id}')`:`deleteRecord('${record.id}')`;
  const image=b1RecordIsImage(record);
  return `<div class="b1-record-actions"><button onclick="${editAction}">編集</button>${image&&record.slotId?`<button onclick="setRecordAsCover('${record.id}')">${record.isCover?'✓ 代表写真':'代表写真にする'}</button>`:''}<button class="danger-soft" onclick="${deleteAction}">削除</button></div>`;
}
function b1TimelineRecordHtml(record){
  const time=b1TimelineIsoTime(record.capturedAt||record.createdAt)||'時刻不明';
  const role=cameraRoleLabel?.(b1RecordKind(record))||recordKindLabel?.(b1RecordKind(record))||'RECORD';
  const note=record.comment||record.note||'';
  return `<article class="b1-timeline-record ${record.isCover?'is-cover':''}">
    <div class="b1-record-meta"><span>${escapeHtml(role)}</span><strong>${escapeHtml(time)}</strong>${record.isCover?'<em>代表写真</em>':''}</div>
    ${b1RecordMediaHtml(record)}
    <div class="b1-record-copy"><div class="b1-record-place">${iconSvg('pin')}<span>${escapeHtml(record.placeName||'場所未設定')}</span></div>${note?`<p>${escapeHtml(note)}</p>`:''}${b1RecordActionsHtml(record)}</div>
  </article>`;
}
function b1ScheduleActualLabel(meta){
  const start=b1TimelineIsoTime(meta?.actualStartAt),end=b1TimelineIsoTime(meta?.actualEndAt);
  if(start&&end) return `実際 ${start}–${end}`;
  if(start) return `実際 ${start}〜`;
  if(end) return `実際 終了 ${end}`;
  return '';
}
function b1TimelineItemHtml(item){
  if(item.type==='unplanned'){
    const allTimes=[...(item.records||[]).map(r=>r.capturedAt||r.createdAt||''),...(item.blocks||[]).map(b=>b.timelineTime||b.createdAt||'')].filter(Boolean).sort((a,b)=>new Date(a)-new Date(b));
    const firstTime=b1TimelineIsoTime(allTimes[0]);
    const lastTime=b1TimelineIsoTime(allTimes[allTimes.length-1]);
    const range=firstTime&&lastTime&&firstTime!==lastTime?`${firstTime}–${lastTime}`:(firstTime||'時間未定');
    return `<section class="b1-timeline-group b1-unplanned-group"><div class="b1-timeline-rail"><span></span></div><div class="b1-timeline-card"><div class="b1-group-top"><div><div class="b1-group-kicker">寄り道</div><h3>予定の外で生まれた記録</h3></div><div class="b1-group-time">${escapeHtml(range)}</div></div><p class="b1-group-sub">予定に合わせ直さなくても、このまま旅の一部として残せます。</p><div class="b1-group-records">${[...(item.records||[]).map(record=>({at:b1RecordSortAt(record),html:b1TimelineRecordHtml(record)})),...(item.blocks||[]).map(block=>({at:b2BlockSortAt(block),html:b2TextBlockHtml(block)}))].sort((a,b)=>a.at-b.at).map(x=>x.html).join('')}</div></div></section>`;
  }
  const {slot,candidate,records,blocks,meta,status}=item;
  const actual=b1ScheduleActualLabel(meta);
  const statusLabel=b1TimelineStatusLabel(status);
  const policy=meta?.timePolicy==='fixed'?'固定':'調整可';
  return `<section class="b1-timeline-group b1-schedule-group status-${escapeHtml(status)}"><div class="b1-timeline-rail"><span></span></div><div class="b1-timeline-card"><div class="b1-group-top"><div><div class="b1-group-kicker">SCHEDULE · ${escapeHtml(statusLabel)}</div><h3>${escapeHtml(cleanDisplayName(candidate?.name||candidate?.destination||'予定'))}</h3></div><div class="b1-group-time">${escapeHtml(slotTimeLabel(slot))}</div></div><div class="b1-schedule-meta"><span>${escapeHtml(policy)}</span>${actual?`<span>${escapeHtml(actual)}</span>`:''}${candidate?.destination?`<span>${iconSvg('pin')} ${escapeHtml(candidate.destination)}</span>`:''}</div>${candidate?.activity?`<p class="b1-group-sub">${escapeHtml(candidate.activity)}</p>`:''}<div class="b1-group-records">${(records?.length||blocks?.length)?[...(records||[]).map(record=>({at:b1RecordSortAt(record),html:b1TimelineRecordHtml(record)})),...(blocks||[]).map(block=>({at:b2BlockSortAt(block),html:b2TextBlockHtml(block)}))].sort((a,b)=>a.at-b.at).map(x=>x.html).join(''):'<div class="b1-empty-inside">この予定の記録はまだありません。</div>'}</div></div></section>`;
}
function renderRecordScreen(){
  const section=document.getElementById('record'); if(!section) return;
  const trip=getRecordTrip?.()||v254RecentTripForRecord?.()||getHomeTrip()||getTrip();
  const timeline=b1BuildTimelineSkeleton(trip);
  const photoCount=(trip?.records||[]).filter(b1RecordIsImage).length;
  const quickEligibility=trip?b2CanQuickRecordNow(trip,new Date()):{ok:false,phase:'none'};
  const quickDisabled=quickEligibility.ok?'':' disabled aria-disabled="true"';
  const quickPlaceholder=quickEligibility.ok?'今のことを記録…':(quickEligibility.phase==='before'?'旅行開始後に記録できます':'終了した旅です');
  section.innerHTML=`<div class="editorial-page-shell record-camera-only-page b1-timeline-page">
    <div class="page-intro-row single"><div><div class="page-kicker">RECORD</div><h2 class="section-title no-margin">記録</h2><p class="section-sub">予定を骨格に、写真や寄り道が旅の流れの中へ自然に積み重なるTimelineです。</p></div></div>
    ${(APP_DATA?.trips||[]).length>1?`<div class="record-trip-switch chip-row">${(APP_DATA.trips||[]).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate)).map(t=>`<button class="chip ${trip?.id===t.id?'active':''}" onclick="setRecordTrip('${t.id}')">${escapeHtml(cleanDisplayName(t.title))}</button>`).join('')}</div>`:''}
    ${trip?`<div class="record-hero-card card b1-record-hero"><div class="record-hero-top"><div><div class="time">LIVE TIMELINE</div><div class="title">${escapeHtml(cleanDisplayName(trip.title))}</div><div class="desc">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))} · ${v257PhotoCount(photoCount)}</div></div></div><button class="record-camera-main" onclick="startInAppCamera('entry')"${quickDisabled}>${iconSvg('camera')}<span><strong>${quickEligibility.ok?'今を撮る':'撮影は終了しています'}</strong><small>${quickEligibility.ok?'今までのカメラ機能はそのまま使えます':'過去の旅には現在時刻の写真を追加しません'}</small></span></button><div class="record-role-actions camera-only"><button onclick="startInAppCamera('start')"${quickDisabled}><span>START</span><strong>旅の始まりを撮る</strong></button><button onclick="startInAppCamera('fin')"${quickDisabled}><span>FIN</span><strong>旅の終わりを撮る</strong></button></div></div>`:'<div class="record-empty">旅行を登録するとTimelineを表示できます。</div>'}
    ${trip?`<div class="b1-timeline-summary"><div><span>SCHEDULE</span><strong>${timeline.scheduleCount}</strong></div><div><span>RECORD</span><strong>${timeline.recordCount}</strong></div><div><span>寄り道</span><strong>${timeline.unplannedCount}</strong></div></div>`:''}
    <div class="b1-phase-note"><strong>Phase 4B.2</strong><span>Quick Record BarとText Blockを追加しました。Scheduleの開始・終了操作は次工程です。</span></div>
    <div class="b1-master-timeline">${timeline.days.map(dayEntry=>`<section class="b1-day-section"><div class="b1-day-heading"><span>DAY ${dayEntry.day.day}</span><strong>${escapeHtml(formatJP(dayEntry.day.date))}</strong></div>${dayEntry.items.length?dayEntry.items.map(b1TimelineItemHtml).join(''):'<div class="record-empty">この日のTimelineはまだ空です。</div>'}</section>`).join('')}</div>
    ${trip?`<div class="b2-quick-record-bar ${quickEligibility.ok?'':'is-readonly'}"><button class="b2-quick-plus" onclick="b2OpenQuickAddMenu()" aria-label="追加">＋</button><button class="b2-quick-camera" onclick="startInAppCamera('entry')" aria-label="写真を撮る"${quickDisabled}>${iconSvg('camera')}</button><textarea id="b2QuickTextInput" rows="1" maxlength="500" placeholder="${escapeHtml(quickPlaceholder)}" oninput="b2SyncQuickSendState()" onkeydown="b2QuickTextKeydown(event)"${quickDisabled}></textarea><button id="b2QuickSend" class="b2-quick-send" onclick="b2SubmitQuickText()" disabled aria-label="送信">↑</button></div>`:''}
  </div>`;
  setTimeout(()=>hydrateV258AFullQualityMedia(section),0);
}

/* Make older "代表写真にする" action use the new lightweight cover pointer as well. */
function setRecordAsCover(recordId){
  const found=(APP_DATA.trips||[]).map(t=>({trip:t,record:(t.records||[]).find(r=>r.id===recordId)})).find(x=>x.record);
  if(!found) return;
  const {trip,record}=found;
  if(record.mediaType!=='image'||!record.slotId){ alert('代表写真にするには、予定に紐付いた写真記録が必要です。'); return; }
  const link=recordSlotLink(record); if(!link.slot){ alert('紐付け先の予定が見つかりません。'); return; }
  (trip.records||[]).forEach(r=>{ if(r.id!==record.id&&r.slotId===record.slotId&&Number(r.day)===Number(record.day)) r.isCover=false; });
  record.isCover=true;
  link.slot.coverPhoto={dataUrl:'',mediaKey:record.mediaKey||'',recordId:record.id,addedAt:new Date().toISOString(),capturedAt:record.capturedAt||'',name:'Time Diary代表写真'};
  persistAppData(); renderRecordScreen(); if(getTrip()?.id===trip.id) renderTripDetail(); setTimeout(()=>hydrateV258AFullQualityMedia(document),0); showToast('✓ 予定の代表写真に設定しました');
}

/* Wrap the existing global render pipeline so new full-quality blobs are hydrated after every redraw. */
const v258ABaseRenderAll=renderAll;
renderAll=function(){
  v258ARevokeMediaUrls();
  v258ABaseRenderAll();
  setTimeout(()=>hydrateV258AFullQualityMedia(document),0);
};

ensureV258ABackup();
try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion=V258A_VERSION;
  persistAppData();
}catch(err){ console.warn('v2.5.8-A version marker not persisted',err); }

/* Direct itinerary redraws (candidate selection/shuffle/editor save) also need cover hydration. */
const v258ABaseRenderTripDetail=renderTripDetail;
renderTripDetail=function(){
  v258ABaseRenderTripDetail();
  setTimeout(()=>hydrateV258AFullQualityMedia(document.getElementById('tripDetail')||document),0);
};

/* =========================================================
   v2.5.8-A.1 Focused Hotfix
   - front camera switching reliability
   - Google Maps short URL refresh priority
   - clearer true-random shuffle feedback
   ========================================================= */
const V258A1_VERSION='2.5.8-A.1';

function v258A1RandomIndex(length){
  if(!Number.isInteger(length)||length<=0) return 0;
  try{
    if(window.crypto?.getRandomValues){
      const max=0x100000000;
      const limit=max-(max%length);
      const buffer=new Uint32Array(1);
      do{ window.crypto.getRandomValues(buffer); }while(buffer[0]>=limit);
      return buffer[0]%length;
    }
  }catch(_e){}
  return Math.floor(Math.random()*length);
}

/* Use an exact camera-facing request first. Some iPhones may ignore `ideal`
   during a live camera switch and keep the previous lens. We then fall back
   progressively so older WebKit builds still get a usable stream. */
async function openTripperCameraStream(){
  const loading=document.getElementById('cameraLoading');
  const video=document.getElementById('recordCameraVideo');
  const mode=TRIPPER_CAMERA_STATE.facingMode==='user'?'user':'environment';
  if(loading){ loading.textContent=mode==='user'?'前面カメラに切り替えています…':'背面カメラを起動しています…'; loading.classList.remove('hidden'); }
  stopTripperCameraStream();
  if(!navigator.mediaDevices?.getUserMedia){
    if(loading) loading.textContent='この端末ではアプリ内カメラを利用できません。';
    return;
  }

  const attempts=[
    {audio:false,video:{facingMode:{exact:mode},width:{ideal:2560},height:{ideal:1920},aspectRatio:{ideal:4/3}}},
    {audio:false,video:{facingMode:{ideal:mode},width:{ideal:1920},height:{ideal:1440},aspectRatio:{ideal:4/3}}},
    {audio:false,video:{facingMode:mode}}
  ];
  let lastError=null;
  for(const constraints of attempts){
    try{
      const stream=await navigator.mediaDevices.getUserMedia(constraints);
      TRIPPER_CAMERA_STATE.stream=stream;
      if(video){
        video.srcObject=stream;
        // The preview and saved canvas use the same orientation. No surprise
        // horizontal flip is applied after pressing the shutter.
        video.style.transform='none';
        await video.play();
      }
      if(loading) loading.classList.add('hidden');
      const label=document.getElementById('cameraFacingLabel');
      if(label) label.textContent=mode==='environment'?'背面カメラ':'前面カメラ';
      return;
    }catch(err){ lastError=err; console.warn('camera attempt failed',constraints,err); }
  }
  if(loading){
    const name=String(lastError?.name||'');
    loading.textContent=(name==='NotAllowedError'||name==='SecurityError')
      ?'カメラを起動できません。iPhoneの設定でTripper Noteのカメラ権限を確認してください。'
      :'カメラの切り替えに失敗しました。いったん閉じてもう一度お試しください。';
  }
}

async function flipInAppCamera(){
  const previous=TRIPPER_CAMERA_STATE.facingMode;
  TRIPPER_CAMERA_STATE.facingMode=previous==='environment'?'user':'environment';
  await openTripperCameraStream();
  if(!TRIPPER_CAMERA_STATE.stream){
    TRIPPER_CAMERA_STATE.facingMode=previous;
  }
}

/* URL refresh is authoritative. A newly pasted Google Maps URL must be
   resolved before an old destination/name can be reused. */
async function autoFillCandidateCoords(){
  const url=document.getElementById('candidateMaps').value.trim();
  const dest=document.getElementById('candidateDestination').value.trim();
  const name=document.getElementById('candidateName').value.trim();
  const hint=document.getElementById('coordHint');
  hint.textContent='位置情報を更新しています…'; hint.className='coord-hint';

  document.getElementById('candidateAddress').value='';
  document.getElementById('candidateLat').value='';
  document.getElementById('candidateLon').value='';

  let point=extractCoordinatesFromMapsUrl(url);

  // Short maps.app.goo.gl links normally contain no coordinates themselves.
  // Ask the native plugin to follow the redirect and resolve that URL first.
  if(!point&&url){
    point=await resolvePlaceWithNativeSearch({
      destination:dest,
      name,
      address:'',
      googleMapsUrl:url,
      preferMapsUrl:true
    });
  }

  if(!point){
    const known=findNavPoint(dest||name);
    if(known) point={lat:known.lat,lon:known.lon,address:known.address||'',name:known.name||dest||name};
  }
  if(!point&&(dest||name)){
    point=await resolvePlaceWithNativeSearch({destination:dest,name,address:'',googleMapsUrl:'',preferMapsUrl:false});
  }

  if(point){
    document.getElementById('candidateLat').value=point.lat;
    document.getElementById('candidateLon').value=point.lon;
    document.getElementById('candidateAddress').value=point.address||'';
    if(!dest&&point.name) document.getElementById('candidateDestination').value=point.name;
    hint.textContent=point.source==='google_maps_url'
      ?'✓ Google Maps URLから新しい住所・緯度・経度へ更新しました'
      :'✓ 新しい位置情報で住所・緯度・経度を更新しました';
    hint.className='coord-hint ok';
  }else{
    hint.textContent=url
      ?'Google Maps URLから場所を特定できませんでした。URLを開き直して共有リンクを貼り直すか、施設名を入力して再度取得してください。古い位置情報は誤ナビ防止のためクリアしています。'
      :'場所を特定できませんでした。施設名をより具体的にして再度取得してください。';
    hint.className='coord-hint warn';
  }
}

function shuffleCurrentSlot(){
  const slot=candidateSlot(); if(!slot||slot.candidates.length<2) return;
  const before=slot.selectedCandidateId;
  const picked=slot.candidates[v258A1RandomIndex(slot.candidates.length)];
  if(!picked) return;
  slot.selectedCandidateId=picked.id;
  if(candidateContext.source==='app'){
    persistAppData(); renderTripDetail(); renderHome(); renderCandidateModal();
  }else{
    renderPlanEditor(); renderCandidateModal();
  }
  const same=before===picked.id;
  showToast(`${same?'同じ候補を再選択':'候補を変更'}：${cleanDisplayName(picked.name)}（ランダム）`);
}

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion=V258A1_VERSION;
  persistAppData();
}catch(err){ console.warn('v2.5.8-A.1 version marker not persisted',err); }

/* =========================================================
   v2.5.8-A.2 Camera & UX Polish
   - iPhone-camera-inspired Camera Only UI
   - front preview + saved image stay mirror-matched
   - manual schedule completion + completed memory-card UI
   - candidate-bundle indicator clarified
   ========================================================= */
const V258A2_VERSION='2.5.8-A.2';

function v258A2SetCameraBodyState(open){
  document.body.classList.toggle('camera-open',!!open);
  const modal=document.getElementById('recordCameraModal');
  if(modal) modal.setAttribute('aria-hidden',open?'false':'true');
}

function v258A2CameraIsFront(){
  return TRIPPER_CAMERA_STATE.facingMode==='user';
}

async function startInAppCamera(role='entry'){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip()||APP_DATA.trips?.[0];
  if(!trip){ alert('先に旅行を登録してください。'); return; }
  const eligibility=typeof b2CanQuickRecordNow==='function'?b2CanQuickRecordNow(trip,new Date()):{ok:true};
  if(!eligibility.ok){ showToast(eligibility.message||'現在時刻の記録は追加できません。'); return; }
  stopTripperCameraStream();
  TRIPPER_CAMERA_STATE={
    stream:null,
    role:['start','entry','fin'].includes(role)?role:'entry',
    facingMode:'environment',
    blob:null,
    previewDataUrl:'',
    capturedAt:'',
    tripId:trip.id,
    editRecordId:'',
    switching:false,
    capturing:false
  };
  const modal=document.getElementById('recordCameraModal');
  if(!modal) return;
  const roleTitle=document.getElementById('cameraRoleTitle');
  if(roleTitle) roleTitle.textContent=cameraRoleLabel(TRIPPER_CAMERA_STATE.role);
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  v258A2SetCameraBodyState(true);
  await openTripperCameraStream();
}

async function openTripperCameraStream(){
  const loading=document.getElementById('cameraLoading');
  const video=document.getElementById('recordCameraVideo');
  const shutter=document.getElementById('cameraShutter');
  const flip=document.getElementById('cameraFlipButton');
  const mode=v258A2CameraIsFront()?'user':'environment';
  if(loading){
    loading.textContent=mode==='user'?'前面カメラに切り替えています…':'背面カメラを起動しています…';
    loading.classList.remove('hidden');
  }
  if(shutter) shutter.disabled=true;
  if(flip) flip.disabled=true;
  stopTripperCameraStream();
  if(!navigator.mediaDevices?.getUserMedia){
    if(loading) loading.textContent='この端末ではアプリ内カメラを利用できません。';
    if(flip) flip.disabled=false;
    return;
  }
  const attempts=[
    {audio:false,video:{facingMode:{exact:mode},width:{ideal:4032},height:{ideal:3024},aspectRatio:{ideal:4/3},frameRate:{ideal:30,max:30}}},
    {audio:false,video:{facingMode:{ideal:mode},width:{ideal:2560},height:{ideal:1920},aspectRatio:{ideal:4/3},frameRate:{ideal:30,max:30}}},
    {audio:false,video:{facingMode:mode}}
  ];
  let lastError=null;
  for(const constraints of attempts){
    try{
      const stream=await navigator.mediaDevices.getUserMedia(constraints);
      TRIPPER_CAMERA_STATE.stream=stream;
      const track=stream.getVideoTracks?.()[0];
      const actualMode=track?.getSettings?.().facingMode;
      const isFront=actualMode?actualMode==='user':mode==='user';
      TRIPPER_CAMERA_STATE.facingMode=isFront?'user':'environment';
      if(video){
        video.srcObject=stream;
        video.classList.toggle('front-mirror',isFront);
        await video.play();
      }
      const label=document.getElementById('cameraFacingLabel');
      if(label) label.textContent=isFront?'前面カメラ':'背面カメラ';
      if(loading) loading.classList.add('hidden');
      if(shutter) shutter.disabled=false;
      if(flip) flip.disabled=false;
      return;
    }catch(err){
      lastError=err;
      console.warn('v2.5.8-A.2 camera attempt failed',constraints,err);
    }
  }
  if(loading){
    const name=String(lastError?.name||'');
    loading.textContent=(name==='NotAllowedError'||name==='SecurityError')
      ?'カメラを起動できません。iPhoneの設定でTripper Noteのカメラ権限を確認してください。'
      :'カメラを起動できませんでした。いったんキャンセルして、もう一度お試しください。';
  }
  if(flip) flip.disabled=false;
}

async function flipInAppCamera(){
  if(TRIPPER_CAMERA_STATE.switching||TRIPPER_CAMERA_STATE.capturing) return;
  TRIPPER_CAMERA_STATE.switching=true;
  const previous=TRIPPER_CAMERA_STATE.facingMode;
  TRIPPER_CAMERA_STATE.facingMode=previous==='environment'?'user':'environment';
  try{
    await openTripperCameraStream();
    if(!TRIPPER_CAMERA_STATE.stream) TRIPPER_CAMERA_STATE.facingMode=previous;
  }finally{
    TRIPPER_CAMERA_STATE.switching=false;
  }
}

function closeInAppCamera(){
  stopTripperCameraStream();
  const video=document.getElementById('recordCameraVideo');
  if(video) video.classList.remove('front-mirror');
  document.getElementById('recordCameraModal')?.classList.remove('open');
  TRIPPER_CAMERA_STATE.blob=null;
  TRIPPER_CAMERA_STATE.previewDataUrl='';
  TRIPPER_CAMERA_STATE.capturedAt='';
  TRIPPER_CAMERA_STATE.capturing=false;
  TRIPPER_CAMERA_STATE.switching=false;
  v258A2SetCameraBodyState(false);
  if(!document.getElementById('recordDetailModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
}

async function captureInAppPhoto(){
  const video=document.getElementById('recordCameraVideo');
  if(TRIPPER_CAMERA_STATE.capturing) return;
  if(!video||!video.videoWidth||!video.videoHeight){ showToast('カメラの準備中です'); return; }
  TRIPPER_CAMERA_STATE.capturing=true;
  const shutter=document.getElementById('cameraShutter');
  const flip=document.getElementById('cameraFlipButton');
  if(shutter) shutter.disabled=true;
  if(flip) flip.disabled=true;
  const capturedAt=new Date().toISOString();
  try{
    const maxSide=4032;
    const scale=Math.min(1,maxSide/Math.max(video.videoWidth,video.videoHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
    canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('2D canvas unavailable');
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    // Front camera: save exactly the mirror direction shown in the preview.
    if(v258A2CameraIsFront()){
      ctx.save();
      ctx.translate(canvas.width,0);
      ctx.scale(-1,1);
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      ctx.restore();
    }else{
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
    }

    const blob=await canvasToBlob(canvas,'image/jpeg',.95);

    // Metadata thumbnail only. The full-quality blob is stored separately in IndexedDB.
    const previewMax=1280;
    const previewScale=Math.min(1,previewMax/Math.max(canvas.width,canvas.height));
    const previewCanvas=document.createElement('canvas');
    previewCanvas.width=Math.max(1,Math.round(canvas.width*previewScale));
    previewCanvas.height=Math.max(1,Math.round(canvas.height*previewScale));
    const pctx=previewCanvas.getContext('2d',{alpha:false});
    if(!pctx) throw new Error('Preview canvas unavailable');
    pctx.imageSmoothingEnabled=true;
    pctx.imageSmoothingQuality='high';
    pctx.drawImage(canvas,0,0,previewCanvas.width,previewCanvas.height);

    TRIPPER_CAMERA_STATE.blob=blob;
    TRIPPER_CAMERA_STATE.previewDataUrl=previewCanvas.toDataURL('image/jpeg',.84);
    TRIPPER_CAMERA_STATE.capturedAt=capturedAt;
    stopTripperCameraStream();
    if(video) video.classList.remove('front-mirror');
    document.getElementById('recordCameraModal')?.classList.remove('open');
    v258A2SetCameraBodyState(false);
    TRIPPER_CAMERA_STATE.capturing=false;
    openCapturedRecordDetail();
  }catch(err){
    console.warn('v2.5.8-A.2 capture failed',err);
    TRIPPER_CAMERA_STATE.capturing=false;
    if(shutter) shutter.disabled=false;
    if(flip) flip.disabled=false;
    alert('写真を撮影できませんでした。もう一度お試しください。');
  }
}

/* Manual completion is persisted on the slot, while time-based completion remains compatible. */
function slotStatus(trip,dayNum,slot,now=new Date()){
  if(slot?.completedAt) return 'completed';
  if(!trip||!slot) return 'upcoming';
  const day=getDayFromTrip(trip,dayNum); if(!day) return 'upcoming';
  const today=localDateKey(now);
  if(day.date<today) return 'completed';
  if(day.date>today) return 'upcoming';
  const current=now.getHours()*60+now.getMinutes();
  const plan=getPlanFromTrip(trip,dayNum,getDayFromTrip(trip,dayNum)?.activePlanId);
  const ordered=(plan?.slots||[]).slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  const idx=ordered.findIndex(s=>s.id===slot.id),start=slotSortMinutes(slot);
  const next=idx>=0?ordered[idx+1]:null;
  const end=slot.endTime?timeToMinutes(slot.endTime):(next?Math.max(start+1,slotSortMinutes(next)):Math.min(1439,start+60));
  if(current>=end) return 'completed';
  if(current>=start&&current<end) return 'active';
  return 'upcoming';
}

function findNextSlotForTrip(trip,day,now=new Date()){
  const slots=(getActivePlanFromTrip(trip,day.day)?.slots||[])
    .filter(slot=>!slot.completedAt)
    .slice().sort((a,b)=>slotSortMinutes(a)-slotSortMinutes(b));
  const current=now.getHours()*60+now.getMinutes();
  for(let i=0;i<slots.length;i++){
    const start=slotSortMinutes(slots[i]);
    const inferredEnd=slots[i].endTime?timeToMinutes(slots[i].endTime):(slots[i+1]?Math.max(start+1,slotSortMinutes(slots[i+1])):Math.min(1439,start+60));
    if(current>=start&&current<inferredEnd) return slots[i];
  }
  return slots.find(s=>slotSortMinutes(s)>current)||null;
}

function completeSlot(dayNum,planId,slotId){
  const slot=getSlot(dayNum,planId,slotId);
  if(!slot||slot.completedAt) return;
  if(!confirm('この予定を終了しますか？')) return;
  slot.completedAt=new Date().toISOString();
  persistAppData();
  renderTripDetail();
  renderHome();
  showToast('✓ 予定を終了しました');
}

function v258A2BundleIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 5.5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z"/><path d="M8.5 2.5h9a3.5 3.5 0 0 1 3.5 3.5v9"/></svg>';
}

function openCandidateModal(dayNum,planId,slotId,source='app',openAdd=false){
  candidateContext={dayNum:Number(dayNum),planId,slotId,source,completedEdit:false};
  candidateFormMode=null;
  const modal=document.getElementById('candidateModal');
  modal?.classList.remove('completed-edit-mode');
  modal?.classList.add('open');
  document.body.classList.add('modal-open');
  renderCandidateModal();
  if(openAdd) showCandidateForm('add');
}

function closeCandidateModal(){
  candidateContext=null;
  candidateFormMode=null;
  const modal=document.getElementById('candidateModal');
  modal?.classList.remove('open','completed-edit-mode');
  if(!document.getElementById('editorModal')?.classList.contains('open')) document.body.classList.remove('modal-open');
}

function openCompletedCandidateOptions(dayNum,planId,slotId,editSelected=false){
  candidateContext={dayNum:Number(dayNum),planId,slotId,source:'app',completedEdit:true};
  candidateFormMode=null;
  const modal=document.getElementById('candidateModal');
  if(!modal) return;
  modal.classList.add('open','completed-edit-mode');
  document.body.classList.add('modal-open');
  renderCandidateModal();
  if(editSelected){
    const slot=candidateSlot();
    const selected=slot?.selectedCandidateId||slot?.candidates?.[0]?.id;
    if(selected) showCandidateForm('edit',selected);
  }
}

function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip();
  const c=selectedCandidate(slot);
  const count=Array.isArray(slot?.candidates)?slot.candidates.length:0;
  const hasStack=count>=2;
  const status=slotStatus(trip,dayNum,slot);
  const completed=status==='completed';
  const coverRecord=v258ACoverRecord(trip,slot,dayNum);
  const fallbackCover=slot?.coverPhoto?.dataUrl||coverRecord?.previewDataUrl||'';
  const coverKey=coverRecord?.mediaKey||slot?.coverPhoto?.mediaKey||'';
  const hasCover=completed&&!!(fallbackCover||coverKey);
  const hasLocation=!!(c?.destination||c?.address||c?.googleMapsUrl||c?.name);
  const locationLabel=c?.address||c?.destination||'';
  const coverStyle=hasCover&&fallbackCover?` style="--slot-cover-photo:url('${fallbackCover}')"`:'';
  const coverAttr=hasCover&&coverKey?` data-v258-cover-key="${escapeHtml(coverKey)}"`:'';
  const stateLabel=completed?'完了':status==='active'?'進行中':'予定';
  const bundleButton=hasStack
    ? `<button class="slot-bundle-button" onclick="${completed?'openCompletedCandidateOptions':'openCandidateModal'}(${dayNum},'${planId}','${slot.id}'${completed?'':",'app'"})" aria-label="${count}件の候補を表示">${v258A2BundleIcon()}<span>候補</span><strong>${count}</strong></button>`
    : '';
  const addCandidate=(!completed&&!hasStack)
    ? `<button class="candidate-add-mini" onclick="openCandidateModal(${dayNum},'${planId}','${slot.id}','app',true)">＋候補</button>`
    : '';

  let bodyActions='';
  if(completed){
    bodyActions=`<div class="slot-completed-actions">
      <button class="slot-quiet-action" onclick="openCompletedCandidateOptions(${dayNum},'${planId}','${slot.id}',true)">${iconSvg('edit')} 編集</button>
      ${hasLocation?`<button class="slot-quiet-action" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`:''}
    </div>`;
  }else{
    const buttons=[];
    if(c?.transportMode!=='none') buttons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
    if(hasLocation) buttons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
    bodyActions=`${buttons.length?`<div class="actions ${buttons.length===1?'one':''}">${buttons.join('')}</div>`:''}<div class="slot-finish-row"><button class="slot-finish-button" onclick="completeSlot(${dayNum},'${planId}','${slot.id}')">✓ 予定を終了</button></div>`;
  }

  return `<div class="slot-wrap ${hasStack?'has-stack':''}" data-candidate-count="${count}">
    <div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}${coverAttr}>
      <div class="slot-cover-overlay"></div>
      <div class="slot-main">
        <div class="slot-meta-row">
          <div class="slot-meta-left">
            <span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>
            ${bundleButton}
            ${coverRecord?'<span class="slot-record-chip">PHOTO</span>':''}
          </div>
          <span class="slot-state-badge ${status}">${stateLabel}</span>
        </div>
        <div class="title">${escapeHtml(cleanDisplayName(c?.name||'未設定の予定'))}</div>
        ${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}
        ${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}
        ${completed
          ? (locationLabel?`<div class="slot-completed-location">${iconSvg('pin')}<span>${escapeHtml(locationLabel)}</span></div>`:'')
          : (c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:'')}
        ${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}
        ${bodyActions}
      </div>
      ${addCandidate}
    </div>
  </div>`;
}

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion=V258A2_VERSION;
  persistAppData();
}catch(err){ console.warn('v2.5.8-A.2 version marker not persisted',err); }

/* =========================================================
   v2.5.8-B.1 Unified Schedule Editor
   Scope: one common form wired to
   - new schedule
   - existing schedule edit
   - candidate add
   - candidate edit
   No automatic MapKit place lookup is added in B.1.
   ========================================================= */
const V258B1_VERSION='2.5.8-B.3.1';
let scheduleEditorContext=null;

function b1ScheduleSlot(ctx=scheduleEditorContext){
  if(!ctx||ctx.mode==='new-slot') return null;
  return getSlot(ctx.dayNum,ctx.planId,ctx.slotId,ctx.source||'edit');
}
function b1ScheduleCandidate(ctx=scheduleEditorContext){
  const slot=b1ScheduleSlot(ctx); if(!slot) return null;
  if(ctx?.candidateId) return slot.candidates.find(c=>c.id===ctx.candidateId)||null;
  return selectedCandidate(slot);
}
function b1ScheduleTitle(mode){
  if(mode==='new-slot') return '予定を追加';
  if(mode==='add-candidate') return '候補を追加';
  if(mode==='edit-candidate') return '候補を編集';
  return '予定を編集';
}
function b1SetField(id,value){ const el=document.getElementById(id); if(el) el.value=value??''; }
function b1NumberOrNull(value){
  if(value===null||value===undefined||String(value).trim()==='') return null;
  const n=Number(value); return Number.isFinite(n)?n:null;
}

function openScheduleEditor(mode,dayNum,planId,slotId='',source='edit',candidateId=''){
  const normalizedMode=['new-slot','edit-schedule','add-candidate','edit-candidate'].includes(mode)?mode:'edit-schedule';
  scheduleEditorContext={mode:normalizedMode,dayNum:Number(dayNum),planId,slotId:slotId||'',source:source||'edit',candidateId:candidateId||''};

  const slot=b1ScheduleSlot();
  const candidate=b1ScheduleCandidate();
  if(normalizedMode!=='new-slot'&&!slot){ scheduleEditorContext=null; return; }
  if(normalizedMode==='add-candidate'&&slot.candidates.length>=MAX_CANDIDATES){ scheduleEditorContext=null; showToast('候補は最大4つです'); return; }

  const c=(normalizedMode==='new-slot'||normalizedMode==='add-candidate')?blankCandidate('TEMP'):(candidate||blankCandidate('TEMP'));
  const start=normalizedMode==='new-slot'?'12:00':(slot?.startTime||'12:00');
  const end=normalizedMode==='new-slot'?'':(slot?.endTime||'');
  const place=(c.destination||cleanDisplayName(c.name||''));
  scheduleEditorContext.originalPlace=place==='新しい候補'?'':place;
  scheduleEditorContext.originalName=c.name||'';
  scheduleEditorContext.originalMaps=String(c.googleMapsUrl||'').trim();
  scheduleEditorContext.originalAddress=String(c.address||'').trim();
  scheduleEditorContext.originalLat=b1NumberOrNull(c.lat);
  scheduleEditorContext.originalLon=b1NumberOrNull(c.lon);
  scheduleEditorContext.originalLocationUnresolved=!!c.locationUnresolved;

  document.getElementById('scheduleEditorTitle').textContent=b1ScheduleTitle(normalizedMode);
  b1SetField('scheduleActivity',c.activity||'');
  b1SetField('scheduleStart',start);
  b1SetField('scheduleEnd',end);
  b1SetField('schedulePlace',place==='新しい候補'?'':place);
  b1SetField('scheduleTransport',c.transportMode||'car');
  b1SetField('scheduleMemo',c.memo||'');
  b1SetField('scheduleMaps',c.googleMapsUrl||'');
  b1SetField('scheduleAddress',c.address||'');
  b1SetField('scheduleLat',c.lat??'');
  b1SetField('scheduleLon',c.lon??'');
  b1SetField('scheduleStation',c.stationName||'');
  const details=document.getElementById('scheduleDetails'); if(details) details.open=false;
  b2SetLocationStatus(
    (normalizedMode==='edit-schedule'||normalizedMode==='edit-candidate') && b2HasCoordinates(c)
      ? '位置情報は登録済みです。場所・URL・住所を変更した場合だけ再検索します。'
      : '保存時に場所名から地図情報を自動取得します。',
    'info'
  );
  b2SetSaveBusy(false);

  // B.1.1: show the full compact modal first. Do not summon the iOS keyboard
  // until the user explicitly taps a field. Blurring also closes a keyboard
  // left open by a parent editor before this modal appears.
  if(document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const modal=document.getElementById('scheduleEditorModal');
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  const body=modal?.querySelector('.schedule-editor-body');
  if(body) body.scrollTop=0;
}

function closeScheduleEditor(){
  scheduleEditorContext=null;
  const modal=document.getElementById('scheduleEditorModal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden','true');
  const parentOpen=document.getElementById('editorModal')?.classList.contains('open')||document.getElementById('candidateModal')?.classList.contains('open')||document.getElementById('recordDetailModal')?.classList.contains('open');
  if(!parentOpen) document.body.classList.remove('modal-open');
}

/* =========================================================
   v2.5.8-B.2.1 Smart Place Input
   - place name -> MapKit on Save
   - auto-fill address / lat / lon
   - auto-generate Google Maps URL for resolved place names
   - only re-resolve existing schedules when location inputs changed
   ========================================================= */
function b2NormalizeText(value){ return String(value??'').trim().replace(/\s+/g,' '); }
function b2SameText(a,b){ return b2NormalizeText(a)===b2NormalizeText(b); }

// B.2.1: Do not silently turn an ambiguous category word such as "カフェ"
// into the first MapKit result. A generic category is not a unique destination.
function b2PlaceMatchKey(value){
  return b2NormalizeText(value)
    .toLocaleLowerCase('ja-JP')
    .replace(/[\s　・･·'’"“”`´.,，。:：;；!！?？()（）\[\]［］{}｛｝\-_ー]/g,'');
}
function b2IsLikelyAddress(value){
  const text=b2NormalizeText(value);
  if(!text) return false;
  return /〒?\d{3}[-ー]?\d{4}/.test(text)
    || /(?:都|道|府|県).*(?:市|区|町|村)/.test(text)
    || /(?:市|区|町|村).*(?:丁目|番地|番|号|[-ー]\d)/.test(text)
    || /\d+[-ー]\d+(?:[-ー]\d+)?/.test(text);
}
function b2IsGenericPlaceQuery(value){
  const key=b2PlaceMatchKey(value);
  if(!key) return false;
  const generic=new Set([
    'カフェ','cafe','喫茶店','コーヒー','coffee','レストラン','restaurant',
    'ランチ','昼食','ごはん','ご飯','食事','ディナー','夕食','居酒屋','バー','bar',
    'ホテル','hotel','宿','宿泊','旅館','温泉','公園','park','駅','station',
    'コンビニ','スーパー','ショッピング','買い物','観光','観光地','美術館','博物館',
    'ワイナリー','winery','ぶどう狩り','果樹園','道の駅','駐車場','parking'
  ].map(b2PlaceMatchKey));
  return generic.has(key);
}
function b2ResolvedNameLooksRelevant(query,resolvedName){
  const q=b2PlaceMatchKey(query), r=b2PlaceMatchKey(resolvedName);
  if(!q||!r) return true;
  if(q===r||q.includes(r)||r.includes(q)) return true;

  // For longer proper names, allow a strong shared substring so minor punctuation,
  // branch labels, or notation differences from MapKit do not create false errors.
  if(q.length>=6){
    const chunkSize=Math.min(6,Math.max(4,Math.floor(q.length*0.45)));
    for(let i=0;i<=q.length-chunkSize;i++){
      if(r.includes(q.slice(i,i+chunkSize))) return true;
    }
  }
  return false;
}
function b2HasCoordinates(c){ return b1NumberOrNull(c?.lat)!==null&&b1NumberOrNull(c?.lon)!==null; }
function b2GoogleMapsUrl(lat,lon){
  const la=b1NumberOrNull(lat),lo=b1NumberOrNull(lon);
  if(la===null||lo===null) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${la},${lo}`)}`;
}
function b2SetLocationStatus(message='',state='info'){
  const el=document.getElementById('scheduleLocationStatus');
  if(!el) return;
  el.textContent=message;
  el.className=`schedule-location-status ${state||'info'}`;
}
function b2SetSaveBusy(busy,label='保存'){
  const button=document.getElementById('scheduleEditorSave');
  if(!button) return;
  button.disabled=!!busy;
  button.classList.toggle('is-busy',!!busy);
  button.textContent=busy?'場所を確認中…':label;
}
function b2LocationInputsChanged(candidate,ctx){
  if(!ctx||ctx.mode==='new-slot'||ctx.mode==='add-candidate') return true;
  const coordsChanged=b1NumberOrNull(candidate.lat)!==b1NumberOrNull(ctx.originalLat)||b1NumberOrNull(candidate.lon)!==b1NumberOrNull(ctx.originalLon);
  const unresolvedChanged=!!candidate.locationUnresolved!==!!ctx.originalLocationUnresolved;
  return !b2SameText(candidate.destination,ctx.originalPlace)
    ||!b2SameText(candidate.googleMapsUrl,ctx.originalMaps)
    ||!b2SameText(candidate.address,ctx.originalAddress)
    ||coordsChanged
    ||unresolvedChanged;
}
function b2CoordinatesManuallyChanged(candidate,ctx){
  if(!ctx) return false;
  const lat=b1NumberOrNull(candidate.lat),lon=b1NumberOrNull(candidate.lon);
  if(lat===null||lon===null) return false;
  if(ctx.mode==='new-slot'||ctx.mode==='add-candidate') return true;
  return lat!==b1NumberOrNull(ctx.originalLat)||lon!==b1NumberOrNull(ctx.originalLon);
}
function b2OpenLocationDetails(message){
  const details=document.getElementById('scheduleDetails');
  if(details) details.open=true;
  b2SetLocationStatus(message,'error');
  const maps=document.getElementById('scheduleMaps');
  const address=document.getElementById('scheduleAddress');
  const focusTarget=(maps&&!maps.value.trim())?maps:address;
  if(focusTarget){
    setTimeout(()=>{
      try{ focusTarget.scrollIntoView({behavior:'smooth',block:'center'}); focusTarget.focus({preventScroll:true}); }catch(_e){ focusTarget.focus(); }
    },80);
  }
}
async function b2PrepareLocation(candidate,ctx){
  const hasLocationInput=!!b2NormalizeText(candidate.destination||candidate.address||candidate.googleMapsUrl);

  // B.3.1: allow intentionally vague plans (e.g. "カフェ") without inventing a destination.
  // When unresolved is explicitly selected, stale/guessed map details are cleared.
  if(candidate.locationUnresolved){
    candidate.address='';
    candidate.googleMapsUrl='';
    candidate.lat=null;
    candidate.lon=null;
    candidate.locationResolutionSource='unresolved';
    candidate.locationResolvedAt='';
    b1SetField('scheduleAddress','');
    b1SetField('scheduleMaps','');
    b1SetField('scheduleLat','');
    b1SetField('scheduleLon','');
    b2SetLocationStatus('場所未確定として保存します。具体的な目的地が決まったらチェックを外して再保存してください。','unresolved');
    return {ok:true,candidate};
  }

  if(!hasLocationInput) return {ok:true,candidate};

  const changed=b2LocationInputsChanged(candidate,ctx);

  // B.3.1: when only the place name changed, old address/URL/coordinates must not
  // masquerade as user-entered data for the new destination. Keep only detail fields
  // the user actually changed in the same edit session.
  if(ctx&&(ctx.mode==='edit-schedule'||ctx.mode==='edit-candidate')){
    const placeChanged=!b2SameText(candidate.destination,ctx.originalPlace);
    if(placeChanged){
      const mapsChanged=!b2SameText(candidate.googleMapsUrl,ctx.originalMaps);
      const addressChanged=!b2SameText(candidate.address,ctx.originalAddress);
      const coordsChanged=b1NumberOrNull(candidate.lat)!==b1NumberOrNull(ctx.originalLat)||b1NumberOrNull(candidate.lon)!==b1NumberOrNull(ctx.originalLon);
      if(!mapsChanged) candidate.googleMapsUrl='';
      if(!addressChanged) candidate.address='';
      if(!coordsChanged){ candidate.lat=null; candidate.lon=null; }
    }
  }

  // B.2 may already have saved a generic category by mistake. If the saved
  // coordinates/Google Maps URL were automatically generated by MapKit, do not
  // keep that old guess silently. Ask for a unique facility name instead.
  const currentDestination=b2NormalizeText(candidate.destination);
  const autoGeneratedMapUrl=b2HasCoordinates(candidate)
    &&b2SameText(candidate.googleMapsUrl,b2GoogleMapsUrl(candidate.lat,candidate.lon));
  const looksLikeOldAmbiguousAutoResolve=!changed
    &&b2IsGenericPlaceQuery(currentDestination)
    &&candidate.locationResolutionSource==='mapkit'
    &&autoGeneratedMapUrl;
  if(looksLikeOldAmbiguousAutoResolve){
    return {
      ok:false,
      candidate,
      reason:'ambiguous_existing_result',
      message:`「${currentDestination}」は候補が複数あるため、以前自動取得した位置情報をそのまま使用できません。施設名（例：○○カフェ）を入力するか、Google Map URLまたは住所を入力してください。`
    };
  }

  // Existing schedule + no location edit: preserve coordinates exactly as-is.
  if(!changed && (ctx?.mode==='edit-schedule'||ctx?.mode==='edit-candidate')){
    return {ok:true,candidate};
  }

  // Explicitly edited coordinates are authoritative and do not need MapKit.
  if(b2CoordinatesManuallyChanged(candidate,ctx)){
    if(!candidate.googleMapsUrl) candidate.googleMapsUrl=b2GoogleMapsUrl(candidate.lat,candidate.lon);
    candidate.locationResolutionSource='manual_coordinates';
    candidate.locationResolvedAt=new Date().toISOString();
    return {ok:true,candidate};
  }

  // Location text/URL changed. Never carry old coordinates into the new destination.
  candidate.lat=null;
  candidate.lon=null;

  const destinationText=b2NormalizeText(candidate.destination);
  const hasExplicitAddress=!!b2NormalizeText(candidate.address);
  const hasMapsUrl=!!b2NormalizeText(candidate.googleMapsUrl);
  if(destinationText&&!hasExplicitAddress&&!hasMapsUrl&&b2IsGenericPlaceQuery(destinationText)){
    return {
      ok:false,
      candidate,
      reason:'ambiguous_query',
      message:`「${destinationText}」だけでは目的地を1か所に特定できません。施設名を具体的にするか、右側の「場所未確定」にチェックして保存してください。`
    };
  }

  b2SetLocationStatus('場所を確認しています…','checking');

  const queryCandidate={
    ...candidate,
    // A newly supplied Google Maps URL should be authoritative.
    preferMapsUrl:!!b2NormalizeText(candidate.googleMapsUrl)
  };
  const tripHint=(typeof getTrip==='function'?getTrip(ctx?.source||'edit'):null);
  let resolved=null;
  try{
    resolved=await resolvePlaceWithNativeSearch(queryCandidate,tripHint);
  }catch(err){
    console.warn('B.2 place resolution failed',err);
  }
  if(!resolved){
    return {ok:false,candidate,reason:'not_found'};
  }

  // A place-name search must resemble the returned MapKit name. This prevents
  // unrelated results (e.g. a school for the query "カフェ") from being saved.
  if(destinationText&&!hasExplicitAddress&&!hasMapsUrl&&!b2IsLikelyAddress(destinationText)
      &&!b2ResolvedNameLooksRelevant(destinationText,resolved.name||'')){
    console.warn('B.2.1 rejected unrelated MapKit result',{query:destinationText,resolvedName:resolved.name,address:resolved.address});
    return {
      ok:false,
      candidate,
      reason:'unrelated_result',
      message:`「${destinationText}」に一致する施設を特定できませんでした。施設名をより具体的にするか、右側の「場所未確定」にチェックして保存してください。`
    };
  }

  candidate.lat=resolved.lat;
  candidate.lon=resolved.lon;
  if(resolved.address) candidate.address=resolved.address;
  if(!candidate.googleMapsUrl) candidate.googleMapsUrl=b2GoogleMapsUrl(resolved.lat,resolved.lon);
  candidate.locationResolutionSource=resolved.source||'mapkit';
  candidate.locationResolvedAt=new Date().toISOString();

  // Keep hidden detail inputs synchronized so opening Details immediately shows
  // exactly what will be saved.
  b1SetField('scheduleAddress',candidate.address||'');
  b1SetField('scheduleLat',candidate.lat??'');
  b1SetField('scheduleLon',candidate.lon??'');
  b1SetField('scheduleMaps',candidate.googleMapsUrl||'');
  b2SetLocationStatus(`✓ ${candidate.address?'住所・位置情報を自動取得しました':'位置情報を自動取得しました'}`,'ok');
  return {ok:true,candidate};
}

function b1ReadScheduleForm(existing={}){
  const place=document.getElementById('schedulePlace').value.trim();
  const activity=document.getElementById('scheduleActivity').value.trim();
  const preserveExistingName=!!(scheduleEditorContext&&['edit-schedule','edit-candidate'].includes(scheduleEditorContext.mode)&&place===scheduleEditorContext.originalPlace&&scheduleEditorContext.originalName);
  return {
    candidate:{
      ...existing,
      name:preserveExistingName?scheduleEditorContext.originalName:(place||activity||cleanDisplayName(existing.name||'')||'予定'),
      destination:place,
      activity,
      transportMode:document.getElementById('scheduleTransport').value||'car',
      memo:document.getElementById('scheduleMemo').value.trim(),
      googleMapsUrl:document.getElementById('scheduleMaps').value.trim(),
      address:document.getElementById('scheduleAddress').value.trim(),
      lat:b1NumberOrNull(document.getElementById('scheduleLat').value),
      lon:b1NumberOrNull(document.getElementById('scheduleLon').value),
      stationName:document.getElementById('scheduleStation').value.trim(),
      description:existing.description||'',
      tags:Array.isArray(existing.tags)?existing.tags:[]
    },
    startTime:document.getElementById('scheduleStart').value||'12:00',
    endTime:document.getElementById('scheduleEnd').value||''
  };
}

async function saveScheduleEditor(){
  const ctx=scheduleEditorContext; if(!ctx) return;
  const activity=document.getElementById('scheduleActivity').value.trim();
  const place=document.getElementById('schedulePlace').value.trim();
  if(!activity&&!place){ alert('「すること」または「場所」を入力してください。'); return; }

  // Read the form before resolution so location-change detection can compare it
  // with the original record. Nothing is written to APP_DATA until resolution succeeds.
  const existing=(ctx.mode==='edit-schedule'||ctx.mode==='edit-candidate')?(b1ScheduleCandidate(ctx)||{}):{};
  const draft=b1ReadScheduleForm(existing);
  b2SetSaveBusy(true);
  const locationResult=await b2PrepareLocation(draft.candidate,ctx);

  // User may have closed the modal while MapKit was working.
  if(scheduleEditorContext!==ctx){ b2SetSaveBusy(false); return; }
  if(!locationResult.ok){
    b2SetSaveBusy(false);
    b2OpenLocationDetails(locationResult.message||'場所を特定できませんでした。Google Map URLまたは住所を入力してください。');
    return;
  }
  draft.candidate=locationResult.candidate;

  if(ctx.mode==='new-slot'){
    const plan=getPlan(ctx.dayNum,ctx.planId,ctx.source||'edit'); if(!plan){ b2SetSaveBusy(false); return; }
    const cid=uid('candidate'), sid=uid(`d${ctx.dayNum}${ctx.planId}-slot`);
    draft.candidate.id=cid;
    plan.slots.push({id:sid,startTime:draft.startTime,endTime:draft.endTime,timeNote:'',selectedCandidateId:cid,candidates:[draft.candidate]});
  }else{
    const slot=b1ScheduleSlot(ctx); if(!slot){ b2SetSaveBusy(false); return; }
    if(ctx.mode==='add-candidate'){
      if(slot.candidates.length>=MAX_CANDIDATES){ b2SetSaveBusy(false); showToast('候補は最大4つです'); return; }
      const cid=uid('candidate');
      draft.candidate.id=cid;
      slot.startTime=draft.startTime; slot.endTime=draft.endTime;
      b3SyncPlannedFoundationForEditor(slot,ctx.dayNum,draft.startTime,draft.endTime,ctx.source||'app');
      slot.candidates.push(draft.candidate); slot.selectedCandidateId=cid;
    }else{
      const target=b1ScheduleCandidate(ctx); if(!target){ b2SetSaveBusy(false); return; }
      draft.candidate.id=target.id;
      slot.startTime=draft.startTime; slot.endTime=draft.endTime;
      b3SyncPlannedFoundationForEditor(slot,ctx.dayNum,draft.startTime,draft.endTime,ctx.source||'app');
      const idx=slot.candidates.findIndex(c=>c.id===target.id);
      if(idx>=0) slot.candidates[idx]={...target,...draft.candidate};
    }
  }

  const source=ctx.source||'edit';
  b2SetSaveBusy(false);
  closeScheduleEditor();
  if(source==='app'){
    persistAppData(); renderTripDetail(); renderHome();
  }else{
    renderPlanEditor();
  }
  if(document.getElementById('candidateModal')?.classList.contains('open')) renderCandidateModal();
  showToast(ctx.mode==='new-slot'?'✓ 予定を追加しました':ctx.mode==='add-candidate'?'✓ 候補を追加しました':'✓ 予定を保存しました');
}

/* The trip editor no longer creates a blank intermediary candidate. */
function addSlotEditor(dayNum,planId){ openScheduleEditor('new-slot',dayNum,planId,'','edit'); }

function renderPlanEditor(){
  if(!EDIT_DATA) return;
  const day=getDay(editingPlanDay,'edit'),box=document.getElementById('planEditorContent'); if(!day||!box) return;
  box.innerHTML=day.plans.map(plan=>{
    const slots=(plan.slots||[]).map(slot=>{
      const c=selectedCandidate(slot), count=slot.candidates?.length||0;
      const title=cleanDisplayName(c?.destination||c?.name||'未設定の予定');
      const meta=[c?.activity,slotTimeLabel(slot),count>1?`候補 ${count}`:''].filter(Boolean).join(' · ');
      return `<div class="slot-editor-row">
        <div class="slot-editor-top">
          <div class="schedule-slot-summary"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></div>
          <button class="delete-btn" onclick="deleteSlotEditor(${editingPlanDay},'${plan.id}','${slot.id}')">削除</button>
        </div>
        <div class="schedule-editor-trigger-row">
          <button class="btn ghost full compact-btn" onclick="openScheduleEditor('edit-schedule',${editingPlanDay},'${plan.id}','${slot.id}','edit')">予定を編集</button>
          <button class="btn secondary full compact-btn" onclick="openScheduleEditor('add-candidate',${editingPlanDay},'${plan.id}','${slot.id}','edit')" ${count>=MAX_CANDIDATES?'disabled':''}>＋ 候補</button>
        </div>
        ${count>1?`<button class="tiny-edit" style="margin-top:8px" onclick="openCandidateModal(${editingPlanDay},'${plan.id}','${slot.id}','edit')">候補 ${count}件を選択・管理</button>`:''}
      </div>`;
    }).join('');
    return `<div class="plan-editor-card"><div class="plan-editor-head"><div class="plan-code">Plan ${plan.id.toUpperCase()}</div><button class="delete-btn" onclick="deletePlanEditor(${editingPlanDay},'${plan.id}')" ${day.plans.length<=1?'disabled':''}>プラン削除</button></div><label>プラン名<input value="${escapeHtml(plan.name)}" onchange="updatePlanName(${editingPlanDay},'${plan.id}',this.value)"></label>${slots||'<div class="small">予定がありません。</div>'}<button class="btn ghost full" onclick="addSlotEditor(${editingPlanDay},'${plan.id}')">＋ 予定を追加</button></div>`;
  }).join('');
  const add=document.getElementById('addPlanBtn'); if(add){ add.disabled=day.plans.length>=MAX_PLANS; add.textContent=day.plans.length>=MAX_PLANS?'プランは最大4つです':'＋ プランを追加'; }
}

/* Candidate list remains for selection/shuffle, but add/edit now uses the shared form. */
function renderCandidateModal(){
  const slot=candidateSlot(); if(!slot) return;
  const completed=!!candidateContext?.completedEdit;
  document.getElementById('candidateModalTitle').textContent=`${slotTimeLabel(slot)} の候補`;
  document.getElementById('candidateCount').textContent=`${slot.candidates.length}/${MAX_CANDIDATES}`;
  document.getElementById('candidateList').innerHTML=slot.candidates.map((c,i)=>`<div class="candidate-choice ${c.id===slot.selectedCandidateId?'selected':''}">
    <div class="candidate-choice-main" role="button" tabindex="0" onclick="selectCandidate('${c.id}')">
      <div class="candidate-index">${i+1}</div>
      <div><div class="candidate-name">${escapeHtml(cleanDisplayName(c.destination||c.name||'予定'))}</div><div class="candidate-meta">${transportIcon(c.transportMode)} ${escapeHtml(c.activity||'すること未入力')}</div></div>
    </div>
    <div class="candidate-choice-actions">
      <button class="tiny-edit" onclick="selectCandidate('${c.id}')">${c.id===slot.selectedCandidateId?'✓ 選択中':'この候補を選ぶ'}</button>
      <button class="tiny-edit schedule-unified-edit" onclick="openScheduleEditor('edit-candidate',${candidateContext.dayNum},'${candidateContext.planId}','${candidateContext.slotId}','${candidateContext.source}','${c.id}')">編集</button>
      <button class="delete-btn" onclick="deleteCandidate('${c.id}')" ${slot.candidates.length<=1?'disabled':''}>削除</button>
    </div>
  </div>`).join('');
  const add=document.getElementById('candidateAddBtn');
  if(add){
    add.style.display=completed?'none':'';
    add.disabled=slot.candidates.length>=MAX_CANDIDATES;
    add.textContent=slot.candidates.length>=MAX_CANDIDATES?'候補は最大4つです':'＋ 候補を追加';
    add.onclick=()=>openScheduleEditor('add-candidate',candidateContext.dayNum,candidateContext.planId,candidateContext.slotId,candidateContext.source);
  }
  const shuffle=document.getElementById('slotShuffleBtn'); if(shuffle){ shuffle.style.display=completed?'none':''; shuffle.disabled=slot.candidates.length<2; }
  const legacy=document.getElementById('candidateForm'); if(legacy) legacy.classList.remove('show');
}

function openCandidateModal(dayNum,planId,slotId,source='app',openAdd=false){
  candidateContext={dayNum:Number(dayNum),planId,slotId,source,completedEdit:false};
  candidateFormMode=null;
  const modal=document.getElementById('candidateModal');
  modal?.classList.remove('completed-edit-mode'); modal?.classList.add('open');
  document.body.classList.add('modal-open'); renderCandidateModal();
  if(openAdd) openScheduleEditor('add-candidate',dayNum,planId,slotId,source);
}

function openCompletedCandidateOptions(dayNum,planId,slotId,editSelected=false){
  if(editSelected){ openScheduleEditor('edit-schedule',dayNum,planId,slotId,'app'); return; }
  candidateContext={dayNum:Number(dayNum),planId,slotId,source:'app',completedEdit:true};
  candidateFormMode=null;
  const modal=document.getElementById('candidateModal'); if(!modal) return;
  modal.classList.add('open','completed-edit-mode'); document.body.classList.add('modal-open'); renderCandidateModal();
}

/* Legacy candidate-form hooks are redirected to the common schedule form. */
function showCandidateForm(mode,candidateId=null){
  if(!candidateContext) return;
  openScheduleEditor(mode==='add'?'add-candidate':'edit-candidate',candidateContext.dayNum,candidateContext.planId,candidateContext.slotId,candidateContext.source,candidateId||'');
}
function hideCandidateForm(){ candidateFormMode=null; const form=document.getElementById('candidateForm'); if(form) form.classList.remove('show'); }

/* Upcoming card +candidate opens the common editor directly. */
function renderSlotCard(slot,dayNum,planId){
  const trip=getTrip();
  const c=selectedCandidate(slot);
  const count=Array.isArray(slot?.candidates)?slot.candidates.length:0;
  const hasStack=count>=2;
  const status=slotStatus(trip,dayNum,slot);
  const completed=status==='completed';
  const coverRecord=v258ACoverRecord(trip,slot,dayNum);
  const fallbackCover=slot?.coverPhoto?.dataUrl||coverRecord?.previewDataUrl||'';
  const coverKey=coverRecord?.mediaKey||slot?.coverPhoto?.mediaKey||'';
  const hasCover=completed&&!!(fallbackCover||coverKey);
  const hasLocation=!!(c?.destination||c?.address||c?.googleMapsUrl||c?.name);
  const locationLabel=c?.address||c?.destination||'';
  const coverStyle=hasCover&&fallbackCover?` style="--slot-cover-photo:url('${fallbackCover}')"`:'';
  const coverAttr=hasCover&&coverKey?` data-v258-cover-key="${escapeHtml(coverKey)}"`:'';
  const stateLabel=completed?'完了':status==='active'?'進行中':'予定';
  const bundleButton=hasStack
    ? `<button class="slot-bundle-button" onclick="${completed?'openCompletedCandidateOptions':'openCandidateModal'}(${dayNum},'${planId}','${slot.id}'${completed?'':",'app'"})" aria-label="${count}件の候補を表示">${v258A2BundleIcon()}<span>候補</span><strong>${count}</strong></button>`
    : '';
  const addCandidate=(!completed&&!hasStack)
    ? `<button class="candidate-add-mini" onclick="openScheduleEditor('add-candidate',${dayNum},'${planId}','${slot.id}','app')">＋候補</button>`
    : '';

  let bodyActions='';
  if(completed){
    bodyActions=`<div class="slot-completed-actions"><button class="slot-quiet-action" onclick="openScheduleEditor('edit-schedule',${dayNum},'${planId}','${slot.id}','app')">${iconSvg('edit')} 編集</button>${hasLocation?`<button class="slot-quiet-action" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`:''}</div>`;
  }else{
    const buttons=[];
    if(c?.transportMode!=='none') buttons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
    if(hasLocation) buttons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
    bodyActions=`${buttons.length?`<div class="actions ${buttons.length===1?'one':''}">${buttons.join('')}</div>`:''}<div class="slot-finish-row"><button class="slot-finish-button" onclick="completeSlot(${dayNum},'${planId}','${slot.id}')">✓ 予定を終了</button></div>`;
  }

  return `<div class="slot-wrap ${hasStack?'has-stack':''}" data-candidate-count="${count}"><div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}${coverAttr}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="slot-meta-row"><div class="slot-meta-left"><span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>${bundleButton}${coverRecord?'<span class="slot-record-chip">PHOTO</span>':''}</div><span class="slot-state-badge ${status}">${stateLabel}</span></div><div class="title">${escapeHtml(cleanDisplayName(c?.name||c?.destination||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${completed?(locationLabel?`<div class="slot-completed-location">${iconSvg('pin')}<span>${escapeHtml(locationLabel)}</span></div>`:''):(c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}</div>`:'')}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${bodyActions}</div>${addCandidate}</div></div>`;
}

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion=V258B1_VERSION;
  persistAppData();
}catch(err){ console.warn('v2.5.8-B.1 version marker not persisted',err); }


/* =========================================================
   v2.5.8-B.3 Input UX Final
   Adopted Phase 3 backlog P3-01 ... P3-20
   ========================================================= */
let scheduleEditorBusy=false;

function syncTripDateDisplays(){
  [['editStartDate','editStartDateDisplay'],['editEndDate','editEndDateDisplay']].forEach(([inputId,displayId])=>{
    const input=document.getElementById(inputId),display=document.getElementById(displayId);
    if(!input||!display) return;
    const value=input.value||'';
    display.textContent=value?value.replaceAll('-','/'):'—';
    display.classList.toggle('is-empty',!value);
  });
}

/* Keep the native iOS date picker but render it inside a fixed visual shell. */
const b3OriginalOpenTripEditor=openTripEditor;
openTripEditor=function(focusSection='basic',tripId=null){
  b3OriginalOpenTripEditor(focusSection,tripId);
  syncTripDateDisplays();
};
const b3OriginalOpenNewTripEditor=openNewTripEditor;
openNewTripEditor=function(initialDates={}){
  b3OriginalOpenNewTripEditor(initialDates);
  syncTripDateDisplays();
};
const b3OriginalUpdateEditorTripDates=updateEditorTripDates;
updateEditorTripDates=function(){
  syncTripDateDisplays();
  b3OriginalUpdateEditorTripDates();
};

function b3SetFieldError(id,message=''){
  const el=document.getElementById(id);
  if(el) el.textContent=message;
}
function b3MarkField(id,hasError){
  const input=document.getElementById(id);
  const field=input?.closest('.schedule-field');
  if(field) field.classList.toggle('has-error',!!hasError);
}
function b3ClearScheduleErrors(){
  b3SetFieldError('scheduleActivityError','');
  b3SetFieldError('scheduleTimeError','');
  b3SetFieldError('scheduleCoordsError','');
  ['scheduleActivity','scheduleStart','scheduleEnd','scheduleLat','scheduleLon'].forEach(id=>b3MarkField(id,false));
}
function b3ScrollFieldIntoScheduleView(el,focus=false){
  if(!el) return;
  const body=document.querySelector('#scheduleEditorModal .schedule-editor-body');
  if(!body) return;
  const adjust=()=>{
    const br=body.getBoundingClientRect(),er=el.getBoundingClientRect();
    if(er.bottom>br.bottom-18) body.scrollBy({top:er.bottom-br.bottom+34,behavior:'smooth'});
    else if(er.top<br.top+18) body.scrollBy({top:er.top-br.top-28,behavior:'smooth'});
    if(focus){ try{el.focus({preventScroll:true});}catch(_e){el.focus();} }
  };
  requestAnimationFrame(adjust);
  setTimeout(adjust,260);
}
function b3ValidateScheduleForm(){
  b3ClearScheduleErrors();
  const activity=document.getElementById('scheduleActivity')?.value.trim()||'';
  const start=document.getElementById('scheduleStart')?.value||'';
  const end=document.getElementById('scheduleEnd')?.value||'';
  if(!activity){
    b3SetFieldError('scheduleActivityError','「すること」を入力してください。');
    b3MarkField('scheduleActivity',true);
    b3ScrollFieldIntoScheduleView(document.getElementById('scheduleActivity'),true);
    return false;
  }
  if(start&&end&&timeToMinutes(end)<timeToMinutes(start)){
    b3SetFieldError('scheduleTimeError','終了時刻は開始時刻以降にしてください。');
    b3MarkField('scheduleStart',true); b3MarkField('scheduleEnd',true);
    b3ScrollFieldIntoScheduleView(document.getElementById('scheduleEnd'),true);
    return false;
  }
  const latRaw=document.getElementById('scheduleLat')?.value.trim()||'';
  const lonRaw=document.getElementById('scheduleLon')?.value.trim()||'';
  if(latRaw||lonRaw){
    const lat=Number(latRaw),lon=Number(lonRaw);
    const valid=latRaw&&lonRaw&&Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
    if(!valid){
      b3SetFieldError('scheduleCoordsError','緯度は -90〜90、経度は -180〜180 の範囲で両方入力してください。');
      b3MarkField('scheduleLat',true); b3MarkField('scheduleLon',true);
      const details=document.getElementById('scheduleDetails'); if(details) details.open=true;
      b3ScrollFieldIntoScheduleView(document.getElementById('scheduleLat'),true);
      return false;
    }
  }
  return true;
}

/* Busy state also locks explicit close/cancel so a MapKit result cannot race with dismissal. */
b2SetSaveBusy=function(busy,label='保存中…'){
  scheduleEditorBusy=!!busy;
  const save=document.getElementById('scheduleEditorSave');
  if(save){ save.disabled=!!busy; save.classList.toggle('is-busy',!!busy); save.textContent=busy?label:'保存'; }
  const cancel=document.getElementById('scheduleEditorCancel'); if(cancel) cancel.disabled=!!busy;
  const close=document.getElementById('scheduleEditorClose'); if(close) close.disabled=!!busy;
};

function b3CandidateSeed(mode,slot,candidate){
  if(mode==='new-slot') return blankCandidate('TEMP');
  if(mode==='add-candidate'){
    const base=selectedCandidate(slot)||candidate||{};
    const fresh=blankCandidate('TEMP');
    fresh.transportMode=base.transportMode||'car';
    return fresh;
  }
  return candidate||blankCandidate('TEMP');
}

/* Cross-Day Schedule v1 Step B: endDayOffset lives only in the editor context.
   Form serialization, validation and persistence remain unchanged until Step C. */
function scheduleEditorPlannedEndDayOffset(slot){
  const startDate=String(slot?.v21?.plannedStartAt||'').split('T')[0];
  const endDate=String(slot?.v21?.plannedEndAt||'').split('T')[0];
  if(!isSchedulePlannedDateKey(startDate)||!isSchedulePlannedDateKey(endDate)) return 0;
  // UTC midnights number calendar days only; host timezone / DST is irrelevant.
  return new Date(`${endDate}T00:00:00Z`).getTime()-new Date(`${startDate}T00:00:00Z`).getTime()===86400000?1:0;
}

function updateScheduleEndDayUi(){
  const ctx=scheduleEditorContext; if(!ctx) return;
  const start=document.getElementById('scheduleStart').value;
  const end=document.getElementById('scheduleEnd').value;
  const dayDate=getDay(ctx.dayNum,ctx.source)?.date;
  const tripEndDate=getTrip(ctx.source)?.endDate;
  const validDates=isSchedulePlannedDateKey(dayDate)&&isSchedulePlannedDateKey(tripEndDate);
  const canUseNextDay=validDates&&dayDate<tripEndDate;
  if(!canUseNextDay) ctx.endDayOffset=0;
  const same=document.getElementById('scheduleEndDaySame');
  const next=document.getElementById('scheduleEndDayNext');
  same.disabled=!end;
  next.disabled=!end||!canUseNextDay;
  same.setAttribute('aria-pressed',String(ctx.endDayOffset===0));
  next.setAttribute('aria-pressed',String(ctx.endDayOffset===1));
  document.getElementById('scheduleEndDayControls').classList.toggle('is-inactive',!end);
  const isLastDay=validDates&&dayDate===tripEndDate;
  document.getElementById('scheduleEndDayLimit').hidden=!isLastDay;
  if(isLastDay) next.setAttribute('aria-describedby','scheduleEndDayLimit');
  else next.removeAttribute('aria-describedby');
  const endLabel=end.replace(/^0(?=\d:)/,'');
  document.getElementById('scheduleTimePreview').textContent=`${start||'開始未入力'} → ${end?(ctx.endDayOffset===1?'翌':'')+endLabel:'終了なし'}`;
  const suggest=!!(start&&end&&ctx.endDayOffset===0&&canUseNextDay&&timeToMinutes(end)<timeToMinutes(start));
  document.getElementById('scheduleNextDaySuggestionText').textContent=suggest?`翌日 ${endLabel}として設定しますか？`:'';
  document.getElementById('scheduleNextDaySuggestion').hidden=!suggest;
}

function setScheduleEndDayOffset(offset){
  if(!scheduleEditorContext||scheduleEditorBusy||(offset!==0&&offset!==1)) return;
  updateScheduleEndDayUi();
  const button=document.getElementById(offset===1?'scheduleEndDayNext':'scheduleEndDaySame');
  if(button.disabled) return;
  scheduleEditorContext.endDayOffset=offset;
  updateScheduleEndDayUi();
}

openScheduleEditor=function(mode,dayNum,planId,slotId='',source='edit',candidateId=''){
  const normalizedMode=['new-slot','edit-schedule','add-candidate','edit-candidate'].includes(mode)?mode:'edit-schedule';
  scheduleEditorContext={mode:normalizedMode,dayNum:Number(dayNum),planId,slotId:slotId||'',source:source||'edit',candidateId:candidateId||''};
  const slot=b1ScheduleSlot();
  const candidate=b1ScheduleCandidate();
  if(normalizedMode!=='new-slot'&&!slot){ scheduleEditorContext=null; return; }
  if(normalizedMode==='add-candidate'&&slot.candidates.length>=MAX_CANDIDATES){ scheduleEditorContext=null; showToast('候補は最大4つです'); return; }

  const c=b3CandidateSeed(normalizedMode,slot,candidate);
  const start=normalizedMode==='new-slot'?'12:00':(slot?.startTime||'12:00');
  const end=normalizedMode==='new-slot'?'':(slot?.endTime||'');
  const place=(c.destination||cleanDisplayName(c.name||''));
  scheduleEditorContext.originalPlace=place==='新しい候補'?'':place;
  scheduleEditorContext.originalName=c.name||'';
  scheduleEditorContext.originalMaps=String(c.googleMapsUrl||'').trim();
  scheduleEditorContext.originalAddress=String(c.address||'').trim();
  scheduleEditorContext.originalLat=b1NumberOrNull(c.lat);
  scheduleEditorContext.originalLon=b1NumberOrNull(c.lon);
  scheduleEditorContext.originalLocationUnresolved=!!c.locationUnresolved;

  document.getElementById('scheduleEditorTitle').textContent=b1ScheduleTitle(normalizedMode);
  b1SetField('scheduleActivity',normalizedMode==='add-candidate'?'':(c.activity||''));
  b1SetField('scheduleStart',start);
  b1SetField('scheduleEnd',end);
  scheduleEditorContext.endDayOffset=scheduleEditorPlannedEndDayOffset(slot);
  updateScheduleEndDayUi();
  b1SetField('schedulePlace',normalizedMode==='add-candidate'?'':(place==='新しい候補'?'':place));
  b1SetField('scheduleTransport',c.transportMode||'car');
  b1SetField('scheduleMemo',normalizedMode==='add-candidate'?'':(c.memo||''));
  b1SetField('scheduleMaps',normalizedMode==='add-candidate'?'':(c.googleMapsUrl||''));
  b1SetField('scheduleAddress',normalizedMode==='add-candidate'?'':(c.address||''));
  b1SetField('scheduleLat',normalizedMode==='add-candidate'?'':(c.lat??''));
  b1SetField('scheduleLon',normalizedMode==='add-candidate'?'':(c.lon??''));
  b1SetField('scheduleStation',c.stationName||'');
  const unresolvedToggle=document.getElementById('schedulePlaceUnresolved');
  if(unresolvedToggle) unresolvedToggle.checked=normalizedMode==='add-candidate'?false:!!c.locationUnresolved;
  const details=document.getElementById('scheduleDetails'); if(details) details.open=false;
  b3ClearScheduleErrors();
  if((normalizedMode==='edit-schedule'||normalizedMode==='edit-candidate')&&c.locationUnresolved){
    b2SetLocationStatus('場所未確定として保存されています。具体的な目的地が決まったらチェックを外して保存してください。','unresolved');
  }else if((normalizedMode==='edit-schedule'||normalizedMode==='edit-candidate')&&b2HasCoordinates(c)){
    b2SetLocationStatus('✓ 場所を確認済みです。場所・URL・住所を変更した場合だけ再検索します。','ok');
  }else{
    b2SetLocationStatus('保存時に場所名から地図情報を自動取得します。','info');
  }
  b2SetSaveBusy(false);
  if(document.activeElement instanceof HTMLElement) document.activeElement.blur();
  const modal=document.getElementById('scheduleEditorModal');
  modal?.classList.add('open'); modal?.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  const body=modal?.querySelector('.schedule-editor-body'); if(body) body.scrollTop=0;
};

closeScheduleEditor=function(force=false){
  if(scheduleEditorBusy&&!force){ b2SetLocationStatus('保存処理中です。少しお待ちください。','checking'); return; }
  scheduleEditorContext=null;
  b3ClearScheduleErrors();
  const modal=document.getElementById('scheduleEditorModal');
  modal?.classList.remove('open'); modal?.setAttribute('aria-hidden','true');
  const parentOpen=document.getElementById('editorModal')?.classList.contains('open')||document.getElementById('candidateModal')?.classList.contains('open')||document.getElementById('recordDetailModal')?.classList.contains('open');
  if(!parentOpen) document.body.classList.remove('modal-open');
};

/* Station name stays in legacy data if it exists, but is no longer user-facing. */
b1ReadScheduleForm=function(existing={}){
  const place=document.getElementById('schedulePlace').value.trim();
  const activity=document.getElementById('scheduleActivity').value.trim();
  const preserveExistingName=!!(scheduleEditorContext&&['edit-schedule','edit-candidate'].includes(scheduleEditorContext.mode)&&place===scheduleEditorContext.originalPlace&&scheduleEditorContext.originalName);
  return {
    candidate:{
      ...existing,
      name:preserveExistingName?scheduleEditorContext.originalName:(place||activity||cleanDisplayName(existing.name||'')||'予定'),
      destination:place,
      activity,
      transportMode:document.getElementById('scheduleTransport').value||'car',
      memo:document.getElementById('scheduleMemo').value.trim(),
      googleMapsUrl:document.getElementById('scheduleMaps').value.trim(),
      address:document.getElementById('scheduleAddress').value.trim(),
      lat:b1NumberOrNull(document.getElementById('scheduleLat').value),
      lon:b1NumberOrNull(document.getElementById('scheduleLon').value),
      locationUnresolved:!!document.getElementById('schedulePlaceUnresolved')?.checked,
      description:existing.description||'',
      tags:Array.isArray(existing.tags)?existing.tags:[]
    },
    startTime:document.getElementById('scheduleStart').value||'12:00',
    endTime:document.getElementById('scheduleEnd').value||''
  };
};

function b3ScrollToSavedSlot(slotId,source){
  if(!slotId) return;
  setTimeout(()=>{
    const attr=source==='app'?'data-slot-id':'data-editor-slot-id';
    const el=document.querySelector(`[${attr}="${slotId}"]`); if(!el) return;
    if(source==='edit'){
      const container=document.querySelector('#editorModal .modal-body');
      if(container){
        const cr=container.getBoundingClientRect(),er=el.getBoundingClientRect();
        container.scrollTo({top:Math.max(0,container.scrollTop+(er.top-cr.top)-90),behavior:'smooth'}); return;
      }
    }
    el.scrollIntoView({behavior:'smooth',block:'center'});
  },90);
}

saveScheduleEditor=async function(){
  const ctx=scheduleEditorContext; if(!ctx||scheduleEditorBusy) return;
  if(!b3ValidateScheduleForm()) return;
  const existing=(ctx.mode==='edit-schedule'||ctx.mode==='edit-candidate')?(b1ScheduleCandidate(ctx)||{}):{};
  const draft=b1ReadScheduleForm(existing);
  const needsPlaceCheck=!draft.candidate.locationUnresolved
    && !!b2NormalizeText(draft.candidate.destination||draft.candidate.address||draft.candidate.googleMapsUrl)
    && (ctx.mode==='new-slot'||ctx.mode==='add-candidate'||b2LocationInputsChanged(draft.candidate,ctx)||!b2HasCoordinates(draft.candidate));
  b2SetSaveBusy(true,needsPlaceCheck?'場所を確認中…':'保存中…');
  const locationResult=await b2PrepareLocation(draft.candidate,ctx);
  if(scheduleEditorContext!==ctx){ b2SetSaveBusy(false); return; }
  if(!locationResult.ok){
    b2SetSaveBusy(false);
    b2OpenLocationDetails(locationResult.message||'場所を特定できませんでした。Google Map URLまたは住所を入力してください。');
    return;
  }
  draft.candidate=locationResult.candidate;
  let savedSlotId=ctx.slotId;
  if(ctx.mode==='new-slot'){
    const plan=getPlan(ctx.dayNum,ctx.planId,ctx.source||'edit'); if(!plan){ b2SetSaveBusy(false); return; }
    const cid=uid('candidate'),sid=uid(`d${ctx.dayNum}${ctx.planId}-slot`); savedSlotId=sid;
    draft.candidate.id=cid;
    plan.slots.push({id:sid,startTime:draft.startTime,endTime:draft.endTime,timeNote:'',selectedCandidateId:cid,candidates:[draft.candidate]});
  }else{
    const slot=b1ScheduleSlot(ctx); if(!slot){ b2SetSaveBusy(false); return; }
    savedSlotId=slot.id;
    if(ctx.mode==='add-candidate'){
      if(slot.candidates.length>=MAX_CANDIDATES){ b2SetSaveBusy(false); showToast('候補は最大4つです'); return; }
      const cid=uid('candidate'); draft.candidate.id=cid;
      slot.startTime=draft.startTime; slot.endTime=draft.endTime;
      slot.candidates.push(draft.candidate); slot.selectedCandidateId=cid;
    }else{
      const target=b1ScheduleCandidate(ctx); if(!target){ b2SetSaveBusy(false); return; }
      draft.candidate.id=target.id;
      slot.startTime=draft.startTime; slot.endTime=draft.endTime;
      const idx=slot.candidates.findIndex(c=>c.id===target.id);
      if(idx>=0) slot.candidates[idx]={...target,...draft.candidate};
    }
  }
  const source=ctx.source||'edit';
  b2SetSaveBusy(false);
  closeScheduleEditor(true);
  if(source==='app'){ persistAppData(); renderTripDetail(); renderHome(); }
  else renderPlanEditor();
  if(document.getElementById('candidateModal')?.classList.contains('open')) closeCandidateModal();
  b3ScrollToSavedSlot(savedSlotId,source);
  showToast(ctx.mode==='new-slot'?'✓ 予定を追加しました':ctx.mode==='add-candidate'?'✓ 候補を追加しました':'✓ 予定を保存しました');
};

/* Data attributes make the post-save return position deterministic. */
const b3PreviousRenderPlanEditor=renderPlanEditor;
renderPlanEditor=function(){
  b3PreviousRenderPlanEditor();
  const day=getDay(editingPlanDay,'edit'); if(!day) return;
  const rows=[...document.querySelectorAll('#planEditorContent .slot-editor-row')];
  let i=0;
  day.plans.forEach(plan=>(plan.slots||[]).forEach(slot=>{ if(rows[i]) rows[i].setAttribute('data-editor-slot-id',slot.id); i++; }));
};

const b3PreviousRenderSlotCard=renderSlotCard;
renderSlotCard=function(slot,dayNum,planId){
  const trip=getTrip();
  const c=selectedCandidate(slot);
  const count=Array.isArray(slot?.candidates)?slot.candidates.length:0;
  const hasStack=count>=2;
  const status=slotStatus(trip,dayNum,slot);
  const completed=status==='completed';
  const coverRecord=v258ACoverRecord(trip,slot,dayNum);
  const fallbackCover=slot?.coverPhoto?.dataUrl||coverRecord?.previewDataUrl||'';
  const coverKey=coverRecord?.mediaKey||slot?.coverPhoto?.mediaKey||'';
  const hasCover=completed&&!!(fallbackCover||coverKey);
  const hasLocation=!!(c?.destination||c?.address||c?.googleMapsUrl||c?.name);
  const locationLabel=c?.address||c?.destination||'';
  const unresolved=!!c?.locationUnresolved;
  const coverStyle=hasCover&&fallbackCover?` style="--slot-cover-photo:url('${fallbackCover}')"`:'';
  const coverAttr=hasCover&&coverKey?` data-v258-cover-key="${escapeHtml(coverKey)}"`:'';
  const stateLabel=completed?'完了':status==='active'?'進行中':'予定';
  const bundleButton=hasStack
    ? `<button class="slot-bundle-button" onclick="${completed?'openCompletedCandidateOptions':'openCandidateModal'}(${dayNum},'${planId}','${slot.id}'${completed?'':",'app'"})" aria-label="${count}件の候補を表示">${v258A2BundleIcon()}<span>候補</span><strong>${count}</strong></button>`
    : '';
  const addCandidate=(!completed&&!hasStack)
    ? `<button class="slot-add-candidate-button" onclick="openScheduleEditor('add-candidate',${dayNum},'${planId}','${slot.id}','app')">＋候補</button>`
    : '';
  let bodyActions='';
  if(completed){
    bodyActions=`<div class="slot-completed-actions"><button class="slot-quiet-action" onclick="openScheduleEditor('edit-schedule',${dayNum},'${planId}','${slot.id}','app')">${iconSvg('edit')} 編集</button>${hasLocation?`<button class="slot-quiet-action" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`:''}</div>`;
  }else{
    const buttons=[];
    if(c?.transportMode!=='none') buttons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
    if(hasLocation) buttons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
    bodyActions=`${buttons.length?`<div class="actions ${buttons.length===1?'one':''}">${buttons.join('')}</div>`:''}<div class="slot-finish-row"><button class="slot-finish-button" onclick="completeSlot(${dayNum},'${planId}','${slot.id}')">✓ 予定を終了</button></div>`;
  }
  return `<div class="slot-wrap ${hasStack?'has-stack':''}" data-candidate-count="${count}" data-slot-id="${slot.id}"><div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}${coverAttr}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="slot-meta-row"><div class="slot-meta-left"><span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>${bundleButton}${addCandidate}${coverRecord?'<span class="slot-record-chip">PHOTO</span>':''}</div><span class="slot-state-badge ${status}">${stateLabel}</span></div><div class="title">${escapeHtml(cleanDisplayName(c?.name||c?.destination||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${completed?(locationLabel?`<div class="slot-completed-location">${iconSvg('pin')}<span>${escapeHtml(locationLabel)}</span>${unresolved?'<span class="slot-unresolved-badge">場所未確定</span>':''}</div>`:''):(c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}${unresolved?'<span class="slot-unresolved-badge">場所未確定</span>':''}</div>`:'')}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${bodyActions}</div></div></div>`;
};

function b31BlockUnresolvedNavigation(candidate){
  if(!candidate?.locationUnresolved) return false;
  alert('目的地がまだ決まっていません。予定を編集して具体的な場所を設定してください。');
  return true;
}
navigateCandidate=function(day,planId,slotId){
  const c=selectedCandidate(getSlot(day,planId,slotId));
  if(!c||c.transportMode==='none'||b31BlockUnresolvedNavigation(c)) return;
  navigateByPreference(c,c.transportMode);
};
mapCandidate=function(day,planId,slotId){
  const c=selectedCandidate(getSlot(day,planId,slotId));
  if(!c||b31BlockUnresolvedNavigation(c)) return;
  const url=buildMapSearchUrl(c); if(url) openExternal(url); else alert('目的地を登録してください。');
};

function b3BindScheduleEditorUx(){
  const modal=document.getElementById('scheduleEditorModal'); if(!modal||modal.dataset.b3Bound==='1') return;
  modal.dataset.b3Bound='1';
  const body=modal.querySelector('.schedule-editor-body');
  body?.addEventListener('focusin',e=>{
    const t=e.target; if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement) b3ScrollFieldIntoScheduleView(t,false);
  });
  ['scheduleStart','scheduleEnd'].forEach(id=>{
    const input=document.getElementById(id);
    input?.addEventListener('input',updateScheduleEndDayUi);
    input?.addEventListener('change',updateScheduleEndDayUi);
  });
  ['scheduleActivity','scheduleStart','scheduleEnd','scheduleLat','scheduleLon'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',()=>{
      if(id==='scheduleActivity'){ b3SetFieldError('scheduleActivityError',''); b3MarkField(id,false); }
      if(id==='scheduleStart'||id==='scheduleEnd'){ b3SetFieldError('scheduleTimeError',''); b3MarkField('scheduleStart',false); b3MarkField('scheduleEnd',false); }
      if(id==='scheduleLat'||id==='scheduleLon'){ b3SetFieldError('scheduleCoordsError',''); b3MarkField('scheduleLat',false); b3MarkField('scheduleLon',false); }
    });
  });
  ['schedulePlace','scheduleMaps','scheduleAddress'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',()=>{
      const unresolved=!!document.getElementById('schedulePlaceUnresolved')?.checked;
      b2SetLocationStatus(unresolved?'場所未確定として保存します。':'変更内容は保存時に確認します。',unresolved?'unresolved':'info');
    });
  });
  document.getElementById('schedulePlaceUnresolved')?.addEventListener('change',e=>{
    const checked=!!e.target.checked;
    b2SetLocationStatus(checked
      ?'場所未確定として保存します。住所・地図URL・緯度経度は保存時にクリアされます。'
      :'保存時に場所名から地図情報を自動取得します。',checked?'unresolved':'info');
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',()=>{
      if(!modal.classList.contains('open')) return;
      const active=document.activeElement;
      if(active&&modal.contains(active)) b3ScrollFieldIntoScheduleView(active,false);
    });
  }
}
document.addEventListener('DOMContentLoaded',()=>{ syncTripDateDisplays(); b3BindScheduleEditorUx(); });

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion='2.6.0-B.3.1';
  persistAppData();
}catch(err){ console.warn('v2.6.0-B.3.1 version marker not persisted',err); }

/* =========================================================
   v2.6.0-B.3.1 Phase 4B.3 Schedule Progression Core
   Planned times no longer auto-complete a Schedule. Manual
   Start / Finish / Skip transitions write actual times while
   keeping planned times intact. Simple actions use the ±15 min
   snap rule. Explicit time editing will be added later.
   ========================================================= */
const B3_SCHEDULE_STATES=['upcoming','active','extended','completed','skipped'];
const B3_SNAP_MINUTES=15;

function b3SyncPlannedFoundationForEditor(slot,dayNum,startTime,endTime,source='app'){
  if(!slot) return;
  const day=getDay(dayNum,source); if(!day) return;
  slot.v21=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
  slot.v21.plannedStartAt=localDateTimeValue(day.date,startTime||slot.startTime||'');
  slot.v21.plannedEndAt=localDateTimeValue(day.date,endTime||slot.endTime||'');
  slot.v21.plannedDurationMinutes=durationMinutes(startTime||slot.startTime||'',endTime||slot.endTime||'');
}

function b3ScheduleContext(tripId,dayNum,planId,slotId){
  const trip=getTripById(tripId)||getRecordTrip?.()||getTrip();
  if(!trip) return null;
  const day=getDayFromTrip(trip,dayNum); if(!day) return null;
  const plan=getPlanFromTrip(trip,dayNum,planId)||getActivePlanFromTrip(trip,dayNum); if(!plan) return null;
  const slot=plan.slots?.find(s=>String(s.id)===String(slotId)); if(!slot) return null;
  slot.v21=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
  return {trip,day,plan,slot,meta:slot.v21,candidate:selectedCandidate(slot)};
}
function b3StatusForSlot(trip,dayNum,slot){
  if(!trip||!slot) return 'upcoming';
  const day=getDayFromTrip(trip,dayNum); if(!day) return 'upcoming';
  const meta=slot.v21||{};
  if(B3_SCHEDULE_STATES.includes(meta.status)) return meta.status;
  if(slot.completedAt) return 'completed';
  if(day.date<localDateKey()) return 'completed';
  return 'upcoming';
}
slotStatus=function(trip,dayNum,slot){ return b3StatusForSlot(trip,dayNum,slot); };

function b3SnapIso(candidateDate,plannedAt){
  const candidate=candidateDate instanceof Date?candidateDate:new Date(candidateDate||Date.now());
  if(Number.isNaN(candidate.getTime())) return new Date().toISOString();
  const planned=new Date(plannedAt||'');
  if(!Number.isNaN(planned.getTime())&&Math.abs(candidate.getTime()-planned.getTime())<=B3_SNAP_MINUTES*60000) return planned.toISOString();
  return candidate.toISOString();
}
function b3ScheduleIsToday(ctx,now=new Date()){
  return !!ctx&&ctx.day.date===localDateKey(now)&&ctx.trip.startDate<=ctx.day.date&&ctx.trip.endDate>=ctx.day.date;
}
function b3FindActiveSchedule(trip){
  if(!trip) return null;
  for(const day of (trip.days||[])){
    const plan=getActivePlanFromTrip(trip,day.day); if(!plan) continue;
    for(const slot of (plan.slots||[])){
      const status=b3StatusForSlot(trip,day.day,slot);
      if(status==='active'||status==='extended') return b3ScheduleContext(trip.id,day.day,plan.id,slot.id);
    }
  }
  return null;
}
function b3SetCompleted(ctx,candidateDate=new Date(),source='manual_finish_button'){
  if(!ctx) return;
  ctx.meta.actualEndAt=b3SnapIso(candidateDate,ctx.meta.plannedEndAt);
  ctx.meta.status='completed';
  ctx.meta.stateSource=source;
  ctx.meta.manualEndOverride=false;
  ctx.slot.completedAt=ctx.meta.actualEndAt;
}
function b3RefreshScheduleSurfaces(){
  persistAppData();
  try{ renderHome(); }catch(_e){}
  try{ renderTripDetail(); }catch(_e){}
  try{ renderRecordScreen(); }catch(_e){}
}
function b3StartSchedule(tripId,dayNum,planId,slotId){
  const ctx=b3ScheduleContext(tripId,dayNum,planId,slotId); if(!ctx) return;
  if(!b3ScheduleIsToday(ctx)){ showToast('この予定は当日に開始できます'); return; }
  const targetStatus=b3StatusForSlot(ctx.trip,dayNum,ctx.slot);
  if(targetStatus!=='upcoming'){ showToast(targetStatus==='active'||targetStatus==='extended'?'この予定はすでに進行中です':'この予定は開始済みです'); return; }
  const current=b3FindActiveSchedule(ctx.trip);
  if(current){
    const currentName=cleanDisplayName(current.candidate?.name||current.candidate?.destination||'現在の予定');
    const nextName=cleanDisplayName(ctx.candidate?.name||ctx.candidate?.destination||'次の予定');
    if(!confirm(`「${currentName}」を終了して「${nextName}」を開始しますか？`)) return;
    b3SetCompleted(current,new Date(),'next_schedule_manual_start');
  }
  const now=new Date();
  ctx.meta.actualStartAt=b3SnapIso(now,ctx.meta.plannedStartAt);
  ctx.meta.actualEndAt=null;
  ctx.meta.status='active';
  ctx.meta.stateSource='manual_start_button';
  ctx.meta.manualStartOverride=false;
  ctx.meta.manualEndOverride=false;
  ctx.slot.completedAt='';
  b3RefreshScheduleSurfaces();
  showToast('✓ 予定を開始しました');
}
function b3FinishSchedule(tripId,dayNum,planId,slotId){
  const ctx=b3ScheduleContext(tripId,dayNum,planId,slotId); if(!ctx) return;
  if(!['active','extended'].includes(b3StatusForSlot(ctx.trip,dayNum,ctx.slot))){ showToast('進行中の予定だけ終了できます'); return; }
  if(!confirm('この予定を終了しますか？')) return;
  b3SetCompleted(ctx,new Date(),'manual_finish_button');
  b3RefreshScheduleSurfaces();
  showToast('✓ 予定を終了しました');
}
function b3SkipSchedule(tripId,dayNum,planId,slotId){
  const ctx=b3ScheduleContext(tripId,dayNum,planId,slotId); if(!ctx) return;
  if(!b3ScheduleIsToday(ctx)){ showToast('スキップ操作は旅行当日に使えます'); return; }
  if(b3StatusForSlot(ctx.trip,dayNum,ctx.slot)!=='upcoming'){ showToast('これからの予定だけスキップできます'); return; }
  const name=cleanDisplayName(ctx.candidate?.name||ctx.candidate?.destination||'この予定');
  if(!confirm(`「${name}」を今日はスキップしますか？`)) return;
  ctx.meta.status='skipped';
  ctx.meta.stateSource='manual_skip';
  ctx.meta.actualStartAt=null;
  ctx.meta.actualEndAt=null;
  ctx.slot.completedAt='';
  b3RefreshScheduleSurfaces();
  showToast('予定をスキップしました');
}
completeSlot=function(dayNum,planId,slotId){
  const trip=getTrip(); if(!trip) return;
  return b3FinishSchedule(trip.id,dayNum,planId,slotId);
};

function b3TimelineActions(item){
  if(!item||item.type!=='schedule') return '';
  const tripId=item?.tripId||getRecordTrip?.()?.id||getTrip()?.id||'';
  const ctx=b3ScheduleContext(tripId,item.day.day,item.plan.id,item.slot.id);
  if(!ctx||!b3ScheduleIsToday(ctx)) return '';
  const status=b3StatusForSlot(ctx.trip,ctx.day.day,ctx.slot);
  if(status==='upcoming') return `<div class="b3-schedule-actions"><button class="b3-start-button" onclick="b3StartSchedule('${ctx.trip.id}',${ctx.day.day},'${ctx.plan.id}','${ctx.slot.id}')">予定を開始</button><button class="b3-quiet-button" onclick="b3SkipSchedule('${ctx.trip.id}',${ctx.day.day},'${ctx.plan.id}','${ctx.slot.id}')">今日はスキップ</button></div>`;
  if(status==='active'||status==='extended') return `<div class="b3-schedule-actions"><button class="b3-finish-button" onclick="b3FinishSchedule('${ctx.trip.id}',${ctx.day.day},'${ctx.plan.id}','${ctx.slot.id}')">予定を終了</button></div>`;
  return '';
}

const b3BaseBuildTimelineSkeleton=b1BuildTimelineSkeleton;
b1BuildTimelineSkeleton=function(trip,options){
  const result=b3BaseBuildTimelineSkeleton(trip,options);
  (result.days||[]).forEach(dayEntry=>(dayEntry.items||[]).forEach(item=>{
    if(item.type==='schedule') item.tripId=trip.id;
  }));
  return result;
};

b1TimelineItemHtml=function(item,{readOnly=false}={}){
  if(item.type==='unplanned'){
    const allTimes=[...(item.records||[]).map(r=>r.capturedAt||r.createdAt||''),...(item.blocks||[]).map(b=>b.timelineTime||b.createdAt||'')].filter(Boolean).sort((a,b)=>new Date(a)-new Date(b));
    const firstTime=b1TimelineIsoTime(allTimes[0]);
    const lastTime=b1TimelineIsoTime(allTimes[allTimes.length-1]);
    const range=firstTime&&lastTime&&firstTime!==lastTime?`${firstTime}–${lastTime}`:(firstTime||'時間未定');
    return `<section class="b1-timeline-group b1-unplanned-group"><div class="b1-timeline-rail"><span></span></div><div class="b1-timeline-card"><div class="b1-group-top"><div><div class="b1-group-kicker">寄り道</div><h3>予定の外で生まれた記録</h3></div><div class="b1-group-time">${escapeHtml(range)}</div></div><p class="b1-group-sub">予定に合わせ直さなくても、このまま旅の一部として残せます。</p><div class="b1-group-records">${[...(item.records||[]).map(record=>({at:b1RecordSortAt(record),html:b1TimelineRecordHtml(record)})),...(item.blocks||[]).map(block=>({at:b2BlockSortAt(block),html:b2TextBlockHtml(block)}))].sort((a,b)=>a.at-b.at).map(x=>x.html).join('')}</div></div></section>`;
  }
  const {slot,candidate,records,blocks,meta}=item;
  const tripId=item?.tripId||getRecordTrip?.()?.id||getTrip()?.id||'';
  const trip=getTripById(tripId)||getRecordTrip?.()||getTrip();
  const status=b3StatusForSlot(trip,item.day.day,slot);
  const actual=b1ScheduleActualLabel(meta);
  const statusLabel=b1TimelineStatusLabel(status);
  const policy=meta?.timePolicy==='fixed'?'固定':'調整可';
  const actions=readOnly?'':b3TimelineActions({...item,status});
  return `<section class="b1-timeline-group b1-schedule-group status-${escapeHtml(status)}"><div class="b1-timeline-rail"><span></span></div><div class="b1-timeline-card"><div class="b1-group-top"><div><div class="b1-group-kicker">SCHEDULE · ${escapeHtml(statusLabel)}</div><h3>${escapeHtml(cleanDisplayName(candidate?.name||candidate?.destination||'予定'))}</h3></div><div class="b1-group-time">${escapeHtml(slotTimeLabel(slot))}</div></div><div class="b1-schedule-meta"><span>${escapeHtml(policy)}</span>${actual?`<span>${escapeHtml(actual)}</span>`:''}${candidate?.destination?`<span>${iconSvg('pin')} ${escapeHtml(candidate.destination)}</span>`:''}</div>${candidate?.activity?`<p class="b1-group-sub">${escapeHtml(candidate.activity)}</p>`:''}${actions}<div class="b1-group-records">${(records?.length||blocks?.length)?[...(records||[]).map(record=>({at:b1RecordSortAt(record),html:b1TimelineRecordHtml(record)})),...(blocks||[]).map(block=>({at:b2BlockSortAt(block),html:b2TextBlockHtml(block)}))].sort((a,b)=>a.at-b.at).map(x=>x.html).join(''):'<div class="b1-empty-inside">この予定の記録はまだありません。</div>'}</div></div></section>`;
};

const b43PreviousRenderSlotCard=renderSlotCard;
renderSlotCard=function(slot,dayNum,planId){
  const trip=getTrip();
  const c=selectedCandidate(slot);
  const count=Array.isArray(slot?.candidates)?slot.candidates.length:0;
  const hasStack=count>=2;
  const status=b3StatusForSlot(trip,dayNum,slot);
  const completed=status==='completed',skipped=status==='skipped',settled=completed||skipped;
  const coverRecord=v258ACoverRecord(trip,slot,dayNum);
  const fallbackCover=slot?.coverPhoto?.dataUrl||coverRecord?.previewDataUrl||'';
  const coverKey=coverRecord?.mediaKey||slot?.coverPhoto?.mediaKey||'';
  const hasCover=completed&&!!(fallbackCover||coverKey);
  const hasLocation=!!(c?.destination||c?.address||c?.googleMapsUrl||c?.name);
  const locationLabel=c?.address||c?.destination||'';
  const unresolved=!!c?.locationUnresolved;
  const coverStyle=hasCover&&fallbackCover?` style="--slot-cover-photo:url('${fallbackCover}')"`:'';
  const coverAttr=hasCover&&coverKey?` data-v258-cover-key="${escapeHtml(coverKey)}"`:'';
  const stateLabel=({completed:'完了',active:'進行中',extended:'延長中',skipped:'スキップ',upcoming:'予定'})[status]||'予定';
  const bundleButton=hasStack?`<button class="slot-bundle-button" onclick="${completed?'openCompletedCandidateOptions':'openCandidateModal'}(${dayNum},'${planId}','${slot.id}'${completed?'':",'app'"})" aria-label="${count}件の候補を表示">${v258A2BundleIcon()}<span>候補</span><strong>${count}</strong></button>`:'';
  const addCandidate=(!settled&&!hasStack)?`<button class="slot-add-candidate-button" onclick="openScheduleEditor('add-candidate',${dayNum},'${planId}','${slot.id}','app')">＋候補</button>`:'';
  const meta=slot.v21||{};
  const actual=b1ScheduleActualLabel(meta);
  let bodyActions='';
  if(settled){
    bodyActions=`${actual?`<div class="b3-slot-actual">${escapeHtml(actual)}</div>`:''}<div class="slot-completed-actions"><button class="slot-quiet-action" onclick="openScheduleEditor('edit-schedule',${dayNum},'${planId}','${slot.id}','app')">${iconSvg('edit')} 編集</button>${hasLocation?`<button class="slot-quiet-action" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`:''}</div>`;
  }else{
    const buttons=[];
    if(c?.transportMode!=='none') buttons.push(`<button class="btn ${c?.transportMode==='car'?'nav':'walk'}" onclick="navigateCandidate(${dayNum},'${planId}','${slot.id}')">${transportIcon(c?.transportMode)} ${navPreferenceLabel(c?.transportMode)}</button>`);
    if(hasLocation) buttons.push(`<button class="btn secondary" onclick="mapCandidate(${dayNum},'${planId}','${slot.id}')">${iconSvg('pin')} 地図</button>`);
    const ctx=b3ScheduleContext(trip?.id,dayNum,planId,slot.id);
    let stateAction='';
    if(ctx&&b3ScheduleIsToday(ctx)){
      if(status==='upcoming') stateAction=`<div class="b3-trip-state-actions"><button class="b3-trip-start" onclick="b3StartSchedule('${trip.id}',${dayNum},'${planId}','${slot.id}')">予定を開始</button><button class="b3-trip-skip" onclick="b3SkipSchedule('${trip.id}',${dayNum},'${planId}','${slot.id}')">スキップ</button></div>`;
      else if(status==='active'||status==='extended') stateAction=`<div class="b3-trip-state-actions"><button class="slot-finish-button" onclick="b3FinishSchedule('${trip.id}',${dayNum},'${planId}','${slot.id}')">✓ 予定を終了</button></div>`;
    }
    bodyActions=`${buttons.length?`<div class="actions ${buttons.length===1?'one':''}">${buttons.join('')}</div>`:''}${actual?`<div class="b3-slot-actual">${escapeHtml(actual)}</div>`:''}${stateAction}`;
  }
  return `<div class="slot-wrap ${hasStack?'has-stack':''}" data-candidate-count="${count}" data-slot-id="${slot.id}"><div class="card slot-card editorial-slot status-${status} ${hasCover?'has-cover-photo':''}"${coverStyle}${coverAttr}><div class="slot-cover-overlay"></div><div class="slot-main"><div class="slot-meta-row"><div class="slot-meta-left"><span class="slot-time-chip">${escapeHtml(slotTimeLabel(slot))}</span>${bundleButton}${addCandidate}${coverRecord?'<span class="slot-record-chip">PHOTO</span>':''}</div><span class="slot-state-badge ${status}">${stateLabel}</span></div><div class="title">${escapeHtml(cleanDisplayName(c?.name||c?.destination||'未設定の予定'))}</div>${c?.activity?`<div class="activity-line">${escapeHtml(c.activity)}</div>`:''}${c?.description?`<div class="desc">${escapeHtml(c.description)}</div>`:''}${settled?(locationLabel?`<div class="slot-completed-location">${iconSvg('pin')}<span>${escapeHtml(locationLabel)}</span>${unresolved?'<span class="slot-unresolved-badge">場所未確定</span>':''}</div>`:''):(c?.destination?`<div class="destination-line">${iconSvg('pin')} ${escapeHtml(c.destination)}${unresolved?'<span class="slot-unresolved-badge">場所未確定</span>':''}</div>`:'')}${c?.tags?.length?`<div class="tags">${c.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`:''}${bodyActions}</div></div></div>`;
};

/* Update the phase note without duplicating the full Record renderer. */
const b3PreviousRenderRecordScreen=renderRecordScreen;
renderRecordScreen=function(){
  b3PreviousRenderRecordScreen();
  const note=document.querySelector('#record .b1-phase-note');
  if(note) note.innerHTML='<strong>Phase 4B.3</strong><span>Scheduleの開始・終了・スキップとactual時刻記録を追加しました。位置情報による自動切替は次Phaseです。</span>';
};

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion='2.6.0-B.3.1';
  persistAppData();
}catch(err){ console.warn('v2.6.0-B.3.1 version marker not persisted',err); }

/* =========================================================
   v2.6.0-B.3.1 Cross-Day Active Schedule Assignment Hotfix
   An ACTIVE / EXTENDED Schedule outranks the calendar-day
   boundary for Quick Record assignment. A photo or text made
   after midnight remains inside the Schedule that is still in
   progress until that Schedule is explicitly completed.
   ========================================================= */
function b31ActiveScheduleRef(trip){
  const ctx=typeof b3FindActiveSchedule==='function'?b3FindActiveSchedule(trip):null;
  if(!ctx) return null;
  return {
    day:Number(ctx.day.day),
    planId:String(ctx.plan.id||''),
    slotId:String(ctx.slot.id||''),
    actualStartAt:ctx.meta?.actualStartAt||'',
    status:b3StatusForSlot(ctx.trip,ctx.day.day,ctx.slot)
  };
}

function b31ActiveRefStillValid(trip,ref){
  if(!trip||!ref?.slotId) return false;
  const ctx=b3ScheduleContext(trip.id,ref.day,ref.planId,ref.slotId);
  if(!ctx) return false;
  return ['active','extended'].includes(b3StatusForSlot(trip,ctx.day.day,ctx.slot));
}

/* While a Schedule is active, Quick Record remains available even when
   midnight is technically outside the Trip's nominal date range. */
const b31BaseCanQuickRecordNow=b2CanQuickRecordNow;
b2CanQuickRecordNow=function(trip,now=new Date()){
  if(trip&&b31ActiveScheduleRef(trip)) return {ok:true,phase:'active-schedule'};
  return b31BaseCanQuickRecordNow(trip,now);
};

/* Active Schedule lookup must scan the whole Trip, not only today's Day. */
b2FindActiveScheduleRef=function(trip,now=new Date()){
  const ref=b31ActiveScheduleRef(trip);
  return ref?{day:ref.day,planId:ref.planId,slotId:ref.slotId}:null;
};

/* Text Quick Record follows the same cross-day ownership rule. */
b2SubmitQuickText=function(){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip();
  const input=b2QuickTextInput(); const text=input?.value?.trim()||'';
  if(!text) return;
  const now=new Date();
  const eligibility=b2CanQuickRecordNow(trip,now);
  if(!eligibility.ok){ showToast(eligibility.message); return; }
  const iso=now.toISOString();
  const ref=b2FindActiveScheduleRef(trip,now);
  const block={
    id:uid('text'),tripId:trip.id,type:'text',text,createdAt:iso,timelineTime:iso,
    day:ref?.day??b2DayNumberForTime(trip,iso),scheduleRef:ref?{...ref}:null,
    displaySettings:{showTime:true},sortOrder:Date.now()
  };
  b2CoreBlocks().push(block);
  persistAppData();
  if(input) input.value='';
  renderRecordScreen();
  showToast(ref?'✓ 今の予定にメモを追加しました':'✓ 寄り道にメモを追加しました');
};

/* Default the post-capture link selector to the currently active Schedule,
   even when its owning Day is yesterday. The user can still explicitly
   choose another Schedule or "予定に紐付けない". */
const b31BaseRenderCapturedLinkSelectors=renderCapturedLinkSelectors;
renderCapturedLinkSelectors=function(dayChanged=false,existingRecord=null){
  b31BaseRenderCapturedLinkSelectors(dayChanged,existingRecord);
  if(existingRecord||dayChanged) return;
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip();
  const ref=b31ActiveScheduleRef(trip);
  if(!trip||!ref) return;
  const daySelect=document.getElementById('capturedDaySelect');
  const slotSelect=document.getElementById('capturedSlotSelect');
  const day=getDayFromTrip(trip,ref.day);
  const plan=day?getActivePlanFromTrip(trip,ref.day):null;
  if(!daySelect||!slotSelect||!day||!plan) return;
  daySelect.value=String(ref.day);
  const slots=plan.slots||[];
  slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(slot=>{
    const c=selectedCandidate(slot);
    return `<option value="${slot.id}">${escapeHtml(slotTimeLabel(slot))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`;
  }).join('');
  if(slots.some(s=>String(s.id)===String(ref.slotId))) slotSelect.value=String(ref.slotId);
  TRIPPER_CAMERA_STATE.autoScheduleRef={...ref};
  TRIPPER_CAMERA_STATE.manualScheduleSelection=false;
  syncCapturedPlaceFromSlot();
  updateCapturedCoverAvailability();
  try{ updateCapturedLinkSummary(); }catch(_e){}
};

/* Programmatic selector changes do not dispatch change events, so this only
   marks a real user override. Once overridden, save never forces the active
   Schedule back onto the photo. */
document.addEventListener('change',event=>{
  const id=event?.target?.id||'';
  if((id==='capturedDaySelect'||id==='capturedSlotSelect')&&!TRIPPER_CAMERA_STATE?.editRecordId){
    TRIPPER_CAMERA_STATE.manualScheduleSelection=true;
  }
});

const b31BaseSaveCapturedRecord=saveCapturedRecord;
saveCapturedRecord=async function(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value);
  const isEdit=!!TRIPPER_CAMERA_STATE?.editRecordId;
  const ref=TRIPPER_CAMERA_STATE?.autoScheduleRef;
  if(trip&&!isEdit&&!TRIPPER_CAMERA_STATE?.manualScheduleSelection&&ref&&b31ActiveRefStillValid(trip,ref)){
    const daySelect=document.getElementById('capturedDaySelect');
    const slotSelect=document.getElementById('capturedSlotSelect');
    const day=getDayFromTrip(trip,ref.day),plan=day?getActivePlanFromTrip(trip,ref.day):null;
    if(daySelect&&slotSelect&&day&&plan){
      daySelect.value=String(ref.day);
      const slots=plan.slots||[];
      slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(slot=>{
        const c=selectedCandidate(slot);
        return `<option value="${slot.id}">${escapeHtml(slotTimeLabel(slot))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`;
      }).join('');
      slotSelect.value=String(ref.slotId);
    }
  }
  return b31BaseSaveCapturedRecord();
};

/* Repair only the known B.3 regression shape: a Tripper Note camera photo
   was saved unlinked on the next calendar Day while the previous Day's
   Schedule is still ACTIVE. Same-day unlinked records are intentionally
   left untouched so explicit "予定に紐付けない" choices remain respected. */
function b31RepairCrossDayActiveRecords(trip){
  const ref=b31ActiveScheduleRef(trip);
  if(!trip||!ref?.slotId||!ref.actualStartAt) return false;
  const startMs=new Date(ref.actualStartAt).getTime();
  if(!Number.isFinite(startMs)) return false;
  let changed=false;
  for(const record of (trip.records||[])){
    if(record?.captureSource!=='tripper_camera'||record?.slotId) continue;
    if(Number(record.day)===Number(ref.day)) continue;
    const capturedMs=new Date(record.capturedAt||record.createdAt||'').getTime();
    if(!Number.isFinite(capturedMs)||capturedMs<startMs) continue;
    record.day=ref.day;
    record.planId=ref.planId;
    record.slotId=ref.slotId;
    record.autoAssignedBy='active_schedule_cross_day';
    changed=true;
  }
  return changed;
}

/* An active Schedule remains actionable after midnight. Upcoming schedules
   still require their own calendar day to start or skip. */
const b31BaseScheduleIsToday=b3ScheduleIsToday;
b3ScheduleIsToday=function(ctx,now=new Date()){
  if(ctx){
    const status=b3StatusForSlot(ctx.trip,ctx.day.day,ctx.slot);
    if(status==='active'||status==='extended') return true;
  }
  return b31BaseScheduleIsToday(ctx,now);
};

const b31BaseRenderRecordScreen=renderRecordScreen;
renderRecordScreen=function(){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip();
  if(trip&&b31RepairCrossDayActiveRecords(trip)) persistAppData();
  b31BaseRenderRecordScreen();
  const note=document.querySelector('#record .b1-phase-note');
  if(note) note.innerHTML='<strong>Phase 4B.3.1</strong><span>進行中Scheduleは日付をまたいでもQuick Recordを引き継ぎます。</span>';
};

try{
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip();
  if(trip&&b31RepairCrossDayActiveRecords(trip)) persistAppData();
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion='2.6.0-B.3.1';
  persistAppData();
}catch(err){ console.warn('v2.6.0-B.3.1 hotfix initialization failed',err); }


/* =========================================================
   v2.6.0-B.3.2 State Persistence + Cross-Day Linker Hotfix
   - hydrate v2.1 Core DB before startup writes can overwrite it
   - keep live Schedule state in compact rollback bridge
   - recover the narrow B.3.1 overnight test regression when evidence exists
   - Photo Linker prefers the durable ACTIVE Schedule across midnight
   ========================================================= */
function b32DurableActiveScheduleRef(trip){
  if(!trip) return null;
  const found=[];
  for(const day of (trip.days||[])){
    for(const plan of (day.plans||[])){
      for(const slot of (plan.slots||[])){
        const meta=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
        const status=meta.status;
        const openByActual=!!meta.actualStartAt&&!meta.actualEndAt&&!slot.completedAt;
        if(status==='active'||status==='extended'||openByActual){
          found.push({
            day:Number(day.day),planId:String(plan.id||''),slotId:String(slot.id||''),
            actualStartAt:meta.actualStartAt||'',status:status==='extended'?'extended':'active'
          });
        }
      }
    }
  }
  if(!found.length) return null;
  found.sort((a,b)=>new Date(b.actualStartAt||0)-new Date(a.actualStartAt||0));
  return found[0];
}

function b32RefContext(trip,ref){
  if(!trip||!ref?.slotId) return null;
  return b3ScheduleContext(trip.id,ref.day,ref.planId,ref.slotId);
}

function b32ActiveRefStillValid(trip,ref){
  const ctx=b32RefContext(trip,ref); if(!ctx) return false;
  const meta=normalizeScheduleFoundation(ctx.slot.v21||{},ctx.slot,ctx.day.date);
  return (meta.status==='active'||meta.status==='extended'||(!!meta.actualStartAt&&!meta.actualEndAt&&!ctx.slot.completedAt));
}

/* B.3.1 accidentally stripped slot.v21 from the compact bridge. If that build
   was launched after midnight, a still-running previous-day open-ended Schedule
   could be re-inferred as completed. Recover ONLY the narrow, evidence-backed
   shape: exactly one previous-day evening/open-ended Schedule + an unlinked
   Tripper Camera photo shortly after midnight. */
function b32RecoverB31OvernightStateLoss(trip,now=new Date()){
  if(!trip||b32DurableActiveScheduleRef(trip)) return null;
  const today=localDateKey(now);
  const candidates=[];
  for(const day of (trip.days||[])){
    if(addDaysKey(day.date,1)!==today) continue;
    for(const plan of (day.plans||[])){
      for(const slot of (plan.slots||[])){
        if(slot.completedAt||slot.endTime) continue;
        const startMin=slotSortMinutes(slot);
        if(startMin<18*60) continue;
        const meta=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
        if(meta.actualEndAt) continue;
        if(!(meta.status==='completed'&&meta.stateSource==='legacy_date_inferred')) continue;
        const plannedStart=meta.plannedStartAt?new Date(meta.plannedStartAt):null;
        if(!plannedStart||Number.isNaN(plannedStart.getTime())) continue;
        const evidence=(trip.records||[]).filter(record=>{
          if(record?.captureSource!=='tripper_camera'||record?.slotId) return false;
          const dt=new Date(record.capturedAt||record.createdAt||'');
          if(Number.isNaN(dt.getTime())||localDateKey(dt)!==today||dt.getHours()>=6) return false;
          const diff=dt.getTime()-plannedStart.getTime();
          return diff>=0&&diff<=12*60*60*1000;
        });
        if(evidence.length) candidates.push({day,plan,slot,meta,evidence});
      }
    }
  }
  if(candidates.length!==1) return null;
  const hit=candidates[0];
  hit.slot.v21=normalizeScheduleFoundation(hit.slot.v21||{},hit.slot,hit.day.date);
  hit.slot.v21.status='active';
  hit.slot.v21.actualStartAt=hit.slot.v21.plannedStartAt||localDateTimeValue(hit.day.date,hit.slot.startTime||'');
  hit.slot.v21.actualEndAt=null;
  hit.slot.v21.stateSource='b3.2_recovered_b31_overnight_state_loss';
  hit.slot.completedAt='';
  return {day:Number(hit.day.day),planId:String(hit.plan.id||''),slotId:String(hit.slot.id||''),actualStartAt:hit.slot.v21.actualStartAt,status:'active'};
}

function b32PopulateCapturedSelectorsForRef(trip,ref){
  if(!trip||!ref?.slotId) return false;
  const daySelect=document.getElementById('capturedDaySelect');
  const slotSelect=document.getElementById('capturedSlotSelect');
  const day=getDayFromTrip(trip,ref.day);
  const plan=day?getPlanFromTrip(trip,ref.day,ref.planId):null;
  if(!daySelect||!slotSelect||!day||!plan) return false;
  daySelect.value=String(ref.day);
  const slots=plan.slots||[];
  slotSelect.innerHTML=`<option value="">予定に紐付けない</option>`+slots.map(slot=>{
    const c=selectedCandidate(slot);
    return `<option value="${slot.id}">${escapeHtml(slotTimeLabel(slot))} · ${escapeHtml(cleanDisplayName(c?.name||'予定'))}</option>`;
  }).join('');
  if(!slots.some(s=>String(s.id)===String(ref.slotId))) return false;
  slotSelect.value=String(ref.slotId);
  syncCapturedPlaceFromSlot();
  updateCapturedCoverAvailability();
  try{ updateCapturedLinkSummary(); }catch(_e){}
  return true;
}

/* Snapshot the running Schedule at camera launch. This makes the ownership
   decision stable even if the clock crosses midnight while the camera is open. */
const b32BaseStartInAppCamera=startInAppCamera;
startInAppCamera=async function(role='entry'){
  const trip=getRecordTrip?.()||getHomeTrip()||getTrip()||APP_DATA.trips?.[0];
  const launchRef=b32DurableActiveScheduleRef(trip);
  await b32BaseStartInAppCamera(role);
  if(trip&&TRIPPER_CAMERA_STATE?.tripId===trip.id&&launchRef){
    TRIPPER_CAMERA_STATE.launchScheduleRef={...launchRef};
  }
};

const b32BaseRenderCapturedLinkSelectors=renderCapturedLinkSelectors;
renderCapturedLinkSelectors=function(dayChanged=false,existingRecord=null){
  b32BaseRenderCapturedLinkSelectors(dayChanged,existingRecord);
  if(existingRecord||dayChanged) return;
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip();
  if(!trip) return;
  const ref=(TRIPPER_CAMERA_STATE?.launchScheduleRef&&b32ActiveRefStillValid(trip,TRIPPER_CAMERA_STATE.launchScheduleRef))
    ?TRIPPER_CAMERA_STATE.launchScheduleRef
    :b32DurableActiveScheduleRef(trip);
  if(!ref) return;
  if(b32PopulateCapturedSelectorsForRef(trip,ref)){
    TRIPPER_CAMERA_STATE.autoScheduleRef={...ref};
    TRIPPER_CAMERA_STATE.manualScheduleSelection=false;
  }
};

const b32BaseSaveCapturedRecord=saveCapturedRecord;
saveCapturedRecord=async function(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value);
  const isEdit=!!TRIPPER_CAMERA_STATE?.editRecordId;
  const candidateRef=TRIPPER_CAMERA_STATE?.manualScheduleSelection?null:
    ((TRIPPER_CAMERA_STATE?.launchScheduleRef&&b32ActiveRefStillValid(trip,TRIPPER_CAMERA_STATE.launchScheduleRef))
      ?TRIPPER_CAMERA_STATE.launchScheduleRef:b32DurableActiveScheduleRef(trip));
  if(trip&&!isEdit&&candidateRef&&b32PopulateCapturedSelectorsForRef(trip,candidateRef)){
    TRIPPER_CAMERA_STATE.autoScheduleRef={...candidateRef};
  }
  return b32BaseSaveCapturedRecord();
};

async function b32BootstrapCoreState(){
  try{
    if(typeof hydrateV26CoreFoundation==='function'){
      APP_DATA=normalizeAppData(await hydrateV26CoreFoundation(APP_DATA));
    }
    let recovered=false;
    for(const trip of (APP_DATA.trips||[])){
      const ref=b32RecoverB31OvernightStateLoss(trip);
      if(ref){
        recovered=true;
        try{ b31RepairCrossDayActiveRecords(trip); }catch(_e){}
      }
    }
    APP_DATA.settings=APP_DATA.settings||{};
    APP_DATA.settings.lastAppVersion='2.6.0-B.3.2';
    persistAppData();
    renderAll();
    const note=document.querySelector('#record .b1-phase-note');
    if(note) note.innerHTML='<strong>Phase 4B.3.2</strong><span>進行中Scheduleの状態を再起動後も保持し、日付跨ぎ写真を同じScheduleへ紐付けます。</span>';
    if(recovered) showToast('✓ 進行中Scheduleを復元しました');
  }catch(err){
    console.warn('v2.6.0-B.3.2 bootstrap failed',err);
  }
}

document.addEventListener('DOMContentLoaded',()=>{ b32BootstrapCoreState(); });

/* =========================================================
   v2.6.0-B.3.3 Overnight Open-Ended Recovery Hotfix
   Repair path for users who installed B.3.1/B.3.2 after the
   ACTIVE state had already been lost. During a fresh camera
   capture shortly after midnight, exactly one plausible
   previous-day open-ended Schedule can be restored and used
   by Photo Linker. This is intentionally narrow and only
   applies to legacy date-inferred completion without an
   explicit end/completion.
   ========================================================= */
function b33RecoverPreviousDayOpenEndedForCapture(trip,capturedAt){
  if(!trip) return null;
  const durable=b32DurableActiveScheduleRef?.(trip);
  if(durable) return durable;

  const captured=new Date(capturedAt||TRIPPER_CAMERA_STATE?.capturedAt||Date.now());
  if(Number.isNaN(captured.getTime())) return null;
  const capturedDate=localDateKey(captured);
  /* Recovery is only for the overnight window. Daytime capture must never
     resurrect yesterday's plan. */
  if(captured.getHours()>=6) return null;

  const candidates=[];
  for(const day of (trip.days||[])){
    if(addDaysKey(day.date,1)!==capturedDate) continue;
    const plan=getActivePlanFromTrip(trip,day.day);
    if(!plan) continue;
    for(const slot of (plan.slots||[])){
      if(slot.completedAt||slot.endTime) continue;
      const meta=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
      if(meta.actualEndAt||meta.manualEndOverride||meta.status==='skipped') continue;
      /* Only repair the specific state-loss signature produced by the old
         date inference. Never revive an explicitly completed Schedule. */
      if(!(meta.status==='completed'&&meta.stateSource==='legacy_date_inferred')) continue;
      const plannedStart=meta.plannedStartAt?new Date(meta.plannedStartAt):null;
      if(!plannedStart||Number.isNaN(plannedStart.getTime())) continue;
      if(plannedStart.getHours()<18) continue;
      const gap=captured.getTime()-plannedStart.getTime();
      if(gap<0||gap>12*60*60*1000) continue;
      candidates.push({day,plan,slot,meta,plannedStart});
    }
  }
  if(candidates.length!==1) return null;

  const hit=candidates[0];
  hit.slot.v21=normalizeScheduleFoundation(hit.slot.v21||{},hit.slot,hit.day.date);
  hit.slot.v21.status='active';
  hit.slot.v21.actualStartAt=hit.slot.v21.actualStartAt||hit.slot.v21.plannedStartAt||hit.plannedStart.toISOString();
  hit.slot.v21.actualEndAt=null;
  hit.slot.v21.stateSource='b3.3_recovered_overnight_open_ended_capture';
  hit.slot.completedAt='';

  const ref={
    day:Number(hit.day.day),
    planId:String(hit.plan.id||''),
    slotId:String(hit.slot.id||''),
    actualStartAt:hit.slot.v21.actualStartAt||'',
    status:'active'
  };
  try{
    APP_DATA.settings=APP_DATA.settings||{};
    APP_DATA.settings.b33OvernightRecovery={
      recoveredAt:new Date().toISOString(),
      tripId:String(trip.id||''),slotId:ref.slotId,capturedAt:captured.toISOString()
    };
    persistAppData();
  }catch(err){ console.warn('B3.3 recovery persist failed',err); }
  return ref;
}

const b33BaseRenderCapturedLinkSelectors=renderCapturedLinkSelectors;
renderCapturedLinkSelectors=function(dayChanged=false,existingRecord=null){
  b33BaseRenderCapturedLinkSelectors(dayChanged,existingRecord);
  if(existingRecord||dayChanged) return;
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip();
  if(!trip) return;
  let ref=(TRIPPER_CAMERA_STATE?.launchScheduleRef&&b32ActiveRefStillValid(trip,TRIPPER_CAMERA_STATE.launchScheduleRef))
    ?TRIPPER_CAMERA_STATE.launchScheduleRef
    :b32DurableActiveScheduleRef(trip);
  if(!ref){
    ref=b33RecoverPreviousDayOpenEndedForCapture(trip,TRIPPER_CAMERA_STATE?.capturedAt||new Date().toISOString());
  }
  if(ref&&b32PopulateCapturedSelectorsForRef(trip,ref)){
    TRIPPER_CAMERA_STATE.autoScheduleRef={...ref};
    TRIPPER_CAMERA_STATE.launchScheduleRef={...ref};
    TRIPPER_CAMERA_STATE.manualScheduleSelection=false;
    try{ showToast('✓ 進行中Scheduleを復元して写真を紐付けます'); }catch(_e){}
    try{ renderRecordScreen(); }catch(_e){}
  }
};

const b33BaseSaveCapturedRecord=saveCapturedRecord;
saveCapturedRecord=async function(){
  const trip=recordTripById?.(document.getElementById('capturedTripSelect')?.value)||getRecordTrip?.()||getTrip();
  if(trip&&!TRIPPER_CAMERA_STATE?.editRecordId&&!TRIPPER_CAMERA_STATE?.manualScheduleSelection){
    let ref=(TRIPPER_CAMERA_STATE?.launchScheduleRef&&b32ActiveRefStillValid(trip,TRIPPER_CAMERA_STATE.launchScheduleRef))
      ?TRIPPER_CAMERA_STATE.launchScheduleRef
      :b32DurableActiveScheduleRef(trip);
    if(!ref) ref=b33RecoverPreviousDayOpenEndedForCapture(trip,TRIPPER_CAMERA_STATE?.capturedAt||new Date().toISOString());
    if(ref&&b32PopulateCapturedSelectorsForRef(trip,ref)){
      TRIPPER_CAMERA_STATE.autoScheduleRef={...ref};
      TRIPPER_CAMERA_STATE.launchScheduleRef={...ref};
    }
  }
  return b33BaseSaveCapturedRecord();
};

const b33BaseRenderRecordScreen=renderRecordScreen;
renderRecordScreen=function(){
  b33BaseRenderRecordScreen();
  const note=document.querySelector('#record .b1-phase-note');
  if(note) note.innerHTML='<strong>Phase 4B.3.3</strong><span>旧版で失われた深夜の進行中Scheduleも、撮影時に安全条件を満たせば復元します。</span>';
};

try{
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.lastAppVersion='2.6.0-B.3.3';
  persistAppData();
}catch(err){ console.warn('v2.6.0-B.3.3 version marker not persisted',err); }
