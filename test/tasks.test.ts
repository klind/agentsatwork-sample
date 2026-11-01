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

  it('accepts a title of 200 characters, and refuses one of 201', () => {
    const tasks = new TaskList();
    const first = tasks.add('a'.repeat(200));
    assert.equal(first.title, 'a'.repeat(200));
    assert.throws(() => tasks.add('a'.repeat(201)), new ValidationError('title must be at most 200 characters'));
    assert.deepEqual(tasks.all(), [first]);
    assert.deepEqual(tasks.add(`  ${'a'.repeat(200)}  `), { id: first.id + 1, title: 'a'.repeat(200), done: false });
  });

  it('marks a task done, and says so when there is no such task', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Ship it');
    assert.equal(tasks.complete(id)?.done, true);
    assert.equal(tasks.get(id)?.done, true);
    assert.equal(tasks.complete(99), undefined);
  });

  it('marks a task not done, leaves one that is not done as it was, and says so when there is no such task', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Ship it');
    tasks.complete(id);
    assert.deepEqual(tasks.reopen(id), { id, title: 'Ship it', done: false });
    assert.equal(tasks.get(id)?.done, false);
    assert.deepEqual(tasks.reopen(id), { id, title: 'Ship it', done: false });
    assert.equal(tasks.reopen(99), undefined);
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

  it('renames a task to a title of 200 characters, and refuses 201, leaving it as it was', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Write the spec');
    assert.deepEqual(tasks.rename(id, 'b'.repeat(200)), { id, title: 'b'.repeat(200), done: false });
    assert.throws(() => tasks.rename(id, 'c'.repeat(201)), new ValidationError('title must be at most 200 characters'));
    assert.equal(tasks.get(id)?.title, 'b'.repeat(200));
  });

  it('lists only the tasks that are done, or only those that are not, in order', () => {
    const tasks = new TaskList();
    assert.deepEqual(tasks.all(true), []);
    assert.deepEqual(tasks.all(false), []);

    const first = tasks.add('Write the spec');
    const second = tasks.add('Review it');
    const third = tasks.add('Ship it');
    tasks.complete(first.id);
    tasks.complete(third.id);

    assert.deepEqual(tasks.all(true), [
      { id: first.id, title: 'Write the spec', done: true },
      { id: third.id, title: 'Ship it', done: true },
    ]);
    assert.deepEqual(tasks.all(false), [{ id: second.id, title: 'Review it', done: false }]);
    assert.deepEqual(tasks.all().map((task) => task.id), [first.id, second.id, third.id]);
  });

  it('lists only the tasks whose title contains the search, ignoring case, and with done', () => {
    const tasks = new TaskList();
    const buy = tasks.add('Buy milk');
    const cow = tasks.add('Milk the cow');
    const walk = tasks.add('Walk the dog');
    tasks.complete(cow.id);

    const both = [
      { id: buy.id, title: 'Buy milk', done: false },
      { id: cow.id, title: 'Milk the cow', done: true },
    ];
    assert.deepEqual(tasks.all(undefined, 'milk'), both);
    assert.deepEqual(tasks.all(undefined, 'MILK'), both);
    assert.deepEqual(tasks.all(undefined, 'mil'), both);
    assert.deepEqual(tasks.all(undefined, 'zebra'), []);
    assert.deepEqual(tasks.all(false, 'milk'), [{ id: buy.id, title: 'Buy milk', done: false }]);
    assert.deepEqual(tasks.all(true, 'milk'), [{ id: cow.id, title: 'Milk the cow', done: true }]);
    assert.deepEqual(tasks.all(undefined, 'walk'), [{ id: walk.id, title: 'Walk the dog', done: false }]);
  });

  it('lists every task with an empty search, the same as with no search', () => {
    const tasks = new TaskList();
    assert.deepEqual(tasks.all(undefined, ''), []);

    const buy = tasks.add('Buy milk');
    const cow = tasks.add('Milk the cow');
    const walk = tasks.add('Walk the dog');
    tasks.complete(cow.id);

    assert.deepEqual(tasks.all(undefined, ''), [
      { id: buy.id, title: 'Buy milk', done: false },
      { id: cow.id, title: 'Milk the cow', done: true },
      { id: walk.id, title: 'Walk the dog', done: false },
    ]);
    assert.deepEqual(tasks.all(undefined, ''), tasks.all());
    assert.deepEqual(tasks.all(false, ''), tasks.all(false));
    assert.deepEqual(tasks.all(true, ''), tasks.all(true));
  });

  it('removes a task once', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Clean up');
    assert.equal(tasks.remove(id), true);
    assert.equal(tasks.remove(id), false);
    assert.equal(tasks.get(id), undefined);
  });

  it('removes the tasks that are done, says how many, and keeps the rest', () => {
    const tasks = new TaskList();
    const first = tasks.add('Write the spec');
    const second = tasks.add('Review it');
    const third = tasks.add('Ship it');
    tasks.complete(first.id);
    tasks.complete(third.id);

    assert.equal(tasks.removeDone(), 2);
    assert.deepEqual(tasks.all(), [{ id: second.id, title: 'Review it', done: false }]);
    assert.deepEqual(tasks.count(), { total: 1, done: 0, open: 1 });
    assert.equal(tasks.add('Celebrate').id, third.id + 1);
  });

  it('removes nothing when no task is done', () => {
    const tasks = new TaskList();
    assert.equal(tasks.removeDone(), 0);

    const { id } = tasks.add('Write the spec');
    assert.equal(tasks.removeDone(), 0);
    assert.deepEqual(tasks.all(), [{ id, title: 'Write the spec', done: false }]);

    tasks.complete(id);
    assert.equal(tasks.removeDone(), 1);
    assert.equal(tasks.removeDone(), 0);
  });

  it('counts the tasks, and the ones that are done', () => {
    const tasks = new TaskList();
    assert.deepEqual(tasks.count(), { total: 0, done: 0, open: 0 });

    const { id } = tasks.add('Write the spec');
    tasks.add('Review it');
    tasks.add('Ship it');
    assert.deepEqual(tasks.count(), { total: 3, done: 0, open: 3 });

    tasks.complete(id);
    assert.deepEqual(tasks.count(), { total: 3, done: 1, open: 2 });

    tasks.remove(id);
    assert.deepEqual(tasks.count(), { total: 2, done: 0, open: 2 });
  });

  it('counts the tasks that are not done as open', () => {
    const tasks = new TaskList();
    const { id } = tasks.add('Write the spec');
    tasks.add('Review it');
    tasks.add('Ship it');
    tasks.complete(id);
    assert.deepEqual(tasks.count(), { total: 3, done: 1, open: 2 });
  });
});
