'use strict';

// node --test tests/home-calendar.test.cjs
// Run under Asia/Tokyo, America/New_York and Europe/London. All fixtures are
// synthetic; production helpers execute without starting the application.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = name => readFileSync(path.join(__dirname, '../www/js', name), 'utf8');
const appSource = source('app.js');

// Extract declarations verbatim, not copies of the behavior under test. These
// helpers have a top-level closing brace on its own line, or a one-line body.
function declaration(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Production declaration ${name} exists`);
  const lineEnd = appSource.indexOf('\n', start);
  const firstLine = appSource.slice(start, lineEnd);
  const end = firstLine.endsWith('}') ? lineEnd : appSource.indexOf('\n}', lineEnd) + 2;
  assert.ok(end > start, `Production declaration ${name} has a closing brace`);
  return appSource.slice(start, end);
}

let forbiddenAccesses = 0;
const listeners = [];
const sandbox = {
  // Capture boot registration without running it or constructing a fake DOM.
  document: { addEventListener(type, listener) { listeners.push({ type, listener }); } },
  console
};
for (const name of ['localStorage', 'indexedDB', 'APP_DATA', 'EDIT_DATA', 'DEFAULT_APP_DATA']) {
  Object.defineProperty(sandbox, name, {
    get() { forbiddenAccesses++; throw new Error(`Forbidden access: ${name}`); },
    set() { forbiddenAccesses++; throw new Error(`Forbidden write: ${name}`); }
  });
}
const context = vm.createContext(sandbox);
vm.runInContext(source('storage.js'), context, { filename: 'storage.js' });
const scheduleStates = appSource.match(/^const B3_SCHEDULE_STATES=.*;$/m);
assert.ok(scheduleStates, 'Production Schedule states exist');
vm.runInContext(scheduleStates[0], context);
for (const name of [
  'timeToMinutes', 'slotSortMinutes', 'selectedCandidate', 'getDayFromTrip',
  'getPlanFromTrip', 'getActivePlanFromTrip', 'b3StatusForSlot',
  'b32DurableActiveScheduleRef'
]) {
  vm.runInContext(declaration(name), context, { filename: `app.js:${name}` });
}
vm.runInContext(source('calendar.js'), context, { filename: 'calendar.js' });

const plain = value => JSON.parse(JSON.stringify(value));
const dayNumber = value => context.calendarDayNumber(value);
const dateFromDay = value => context.calendarDateFromDay(value);
const now = () => new Date(2026, 9, 24, 12, 30, 0);
function freezeDeep(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeDeep(child);
  return Object.freeze(value);
}
function slot(id, startTime, status = 'upcoming', extra = {}) {
  return {
    id, startTime, endTime: '', selectedCandidateId: `${id}-candidate`,
    candidates: [{ id: `${id}-candidate`, name: `Synthetic ${id}`, transportMode: 'none' }],
    completedAt: '',
    v21: { status, actualStartAt: null, actualEndAt: null, ...extra }
  };
}
function day(date, slots = [], dayIndex = 1, extraPlans = []) {
  return { day: dayIndex, date, activePlanId: 'a', plans: [{ id: 'a', name: 'Plan A', slots }, ...extraPlans], lodging: null };
}
function trip(id, startDate, endDate, days = []) {
  return { id, title: `Synthetic ${id}`, startDate, endDate, days, records: [] };
}
function root(trips, activeTripId = null) {
  return { trips, activeTripId, coreV21: { blocks: [] }, settings: {} };
}
const state = data => context.homeCalendarState(data, now());
const range = (anchor, target, today = '2026-10-24') => plain(context.calendarRangeBetween(anchor, target, today));
const move = (value, endpoint, date, today = '2026-10-24') => plain(context.calendarMoveRangeEndpoint(value, endpoint, date, today));

test('civil dates validate real dates and round-trip independently of host timezone', () => {
  assert.equal(dayNumber('1970-01-01'), 0);
  assert.equal(dayNumber('1969-12-31'), -1);
  for (const date of ['2026-10-24', '2026-12-31', '2027-01-01', '2028-02-29']) {
    assert.equal(dateFromDay(dayNumber(date)), date);
  }
  for (const date of ['2026-02-29', '2026-02-31', '2026-04-31', '2026-13-01', '2026-10-00', '2026-1-01', '2026-10-24T00:00:00', '', null, 20261024]) {
    assert.equal(dayNumber(date), null, String(date));
  }
});

test('invalid numeric calendar days do not become dates', () => {
  for (const value of [NaN, Infinity, -Infinity, 0.5, '0', null, undefined]) {
    assert.equal(dateFromDay(value), '', String(value));
  }
});

for (const [name, from, to] of [
  ['NY spring DST', '2026-03-08', '2026-03-09'],
  ['NY autumn DST', '2026-11-01', '2026-11-02'],
  ['London spring DST', '2026-03-29', '2026-03-30'],
  ['London autumn DST', '2026-10-25', '2026-10-26'],
  ['leap day', '2028-02-28', '2028-02-29'],
  ['month end', '2026-04-30', '2026-05-01'],
  ['year end', '2026-12-31', '2027-01-01']
]) {
  test(`calendar date arithmetic: ${name}`, () => {
    assert.equal(dayNumber(to) - dayNumber(from), 1);
    assert.equal(dateFromDay(dayNumber(from) + 1), to);
  });
}

test('month navigation handles month ends and year boundaries', () => {
  assert.equal(context.calendarShiftMonth('2026-01-31', 1), '2026-02-01');
  assert.equal(context.calendarShiftMonth('2026-12-15', 1), '2027-01-01');
  assert.equal(context.calendarShiftMonth('2027-01-01', -1), '2026-12-01');
  assert.equal(context.calendarShiftMonth('2026-10-24', 0), '2026-10-01');
});

test('month grid contains 42 contiguous calendar dates including adjacent months', () => {
  const cells = plain(context.calendarMonthCells('2026-10-01'));
  assert.equal(cells.length, 42);
  assert.equal(new Set(cells).size, 42);
  assert.ok(cells.includes('2026-09-30'));
  assert.ok(cells.includes('2026-10-01'));
  assert.ok(cells.includes('2026-10-31'));
  assert.ok(cells.includes('2026-11-01'));
  for (let index = 1; index < cells.length; index++) {
    assert.equal(dayNumber(cells[index]) - dayNumber(cells[index - 1]), 1);
  }
});

test('leap-year February grid includes February 29 and March', () => {
  const cells = plain(context.calendarMonthCells('2028-02-01'));
  assert.equal(cells.length, 42);
  assert.ok(cells.includes('2028-02-29'));
  assert.ok(cells.includes('2028-03-01'));
});

test('Trip markers include every date across month and year boundaries', () => {
  const travel = freezeDeep(trip('year-crossing', '2026-12-30', '2027-01-02', [
    day('2026-12-30'), day('2026-12-31', [], 2), day('2027-01-01', [], 3), day('2027-01-02', [], 4)
  ]));
  for (const [date, number] of [['2026-12-30', 1], ['2026-12-31', 2], ['2027-01-01', 3], ['2027-01-02', 4]]) {
    const matches = context.calendarTripsOnDate([travel], date);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].trip, travel);
    assert.equal(matches[0].day.day, number);
  }
  assert.equal(context.calendarTripsOnDate([travel], '2026-12-29').length, 0);
  assert.equal(context.calendarTripsOnDate([travel], '2027-01-03').length, 0);
});

test('overlapping Trips are all returned for explicit selection', () => {
  const travels = freezeDeep([
    trip('first', '2026-10-23', '2026-10-25', [day('2026-10-24', [], 2)]),
    trip('second', '2026-10-24', '2026-10-24', [day('2026-10-24')]),
    trip('other', '2026-10-25', '2026-10-26', [day('2026-10-25')])
  ]);
  const matches = context.calendarTripsOnDate(travels, '2026-10-24');
  assert.deepEqual(plain(matches.map(match => match.trip.id).sort()), ['first', 'second']);
  assert.equal(matches.find(match => match.trip.id === 'first').day.day, 2);
  assert.equal(matches.find(match => match.trip.id === 'second').day.day, 1);
});

test('a date inside a Trip still has a marker when its DAY is absent', () => {
  const travel = freezeDeep(trip('legacy', '2026-10-23', '2026-10-25', [day('2026-10-23')]));
  const matches = context.calendarTripsOnDate([travel], '2026-10-24');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].trip, travel);
  assert.equal(matches[0].day, null);
  assert.equal(travel.days.length, 1);
});

test('Home with no Trips is the simple idle Home', () => {
  const result = state(freezeDeep(root([])));
  assert.equal(result.mode, 'idle');
  assert.equal(result.trip, null);
  assert.equal(result.active, null);
  assert.equal(result.next, null);
  assert.deepEqual(plain(result.recent), []);
});

test('future Trip or viewed Trip alone does not make Home ongoing', () => {
  const travel = trip('future', '2026-11-01', '2026-11-02', [day('2026-11-01')]);
  const result = state(freezeDeep(root([travel], travel.id)));
  assert.equal(result.mode, 'idle');
  assert.equal(result.trip, null);
  assert.equal(result.active, null);
  assert.equal(result.next, null);
});

test('an ongoing Trip has priority over idle and recent Trips', () => {
  const current = trip('current', '2026-10-23', '2026-10-25', [day('2026-10-24')]);
  const result = state(freezeDeep(root([
    trip('past', '2026-10-01', '2026-10-02'), current,
    trip('future', '2026-11-01', '2026-11-02')
  ], 'past')));
  assert.equal(result.mode, 'trip');
  assert.equal(result.trip, current);
  assert.equal(result.active, null);
});

test('ongoing Trip date bounds are inclusive', () => {
  for (const [startDate, endDate] of [['2026-10-24', '2026-10-25'], ['2026-10-23', '2026-10-24'], ['2026-10-24', '2026-10-24']]) {
    const current = trip('current', startDate, endDate, [day('2026-10-24')]);
    assert.equal(state(freezeDeep(root([current]))).mode, 'trip');
  }
});

test('an Active Schedule outside nominal Trip dates wins over an ongoing Trip', () => {
  const active = slot('late-night', '23:00', 'active', { actualStartAt: '2026-10-23T23:00:00+09:00' });
  const activeTrip = trip('active-trip', '2026-10-23', '2026-10-23', [day('2026-10-23', [active])]);
  const current = trip('current', '2026-10-24', '2026-10-25', [day('2026-10-24')]);
  const result = state(freezeDeep(root([current, activeTrip], current.id)));
  assert.equal(result.mode, 'schedule');
  assert.equal(result.trip, activeTrip);
  assert.equal(result.active.slot, active);
  assert.equal(result.active.day.date, '2026-10-23');
  assert.equal(result.active.ref.slotId, active.id);
});

test('Extended Schedule and inactive-plan Active Schedule are recognized', () => {
  const active = slot('extended', '23:00', 'extended', { actualStartAt: '2026-10-23T23:00:00+09:00' });
  const current = trip('current', '2026-10-23', '2026-10-24', [
    day('2026-10-23', [], 1, [{ id: 'b', name: 'Plan B', slots: [active] }])
  ]);
  const result = state(freezeDeep(root([current])));
  assert.equal(result.mode, 'schedule');
  assert.equal(result.active.plan.id, 'b');
  assert.equal(result.active.slot, active);
});

test('durable actual start without actual end preserves the existing Active lookup rule', () => {
  const active = slot('durable', '23:00', 'upcoming', { actualStartAt: '2026-10-23T23:00:00+09:00' });
  const current = trip('current', '2026-10-23', '2026-10-23', [day('2026-10-23', [active])]);
  const result = state(freezeDeep(root([current])));
  assert.equal(result.mode, 'schedule');
  assert.equal(result.active.slot, active);
  assert.equal(active.v21.status, 'upcoming');
});

for (const count of [0, 1, 3, 4]) {
  test(`recent Trips: ${count} source Trips are newest-first and capped at three`, () => {
    const travels = Array.from({ length: count }, (_, index) => trip(`past-${index + 1}`, `2026-10-0${index + 1}`, `2026-10-0${index + 1}`));
    const result = state(freezeDeep(root(travels)));
    assert.equal(result.mode, 'idle');
    assert.equal(result.recent.length, Math.min(3, count));
    assert.deepEqual(plain(result.recent.map(item => item.id)), travels.slice().reverse().slice(0, 3).map(item => item.id));
    assert.deepEqual(travels.map(item => item.id), Array.from({ length: count }, (_, index) => `past-${index + 1}`));
  });
}

test('Home NEXT chooses upcoming manual state even when today clock time has passed', () => {
  const overdue = slot('overdue', '08:00');
  const current = trip('current', '2026-10-23', '2026-10-25', [
    day('2026-10-23', [slot('yesterday', '01:00')]),
    day('2026-10-24', [slot('later', '18:00'), overdue, slot('skipped', '07:00', 'skipped'), slot('done', '06:00', 'completed')], 2),
    day('2026-10-25', [slot('tomorrow', '00:01')], 3)
  ]);
  const result = state(freezeDeep(root([current])));
  assert.equal(result.mode, 'trip');
  assert.equal(result.next.slot, overdue);
  assert.equal(result.next.day.day, 2);
});

test('Home NEXT searches later Trip days and only their active plan', () => {
  const later = slot('tomorrow', '09:00');
  const current = trip('current', '2026-10-24', '2026-10-26', [
    day('2026-10-24', [slot('done', '07:00', 'completed')], 1, [{ id: 'b', slots: [slot('inactive-plan', '08:00')] }]),
    day('2026-10-26', [slot('last-day', '08:00')], 3),
    day('2026-10-25', [later], 2)
  ]);
  const result = state(freezeDeep(root([current])));
  assert.equal(result.next.slot, later);
  assert.equal(result.next.day.date, '2026-10-25');
  assert.equal(result.next.plan.id, 'a');
});

test('Home NEXT is null when every Schedule is completed or skipped', () => {
  const current = trip('current', '2026-10-24', '2026-10-24', [day('2026-10-24', [
    slot('skipped', '08:00', 'skipped'), slot('completed', '09:00', 'completed')
  ])]);
  assert.equal(state(freezeDeep(root([current]))).next, null);
});

test('future Range creation supports same-day and forward/reverse dragging', () => {
  assert.deepEqual(range('2026-10-24', '2026-10-24'), { startDate: '2026-10-24', endDate: '2026-10-24' });
  assert.deepEqual(range('2026-10-25', '2026-10-28'), { startDate: '2026-10-25', endDate: '2026-10-28' });
  assert.deepEqual(range('2026-10-28', '2026-10-25'), { startDate: '2026-10-25', endDate: '2026-10-28' });
});

test('a past day cannot begin Range selection and dragging backward clamps to today', () => {
  assert.equal(range('2026-10-23', '2026-10-25'), null);
  assert.deepEqual(range('2026-10-26', '2026-10-20'), { startDate: '2026-10-24', endDate: '2026-10-26' });
});

test('Range supports month and year boundaries without saving', () => {
  assert.deepEqual(range('2026-10-30', '2026-11-02'), { startDate: '2026-10-30', endDate: '2026-11-02' });
  assert.deepEqual(range('2026-12-31', '2027-01-02'), { startDate: '2026-12-31', endDate: '2027-01-02' });
  assert.equal(forbiddenAccesses, 0);
});

test('Range start endpoint extends, shortens and clamps at the other endpoint', () => {
  const initial = freezeDeep({ startDate: '2026-10-26', endDate: '2026-10-30' });
  assert.deepEqual(move(initial, 'start', '2026-10-24'), { startDate: '2026-10-24', endDate: '2026-10-30' });
  assert.deepEqual(move(initial, 'start', '2026-10-29'), { startDate: '2026-10-29', endDate: '2026-10-30' });
  assert.deepEqual(move(initial, 'start', '2026-11-03'), { startDate: '2026-10-30', endDate: '2026-10-30' });
  assert.deepEqual(move(initial, 'start', '2026-10-20'), { startDate: '2026-10-24', endDate: '2026-10-30' });
  assert.deepEqual(initial, { startDate: '2026-10-26', endDate: '2026-10-30' });
});

test('Range end endpoint extends, shortens and clamps at the other endpoint', () => {
  const initial = freezeDeep({ startDate: '2026-10-26', endDate: '2026-10-30' });
  assert.deepEqual(move(initial, 'end', '2026-11-03'), { startDate: '2026-10-26', endDate: '2026-11-03' });
  assert.deepEqual(move(initial, 'end', '2026-10-27'), { startDate: '2026-10-26', endDate: '2026-10-27' });
  assert.deepEqual(move(initial, 'end', '2026-10-24'), { startDate: '2026-10-26', endDate: '2026-10-26' });
  assert.deepEqual(initial, { startDate: '2026-10-26', endDate: '2026-10-30' });
});

test('Range calculation and Home projection preserve Trips, Photos, Timeline and actual facts', () => {
  const active = slot('active', '23:00', 'active', { actualStartAt: '2026-10-23T23:05:12+09:00', manualStartOverride: true });
  const current = trip('protected', '2026-10-23', '2026-10-25', [day('2026-10-23', [active]), day('2026-10-24', [], 2)]);
  current.records.push({ id: 'photo', mediaKey: 'synthetic-media-key', capturedAt: '2026-10-24T00:01:00+09:00', createdAt: '2026-10-24T00:01:01+09:00', day: 1, slotId: active.id });
  const data = root([current]);
  data.coreV21.blocks.push({ id: 'text', tripId: current.id, createdAt: '2026-10-24T00:05:00+09:00', timelineTime: '2026-10-23T23:55:00+09:00', scheduleRef: { day: 1, planId: 'a', slotId: active.id } });
  freezeDeep(data);
  const before = JSON.stringify(data);
  const first = state(data);
  assert.equal(first.mode, 'schedule');
  assert.equal(first.active.slot, active);
  context.calendarTripsOnDate(data.trips, '2026-10-24');
  const selected = range('2026-10-25', '2026-10-29');
  assert.deepEqual(move(selected, 'end', '2026-11-02'), { startDate: '2026-10-25', endDate: '2026-11-02' });
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(plain(state(data)), plain(first));
  assert.equal(forbiddenAccesses, 0);
});

// UI Hotfix: production civil-date helpers; no DOM or storage access.
test('Picker calendar components handle month ends and leap/century years',()=>{
  for(const [y,m,d,want] of [[2028,2,29,'2028-02-29'],[2027,2,29,'2027-02-28'],[2100,2,29,'2100-02-28'],[2000,2,29,'2000-02-29'],[2026,4,31,'2026-04-30'],[2026,12,31,'2026-12-31'],[2027,1,1,'2027-01-01']])assert.equal(context.calendarPickerDate(y,m,d),want);
});
test('Picker rejects malformed components and limits dates to YYYY-MM-DD',()=>{
  for(const parts of [[NaN,1,1],[2026,0,1],[2026,13,1],[2026,1,0],[0,1,1],[10000,1,1],[2026.5,1,1]])assert.equal(context.calendarPickerDate(...parts),'');
});
test('Picker initial start or end produces a one-day range without saving',()=>{
  for(const edge of ['start','end'])assert.deepEqual(plain(context.calendarPickerRange(null,edge,'2027-01-01','2026-10-26')),{range:{startDate:'2027-01-01',endDate:'2027-01-01'},error:''});
});
test('Picker crosses year/month boundaries without changing the other endpoint',()=>{
  const input=freezeDeep({startDate:'2026-12-31',endDate:'2026-12-31'});
  const next=context.calendarPickerRange(input,'end','2027-02-01','2026-10-26');
  assert.deepEqual(plain(next.range),{startDate:'2026-12-31',endDate:'2027-02-01'});assert.equal(input.endDate,'2026-12-31');
});
test('Picker rejects reversed, past, invalid and stale ranges; same day is allowed',()=>{
  const range=freezeDeep({startDate:'2026-10-28',endDate:'2026-10-30'});
  for(const [edge,key] of [['start','2026-10-31'],['end','2026-10-27'],['start','2026-10-25'],['end','2026-02-31'],['other','2026-10-28']]){const result=context.calendarPickerRange(range,edge,key,'2026-10-26');assert.equal(result.range,null);assert.ok(result.error);}
  assert.equal(context.calendarPickerRange(range,'end','2026-10-28','2026-10-26').error,'');
  assert.ok(context.calendarPickerRange(range,'end','2026-11-01','2026-10-29').error);assert.equal(forbiddenAccesses,0);
});
