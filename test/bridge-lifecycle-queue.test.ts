import test from 'node:test';
import assert from 'node:assert/strict';
import { SerialTaskQueue } from '../src/server/bridge/serialTaskQueue';

test('SerialTaskQueue runs lifecycle tasks in submission order without overlap', async () => {
  const queue = new SerialTaskQueue();
  const events: string[] = [];
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = queue.run(async () => {
    events.push('first:start');
    await firstGate;
    events.push('first:end');
  });
  const second = queue.run(async () => {
    events.push('second:start');
    events.push('second:end');
  });

  await Promise.resolve();
  assert.deepEqual(events, ['first:start']);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});

test('SerialTaskQueue continues after a rejected lifecycle task', async () => {
  const queue = new SerialTaskQueue();
  const events: string[] = [];

  const failed = queue.run(async () => {
    events.push('failed');
    throw new Error('expected test failure');
  });
  const recovered = queue.run(() => {
    events.push('recovered');
    return 42;
  });

  await assert.rejects(failed, /expected test failure/);
  assert.equal(await recovered, 42);
  assert.deepEqual(events, ['failed', 'recovered']);
});
