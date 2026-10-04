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

  it('refuses a task without a title, and a body that is not JSON', async () => {
    assert.deepEqual(await call('POST', '/tasks', { title: '' }), { status: 400, json: { error: 'title must be text' } });
    assert.deepEqual(await call('POST', '/tasks', 'not json'), { status: 400, json: { error: 'the body must be JSON' } });
  });

  it('answers 404 for what it does not have, and 405 for a method it does not take', async () => {
    assert.equal((await call('GET', '/nothing')).status, 404);
    assert.equal((await call('GET', '/tasks/abc')).status, 404);
    assert.equal((await call('POST', '/tasks/99/complete')).status, 404);
    assert.equal((await call('PUT', '/tasks', { title: 'x' })).status, 405);
  });
});
