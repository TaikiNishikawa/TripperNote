/* Record Archive Redesign v2: Trip cards and the existing Timeline.
   Playback, navigation and object URLs are temporary UI state only. */
const RECORD_ARCHIVE_UI={tripId:'',view:'list',players:[],observer:null,timer:null,installed:false,pendingDetail:false,returnScroll:0,returnTrip:''};

function recordArchiveIsPast(trip,now=new Date()){
  return !!trip&&isSchedulePlannedDateKey(trip.endDate)&&trip.endDate<localDateKey(now)&&!b32DurableActiveScheduleRef(trip);
}
function recordArchivePhotoKey(photo){ return String(photo.mediaKey||photo.id||photo.previewDataUrl||photo.dataUrl||''); }
function recordArchiveRecordMatches(record,trip,item,allItems){
  if(!record?.slotId) return false;
  if(record.tripId&&String(record.tripId)!==String(trip.id)) return false;
  const matches=allItems.filter(entry=>String(record.slotId)===String(entry.slot.id)
    &&(record.day==null||record.day===''||Number(record.day)===Number(entry.day.day))
    &&(!record.planId||String(record.planId)===String(entry.plan.id)));
  // Incomplete legacy references are usable only when their saved IDs are unique.
  return matches.length===1&&matches[0].key===item.key;
}
function recordArchiveIsPhoto(record){
  if(!record||['video','audio','text'].includes(record.mediaType)) return false;
  if(record.mimeType&&!String(record.mimeType).startsWith('image/')) return false;
  if(record.mediaType==='image') return true; // Metadata can exist before its Blob is loaded.
  return [undefined,'','none'].includes(record.mediaType)&&/^data:image\//.test(record.previewDataUrl||record.dataUrl||'');
}
function recordArchiveTripPhotos(trip){
  const media=new Set(),ids=new Set(),sources=new Set();
  return (trip?.records||[]).filter(record=>{
    // Nesting in this Trip is the legacy ownership evidence. An explicit
    // conflicting tripId is never replaced by time, place or Schedule guesses.
    if(!recordArchiveIsPhoto(record)||(record.tripId&&String(record.tripId)!==String(trip.id))) return false;
    const source=record.previewDataUrl||record.dataUrl||'';
    if((record.mediaKey&&media.has(record.mediaKey))||(record.id&&ids.has(record.id))||(!record.mediaKey&&!record.id&&sources.has(source))) return false;
    if(record.mediaKey) media.add(record.mediaKey);
    if(record.id) ids.add(record.id);
    if(source) sources.add(source);
    return true;
  });
}
function recordArchiveTrips(trips,now=new Date()){
  return (trips||[]).filter(trip=>recordArchiveIsPast(trip,now)).slice()
    .sort((a,b)=>b.endDate.localeCompare(a.endDate)||b.startDate.localeCompare(a.startDate)||String(a.id).localeCompare(String(b.id)));
}
function recordArchiveCurrentTrips(trips,now=new Date()){
  const today=localDateKey(now);
  return (trips||[]).filter(trip=>b32DurableActiveScheduleRef(trip)||(trip.startDate<=today&&today<=trip.endDate));
}
function recordArchiveAllItems(trip){
  if(!trip) return [];
  const all=[];
  for(const day of trip.days||[]) for(const plan of day.plans||[]) for(const slot of plan.slots||[]){
    all.push({key:JSON.stringify([String(trip.id),Number(day.day),String(plan.id),String(slot.id)]),day,plan,slot});
  }
  return all;
}
function recordArchiveShuffle(photos,lastId='',random=Math.random){
  const result=photos.slice();
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  if(result.length>1&&recordArchivePhotoKey(result[0])===lastId) [result[0],result[1]]=[result[1],result[0]];
  return result;
}
function recordArchiveBackButton(){ return '<button type="button" class="record-archive-back" data-record-list>‹ 旅の記憶に戻る</button>'; }
function recordArchiveRenderList(){
  const ui=RECORD_ARCHIVE_UI,section=document.getElementById('record');
  section.dataset.recordView='list';
  const header='<header class="record-archive-heading"><div class="page-kicker">RECORD</div><h2>旅の記憶。</h2><p>その日の景色を、もう一度。</p></header>';
  if(typeof V26_CORE_BOOTSTRAP_COMPLETE!=='undefined'&&!V26_CORE_BOOTSTRAP_COMPLETE){
    section.innerHTML=`<div class="record-archive-page">${header}<p class="record-archive-empty" role="status">旅の記録を読み込み中…</p></div>`;return;
  }
  const trips=recordArchiveTrips(APP_DATA.trips),current=recordArchiveCurrentTrips(APP_DATA.trips);
  const items=trips.map(trip=>({trip,photos:recordArchiveTripPhotos(trip)}));
  section.innerHTML=`<div class="record-archive-page">${header}${current.length?`<aside class="record-current-trips" aria-label="進行中の旅">${current.map(trip=>`<button type="button" data-record-open="${escapeHtml(trip.id)}"><span><small>進行中の旅</small><strong>${escapeHtml(cleanDisplayName(trip.title))}</strong></span><span aria-hidden="true">↗</span></button>`).join('')}</aside>`:''}<div class="record-archive-list">${items.map(({trip,photos})=>`<button type="button" class="record-trip-card" data-record-open="${escapeHtml(trip.id)}" data-photo-state="${photos.length?'loading':'empty'}" aria-label="${escapeHtml(cleanDisplayName(trip.title))}の旅行記録を見る"><span class="record-card-photo"><span class="record-photo-placeholder"><span aria-hidden="true">${iconSvg('record')}</span><span>${photos.length?'写真を読み込み中':'この旅の余韻を、ここに。'}</span></span><span class="record-photo-backdrop" aria-hidden="true"></span><span class="record-photo-backdrop" aria-hidden="true"></span><img alt="" decoding="async" hidden><img alt="" decoding="async" hidden></span><span class="record-card-copy"><strong>${escapeHtml(cleanDisplayName(trip.title))}</strong><span class="record-card-arrow" aria-hidden="true">↗</span><span class="record-card-dates">${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))}</span><span class="record-card-count">${photos.length}枚の写真</span></span></button>`).join('')||'<div class="record-archive-empty"><p>旅の記憶は、これから。</p><span>終えた旅が、ここに並びます。</span></div>'}</div></div>`;
  ui.players=items.map(({trip,photos})=>recordArchivePlayer([...section.querySelectorAll('.record-trip-card')].find(el=>el.dataset.recordOpen===String(trip.id)),photos));
  recordArchiveObserve();
}
function recordArchiveRenderTimeline(trip){
  const ui=RECORD_ARCHIVE_UI,section=document.getElementById('record'),all=recordArchiveAllItems(trip);
  const timeline=b1BuildTimelineSkeleton(trip,{readOnly:true,recordMatches:(record,day,plan,slot)=>{
    const item=all.find(item=>item.day===day&&item.plan===plan&&item.slot===slot);
    return !!item&&recordArchiveRecordMatches(record,trip,item,all);
  }});
  section.dataset.recordView='timeline';
  section.innerHTML=`<div class="record-archive-page">${recordArchiveBackButton()}<button type="button" class="record-archive-add" onclick="b2OpenQuickAddMenu()" aria-label="記録の追加メニュー">＋</button><header class="record-archive-heading"><div class="page-kicker">TRAVEL JOURNAL</div><h2>${escapeHtml(cleanDisplayName(trip.title))}</h2><p>${escapeHtml(formatSlash(trip.startDate))} — ${escapeHtml(formatSlash(trip.endDate))}</p></header><div class="b1-master-timeline">${timeline.days.map(entry=>`<section class="b1-day-section"><div class="b1-day-heading"><span>DAY ${entry.day.day}</span><strong>${escapeHtml(formatJP(entry.day.date))}</strong></div>${entry.items.map(item=>`<div data-record-item="${escapeHtml(item.id)}">${b1TimelineItemHtml(item,{readOnly:true})}</div>`).join('')||'<p class="record-empty">この日の記録はまだありません。</p>'}</section>`).join('')}</div></div>`;
  // Existing record actions remain. Archive originals use cancellable,
  // viewport-scoped readonly loading instead of the global hydrator.
  ui.players=[...section.querySelectorAll('img[data-v258-media-key]')].map(img=>{
    const photo={mediaKey:img.dataset.v258MediaKey,previewDataUrl:img.getAttribute('src')||''};
    img.removeAttribute('data-v258-media-key');img.removeAttribute('src');img.hidden=true;
    const element=img.parentElement;element.classList.add('record-archive-photo');
    const placeholder=document.createElement('span');placeholder.className='record-photo-placeholder';
    placeholder.innerHTML='<span>写真を読み込み中</span>';element.append(placeholder);
    return recordArchivePlayer(element,[photo]);
  });
  recordArchiveObserve();
}
function openRecordArchive(){
  const ui=RECORD_ARCHIVE_UI;ui.view='list';ui.tripId='';ui.pendingDetail=false;ui.returnScroll=0;ui.returnTrip='';
  showScreen('record','record');
}
function recordArchiveOpenTrip(tripId){
  if(!getTripById(tripId)) return;
  const ui=RECORD_ARCHIVE_UI;
  if(ui.view==='list'&&recordArchivePageVisible()){ui.returnScroll=window.scrollY;ui.returnTrip=tripId;}
  setRecordTrip(tripId);showScreen('record','record');
}
function recordArchiveReturn(){
  const ui=RECORD_ARCHIVE_UI;ui.view='list';ui.tripId='';ui.pendingDetail=false;
  renderRecordScreen();
  requestAnimationFrame(()=>{
    if(ui.view!=='list'||!recordArchivePageVisible()) return;
    [...document.querySelectorAll('#record [data-record-open]')].find(el=>el.dataset.recordOpen===String(ui.returnTrip))?.focus({preventScroll:true});
    window.scrollTo({top:ui.returnScroll,behavior:'instant'});
  });
}
function recordArchivePlayer(element,photos){
  return {element,photos,layers:[...element.querySelectorAll('img')],backgrounds:[...element.querySelectorAll('.record-photo-backdrop')],urls:[],queue:[],current:null,active:-1,nextAt:0,token:0,visible:false,disposed:false,loading:false,fadeTimer:null,cancelLoad:null};
}
function recordArchivePageVisible(){ return !document.hidden&&document.getElementById('record')?.classList.contains('active'); }
function recordArchiveReleaseLayer(player,index){
  if(player.urls[index]) URL.revokeObjectURL(player.urls[index]);player.urls[index]='';
  const background=player.backgrounds[index];if(background){background.style.backgroundImage='';background.classList.remove('is-current');}
  const img=player.layers[index];img.onload=null;img.onerror=null;img.removeAttribute('src');img.hidden=true;img.classList.remove('is-current');
}
function recordArchivePause(player){
  player.visible=false;player.token++;player.nextAt=0;player.loading=false;
  player.cancelLoad?.();player.cancelLoad=null;clearTimeout(player.fadeTimer);player.fadeTimer=null;
  player.layers.forEach((_,index)=>recordArchiveReleaseLayer(player,index));player.active=-1;
}
function recordArchiveStop(){
  const ui=RECORD_ARCHIVE_UI;clearTimeout(ui.timer);ui.timer=null;
  ui.observer?.disconnect();ui.observer=null;
  ui.players.forEach(player=>{recordArchivePause(player);player.disposed=true;});ui.players=[];
}
function recordArchiveSchedule(){
  const ui=RECORD_ARCHIVE_UI;clearTimeout(ui.timer);ui.timer=null;
  if(!recordArchivePageVisible()) return;
  const due=ui.players.filter(p=>p.visible&&!p.disposed&&!p.loading&&p.photos.length>1&&p.nextAt);
  if(!due.length) return;
  ui.timer=setTimeout(()=>{
    ui.timer=null;const now=performance.now();
    due.filter(p=>p.nextAt<=now+5).forEach(p=>recordArchiveAdvance(p));recordArchiveSchedule();
  },Math.max(0,Math.min(...due.map(p=>p.nextAt))-performance.now()));
}
function recordArchiveLoadImage(player,img,src){
  if(!src) return Promise.resolve(false);
  return new Promise(resolve=>{
    const finish=ok=>{img.onload=null;img.onerror=null;player.cancelLoad=null;resolve(ok);};
    player.cancelLoad=()=>finish(false);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=src;
  });
}
async function recordArchiveDisplay(player,photo){
  const token=++player.token,valid=()=>!player.disposed&&token===player.token&&player.visible&&recordArchivePageVisible();
  const index=player.layers.length===1?0:(player.active===0?1:0),img=player.layers[index];
  const placeholder=player.element.querySelector('.record-photo-placeholder');
  player.loading=true;player.nextAt=0;recordArchiveSchedule();recordArchiveReleaseLayer(player,index);
  let src=photo.previewDataUrl||photo.dataUrl||'';
  if(player.active<0){placeholder.hidden=false;placeholder.lastElementChild.textContent='写真を読み込み中';player.element.dataset.photoState='loading';}
  if(photo.mediaKey){
    try{
      const blob=await mediaGet(photo.mediaKey);if(!valid()) return;
      if(blob&&(!blob.type||blob.type.startsWith('image/'))){player.urls[index]=URL.createObjectURL(blob);src=player.urls[index];}
    }catch(_e){/* A saved preview remains usable when the original cannot be read. */}
  }
  if(!valid()) return;
  let loaded=await recordArchiveLoadImage(player,img,src);
  if(!valid()) return;
  const fallback=photo.previewDataUrl||photo.dataUrl||'';
  if(!loaded&&fallback&&fallback!==src){
    recordArchiveReleaseLayer(player,index);loaded=await recordArchiveLoadImage(player,img,fallback);if(!valid())return;
  }
  player.loading=false;
  if(loaded){
    const previous=player.active;img.hidden=false;
    const background=player.backgrounds[index];
    if(background){background.style.backgroundImage=`url(${JSON.stringify(img.src)})`;void background.offsetWidth;background.classList.add('is-current');}
    // Start the 260ms fade from a rendered transparent layer; card geometry stays fixed.
    void img.offsetWidth;img.classList.add('is-current');
    if(previous>=0&&previous!==index){
      player.layers[previous].classList.remove('is-current');player.backgrounds[previous]?.classList.remove('is-current');
      clearTimeout(player.fadeTimer);player.fadeTimer=setTimeout(()=>{player.fadeTimer=null;if(valid())recordArchiveReleaseLayer(player,previous);},300);
    }
    player.active=index;placeholder.hidden=true;player.element.dataset.photoKey=recordArchivePhotoKey(photo);player.element.dataset.photoState='ready';
  }else{
    recordArchiveReleaseLayer(player,index);
    if(player.active<0){placeholder.hidden=false;placeholder.lastElementChild.textContent='写真を表示できません';player.element.dataset.photoState='unavailable';}
  }
  if(player.photos.length>1)player.nextAt=performance.now()+3000;
  recordArchiveSchedule();
}
function recordArchiveAdvance(player,resume=false){
  if(player.disposed||!player.visible||player.loading||!recordArchivePageVisible()||!player.photos.length) return;
  if(!resume||!player.current){
    if(!player.queue.length)player.queue=recordArchiveShuffle(player.photos,player.current?recordArchivePhotoKey(player.current):'');
    player.current=player.queue.shift();
  }
  recordArchiveDisplay(player,player.current);
}
function recordArchiveObserve(){
  if(!recordArchivePageVisible()) return;
  const ui=RECORD_ARCHIVE_UI;
  ui.observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const player=ui.players.find(p=>p.element===entry.target);if(!player||player.disposed)return;
      if(entry.isIntersecting&&recordArchivePageVisible()){
        if(!player.visible){player.visible=true;recordArchiveAdvance(player,true);}
      }else recordArchivePause(player);
    });recordArchiveSchedule();
  },{threshold:0.01});
  ui.players.forEach(player=>{if(player.photos.length)ui.observer.observe(player.element);});
}
function recordArchiveScreenChanged(id){
  const ui=RECORD_ARCHIVE_UI;recordArchiveStop();
  if(id==='record'){
    if(!ui.pendingDetail){ui.view='list';ui.tripId='';}
    ui.pendingDetail=false;renderRecordScreen();
  }else{ui.view='list';ui.tripId='';ui.pendingDetail=false;}
}
function installRecordArchiveUi(){
  const ui=RECORD_ARCHIVE_UI;if(ui.installed)return;ui.installed=true;
  const liveRenderer=renderRecordScreen;
  renderRecordScreen=function(){
    recordArchiveStop();
    if(ui.view!=='timeline'||!getTripById(ui.tripId)){ui.view='list';recordArchiveRenderList();return;}
    const trip=getTripById(ui.tripId);
    if(recordArchiveIsPast(trip)){recordArchiveRenderTimeline(trip);return;}
    liveRenderer();
    const section=document.getElementById('record');section.dataset.recordView='live';
    section.insertAdjacentHTML('afterbegin',recordArchiveBackButton());
  };
  const selectTrip=setRecordTrip;
  setRecordTrip=function(tripId){
    if(!getTripById(tripId))return;
    if(!recordArchivePageVisible()){ui.returnScroll=0;ui.returnTrip=tripId;}
    ui.view='timeline';ui.tripId=tripId;ui.pendingDetail=true;selectTrip(tripId);
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('#record button');if(!button)return;
    if(button.dataset.recordOpen)recordArchiveOpenTrip(button.dataset.recordOpen);
    else if(button.hasAttribute('data-record-list'))recordArchiveReturn();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)recordArchiveStop();else if(recordArchivePageVisible())renderRecordScreen();});
  window.addEventListener('pagehide',recordArchiveStop);
  window.addEventListener('pageshow',event=>{if(event.persisted&&recordArchivePageVisible())renderRecordScreen();});
}
if(typeof document!=='undefined')installRecordArchiveUi();
