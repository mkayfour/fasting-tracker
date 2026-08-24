// db/fasts.test.ts
import { resetDbForTests } from './client';
import { startFast, endFast, getActiveFast, listFasts } from './fasts';

beforeEach(() => {
  resetDbForTests();
});

test('startFast creates an active fast with no end time', async () => {
  const fast = await startFast(16, '16:8');
  expect(fast.endAt).toBeNull();
  expect(fast.goalHours).toBe(16);
  expect(fast.scheduleType).toBe('16:8');
});

test('startFast throws if a fast is already active', async () => {
  await startFast(16, '16:8');
  await expect(startFast(18, '18:6')).rejects.toThrow('A fast is already active');
});

test('getActiveFast returns null when no fast is active', async () => {
  expect(await getActiveFast()).toBeNull();
});

test('getActiveFast returns the in-progress fast', async () => {
  const started = await startFast(16, '16:8');
  const active = await getActiveFast();
  expect(active?.id).toBe(started.id);
});

test('endFast sets endAt and clears the active fast', async () => {
  const started = await startFast(16, '16:8');
  const ended = await endFast(started.id);
  expect(ended.endAt).not.toBeNull();
  expect(await getActiveFast()).toBeNull();
});

test('listFasts returns completed fasts, most recent first', async () => {
  const first = await startFast(16, '16:8');
  await endFast(first.id);
  const second = await startFast(18, '18:6');
  await endFast(second.id);

  const fasts = await listFasts();
  expect(fasts.map((f) => f.id)).toEqual([second.id, first.id]);
});
