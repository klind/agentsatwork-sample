import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { TaskList, ValidationError } from './tasks.ts';

/**
 * The HTTP API over a task list:
 *
 *   GET    /health              is the server up
 *   GET    /tasks               every task
 *   POST   /tasks               add a task, body {"title": "..."}
 *   GET    /tasks/count         how many tasks, and how many are done
 *   GET    /tasks/:id           one task
 *   POST   /tasks/:id/complete  mark a task done
 *   POST   /tasks/:id/reopen    mark a task not done again
 *   DELETE /tasks/:id           remove a task
 */
export function createApp(tasks: TaskList = new TaskList()): Server {
  return createServer((request, response) => {
    handle(tasks, request, response).catch((error: unknown) => {
      if (error instanceof ValidationError) send(response, 400, { error: error.message });
      else send(response, 500, { error: 'internal error' });
    });
  });
}

async function handle(tasks: TaskList, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const parts = pathname.split('/').filter(Boolean);
  const method = request.method ?? 'GET';

  if (method === 'GET' && pathname === '/health') return send(response, 200, { status: 'ok' });

  if (parts[0] !== 'tasks') return send(response, 404, { error: 'not found' });

  if (parts.length === 1) {
    if (method === 'GET') return send(response, 200, { tasks: tasks.all() });
    if (method === 'POST') return send(response, 201, tasks.add((await body(request)).title));
    return send(response, 405, { error: 'method not allowed' });
  }

  if (parts.length === 2 && parts[1] === 'count' && method === 'GET') return send(response, 200, tasks.count());

  const id = Number(parts[1]);
  if (!Number.isInteger(id) || id < 1) return send(response, 404, { error: 'not found' });

  if (parts.length === 2 && method === 'GET') return found(response, tasks.get(id));
  if (parts.length === 2 && method === 'DELETE') {
    return tasks.remove(id) ? send(response, 204) : send(response, 404, { error: 'not found' });
  }
  if (parts.length === 3 && parts[2] === 'complete' && method === 'POST') return found(response, tasks.complete(id));
  if (parts.length === 3 && parts[2] === 'reopen' && method === 'POST') return found(response, tasks.reopen(id));

  return send(response, 404, { error: 'not found' });
}

function found(response: ServerResponse, task: unknown): void {
  if (task === undefined) send(response, 404, { error: 'not found' });
  else send(response, 200, task);
}

async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ValidationError('the body must be JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new ValidationError('the body must be a JSON object');
  return parsed as Record<string, unknown>;
}

function send(response: ServerResponse, status: number, payload?: unknown): void {
  if (payload === undefined) {
    response.writeHead(status).end();
    return;
  }
  response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
}
