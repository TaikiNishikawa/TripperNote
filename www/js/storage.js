/* Tripper Note v2.6.0-B.3.2 State Persistence + Cross-Day Linker Hotfix
   Schema v6 + v2.1 model scaffolding.
   Full v2.6 foundation data is persisted in IndexedDB, not duplicated in localStorage.
   V25 localStorage remains as a compact rollback-compatible bridge during Phase 4A. */
const STORAGE_KEY_V26 = 'tripperNoteDataV26';
const STORAGE_KEY_V25 = 'tripperNoteDataV25';
const LEGACY_STORAGE_KEYS = [STORAGE_KEY_V25, 'tripperNoteDataV24', 'tripCompanionDataV23'];
const V21_MODEL_VERSION = 1;
const V21_TRAVEL_STYLES = ['relaxed','balanced','structured'];
const V21_THEMES = ['editorial','pop','easy'];
const V21_SCHEDULE_STATES = ['upcoming','active','extended','completed','skipped'];

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
function finiteOrNull(value){
  if(value===null||value===undefined||String(value).trim()==='') return null;
  const n=Number(value); return Number.isFinite(n)?n:null;
}
function clampNonNegativeInt(value,fallback){
  const n=Number(value); return Number.isFinite(n)&&n>=0?Math.round(n):fallback;
}
function localDateTimeValue(date,time){
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!/^\d{1,2}:\d{2}$/.test(String(time||''))) return null;
  const [h,m]=String(time).split(':').map(Number);
  if(!Number.isFinite(h)||!Number.isFinite(m)||h<0||h>23||m<0||m>59) return null;
  return `${date}T${pad(h)}:${pad(m)}:00`;
}
function durationMinutes(startTime,endTime){
  if(!/^\d{1,2}:\d{2}$/.test(String(startTime||''))||!/^\d{1,2}:\d{2}$/.test(String(endTime||''))) return null;
  const [sh,sm]=String(startTime).split(':').map(Number),[eh,em]=String(endTime).split(':').map(Number);
  const diff=(eh*60+em)-(sh*60+sm); return diff>0?diff:null;
}

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
  return {id:uid('trip'),title,icon,startDate,endDate,travelStyle:'balanced',theme:'editorial',transportBookings:[],days:dates.map((date,i)=>blankDay(i+1,date)),records:[]};
}
function normalizeCandidate(c={}){
  const lat=finiteOrNull(c.lat),lon=finiteOrNull(c.lon);
  return {...blankCandidate(c.id||uid('candidate')),...c,id:c.id||uid('candidate'),name:stripUiEmojiName(c.name||'新しい候補'),lat,lon,tags:Array.isArray(c.tags)?c.tags:[]};
}
function normalizeScheduleFoundation(meta={},slot={},dayDate=''){
  const startTime=slot.startTime||'';
  const endTime=slot.endTime||'';
  const plannedStartAt=meta.plannedStartAt??localDateTimeValue(dayDate,startTime);
  const plannedEndAt=meta.plannedEndAt??localDateTimeValue(dayDate,endTime);
  const legacyCompletedAt=slot.completedAt||'';
  let status=V21_SCHEDULE_STATES.includes(meta.status)?meta.status:null;
  let stateSource=meta.stateSource||'';
  if(!status){
    if(legacyCompletedAt){ status='completed'; stateSource='legacy_manual_completion'; }
    else if(dayDate&&dayDate<localDateKey()){ status='completed'; stateSource='legacy_date_inferred'; }
    else { status='upcoming'; stateSource='migration_default'; }
  }
  const policy=meta.timePolicy==='fixed'?'fixed':'flexible';
  const defaultDuration=durationMinutes(startTime,endTime);
  return {
    plannedStartAt:plannedStartAt||null,
    plannedEndAt:plannedEndAt||null,
    actualStartAt:meta.actualStartAt||null,
    actualEndAt:meta.actualEndAt||legacyCompletedAt||null,
    status,
    stateSource,
    timePolicy:policy,
    allowedShiftBeforeMinutes:clampNonNegativeInt(meta.allowedShiftBeforeMinutes,30),
    allowedShiftAfterMinutes:clampNonNegativeInt(meta.allowedShiftAfterMinutes,30),
    plannedDurationMinutes:meta.plannedDurationMinutes==null?defaultDuration:clampNonNegativeInt(meta.plannedDurationMinutes,defaultDuration),
    minimumDurationMinutes:meta.minimumDurationMinutes==null?null:clampNonNegativeInt(meta.minimumDurationMinutes,null),
    allowAutoAdjustment:meta.allowAutoAdjustment!==false,
    manualStartOverride:!!meta.manualStartOverride,
    manualEndOverride:!!meta.manualEndOverride,
    choiceSlotId:meta.choiceSlotId||null,
    notificationState:(meta.notificationState&&typeof meta.notificationState==='object')?meta.notificationState:{}
  };
}
function normalizeSlotTimeNote(note,candidates=[]){
  const raw=String(note??'').trim();
  if(!raw) return '';
  const comparable=value=>stripUiEmojiName(String(value||'')).replace(/\s+/g,' ').trim();
  const normalized=comparable(raw);
  /* B.1.1: old bundled slots can carry one candidate's activity in the slot-level
     timeNote.  That makes a selected candidate look mixed with another candidate
     (e.g. 吐竜の滝 + 美術館鑑賞).  Candidate activities are not temporal notes,
     so suppress an exact activity leak while preserving real notes such as
     チェックアウト / 以降 / 未定. */
  const isCandidateActivityLeak=(candidates||[]).some(c=>{
    const activity=comparable(c?.activity);
    return !!activity&&activity===normalized;
  });
  return isCandidateActivityLeak?'':raw;
}
function normalizeSlot(slot={},dayDate=''){
  const legacy=parseLegacySlotTime(slot);
  const candidates=(Array.isArray(slot.candidates)&&slot.candidates.length?slot.candidates:[blankCandidate()]).slice(0,MAX_CANDIDATES).map(normalizeCandidate);
  const selectedCandidateId=candidates.some(c=>c.id===slot.selectedCandidateId)?slot.selectedCandidateId:candidates[0].id;
  const rawTimeNote=slot.timeNote??legacy.timeNote??'';
  const next={
    ...slot,
    id:slot.id||uid('slot'), startTime:slot.startTime||legacy.startTime||'12:00', endTime:slot.endTime||legacy.endTime||'',
    timeNote:normalizeSlotTimeNote(rawTimeNote,candidates), selectedCandidateId, candidates,
    completedAt:slot.completedAt||'',
    coverRecordId:slot.coverRecordId||'', coverPhoto:normalizeCoverPhoto(slot.coverPhoto||slot.coverPhotoDataUrl||null)
  };
  next.v21=normalizeScheduleFoundation(slot.v21||{},next,dayDate);
  return next;
}
function normalizePlan(plan={}, fallbackId='a',dayDate=''){
  const id=plan.id||fallbackId;
  return {...plan,id,name:plan.name||`Plan ${id.toUpperCase()}`,slots:(plan.slots||[]).map(slot=>normalizeSlot(slot,dayDate))};
}
function normalizeDay(day={}, idx=0, trip={}){
  const date=day.date||addDaysKey(trip.startDate||localDateKey(),idx);
  const plans=(Array.isArray(day.plans)&&day.plans.length?day.plans:[blankPlan('a')]).slice(0,MAX_PLANS).map((p,i)=>normalizePlan(p,['a','b','c','d'][i]||`p${i+1}`,date));
  const activePlanId=plans.some(p=>p.id===day.activePlanId)?day.activePlanId:plans[0].id;
  return {...day,day:idx+1,date,activePlanId,lodging:parseLegacyLodging(day.lodging,date,trip.endDate),plans};
}
function normalizeRecord(record={}){
  const kind=['start','entry','fin'].includes(record.kind)?record.kind:'entry';
  const mediaType=['image','video','none'].includes(record.mediaType)?record.mediaType:'none';
  return {
    ...record,
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
  const travelStyle=V21_TRAVEL_STYLES.includes(trip.travelStyle)?trip.travelStyle:'balanced';
  const theme=V21_THEMES.includes(trip.theme)?trip.theme:'editorial';
  const base={...trip,id:trip.id||uid('trip'),title:trip.title||'名称未設定の旅行',icon:trip.icon||'',startDate,endDate,travelStyle,theme,transportBookings:Array.isArray(trip.transportBookings)?trip.transportBookings:[],records:(Array.isArray(trip.records)?trip.records:[]).map(r=>normalizeRecord(r,trip))};
  const existingByDate=new Map((trip.days||[]).map(d=>[d.date,d]));
  base.days=dateRange(startDate,endDate).map((date,idx)=>normalizeDay(existingByDate.get(date)||trip.days?.[idx]||blankDay(idx+1,date),idx,base));
  return base;
}

function normalizeCoreV21(core={}){
  const src=(core&&typeof core==='object')?core:{};
  return {
    modelVersion:V21_MODEL_VERSION,
    choiceSlots:Array.isArray(src.choiceSlots)?src.choiceSlots:[],
    travelLegs:Array.isArray(src.travelLegs)?src.travelLegs:[],
    timelineGroups:Array.isArray(src.timelineGroups)?src.timelineGroups:[],
    blocks:Array.isArray(src.blocks)?src.blocks:[],
    mediaAssets:Array.isArray(src.mediaAssets)?src.mediaAssets:[],
    notificationEvents:Array.isArray(src.notificationEvents)?src.notificationEvents:[],
    migration:(src.migration&&typeof src.migration==='object')?src.migration:{}
  };
}
function normalizeAppData(raw){
  const hasRaw=!!(raw&&typeof raw==='object');
  const base=hasRaw?deepClone(raw):deepClone(DEFAULT_APP_DATA);
  const sourceTrips=Array.isArray(base.trips)?base.trips:deepClone(DEFAULT_APP_DATA.trips);
  const trips=sourceTrips.map(normalizeTrip);
  const activeTripId=trips.length?(trips.some(t=>t.id===base.activeTripId)?base.activeTripId:trips[0].id):null;
  const nav={car:'yahoo_carnavi',walk:'google_maps',train:'yahoo_transit',...(base.settings?.navigation||{})};
  return {
    schemaVersion:SCHEMA_VERSION,
    activeTripId,
    settings:{...(base.settings||{}),navigation:nav,calendarEntry:base.settings?.calendarEntry||'header'},
    trips,
    coreV21:normalizeCoreV21(base.coreV21)
  };
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
function stampMigration(data,sourceStorageKey,sourceSchemaVersion){
  data.coreV21=normalizeCoreV21(data.coreV21);
  if(!data.coreV21.migration?.migratedAt){
    data.coreV21.migration={
      sourceStorageKey:sourceStorageKey||'default',
      sourceSchemaVersion:Number(sourceSchemaVersion)||0,
      targetSchemaVersion:SCHEMA_VERSION,
      migratedAt:new Date().toISOString(),
      legacySourcePreserved:sourceStorageKey===STORAGE_KEY_V25
    };
  }
  return data;
}
const V26_CORE_READY_KEY='tripperNoteCoreReadyV1';
const V258A_LEGACY_BACKUP_KEY='tripperNoteBackupBeforeV258A';
let V26_CORE_PERSIST_CHAIN=Promise.resolve();
let V26_CORE_BOOTSTRAP_COMPLETE=false;
let V26_CORE_PENDING_SNAPSHOT=null;

function v26CoreReadyMarker(){
  try{ return localStorage.getItem(V26_CORE_READY_KEY)==='1'; }catch(_e){ return false; }
}


function buildLegacyV25CompatSnapshot(data){
  /* Keep the rollback bridge small, but NEVER strip per-Schedule v21 state.
     B.3.1 proved that status/actualStartAt are live-session critical and must
     survive an app restart even before IndexedDB hydration finishes. Heavy
     core collections (blocks/canvas/media metadata) remain IndexedDB-only. */
  const compact=deepClone(data||{});
  compact.schemaVersion=5;
  delete compact.coreV21;
  /* travelStyle/theme and slot.v21 are intentionally retained. Older builds
     ignore unknown fields, while current builds need them for continuity. */
  return compact;
}

function buildV26CorePayload(data){
  const normalized=normalizeAppData(data);
  const core=normalizeCoreV21(normalized.coreV21);
  return {
    meta:{
      schemaVersion:SCHEMA_VERSION,
      modelVersion:V21_MODEL_VERSION,
      activeTripId:normalized.activeTripId,
      settings:deepClone(normalized.settings||{}),
      migration:deepClone(core.migration||{}),
      appVersion:'2.6.0-B.3.2',
      timelineProjectionMode:'b3.2-core-hydrated-cross-day-linker'
    },
    trips:deepClone(normalized.trips||[]),
    schedules:getV21ScheduleProjection(normalized),
    choiceSlots:deepClone(core.choiceSlots||[]),
    travelLegs:deepClone(core.travelLegs||[]),
    timelineGroups:deepClone(core.timelineGroups||[]),
    blocks:deepClone(core.blocks||[]),
    mediaAssets:deepClone(core.mediaAssets||[]),
    notificationEvents:deepClone(core.notificationEvents||[])
  };
}

function persistCompactV25Fallback(data){
  const compact=buildLegacyV25CompatSnapshot(data);
  try{
    localStorage.setItem(STORAGE_KEY_V25,JSON.stringify(compact));
    return true;
  }catch(err){
    /* A.1 may have left duplicate localStorage keys that consume the WebView quota.
       Do not crash startup. IndexedDB cleanup will retry this write after the data is safe. */
    console.warn('Compact V25 fallback could not be persisted yet; Core DB migration will retry.',err);
    return false;
  }
}

async function migrateLegacyLocalStorageCopiesToCore(data){
  if(typeof coreWriteBackupOnce==='function'){
    const oldBackup=localStorage.getItem(V258A_LEGACY_BACKUP_KEY);
    if(oldBackup){
      await coreWriteBackupOnce('pre-v258a-localstorage',oldBackup);
      localStorage.removeItem(V258A_LEGACY_BACKUP_KEY);
    }
  }
  /* A.1 used this key for a full duplicate. Remove it only after Core DB succeeded. */
  if(localStorage.getItem(STORAGE_KEY_V26)!==null) localStorage.removeItem(STORAGE_KEY_V26);
  persistCompactV25Fallback(data);
  try{ localStorage.setItem(V26_CORE_READY_KEY,'1'); }catch(_e){}
}

function queueV26CorePersist(data){
  const normalized=normalizeAppData(data);
  if(typeof corePersistFoundation!=='function') return normalized;
  /* If a Core DB already exists, startup must read it BEFORE any compatibility
     snapshot is allowed to clear/overwrite its collections. Module-level
     version markers call persistAppData very early, so defer those writes. */
  if(v26CoreReadyMarker()&&!V26_CORE_BOOTSTRAP_COMPLETE){
    V26_CORE_PENDING_SNAPSHOT=normalized;
    return normalized;
  }
  const payload=buildV26CorePayload(normalized);
  V26_CORE_PERSIST_CHAIN=V26_CORE_PERSIST_CHAIN
    .catch(()=>undefined)
    .then(async()=>{
      await corePersistFoundation(payload);
      await migrateLegacyLocalStorageCopiesToCore(normalized);
    })
    .catch(err=>console.warn('Tripper Note Core DB persistence failed; compact V25 source remains available.',err));
  return normalized;
}

function v26DataFromCoreFoundation(fallback,core){
  if(!core?.meta||!Array.isArray(core.trips)||!core.trips.length) return null;
  const base=normalizeAppData(fallback||DEFAULT_APP_DATA);
  const coreModel={
    modelVersion:Number(core.meta.modelVersion)||V21_MODEL_VERSION,
    migration:deepClone(core.meta.migration||base.coreV21?.migration||{}),
    choiceSlots:deepClone(core.choiceSlots||[]),
    travelLegs:deepClone(core.travelLegs||[]),
    timelineGroups:deepClone(core.timelineGroups||[]),
    blocks:deepClone(core.blocks||[]),
    mediaAssets:deepClone(core.mediaAssets||[]),
    notificationEvents:deepClone(core.notificationEvents||[])
  };
  return normalizeAppData({
    ...base,
    schemaVersion:SCHEMA_VERSION,
    activeTripId:core.meta.activeTripId||base.activeTripId,
    settings:{...(base.settings||{}),...(core.meta.settings||{})},
    trips:deepClone(core.trips),
    coreV21:coreModel
  });
}

async function hydrateV26CoreFoundation(fallback){
  let hydrated=null;
  try{
    if(v26CoreReadyMarker()&&typeof coreReadFoundation==='function'){
      const core=await coreReadFoundation();
      hydrated=v26DataFromCoreFoundation(fallback,core);
    }
  }catch(err){
    console.warn('Core DB hydration failed; compact bridge will be used.',err);
  }
  V26_CORE_BOOTSTRAP_COMPLETE=true;
  if(hydrated){
    /* Discard stale startup writes. The hydrated DB is authoritative. */
    V26_CORE_PENDING_SNAPSHOT=null;
    persistCompactV25Fallback(hydrated);
    return hydrated;
  }
  const pending=V26_CORE_PENDING_SNAPSHOT||normalizeAppData(fallback||DEFAULT_APP_DATA);
  V26_CORE_PENDING_SNAPSHOT=null;
  queueV26CorePersist(pending);
  return pending;
}

function writeV26Snapshot(data){
  /* Compatibility name retained for Phase 4A tests/callers. No V26 localStorage write. */
  const normalized=normalizeAppData(data);
  persistCompactV25Fallback(normalized);
  queueV26CorePersist(normalized);
  return normalized;
}

function loadAppDataV26(){
  try{
    /* If A.1 ever managed to persist V26 before a later quota failure, adopt that newest copy first. */
    const a1Current=localStorage.getItem(STORAGE_KEY_V26);
    if(a1Current){
      const parsed=JSON.parse(a1Current);
      const migrated=normalizeAppData(parsed);
      stampMigration(migrated,STORAGE_KEY_V26,parsed?.schemaVersion||SCHEMA_VERSION);
      queueV26CorePersist(migrated);
      return migrated;
    }
    for(const key of LEGACY_STORAGE_KEYS){
      const text=localStorage.getItem(key); if(!text) continue;
      const parsed=JSON.parse(text);
      const sourceVersion=parsed?.schemaVersion||0;
      const migrated=key==='tripCompanionDataV23'?migrateLegacyV23(parsed):normalizeAppData(parsed);
      stampMigration(migrated,key,sourceVersion);
      queueV26CorePersist(migrated);
      return migrated;
    }
  }catch(e){ console.warn('load/migration failed',e); }
  const fresh=stampMigration(normalizeAppData(DEFAULT_APP_DATA),'default',DEFAULT_APP_DATA?.schemaVersion||0);
  queueV26CorePersist(fresh);
  return fresh;
}
function persistAppDataV26(data){ return writeV26Snapshot(data); }
/* Temporary compatibility aliases for older modules. */
function loadAppDataV25(){ return loadAppDataV26(); }
function persistAppDataV25(data){ return persistAppDataV26(data); }
function syncTripDays(trip,startDate,endDate){
  const oldByDate=new Map((trip.days||[]).map(d=>[d.date,d])); trip.startDate=startDate; trip.endDate=endDate;
  trip.days=dateRange(startDate,endDate).map((date,idx)=>normalizeDay(oldByDate.get(date)||blankDay(idx+1,date),idx,trip));
  return trip;
}

/* Read-only v2.1 projection. Legacy planner slots stay the UI source during Phase 4A. */
function projectScheduleV21(trip,day,plan,slot){
  const candidate=(slot.candidates||[]).find(c=>c.id===slot.selectedCandidateId)||slot.candidates?.[0]||{};
  const meta=normalizeScheduleFoundation(slot.v21||{},slot,day.date);
  return {
    id:slot.id,
    tripId:trip.id,
    dayId:`${trip.id}:day:${day.day}`,
    day:day.day,
    planId:plan.id,
    title:stripUiEmojiName(candidate.name||candidate.activity||'予定'),
    placeId:candidate.id||null,
    transport:candidate.transportMode||'none',
    plannedStartAt:meta.plannedStartAt,
    plannedEndAt:meta.plannedEndAt,
    actualStartAt:meta.actualStartAt,
    actualEndAt:meta.actualEndAt,
    status:meta.status,
    timePolicy:meta.timePolicy,
    allowedShiftBeforeMinutes:meta.allowedShiftBeforeMinutes,
    allowedShiftAfterMinutes:meta.allowedShiftAfterMinutes,
    plannedDurationMinutes:meta.plannedDurationMinutes,
    minimumDurationMinutes:meta.minimumDurationMinutes,
    manualStartOverride:meta.manualStartOverride,
    manualEndOverride:meta.manualEndOverride,
    legacyRef:{day:day.day,planId:plan.id,slotId:slot.id}
  };
}
function getV21ScheduleProjection(data,tripId=null){
  const root=data||{}; const trips=(root.trips||[]).filter(t=>!tripId||t.id===tripId); const out=[];
  trips.forEach(trip=>(trip.days||[]).forEach(day=>(day.plans||[]).forEach(plan=>(plan.slots||[]).forEach(slot=>out.push(projectScheduleV21(trip,day,plan,slot))))));
  return out;
}
function validateV21Integrity(data){
  const errors=[],warnings=[],ids=new Set(); let slotCount=0,candidateCount=0,recordCount=0;
  if(Number(data?.schemaVersion)!==SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if(!data?.coreV21||Number(data.coreV21.modelVersion)!==V21_MODEL_VERSION) errors.push('coreV21 model is missing or invalid');
  (data?.trips||[]).forEach(trip=>{
    if(!V21_TRAVEL_STYLES.includes(trip.travelStyle)) errors.push(`trip ${trip.id}: invalid travelStyle`);
    if(!V21_THEMES.includes(trip.theme)) errors.push(`trip ${trip.id}: invalid theme`);
    recordCount+=(trip.records||[]).length;
    (trip.days||[]).forEach(day=>(day.plans||[]).forEach(plan=>(plan.slots||[]).forEach(slot=>{
      slotCount++;
      const key=`${trip.id}:${day.day}:${plan.id}:${slot.id}`; if(ids.has(key)) errors.push(`duplicate schedule key ${key}`); ids.add(key);
      candidateCount+=(slot.candidates||[]).length;
      if(!slot.v21) errors.push(`slot ${slot.id}: v21 metadata missing`);
      if(slot.selectedCandidateId&&!(slot.candidates||[]).some(c=>c.id===slot.selectedCandidateId)) errors.push(`slot ${slot.id}: selected candidate missing`);
      if(slot.v21?.plannedStartAt&&day.date&&!String(slot.v21.plannedStartAt).startsWith(day.date)) warnings.push(`slot ${slot.id}: plannedStartAt differs from day date`);
    })));
  });
  return {ok:errors.length===0,errors,warnings,counts:{trips:(data?.trips||[]).length,schedules:slotCount,candidates:candidateCount,legacyRecords:recordCount}};
}
function buildV21FoundationReport(data){
  return {
    appVersion:'2.6.0-B.3.2',
    schemaVersion:data?.schemaVersion,
    modelVersion:data?.coreV21?.modelVersion,
    migration:data?.coreV21?.migration||{},
    integrity:validateV21Integrity(data),
    scheduleCount:getV21ScheduleProjection(data).length,
    storage:{primary:'IndexedDB/tripperNoteCore',compactBridge:STORAGE_KEY_V25,legacyA1Key:STORAGE_KEY_V26}
  };
}
