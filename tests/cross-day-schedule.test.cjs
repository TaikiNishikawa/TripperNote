'use strict';

// node --test tests/cross-day-schedule.test.cjs
// Synthetic drafts only. Load the real browser script without app startup,
// DOM, device data, storage APIs or third-party dependencies.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Honor the caller's TZ: run this entire suite in separate processes under
// Asia/Tokyo, America/New_York and Europe/London. Never force Tokyo here.
const sandbox = {};
let forbiddenAccesses = 0;
for (const name of ['localStorage', 'indexedDB', 'APP_DATA', 'EDIT_DATA', 'DEFAULT_APP_DATA', 'document', 'window']) {
  Object.defineProperty(sandbox, name, {
    get() { forbiddenAccesses++; throw new Error(`Forbidden access: ${name}`); },
    set() { forbiddenAccesses++; throw new Error(`Forbidden write: ${name}`); }
  });
}
const context = vm.createContext(sandbox);
vm.runInContext(readFileSync(path.join(__dirname, '../www/js/storage.js'), 'utf8'), context);
const plain = value => JSON.parse(JSON.stringify(value));
const build = overrides => plain(context.buildSchedulePlannedRange({
  dayDate: '2026-10-06', tripEndDate: '2026-10-08',
  startTime: '23:00', endTime: '01:00', endDayOffset: 1,
  ...overrides
}));

const validCases = [
  ['1: same day, 30 minutes', { endTime: '23:30', endDayOffset: 0 }, '2026-10-06T23:30:00', 30],
  ['2: next day, 120 minutes', {}, '2026-10-07T01:00:00', 120],
  ['3: next day, equal times, 1440 minutes', { endTime: '23:00' }, '2026-10-07T23:00:00', 1440],
  ['6: explicit next day is 24 hours', { endTime: '23:00' }, '2026-10-07T23:00:00', 24 * 60],
  ['7: month end', { dayDate: '2026-04-30', tripEndDate: '2026-05-02' }, '2026-05-01T01:00:00', 120],
  ['8: year end', { dayDate: '2026-12-31', tripEndDate: '2027-01-02' }, '2027-01-01T01:00:00', 120],
  ['9a: enter leap day', { dayDate: '2028-02-28', tripEndDate: '2028-03-02' }, '2028-02-29T01:00:00', 120],
  ['9b: leave leap day', { dayDate: '2028-02-29', tripEndDate: '2028-03-02' }, '2028-03-01T01:00:00', 120],
  ['non-leap February', { dayDate: '2026-02-28', tripEndDate: '2026-03-02' }, '2026-03-01T01:00:00', 120],
  ['midnight end', { endTime: '00:00' }, '2026-10-07T00:00:00', 60],
  ['next calendar day is not capped at 24 hours', { startTime: '22:00', endTime: '23:00' }, '2026-10-07T23:00:00', 1500]
];
for (const [name, input, plannedEndAt, minutes] of validCases) {
  test(name, () => {
    const plannedStartAt = `${input.dayDate || '2026-10-06'}T${input.startTime || '23:00'}:00`;
    const result = build(input);
    assert.deepEqual(result, { ok: true, plannedStartAt, plannedEndAt, plannedDurationMinutes: minutes });
    // Fixed civil expectations above are the oracle, not host-local Date.parse.
  });
}

const dstCases = [
  ['NY spring transition', '2026-03-07', '23:00', '23:00', 1, '2026-03-08', 1440],
  ['NY autumn transition', '2026-10-31', '23:00', '23:00', 1, '2026-11-01', 1440],
  ['London spring transition', '2026-03-28', '23:00', '23:00', 1, '2026-03-29', 1440],
  ['London autumn transition', '2026-10-24', '23:00', '23:00', 1, '2026-10-25', 1440],
  ['NY missing clock time as start', '2026-03-08', '02:30', '03:30', 0, '2026-03-08', 60],
  ['NY missing clock time as end', '2026-03-08', '01:30', '02:30', 0, '2026-03-08', 60],
  ['London missing clock time', '2026-03-29', '01:30', '02:30', 0, '2026-03-29', 60],
  ['NY repeated clock time', '2026-11-01', '01:30', '02:30', 0, '2026-11-01', 60]
];
for (const [name, dayDate, startTime, endTime, endDayOffset, endDate, minutes] of dstCases) {
  test(`civil time: ${name}`, () => {
    assert.deepEqual(build({ dayDate, tripEndDate: endDate, startTime, endTime, endDayOffset }), {
      ok: true, plannedStartAt: `${dayDate}T${startTime}:00`, plannedEndAt: `${endDate}T${endTime}:00`, plannedDurationMinutes: minutes
    });
  });
}
test('DST transition dates still reject equal and reversed same-day clock values', () => {
  for (const dayDate of ['2026-03-08', '2026-11-01', '2026-03-29', '2026-10-25']) {
    for (const endTime of ['02:30', '01:30']) {
      assert.deepEqual(build({ dayDate, tripEndDate: dayDate, startTime: '02:30', endTime, endDayOffset: 0 }), {
        ok: false, error: 'END_NOT_AFTER_START'
      });
    }
  }
});

test('4: equal times on same day are rejected', () => {
  assert.deepEqual(build({ endTime: '23:00', endDayOffset: 0 }), { ok: false, error: 'END_NOT_AFTER_START' });
});
test('5: earlier same-day end is rejected without advancing the date', () => {
  const input = Object.freeze({ dayDate: '2026-10-06', tripEndDate: '2026-10-08', startTime: '23:00', endTime: '01:00', endDayOffset: 0 });
  assert.deepEqual(plain(context.buildSchedulePlannedRange(input)), { ok: false, error: 'END_NOT_AFTER_START' });
  assert.equal(input.endDayOffset, 0);
});
test('omitting the end-day selection defaults to same day, never inferred next day', () => {
  assert.deepEqual(build({ endDayOffset: undefined }), { ok: false, error: 'END_NOT_AFTER_START' });
  assert.equal(build({ endTime: '23:30', endDayOffset: undefined }).plannedDurationMinutes, 30);
});

test('10: malformed or out-of-range times are rejected for both endpoints', () => {
  const invalidTimes = ['24:00', '23:60', '-1:00', '1:2', '001:00', '23:00:00', '23:00Z', ' 23:00', '23:00 ', 'noon', null, 2300, {}, true];
  for (const time of invalidTimes) {
    assert.deepEqual(build({ startTime: time }), { ok: false, error: 'INVALID_START_TIME' }, `start: ${JSON.stringify(time)}`);
    assert.deepEqual(build({ endTime: time }), { ok: false, error: 'INVALID_END_TIME' }, `end: ${JSON.stringify(time)}`);
  }
  assert.deepEqual(build({ startTime: '' }), { ok: false, error: 'INVALID_START_TIME' });
  assert.deepEqual(build({ startTime: undefined }), { ok: false, error: 'INVALID_START_TIME' });
});
test('existing one-digit hour input is canonicalized', () => {
  assert.deepEqual(build({ startTime: '1:00', endTime: '2:00', endDayOffset: 0 }), {
    ok: true, plannedStartAt: '2026-10-06T01:00:00', plannedEndAt: '2026-10-06T02:00:00', plannedDurationMinutes: 60
  });
});
test('11: two or more days, negative, fractional and nonnumeric offsets are rejected', () => {
  for (const endDayOffset of [2, 3, 100, -1, 0.5, '1', '0', true, null, NaN, Infinity]) {
    assert.deepEqual(build({ endDayOffset }), { ok: false, error: 'INVALID_END_DAY_OFFSET' });
  }
});
test('invalid calendar dates are not silently normalized', () => {
  for (const date of ['2026-02-29', '2028-02-30', '2026-04-31', '2026-00-06', '2026-13-06', '2026-10-00', '2026-1-06', '2026-10-06T00:00:00', '', null]) {
    assert.deepEqual(build({ dayDate: date }), { ok: false, error: 'INVALID_DAY_DATE' });
    assert.deepEqual(build({ tripEndDate: date }), { ok: false, error: 'INVALID_TRIP_END_DATE' });
  }
  assert.deepEqual(plain(context.buildSchedulePlannedRange()), { ok: false, error: 'INVALID_DAY_DATE' });
  assert.deepEqual(build({ tripEndDate: undefined }), { ok: false, error: 'INVALID_TRIP_END_DATE' });
});
test('Founder decision: next day is forbidden on the final trip day', () => {
  assert.deepEqual(build({ tripEndDate: '2026-10-06' }), { ok: false, error: 'END_AFTER_TRIP_END' });
  assert.equal(build({ tripEndDate: '2026-10-06', endTime: '23:30', endDayOffset: 0 }).ok, true);
  assert.equal(build({ tripEndDate: '2026-10-07' }).ok, true);
  assert.deepEqual(build({ tripEndDate: '2026-10-05' }), { ok: false, error: 'DAY_AFTER_TRIP_END' });
});
test('optional end stays null; a next-day selection needs an end time', () => {
  assert.deepEqual(build({ endTime: '', endDayOffset: 0 }), {
    ok: true, plannedStartAt: '2026-10-06T23:00:00', plannedEndAt: null, plannedDurationMinutes: null
  });
  assert.deepEqual(build({ endTime: '', endDayOffset: 1 }), { ok: false, error: 'END_TIME_REQUIRED' });
});
test('helper does not mutate input, facts, existing mismatches or ambient storage', () => {
  const v21 = Object.freeze({ plannedStartAt: '2026-10-06T20:00:00', plannedEndAt: '2026-10-06T21:00:00', actualStartAt: '2026-10-06T20:05:12+09:00', actualEndAt: null });
  const input = Object.freeze({ dayDate: '2026-10-06', tripEndDate: '2026-10-08', startTime: '23:00', endTime: '01:00', endDayOffset: 1, v21, createdAt: '2026-10-06T12:00:00Z', capturedAt: '2026-10-06T12:01:00Z' });
  const before = JSON.stringify(input);
  const first = plain(context.buildSchedulePlannedRange(input));
  assert.equal(first.ok, true);
  assert.deepEqual(plain(context.buildSchedulePlannedRange(input)), first);
  assert.equal(JSON.stringify(input), before);
  assert.equal(forbiddenAccesses, 0);
});
test('existing normalizer still leaves mismatched planned values and actual metadata untouched', () => {
  const meta = Object.freeze({
    plannedStartAt: '2026-10-06T20:00:00', plannedEndAt: '2026-10-06T21:00:00', plannedDurationMinutes: 60,
    actualStartAt: '2026-10-06T20:05:12+09:00', actualEndAt: null, status: 'active', stateSource: 'manual_start_button',
    manualStartOverride: true, manualEndOverride: false, timePolicy: 'fixed'
  });
  const slot = Object.freeze({ startTime: '23:00', endTime: '01:00', v21: meta });
  const result = plain(context.normalizeScheduleFoundation(meta, slot, '2026-10-06'));
  for (const [key, value] of Object.entries(meta)) assert.deepEqual(result[key], value);
  assert.equal(slot.startTime, '23:00');
  assert.equal(slot.endTime, '01:00');
  assert.equal(forbiddenAccesses, 0);
});
