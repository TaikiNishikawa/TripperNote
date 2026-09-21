/* Tripper Note v2.6.0-A.2 Storage Architecture Hotfix
   IndexedDB foundation store for v2.1 core data.
   localStorage is intentionally NOT used for the full v2.6 model. */
const TRIPPER_CORE_DB='tripperNoteCore';
const TRIPPER_CORE_DB_VERSION=1;
const TRIPPER_CORE_STORES=[
  'meta','trips','schedules','choiceSlots','travelLegs','timelineGroups',
  'blocks','mediaAssets','notificationEvents','backups'
];

function coreDbOpen(){
  return new Promise((resolve,reject)=>{
    let req;
    try{ req=indexedDB.open(TRIPPER_CORE_DB,TRIPPER_CORE_DB_VERSION); }
    catch(err){ reject(err); return; }
    req.onupgradeneeded=()=>{
      const db=req.result;
      TRIPPER_CORE_STORES.forEach(name=>{
        if(!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      });
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Tripper Note Core DBを開けませんでした'));
    req.onblocked=()=>reject(new DOMException('Tripper Note Core DBが別の処理で使用中です','InvalidStateError'));
  });
}

function coreTxComplete(db,tx,resolve,reject){
  let settled=false;
  const finish=(fn,value)=>{
    if(settled) return;
    settled=true;
    try{ db.close(); }catch(_e){}
    fn(value);
  };
  tx.oncomplete=()=>finish(resolve,true);
  tx.onerror=()=>finish(reject,tx.error||new Error('Tripper Note Core DBの保存に失敗しました'));
  tx.onabort=()=>finish(reject,tx.error||new DOMException('Tripper Note Core DBの保存が中断されました','AbortError'));
  return finish;
}

async function coreGet(storeName,key){
  const db=await coreDbOpen();
  return await new Promise((resolve,reject)=>{
    let tx;
    try{ tx=db.transaction(storeName,'readonly'); }
    catch(err){ try{db.close()}catch(_e){} reject(err); return; }
    const req=tx.objectStore(storeName).get(key);
    req.onsuccess=()=>{ const value=req.result; try{db.close()}catch(_e){} resolve(value===undefined?null:value); };
    req.onerror=()=>{ const err=req.error||new Error('Tripper Note Core DBの読込に失敗しました'); try{db.close()}catch(_e){} reject(err); };
    tx.onabort=()=>{ const err=tx.error||new DOMException('Tripper Note Core DBの読込が中断されました','AbortError'); try{db.close()}catch(_e){} reject(err); };
  });
}

async function corePut(storeName,key,value){
  const db=await coreDbOpen();
  return await new Promise((resolve,reject)=>{
    let tx;
    try{ tx=db.transaction(storeName,'readwrite'); }
    catch(err){ try{db.close()}catch(_e){} reject(err); return; }
    const finish=coreTxComplete(db,tx,resolve,reject);
    try{
      const req=tx.objectStore(storeName).put(value,key);
      req.onerror=()=>finish(reject,req.error||new Error('Tripper Note Core DBへ書き込めませんでした'));
    }catch(err){ finish(reject,err); }
  });
}

async function coreWriteBackupOnce(key,rawText){
  if(!key||!rawText) return false;
  const existing=await coreGet('backups',key);
  if(existing!==null) return false;
  await corePut('backups',key,{rawText:String(rawText),createdAt:new Date().toISOString()});
  return true;
}

async function corePersistFoundation(payload={}){
  const db=await coreDbOpen();
  const stores=['meta','trips','schedules','choiceSlots','travelLegs','timelineGroups','blocks','mediaAssets','notificationEvents'];
  return await new Promise((resolve,reject)=>{
    let tx;
    try{ tx=db.transaction(stores,'readwrite'); }
    catch(err){ try{db.close()}catch(_e){} reject(err); return; }
    const finish=coreTxComplete(db,tx,resolve,reject);
    try{
      const appMeta={
        ...(payload.meta||{}),
        storageArchitecture:'indexeddb-v1',
        updatedAt:new Date().toISOString()
      };
      const metaStore=tx.objectStore('meta');
      metaStore.put(appMeta,'app');

      const writeCollection=(storeName,items,keyFor)=>{
        const store=tx.objectStore(storeName);
        store.clear();
        (Array.isArray(items)?items:[]).forEach((item,index)=>{
          const key=keyFor(item,index);
          if(key!==null&&key!==undefined&&String(key)!=='') store.put(item,String(key));
        });
      };
      writeCollection('trips',payload.trips,item=>item?.id);
      writeCollection('schedules',payload.schedules,item=>item?.id);
      writeCollection('choiceSlots',payload.choiceSlots,item=>item?.id);
      writeCollection('travelLegs',payload.travelLegs,item=>item?.id);
      writeCollection('timelineGroups',payload.timelineGroups,item=>item?.id);
      writeCollection('blocks',payload.blocks,item=>item?.id);
      writeCollection('mediaAssets',payload.mediaAssets,item=>item?.id);
      writeCollection('notificationEvents',payload.notificationEvents,item=>item?.id);
    }catch(err){
      try{ tx.abort(); }catch(_e){}
      finish(reject,err);
    }
  });
}

async function coreReadFoundation(){
  const db=await coreDbOpen();
  const stores=['meta','trips','schedules','choiceSlots','travelLegs','timelineGroups','blocks','mediaAssets','notificationEvents'];
  return await new Promise((resolve,reject)=>{
    let tx;
    try{ tx=db.transaction(stores,'readonly'); }
    catch(err){ try{db.close()}catch(_e){} reject(err); return; }
    const result={meta:null,trips:[],schedules:[],choiceSlots:[],travelLegs:[],timelineGroups:[],blocks:[],mediaAssets:[],notificationEvents:[]};
    let pending=stores.length;
    const done=()=>{ pending--; if(pending===0){ try{db.close()}catch(_e){} resolve(result); } };
    stores.forEach(storeName=>{
      const store=tx.objectStore(storeName);
      const req=storeName==='meta'?store.get('app'):store.getAll();
      req.onsuccess=()=>{ result[storeName]=storeName==='meta'?(req.result||null):(req.result||[]); done(); };
      req.onerror=()=>{ const err=req.error||new Error(`Core store ${storeName} read failed`); try{db.close()}catch(_e){} reject(err); };
    });
    tx.onabort=()=>{ const err=tx.error||new DOMException('Core DB read aborted','AbortError'); try{db.close()}catch(_e){} reject(err); };
  });
}

async function coreStorageDiagnostics(){
  const meta=await coreGet('meta','app').catch(()=>null);
  let estimate=null;
  try{
    if(navigator.storage?.estimate){
      const e=await navigator.storage.estimate();
      estimate={usage:Number(e.usage)||0,quota:Number(e.quota)||0};
    }
  }catch(_e){}
  return {database:TRIPPER_CORE_DB,version:TRIPPER_CORE_DB_VERSION,meta,estimate};
}
