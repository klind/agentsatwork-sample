import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TaskList, ValidationError } from '../src/tasks.ts';

describe('the task list', () => {
  it('adds tasks with ids that count up, not done', () => {
    const tasks = new TaskList();
    assert.deepEqual(tasks.add('Write the spec'), { id: 1, title: 'Write the spec', done: false });
    assert.deepEqual(tasks.add('  Review it  '), { id: 2, title: 'Review it', done: false });
    assert.equal(tasks.all().length, 2);
  });

  it('refuses a task without a title', () => {
    const tasks = new TaskList();
    assert.throws(() => tasks.add(''), ValidationError);
    assert.throws(() => tasks.add('   '), ValidationError);
    assert.throws(() => tasks.add(42), ValidationError);
    assert.equal(tasks.all().length, 0);
  });

  it('marks a task done, and says so when there is no such task', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Ship it');
    assert.equal(tasks.complete(id)?.done, true);
    assert.equal(tasks.get(id)?.done, true);
    assert.equal(tasks.complete(99), undefined);
  });

  it('removes a task once', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Clean up');
    assert.equal(tasks.remove(id), true);
    assert.equal(tasks.remove(id), false);
    assert.equal(tasks.get(id), undefined);
  });
});
