/* Tripper Note v2.5 Core Foundation - storage, migration, trip factories */
const STORAGE_KEY_V25 = 'tripperNoteDataV25';
const LEGACY_STORAGE_KEYS = ['tripperNoteDataV24', 'tripCompanionDataV23'];

function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }
function pad(n){ return String(n).padStart(2,'0'); }
function localDateKey(d=new Date()){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function parseLocalDate(key){ const [y,m,d]=String(key).split('-').map(Number); return new Date(y,m-1,d); }
function addDaysKey(key, amount){ const d=parseLocalDate(key); d.setDate(d.getDate()+Number(amount)); return localDateKey(d); }
function dateRange(start,end){
  if(!start||!end||end<start) return [];
  const out=[]; let cur=start; let guard=0;
  while(cur<=end && guard<370){ out.push(cur); cur=addDaysKey(cur,1); guard++; }
  return out;
}
function uid(prefix='id'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }
function stripUiEmojiName(value=''){ return String(value).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'').trim(); }

function parseLegacySlotTime(slot={}){
  const label=String(slot.timeLabel||'');
  const matches=[...label.matchAll(/\b([0-2]?\d:[0-5]\d)\b/g)].map(m=>m[1]);
  const startTime=matches[0] || slot.sortTime || '12:00';
  const endTime=matches[1] || '';
  const timeNote=(!matches.length || /以降|チェックイン後|未定/.test(label)) ? label : '';
  return {startTime,endTime,timeNote};
}
function parseLegacyLodging(lodging, dayDate, tripEndDate){
  if(!lodging) return null;
  if('checkInDate' in lodging || 'checkOutDate' in lodging){
    return {
      name:lodging.name||'', address:lodging.address||'',
      checkInDate:lodging.checkInDate||dayDate, checkInTime:lodging.checkInTime||'',
      checkOutDate:lodging.checkOutDate||tripEndDate||dayDate, checkOutTime:lodging.checkOutTime||'',
      room:lodging.room||'', reservationNumber:lodging.reservationNumber||'', parking:lodging.parking||'', memo:lodging.memo||'',
      googleMapsUrl:lodging.googleMapsUrl||'', lat:lodging.lat??null, lon:lodging.lon??null
    };
  }
  const year=Number(String(dayDate).slice(0,4))||new Date().getFullYear();
  function parsePiece(text, fallbackDate){
    text=String(text||''); let date=fallbackDate, time='';
    const dm=text.match(/(\d{1,2})\/(\d{1,2})/); if(dm) date=`${year}-${pad(dm[1])}-${pad(dm[2])}`;
    const tm=text.match(/([0-2]?\d):([0-5]\d)/); if(tm) time=`${pad(tm[1])}:${tm[2]}`;
    return {date,time};
  }
  const ci=parsePiece(lodging.checkIn,dayDate), co=parsePiece(lodging.checkOut,tripEndDate||dayDate);
  return {
    name:lodging.name||'', address:lodging.address||'', checkInDate:ci.date, checkInTime:ci.time,
    checkOutDate:co.date, checkOutTime:co.time, room:lodging.room||'', reservationNumber:'', parking:'', memo:lodging.memo||'',
    googleMapsUrl:lodging.googleMapsUrl||'', lat:lodging.lat??null, lon:lodging.lon??null
  };
}
function blankCandidate(id=uid('candidate')){
  return {id,name:'新しい候補',destination:'',activity:'',description:'',transportMode:'car',googleMapsUrl:'',address:'',lat:null,lon:null,stationName:'',memo:'',tags:[],locationUnresolved:false};
}
function normalizeRecord(record={}, trip={}){
  const lat=(record.lat===null||record.lat===undefined||String(record.lat).trim()==='')?null:Number(record.lat);
  const lon=(record.lon===null||record.lon===undefined||String(record.lon).trim()==='')?null:Number(record.lon);
  const role=['start','fin','diary'].includes(record.role)?record.role:'diary';
  const kind=record.kind==='video'?'video':'photo';
  return {
    id:record.id||uid('record'), kind, role, dataUrl:record.dataUrl||'', fileName:record.fileName||record.name||'',
    capturedAt:record.capturedAt||record.createdAt||new Date().toISOString(), createdAt:record.createdAt||new Date().toISOString(),
    note:record.note||'', day:Number(record.day)||null, planId:record.planId||'', slotId:record.slotId||'',
    lat:Number.isFinite(lat)?lat:null, lon:Number.isFinite(lon)?lon:null
  };
}
function normalizeCoverPhoto(photo){
  if(!photo) return null;
  if(typeof photo==='string') return {dataUrl:photo,mediaKey:'',recordId:'',addedAt:'',capturedAt:'',name:''};
  if(typeof photo!=='object') return null;
  const dataUrl=photo.dataUrl?String(photo.dataUrl):'';
  const mediaKey=photo.mediaKey?String(photo.mediaKey):'';
  const recordId=photo.recordId?String(photo.recordId):'';
  if(!dataUrl&&!mediaKey&&!recordId) return null;
  return {dataUrl,mediaKey,recordId,addedAt:photo.addedAt||'',capturedAt:photo.capturedAt||'',name:photo.name||''};
}

function blankPlan(id='a'){
  return {id,name:id==='a'?'基本プラン':'新しいプラン',slots:[]};
}
function blankDay(day,date){
  return {day,date,activePlanId:'a',lodging:null,plans:[blankPlan('a')]};
}
function createBlankTrip({title='新しい旅行',startDate,endDate,icon=''}={}){
  const today=localDateKey(); startDate=startDate||today; endDate=endDate||addDaysKey(startDate,1);
  if(endDate<startDate) endDate=startDate;
  const dates=dateRange(startDate,endDate);
  return {id:uid('trip'),title,icon,startDate,endDate,transportBookings:[],days:dates.map((date,i)=>blankDay(i+1,date)),records:[]};
}
function normalizeCandidate(c={}){
  const lat=(c.lat===null||c.lat===undefined||String(c.lat).trim()==='')?null:Number(c.lat); const lon=(c.lon===null||c.lon===undefined||String(c.lon).trim()==='')?null:Number(c.lon); return {...blankCandidate(c.id||uid('candidate')),...c,id:c.id||uid('candidate'),name:stripUiEmojiName(c.name||'新しい候補'),lat:Number.isFinite(lat)?lat:null,lon:Number.isFinite(lon)?lon:null,tags:Array.isArray(c.tags)?c.tags:[]};
}
function normalizeSlot(slot={}){
  const legacy=parseLegacySlotTime(slot);
  const candidates=(Array.isArray(slot.candidates)&&slot.candidates.length?slot.candidates:[blankCandidate()]).slice(0,MAX_CANDIDATES).map(normalizeCandidate);
  const selectedCandidateId=candidates.some(c=>c.id===slot.selectedCandidateId)?slot.selectedCandidateId:candidates[0].id;
  return {
    id:slot.id||uid('slot'), startTime:slot.startTime||legacy.startTime||'12:00', endTime:slot.endTime||legacy.endTime||'',
    timeNote:slot.timeNote??legacy.timeNote??'', selectedCandidateId, candidates,
    completedAt:slot.completedAt||'',
    coverRecordId:slot.coverRecordId||'', coverPhoto:normalizeCoverPhoto(slot.coverPhoto||slot.coverPhotoDataUrl||null)
  };
}
function normalizePlan(plan={}, fallbackId='a'){
  const id=plan.id||fallbackId;
  return {id,name:plan.name||`Plan ${id.toUpperCase()}`,slots:(plan.slots||[]).map(normalizeSlot)};
}
function normalizeDay(day={}, idx=0, trip={}){
  const plans=(Array.isArray(day.plans)&&day.plans.length?day.plans:[blankPlan('a')]).slice(0,MAX_PLANS).map((p,i)=>normalizePlan(p,['a','b','c','d'][i]||`p${i+1}`));
  const activePlanId=plans.some(p=>p.id===day.activePlanId)?day.activePlanId:plans[0].id;
  const date=day.date||addDaysKey(trip.startDate||localDateKey(),idx);
  return {day:idx+1,date,activePlanId,lodging:parseLegacyLodging(day.lodging,date,trip.endDate),plans};
}
function normalizeRecord(record={}){
  const kind=['start','entry','fin'].includes(record.kind)?record.kind:'entry';
  const mediaType=['image','video','none'].includes(record.mediaType)?record.mediaType:'none';
  return {
    id:record.id||uid('record'),
    tripId:record.tripId||'',
    day:record.day==null?null:Number(record.day),
    planId:record.planId||'',
    slotId:record.slotId||'',
    kind, mediaType, mediaKey:record.mediaKey||'', mimeType:record.mimeType||'',
    previewDataUrl:record.previewDataUrl||'',
    comment:record.comment||'', placeName:record.placeName||'',
    capturedAt:record.capturedAt||'', createdAt:record.createdAt||new Date().toISOString(),
    isCover:!!record.isCover, captureSource:record.captureSource||''
  };
}
function normalizeTrip(trip={}){
  const startDate=trip.startDate||localDateKey();
  const endDate=(trip.endDate&&trip.endDate>=startDate)?trip.endDate:startDate;
  const base={...trip,id:trip.id||uid('trip'),title:trip.title||'名称未設定の旅行',icon:trip.icon||'',startDate,endDate,transportBookings:Array.isArray(trip.transportBookings)?trip.transportBookings:[],records:(Array.isArray(trip.records)?trip.records:[]).map(r=>normalizeRecord(r,trip))};
  const existingByDate=new Map((trip.days||[]).map(d=>[d.date,d]));
  base.days=dateRange(startDate,endDate).map((date,idx)=>normalizeDay(existingByDate.get(date)||trip.days?.[idx]||blankDay(idx+1,date),idx,base));
  return base;
}
function normalizeAppData(raw){
  const hasRaw=!!(raw&&typeof raw==='object');
  const base=hasRaw?deepClone(raw):deepClone(DEFAULT_APP_DATA);
  const sourceTrips=Array.isArray(base.trips)?base.trips:deepClone(DEFAULT_APP_DATA.trips);
  const trips=sourceTrips.map(normalizeTrip);
  const activeTripId=trips.length?(trips.some(t=>t.id===base.activeTripId)?base.activeTripId:trips[0].id):null;
  const nav={car:'yahoo_carnavi',walk:'google_maps',train:'yahoo_transit',...(base.settings?.navigation||{})};
  return {schemaVersion:SCHEMA_VERSION,activeTripId,settings:{...(base.settings||{}),navigation:nav,calendarEntry:base.settings?.calendarEntry||'header'},trips};
}
function migrateLegacyV23(oldData){
  const next=deepClone(DEFAULT_APP_DATA);
  const oldTrip=oldData?.trips?.find(t=>t.id===oldData.activeTripId)||oldData?.trips?.[0];
  if(!oldTrip) return normalizeAppData(next);
  const trip=next.trips[0]; trip.title=oldTrip.title||trip.title; trip.startDate=oldTrip.startDate||trip.startDate; trip.endDate=oldTrip.endDate||trip.endDate;
  (trip.days||[]).forEach((day,i)=>{
    const oldDay=oldTrip.days?.[i]; if(!oldDay) return;
    day.date=oldDay.date||day.date; day.lodging=oldDay.lodging===undefined?day.lodging:oldDay.lodging;
    (oldDay.events||[]).forEach((e,idx)=>{
      const slot=day.plans?.[0]?.slots?.[idx]; if(!slot) return;
      slot.timeLabel=e.timeLabel||slot.timeLabel; slot.sortTime=e.sortTime||slot.sortTime;
      const c=slot.candidates?.[0]; if(c){ c.name=e.title||c.name; c.description=e.description||c.description; c.googleMapsUrl=e.googleMapsUrl||c.googleMapsUrl; }
    });
  });
  return normalizeAppData(next);
}
function loadAppDataV25(){
  try{
    const current=localStorage.getItem(STORAGE_KEY_V25); if(current) return normalizeAppData(JSON.parse(current));
    const v24=localStorage.getItem(LEGACY_STORAGE_KEYS[0]); if(v24){ const migrated=normalizeAppData(JSON.parse(v24)); localStorage.setItem(STORAGE_KEY_V25,JSON.stringify(migrated)); return migrated; }
    const v23=localStorage.getItem(LEGACY_STORAGE_KEYS[1]); if(v23){ const migrated=migrateLegacyV23(JSON.parse(v23)); localStorage.setItem(STORAGE_KEY_V25,JSON.stringify(migrated)); return migrated; }
  }catch(e){ console.warn('load/migration failed',e); }
  return normalizeAppData(DEFAULT_APP_DATA);
}
function persistAppDataV25(data){ localStorage.setItem(STORAGE_KEY_V25,JSON.stringify(normalizeAppData(data))); }
function syncTripDays(trip,startDate,endDate){
  const oldByDate=new Map((trip.days||[]).map(d=>[d.date,d])); trip.startDate=startDate; trip.endDate=endDate;
  trip.days=dateRange(startDate,endDate).map((date,idx)=>normalizeDay(oldByDate.get(date)||blankDay(idx+1,date),idx,trip));
  return trip;
}
