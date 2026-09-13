/* Tripper Note v2.5.2 - navigation preferences + destination resolver
   Yahoo!カーナビは公式URLスキーム上、目的地の緯度・経度が必要。
   緯度経度がない場合は iOS MapKit (PlaceResolverPlugin) で施設名/住所から解決する。
*/
function numericCoord(v){
  if(v===null||v===undefined||String(v).trim()==='') return null;
  const n=Number(v); return Number.isFinite(n)?n:null;
}

function findNavPoint(text){
  const needle=String(text||'').trim().toLowerCase();
  if(!needle) return null;
  return NAV_POINTS.find(p=>p.keys.some(k=>{
    const key=String(k).toLowerCase();
    return needle===key||needle.includes(key)||key.includes(needle);
  }))||null;
}

function parseCoordinatesFromMapUrl(url){
  let text=String(url||'').trim();
  if(!text) return null;
  try{ text=decodeURIComponent(text); }catch(_e){}
  const patterns=[
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
    /!3d(-?\d{1,3}(?:\.\d+)?)[^!]*!4d(-?\d{1,3}(?:\.\d+)?)/,
    /[?&](?:query|destination|q|ll)=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i,
    /[?&]center=(-?\d{1,3}(?:\.\d+)?)(?:%2C|,)(-?\d{1,3}(?:\.\d+)?)/i
  ];
  for(const re of patterns){
    const m=text.match(re);
    if(!m) continue;
    const lat=Number(m[1]),lon=Number(m[2]);
    if(Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180) return {lat,lon};
  }
  return null;
}

function candidateCoords(c){
  const lat=numericCoord(c?.lat),lon=numericCoord(c?.lon);
  if(lat!==null&&lon!==null) return {lat,lon,name:c.destination||c.name};

  const urlPoint=parseCoordinatesFromMapUrl(c?.googleMapsUrl);
  if(urlPoint) return {...urlPoint,name:c.destination||c.name};

  const known=findNavPoint(c?.destination||c?.name);
  return known?{lat:known.lat,lon:known.lon,name:known.name}:null;
}

function destinationText(c){
  const point=candidateCoords(c);
  if(point) return `${point.lat},${point.lon}`;
  return String(c?.address||c?.destination||c?.name||'').trim();
}

function getNavigationPreference(mode){
  return APP_DATA?.settings?.navigation?.[mode]||({car:'yahoo_carnavi',walk:'google_maps',train:'yahoo_transit'}[mode]);
}

function setNavigationPreference(mode,appId){
  APP_DATA.settings=APP_DATA.settings||{};
  APP_DATA.settings.navigation=APP_DATA.settings.navigation||{};
  APP_DATA.settings.navigation[mode]=appId;
  persistAppData();
}

function openExternal(url){ if(url) window.location.href=url; }

function googleDirectionsUrl(c,mode){
  const dest=destinationText(c);
  if(!dest) return '';
  const travel={car:'driving',walk:'walking',train:'transit'}[mode]||'driving';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=${travel}`;
}

function appleDirectionsUrl(c,mode){
  const dest=destinationText(c);
  if(!dest) return '';
  const flag={car:'d',walk:'w',train:'r'}[mode]||'d';
  return `https://maps.apple.com/?daddr=${encodeURIComponent(dest)}&dirflg=${flag}`;
}

function yahooTransitUrl(c){
  const dest=String(c?.stationName||c?.destination||c?.address||c?.name||'').trim();
  return dest?`https://transit.yahoo.co.jp/search/result?to=${encodeURIComponent(dest)}`:'';
}

function yahooCarNaviUrl(c){
  const p=candidateCoords(c);
  return p?`yjcarnavi://navi/select?lat=${p.lat}&lon=${p.lon}&name=${encodeURIComponent(p.name||c.destination||c.name||'目的地')}`:'';
}

function activeTripCoordinateHint(tripHint=null){
  const trip=tripHint||APP_DATA?.trips?.find(t=>t.id===APP_DATA.activeTripId)||APP_DATA?.trips?.[0];
  if(!trip) return null;
  const points=[];
  (trip.days||[]).forEach(day=>{
    const l=day.lodging;
    const llat=numericCoord(l?.lat),llon=numericCoord(l?.lon);
    if(llat!==null&&llon!==null) points.push({lat:llat,lon:llon});
    (day.plans||[]).forEach(plan=>(plan.slots||[]).forEach(slot=>(slot.candidates||[]).forEach(c=>{
      const lat=numericCoord(c?.lat),lon=numericCoord(c?.lon);
      if(lat!==null&&lon!==null) points.push({lat,lon});
    })));
  });
  if(!points.length) return null;
  const median=arr=>{ const a=arr.slice().sort((x,y)=>x-y),m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; };
  const lat=median(points.map(p=>p.lat)),lon=median(points.map(p=>p.lon));
  const maxDelta=Math.max(...points.map(p=>Math.max(Math.abs(p.lat-lat),Math.abs(p.lon-lon))),0.15);
  return {lat,lon,span:Math.min(Math.max(maxDelta*4,0.35),4)};
}

function getNativePlaceResolverPlugin(){
  try{
    const plugin=window.Capacitor?.Plugins?.PlaceResolverPlugin;
    if(plugin&&typeof plugin.resolvePlace==='function') return plugin;
  }catch(_e){}
  return null;
}
function nativePlaceResolverAvailable(){
  try{
    if(getNativePlaceResolverPlugin()) return true;
    return !!(window.Capacitor && typeof window.Capacitor.nativePromise==='function' &&
      (!window.Capacitor.isNativePlatform || window.Capacitor.isNativePlatform()));
  }catch(_e){ return false; }
}

async function resolvePlaceWithNativeSearch(c,tripHint=null){
  if(!nativePlaceResolverAvailable()) return null;
  const query=String(c?.address||c?.destination||c?.name||'').trim();
  const googleMapsUrl=String(c?.googleMapsUrl||'').trim();
  if(!query&&!googleMapsUrl) return null;
  const hint=activeTripCoordinateHint(tripHint);
  const options={query,googleMapsUrl,preferMapsUrl:!!c?.preferMapsUrl};
  if(hint){ options.hintLat=hint.lat; options.hintLon=hint.lon; options.span=hint.span; }
  try{
    const plugin=getNativePlaceResolverPlugin();
    const result=plugin
      ? await plugin.resolvePlace(options)
      : await window.Capacitor.nativePromise('PlaceResolverPlugin','resolvePlace',options);
    if(!result?.found) return null;
    const lat=numericCoord(result.lat),lon=numericCoord(result.lon);
    if(lat===null||lon===null) return null;
    return {lat,lon,name:result.name||c.destination||c.name,address:result.address||'',source:'mapkit'};
  }catch(err){
    console.warn('PlaceResolverPlugin unavailable/failed',err);
    return null;
  }
}

function applyResolvedLocation(c,resolved){
  if(!c||!resolved) return;
  c.lat=resolved.lat;
  c.lon=resolved.lon;
  if(!c.address&&resolved.address) c.address=resolved.address;
  c.locationResolutionSource=resolved.source||'resolved';
  c.locationResolvedAt=new Date().toISOString();
  try{
    if(typeof persistAppData==='function') persistAppData();
    if(typeof showToast==='function') showToast('✓ 目的地の位置情報を自動取得しました');
  }catch(_e){}
}

async function ensureDestinationCoordinates(c,tripHint=null){
  const existing=candidateCoords(c);
  if(existing){
    if((numericCoord(c?.lat)===null||numericCoord(c?.lon)===null) && existing.lat!==undefined){
      c.lat=existing.lat; c.lon=existing.lon;
      if(typeof persistAppData==='function') persistAppData();
    }
    return existing;
  }
  const nativeResult=await resolvePlaceWithNativeSearch(c,tripHint);
  if(nativeResult){ applyResolvedLocation(c,nativeResult); return nativeResult; }
  return null;
}

function buildNavigationUrl(c,mode,appId=getNavigationPreference(mode)){
  if(mode==='car'){
    if(appId==='yahoo_carnavi') return yahooCarNaviUrl(c); // no silent fallback
    if(appId==='apple_maps') return appleDirectionsUrl(c,'car');
    return googleDirectionsUrl(c,'car');
  }
  if(mode==='walk') return appId==='apple_maps'?appleDirectionsUrl(c,'walk'):googleDirectionsUrl(c,'walk');
  if(mode==='train'){
    if(appId==='yahoo_transit') return yahooTransitUrl(c) || googleDirectionsUrl(c,'train');
    if(appId==='apple_maps') return appleDirectionsUrl(c,'train');
    return googleDirectionsUrl(c,'train');
  }
  return '';
}

async function navigateByPreference(c,mode,tripHint=null){
  const appId=getNavigationPreference(mode);

  if(mode==='car'&&appId==='yahoo_carnavi'){
    const resolved=await ensureDestinationCoordinates(c,tripHint);
    if(resolved){
      const url=yahooCarNaviUrl(c);
      if(url){ openExternal(url); return; }
    }

    const placeName=String(c?.destination||c?.address||c?.name||'目的地').trim();
    if(!nativePlaceResolverAvailable()){
      alert(`「${placeName}」の緯度・経度を取得できませんでした。\n\nYahoo!カーナビを選択しているため、Google Mapsへは自動で切り替えません。\n候補の編集画面で「位置情報を取得」を実行するか、XcodeのPlaceResolver設定を確認してください。`);
    }else{
      alert(`「${placeName}」をYahoo!カーナビ用の位置情報に変換できませんでした。\n\n施設名をより具体的にするか、住所・緯度経度を入力してください。Google Mapsへは自動で切り替えません。`);
    }
    return;
  }

  const url=buildNavigationUrl(c,mode,appId);
  if(!url){ alert('目的地を登録してください。'); return; }
  openExternal(url);
}

function buildMapSearchUrl(c){
  if(c?.googleMapsUrl) return c.googleMapsUrl;
  const q=destinationText(c);
  return q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:'';
}
