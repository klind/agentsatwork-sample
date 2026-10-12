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

  it('renames a task, and keeps its id and whether it is done', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Write the spec');
    const other = tasks.add('Review it');
    assert.deepEqual(tasks.rename(id, 'Write the plan'), { id, title: 'Write the plan', done: false });
    assert.deepEqual(tasks.get(id), { id, title: 'Write the plan', done: false });

    tasks.complete(id);
    assert.deepEqual(tasks.rename(id, '  Ship the plan  '), { id, title: 'Ship the plan', done: true });
    assert.deepEqual(tasks.get(other.id), { id: other.id, title: 'Review it', done: false });
  });

  it('says so when there is no task to rename', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Write the spec');
    assert.equal(tasks.rename(99, 'Nothing'), undefined);
    assert.deepEqual(tasks.all(), [{ id, title: 'Write the spec', done: false }]);
  });

  it('refuses to rename a task to no title, and leaves it as it was', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Write the spec');
    assert.throws(() => tasks.rename(id, ''), ValidationError);
    assert.throws(() => tasks.rename(id, '   '), ValidationError);
    assert.throws(() => tasks.rename(id, 42), ValidationError);
    assert.throws(() => tasks.rename(id, undefined), ValidationError);
    assert.equal(tasks.get(id)?.title, 'Write the spec');
  });

  it('removes a task once', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Clean up');
    assert.equal(tasks.remove(id), true);
    assert.equal(tasks.remove(id), false);
    assert.equal(tasks.get(id), undefined);
  });

  it('counts the tasks, and the ones that are done', () => {
    const tasks = new TaskList();
    assert.deepEqual(tasks.count(), { total: 0, done: 0 });

    const { id } = tasks.add('Write the spec');
    tasks.add('Review it');
    tasks.add('Ship it');
    assert.deepEqual(tasks.count(), { total: 3, done: 0 });

    tasks.complete(id);
    assert.deepEqual(tasks.count(), { total: 3, done: 1 });

    tasks.remove(id);
    assert.deepEqual(tasks.count(), { total: 2, done: 0 });
  });
});
