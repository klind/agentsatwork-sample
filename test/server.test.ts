import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/server.ts';

describe('the HTTP API', () => {
  let server: Server;
  let base: string;

  before(async () => {
    server = createApp();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const call = async (method: string, path: string, body?: unknown) => {
    const response = await fetch(`${base}${path}`, {
      method,
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
    const text = await response.text();
    return { status: response.status, json: text === '' ? undefined : (JSON.parse(text) as Record<string, unknown>) };
  };

  it('answers the health check', async () => {
    assert.deepEqual(await call('GET', '/health'), { status: 200, json: { status: 'ok' } });
  });

  it('adds a task, lists it, completes it, and removes it', async () => {
    const added = await call('POST', '/tasks', { title: 'Write the spec' });
    assert.equal(added.status, 201);
    const id = added.json!.id as number;

    assert.deepEqual((await call('GET', '/tasks')).json, { tasks: [{ id, title: 'Write the spec', done: false }] });
    assert.deepEqual((await call('POST', `/tasks/${id}/complete`)).json, { id, title: 'Write the spec', done: true });
    assert.equal((await call('DELETE', `/tasks/${id}`)).status, 204);
    assert.equal((await call('GET', `/tasks/${id}`)).status, 404);
  });

  it('counts the tasks, and the ones that are done', async () => {
    const start = await call('GET', '/tasks/count');
    assert.equal(start.status, 200);
    const { total, done } = start.json as { total: number; done: number };

    const first = (await call('POST', '/tasks', { title: 'Count me' })).json!.id as number;
    const second = (await call('POST', '/tasks', { title: 'Count me too' })).json!.id as number;
    assert.deepEqual(await call('GET', '/tasks/count'), { status: 200, json: { total: total + 2, done } });

    await call('POST', `/tasks/${first}/complete`);
    assert.deepEqual(await call('GET', '/tasks/count'), { status: 200, json: { total: total + 2, done: done + 1 } });

    await call('DELETE', `/tasks/${first}`);
    await call('DELETE', `/tasks/${second}`);
    assert.deepEqual(await call('GET', '/tasks/count'), { status: 200, json: { total, done } });
  });

  it('removes every task that is done, and keeps the rest', async () => {
    await call('DELETE', '/tasks/done');
    const first = (await call('POST', '/tasks', { title: 'Done one' })).json!.id as number;
    const open = (await call('POST', '/tasks', { title: 'Still open' })).json!.id as number;
    const third = (await call('POST', '/tasks', { title: 'Done two' })).json!.id as number;
    await call('POST', `/tasks/${first}/complete`);
    await call('POST', `/tasks/${third}/complete`);

    assert.deepEqual(await call('DELETE', '/tasks/done'), { status: 200, json: { removed: 2 } });
    assert.equal((await call('GET', `/tasks/${first}`)).status, 404);
    assert.equal((await call('GET', `/tasks/${third}`)).status, 404);
    assert.deepEqual(await call('GET', `/tasks/${open}`), { status: 200, json: { id: open, title: 'Still open', done: false } });

    await call('DELETE', `/tasks/${open}`);
  });

  it('answers removed 0 when no task is done', async () => {
    await call('DELETE', '/tasks/done');
    const id = (await call('POST', '/tasks', { title: 'Not done yet' })).json!.id as number;

    assert.deepEqual(await call('DELETE', '/tasks/done'), { status: 200, json: { removed: 0 } });
    assert.deepEqual((await call('GET', `/tasks/${id}`)).json, { id, title: 'Not done yet', done: false });

    await call('DELETE', `/tasks/${id}`);
  });

  describe('listing tasks by whether they are done', () => {
    let first: number;
    let open: number;
    let third: number;

    before(async () => {
      first = (await call('POST', '/tasks', { title: 'Done one' })).json!.id as number;
      open = (await call('POST', '/tasks', { title: 'Still open' })).json!.id as number;
      third = (await call('POST', '/tasks', { title: 'Done two' })).json!.id as number;
      await call('POST', `/tasks/${first}/complete`);
      await call('POST', `/tasks/${third}/complete`);
    });

    after(async () => {
      for (const id of [first, open, third]) await call('DELETE', `/tasks/${id}`);
    });

    const mine = (json: Record<string, unknown> | undefined) =>
      (json!.tasks as { id: number }[]).filter((task) => [first, open, third].includes(task.id));

    it('lists only the tasks that are done with ?done=true', async () => {
      const listed = await call('GET', '/tasks?done=true');
      assert.equal(listed.status, 200);
      assert.ok((listed.json!.tasks as { done: boolean }[]).every((task) => task.done));
      assert.deepEqual(mine(listed.json), [
        { id: first, title: 'Done one', done: true },
        { id: third, title: 'Done two', done: true },
      ]);
    });

    it('lists only the tasks that are not done with ?done=false', async () => {
      const listed = await call('GET', '/tasks?done=false');
      assert.equal(listed.status, 200);
      assert.ok((listed.json!.tasks as { done: boolean }[]).every((task) => !task.done));
      assert.deepEqual(mine(listed.json), [{ id: open, title: 'Still open', done: false }]);
    });

    it('lists every task without done', async () => {
      const listed = await call('GET', '/tasks');
      assert.equal(listed.status, 200);
      assert.deepEqual(mine(listed.json), [
        { id: first, title: 'Done one', done: true },
        { id: open, title: 'Still open', done: false },
        { id: third, title: 'Done two', done: true },
      ]);
    });

    it('answers 400 and lists nothing for any other value of done', async () => {
      const refused = { status: 400, json: { error: 'done must be true or false' } };
      for (const query of ['done=yes', 'done=1', 'done=TRUE', 'done=', 'done', 'done=true&done=false']) {
        assert.deepEqual(await call('GET', `/tasks?${query}`), refused, query);
      }
    });
  });

  it('refuses a task without a title, and a body that is not JSON', async () => {
    assert.deepEqual(await call('POST', '/tasks', { title: '' }), { status: 400, json: { error: 'title must be text' } });
    assert.deepEqual(await call('POST', '/tasks', 'not json'), { status: 400, json: { error: 'the body must be JSON' } });
  });

  it('renames a task, and keeps its id and whether it is done', async () => {
    const id = (await call('POST', '/tasks', { title: 'Write the spec' })).json!.id as number;

    assert.deepEqual(await call('PATCH', `/tasks/${id}`, { title: 'Write the plan' }), {
      status: 200,
      json: { id, title: 'Write the plan', done: false },
    });
    assert.deepEqual((await call('GET', `/tasks/${id}`)).json, { id, title: 'Write the plan', done: false });

    await call('POST', `/tasks/${id}/complete`);
    assert.deepEqual(await call('PATCH', `/tasks/${id}`, { title: 'Ship the plan', id: id + 1, done: false }), {
      status: 200,
      json: { id, title: 'Ship the plan', done: true },
    });

    await call('DELETE', `/tasks/${id}`);
  });

  it('refuses to rename a task to no title, and leaves it as it was', async () => {
    const id = (await call('POST', '/tasks', { title: 'Keep me' })).json!.id as number;
    const refused = { status: 400, json: { error: 'title must be text' } };

    assert.deepEqual(await call('PATCH', `/tasks/${id}`, {}), refused);
    assert.deepEqual(await call('PATCH', `/tasks/${id}`, { title: '' }), refused);
    assert.deepEqual(await call('PATCH', `/tasks/${id}`, { title: 42 }), refused);
    assert.deepEqual(await call('PATCH', `/tasks/${id}`, 'not json'), { status: 400, json: { error: 'the body must be JSON' } });
    assert.deepEqual((await call('GET', `/tasks/${id}`)).json, { id, title: 'Keep me', done: false });

    await call('DELETE', `/tasks/${id}`);
  });

  it('answers 404 when there is no task to rename', async () => {
    assert.deepEqual(await call('PATCH', '/tasks/99999', { title: 'Nothing' }), { status: 404, json: { error: 'not found' } });
  });

  it('answers 404 for what it does not have, and 405 for a method it does not take', async () => {
    assert.equal((await call('GET', '/nothing')).status, 404);
    assert.equal((await call('GET', '/tasks/abc')).status, 404);
    assert.equal((await call('POST', '/tasks/99/complete')).status, 404);
    assert.equal((await call('PUT', '/tasks', { title: 'x' })).status, 405);
  });
});
