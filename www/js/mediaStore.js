/* Tripper Note v2.5.8-A - resilient local media blob storage using IndexedDB */
const TRIPPER_MEDIA_DB='tripperNoteMedia';
const TRIPPER_MEDIA_STORE='media';

function mediaDbOpen(){
  return new Promise((resolve,reject)=>{
    let req;
    try{ req=indexedDB.open(TRIPPER_MEDIA_DB,1); }
    catch(err){ reject(err); return; }
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(TRIPPER_MEDIA_STORE)) db.createObjectStore(TRIPPER_MEDIA_STORE);
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('IndexedDBを開けませんでした'));
    req.onblocked=()=>reject(new DOMException('IndexedDBが別の処理で使用中です','InvalidStateError'));
  });
}

async function mediaPut(key,blob){
  if(!key) throw new TypeError('media key is required');
  if(!(blob instanceof Blob)) throw new TypeError('media blob is required');
  const db=await mediaDbOpen();
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(fn,value)=>{ if(settled) return; settled=true; try{db.close()}catch(_e){} fn(value); };
    let tx;
    try{ tx=db.transaction(TRIPPER_MEDIA_STORE,'readwrite'); }
    catch(err){ finish(reject,err); return; }
    tx.oncomplete=()=>finish(resolve,key);
    tx.onerror=()=>finish(reject,tx.error||new Error('メディア保存トランザクションに失敗しました'));
    tx.onabort=()=>finish(reject,tx.error||new DOMException('メディア保存が中断されました','AbortError'));
    try{
      const req=tx.objectStore(TRIPPER_MEDIA_STORE).put(blob,key);
      req.onerror=()=>finish(reject,req.error||new Error('メディアを書き込めませんでした'));
    }catch(err){ finish(reject,err); }
  });
}

async function mediaGet(key){
  if(!key) return null;
  const db=await mediaDbOpen();
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(fn,value)=>{ if(settled) return; settled=true; try{db.close()}catch(_e){} fn(value); };
    let tx;
    try{ tx=db.transaction(TRIPPER_MEDIA_STORE,'readonly'); }
    catch(err){ finish(reject,err); return; }
    const req=tx.objectStore(TRIPPER_MEDIA_STORE).get(key);
    req.onsuccess=()=>finish(resolve,req.result||null);
    req.onerror=()=>finish(reject,req.error||new Error('メディアを読み込めませんでした'));
    tx.onabort=()=>finish(reject,tx.error||new DOMException('メディア読込が中断されました','AbortError'));
  });
}

async function mediaDelete(key){
  if(!key) return;
  const db=await mediaDbOpen();
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(fn,value)=>{ if(settled) return; settled=true; try{db.close()}catch(_e){} fn(value); };
    let tx;
    try{ tx=db.transaction(TRIPPER_MEDIA_STORE,'readwrite'); }
    catch(err){ finish(reject,err); return; }
    tx.objectStore(TRIPPER_MEDIA_STORE).delete(key);
    tx.oncomplete=()=>finish(resolve,undefined);
    tx.onerror=()=>finish(reject,tx.error||new Error('メディア削除に失敗しました'));
    tx.onabort=()=>finish(reject,tx.error||new DOMException('メディア削除が中断されました','AbortError'));
  });
}

async function mediaStorageEstimate(){
  try{
    if(!navigator.storage?.estimate) return null;
    const result=await navigator.storage.estimate();
    return {usage:Number(result.usage)||0,quota:Number(result.quota)||0};
  }catch(_e){ return null; }
}
