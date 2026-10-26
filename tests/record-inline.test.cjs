'use strict';

// node --test tests/record-inline.test.cjs
// Synthetic records only. Execute production model helpers without application
// startup, a browser profile, device photos, or any Storage access.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = name => readFileSync(path.join(__dirname, '../www/js', name), 'utf8');
const appSource = source('app.js');

// Production declarations verbatim. No Photo matching/shuffle logic is copied.
function declaration(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Production helper ${name} exists`);
  const lineEnd = appSource.indexOf('\n', start);
  const end = appSource.slice(start, lineEnd).endsWith('}') ? lineEnd : appSource.indexOf('\n}', lineEnd) + 2;
  assert.ok(end > start, `Production helper ${name} has a closing brace`);
  return appSource.slice(start, end);
}
let forbiddenAccesses = 0;
const forbidden = name => () => { forbiddenAccesses++; throw new Error(`Forbidden access: ${name}`); };
const registrations = [];
const sandbox = {
  console,
  document: {
    addEventListener(type, listener) { registrations.push({ type, listener }); },
    getElementById: forbidden('DOM lookup'), querySelector: forbidden('DOM lookup'), querySelectorAll: forbidden('DOM lookup')
  },
  window: { addEventListener(type, listener) { registrations.push({ type, listener }); } },
  renderRecordScreen: forbidden('Record rendering'), showScreen: forbidden('navigation'), setRecordTrip: forbidden('Trip selection'),
  setTimeout: forbidden('timer'), setInterval: forbidden('timer'), requestAnimationFrame: forbidden('animation'),
  mediaGet: forbidden('photo storage'), mediaPut: forbidden('photo storage'), mediaDelete: forbidden('photo storage'),
  persistAppData: forbidden('persistence')
};
for (const name of ['localStorage', 'indexedDB', 'APP_DATA', 'EDIT_DATA', 'DEFAULT_APP_DATA']) {
  Object.defineProperty(sandbox, name, {
    get: forbidden(name), set: forbidden(`${name} write`)
  });
}
const context = vm.createContext(sandbox);
vm.runInContext(source('storage.js'), context, { filename: 'storage.js' });
for (const name of ['timeToMinutes', 'slotSortMinutes', 'selectedCandidate', 'getDayFromTrip', 'getPlanFromTrip', 'getActivePlanFromTrip', 'b32DurableActiveScheduleRef', 'b1RecordIsImage', 'b1RecordSortAt']) {
  vm.runInContext(declaration(name), context, { filename: `app.js:${name}` });
}
vm.runInContext(source('recordArchive.js'), context, { filename: 'recordArchive.js' });

const plain = value => JSON.parse(JSON.stringify(value));
function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}
function schedule(id = 's1', startTime = '09:00') {
  return {
    id, startTime, endTime: '10:00', completedAt: '',
    selectedCandidateId: 'candidate-a',
    candidates: [{ id: 'candidate-a', name: '架空の散歩', activity: '散歩' }],
    v21: { status: 'completed', plannedStartAt: '2026-09-01T09:00:00', plannedEndAt: '2026-09-01T10:00:00', actualStartAt: '2026-09-01T09:05:12+09:00', actualEndAt: '2026-09-01T10:02:01+09:00' }
  };
}
function fixture(records = []) {
  return {
    id: 'trip-a', title: '架空の過去旅行', startDate: '2026-09-01', endDate: '2026-09-02',
    days: [
      { day: 1, date: '2026-09-01', activePlanId: 'a', plans: [{ id: 'a', slots: [schedule()] }] },
      { day: 2, date: '2026-09-02', activePlanId: 'a', plans: [{ id: 'a', slots: [schedule('s2', '11:00')] }] }
    ], records
  };
}
function photo(id, overrides = {}) {
  return {
    id, tripId: 'trip-a', day: 1, planId: 'a', slotId: 's1',
    mediaType: 'image', mediaKey: `synthetic-${id}`, previewDataUrl: '',
    capturedAt: '2026-09-01T09:30:00+09:00', createdAt: '2026-09-01T09:30:01+09:00',
    ...overrides
  };
}
const photos = value => context.recordArchiveTripPhotos(value);
const ids = values => plain(values.map(record => record.id));
const now = () => new Date(2026, 9, 25, 12, 0, 0);

test('empty and missing Trip yield no fabricated photos or archive trips', () => {
  assert.deepEqual(plain(photos(null)), []);
  assert.deepEqual(plain(photos(fixture())), []);
  assert.deepEqual(plain(context.recordArchiveTrips([], now())), []);
});
test('past Trips sort newest first without modifying source order', () => {
  const values = [fixture(), {...fixture(),id:'newer',startDate:'2026-10-01',endDate:'2026-10-02'}, {...fixture(),id:'future',startDate:'2026-12-01',endDate:'2026-12-02'}];
  freezeDeep(values);
  assert.deepEqual(ids(context.recordArchiveTrips(values, now())), ['newer','trip-a']);
  assert.deepEqual(values.map(t=>t.id), ['trip-a','newer','future']);
});
test('all Trip photos include Schedule-linked, unlinked, detour and inactive-plan records', () => {
  const records = [photo('linked'),photo('unlinked',{slotId:''}),photo('detour',{slotId:undefined,day:2}),photo('other-plan',{planId:'b'})];
  assert.deepEqual(ids(photos(freezeDeep(fixture(records)))), records.map(r=>r.id));
});
test('explicit foreign Trip is excluded despite matching times, place and slot', () => {
  const data = fixture([photo('own'),photo('foreign',{tripId:'other'}),photo('legacy',{tripId:undefined})]);
  assert.deepEqual(ids(photos(freezeDeep(data))), ['own','legacy']);
});
test('zero, one and multiple photos keep object identities and counts', () => {
  for(const count of [0,1,4]) {
    const records=Array.from({length:count},(_,i)=>photo('p'+i)),data=freezeDeep(fixture(records));
    assert.equal(photos(data).length,count);assert.ok(photos(data).every(r=>records.includes(r)));
  }
});
test('ChoiceSlot candidates do not multiply Trip photos', () => {
  const data=fixture([photo('one')]);data.days[0].plans[0].slots[0].candidates.push({id:'b',name:'other'});
  assert.deepEqual(ids(photos(freezeDeep(data))),['one']);
});
test('video, audio, text and explicit non-image MIME are excluded even with image previews', () => {
  const records=['video','audio','text'].map(mediaType=>photo(mediaType,{mediaType,previewDataUrl:'data:image/png;base64,synthetic'}));
  records.push(photo('wrong-mime',{mimeType:'video/mp4'}),photo('image'));
  assert.deepEqual(ids(photos(freezeDeep(fixture(records)))),['image']);
});
test('legacy normalized none and absent type require image data; metadata-only image remains a photo', () => {
  const records=[photo('legacy',{mediaType:'none',mediaKey:'',previewDataUrl:'data:image/png;base64,synthetic'}),photo('absent',{mediaType:undefined,mediaKey:'',dataUrl:'data:image/png;base64,other'}),photo('not-image',{mediaType:undefined,mediaKey:'',previewDataUrl:''}),photo('unloaded',{mediaKey:'',previewDataUrl:''})];
  assert.deepEqual(ids(photos(freezeDeep(fixture(records)))),['legacy','absent','unloaded']);
});
test('duplicate media keys, record IDs and id-less inline sources are deduplicated', () => {
  const records=[photo('one'),photo('alias',{mediaKey:'synthetic-one'}),photo('one',{mediaKey:'other-key'}),photo('',{mediaKey:'',previewDataUrl:'data:image/png;base64,unique'}),photo('',{mediaKey:'',previewDataUrl:'data:image/png;base64,unique'})];
  assert.equal(photos(freezeDeep(fixture(records))).length,2);
});
test('photo cycle identity prefers media key then record ID', () => {
  assert.equal(context.recordArchivePhotoKey(photo('a')),'synthetic-a');
  assert.equal(context.recordArchivePhotoKey(photo('a',{mediaKey:''})),'a');
});
test('Timeline strict match uses explicit unique Schedule identity, never time guesses', () => {
  const data=freezeDeep(fixture()),all=context.recordArchiveAllItems(data),first=all[0];
  assert.equal(context.recordArchiveRecordMatches(photo('linked'),data,first,all),true);
  for(const change of [{slotId:''},{tripId:'other'},{day:2},{planId:'b'},{slotId:'other'}])assert.equal(context.recordArchiveRecordMatches(photo('wrong',change),data,first,all),false);
});
test('unique legacy partial Schedule identity remains usable without field repair', () => {
  const data=freezeDeep(fixture()),all=context.recordArchiveAllItems(data),record=freezeDeep(photo('legacy',{day:null,planId:''}));
  const before=JSON.stringify(record);
  assert.equal(context.recordArchiveRecordMatches(record,data,all[0],all),true);assert.equal(JSON.stringify(record),before);
});
test('ambiguous partial Schedule link stays in Trip photos but does not match Timeline Schedule', () => {
  const record=photo('ambiguous',{day:null,planId:''}),data=fixture([record]);
  data.days[0].plans.push({id:'b',slots:[schedule()]});freezeDeep(data);
  const all=context.recordArchiveAllItems(data);
  assert.equal(context.recordArchiveRecordMatches(record,data,all[0],all),false);
  assert.deepEqual(ids(photos(data)),['ambiguous']);
});
test('past classification excludes today/future and invalid end dates', () => {
  assert.equal(context.recordArchiveIsPast(null,now()),false);
  for(const [endDate,expected] of [['2026-10-24',true],['2026-10-25',false],['2026-10-26',false],['2026-02-31',false]])assert.equal(context.recordArchiveIsPast(freezeDeep({...fixture(),endDate}),now()),expected);
});
for(const status of ['active','extended'])test(`durable ${status} prevents archiving even after Trip date`,()=>{
  const data=fixture(),slot=data.days[0].plans[0].slots[0];slot.v21.status=status;slot.v21.actualEndAt=null;freezeDeep(data);
  assert.equal(context.recordArchiveIsPast(data,now()),false);
  assert.deepEqual(ids(context.recordArchiveCurrentTrips([data],now())),['trip-a']);assert.equal(slot.v21.status,status);
});
test('open actual on inactive plan retains current Trip without changing status',()=>{
  const data=fixture(),slot=schedule('open');slot.v21.status='upcoming';slot.v21.actualEndAt=null;
  data.days[0].plans.push({id:'b',slots:[slot]});freezeDeep(data);
  assert.equal(context.recordArchiveIsPast(data,now()),false);assert.equal(context.recordArchiveCurrentTrips([data],now()).length,1);assert.equal(slot.v21.status,'upcoming');
});
test('current date-range Trip uses existing semantics and does not mutate state',()=>{
  const data=freezeDeep({...fixture(),startDate:'2026-10-25',endDate:'2026-10-26'}),before=JSON.stringify(data);
  assert.equal(context.recordArchiveCurrentTrips([data],now()).length,1);assert.equal(JSON.stringify(data),before);
});
test('completed actual facts permit past archive presentation',()=>{
  const data=freezeDeep(fixture());assert.equal(context.recordArchiveIsPast(data,now()),true);
  assert.equal(data.days[0].plans[0].slots[0].v21.actualEndAt,'2026-09-01T10:02:01+09:00');
});
test('shuffle copies empty and singleton arrays',()=>{
  for(const input of [freezeDeep([]),freezeDeep([photo('only')])]){const result=context.recordArchiveShuffle(input,'',()=>0);assert.notEqual(result,input);assert.deepEqual(plain(result),plain(input));}
});
test('shuffle visits every photo once and retains original objects',()=>{
  const input=freezeDeep(Array.from({length:8},(_,i)=>photo('p'+i))),result=context.recordArchiveShuffle(input,'',()=>0.37);
  assert.equal(new Set(result.map(context.recordArchivePhotoKey)).size,8);assert.deepEqual(ids(result).sort(),input.map(r=>r.id).sort());assert.ok(result.every(r=>input.includes(r)));
});
test('each new shuffle avoids repeating previous final photo',()=>{
  const input=freezeDeep([photo('a'),photo('b'),photo('c')]);
  for(const last of input)for(const random of [()=>0,()=>0.9999]){const key=context.recordArchivePhotoKey(last),result=context.recordArchiveShuffle(input,key,random);assert.notEqual(context.recordArchivePhotoKey(result[0]),key);assert.equal(new Set(result.map(context.recordArchivePhotoKey)).size,3);}
});
test('random input changes order; input order is unchanged',()=>{
  const input=freezeDeep([photo('a'),photo('b'),photo('c'),photo('d')]);
  assert.notDeepEqual(ids(context.recordArchiveShuffle(input,'',()=>0)),ids(context.recordArchiveShuffle(input,'',()=>0.9999)));assert.deepEqual(input.map(r=>r.id),['a','b','c','d']);
});
test('projection and shuffle preserve Trip, actual, photo timestamps and links without storage access',()=>{
  const data=freezeDeep(fixture([photo('linked'),photo('loose',{slotId:''})])),before=JSON.stringify(data);
  context.recordArchiveTrips([data],now());context.recordArchiveCurrentTrips([data],now());context.recordArchiveShuffle(photos(data));context.recordArchiveAllItems(data);
  assert.equal(JSON.stringify(data),before);assert.equal(forbiddenAccesses,0);
});
