export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export class ValidationError extends Error {}

/** The most characters a title may have, after trimming. */
const MAX_TITLE_LENGTH = 200;

/** The title as it is stored. Throws when it is not text, is empty, or is longer than MAX_TITLE_LENGTH characters. */
function checked(title: unknown): string {
  if (typeof title !== 'string' || title.trim() === '') throw new ValidationError('title must be text');
  const trimmed = title.trim();
  if ([...trimmed].length > MAX_TITLE_LENGTH) throw new ValidationError(`title must be at most ${MAX_TITLE_LENGTH} characters`);
  return trimmed;
}

/** The task list, kept in memory. One instance per server. */
export class TaskList {
  private readonly tasks = new Map<number, Task>();
  private nextId = 1;

  /**
   * Every task, in the order they were added. Given `done`, only the tasks that are, or are not, done.
   * Given a non-empty `search`, only the tasks whose title contains it, ignoring case.
   * Given `sort` of `'title'`, those sorted by title, A to Z, ignoring case, and of `'-title'`, Z to A;
   * either way, tasks with the same title keep their order.
   * Given `limit`, at most the first `limit` of those, after the other filters and the sort.
   */
  all(done?: boolean, search?: string, limit?: number, sort?: 'title' | '-title'): Task[] {
    let tasks = [...this.tasks.values()];
    if (done !== undefined) tasks = tasks.filter((task) => task.done === done);
    if (search) {
      const wanted = search.toLowerCase();
      tasks = tasks.filter((task) => task.title.toLowerCase().includes(wanted));
    }
    if (sort !== undefined) {
      const direction = sort === 'title' ? 1 : -1;
      tasks.sort((a, b) => {
        const left = a.title.toLowerCase();
        const right = b.title.toLowerCase();
        return left < right ? -direction : left > right ? direction : 0;
      });
    }
    if (limit !== undefined) tasks = tasks.slice(0, limit);
    return tasks;
  }

  get(id: number): Task | undefined {
    return this.tasks.get(id);
  }

  add(title: unknown): Task {
    const stored = checked(title);
    const task: Task = { id: this.nextId++, title: stored, done: false };
    this.tasks.set(task.id, task);
    return task;
  }

  /** Change a task's title. Returns it, or undefined when there is no such task. */
  rename(id: number, title: unknown): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.title = checked(title);
    return task;
  }

  /** Mark a task done. Returns it, or undefined when there is no such task. */
  complete(id: number): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.done = true;
    return task;
  }

  /** Mark a task not done. Returns it, or undefined when there is no such task. */
  reopen(id: number): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.done = false;
    return task;
  }

  /** Mark a task done if it is not, and not done if it is. Returns it, or undefined when there is no such task. */
  toggle(id: number): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.done = !task.done;
    return task;
  }

  remove(id: number): boolean {
    return this.tasks.delete(id);
  }

  /** Remove every task that is done. Returns how many it removed. */
  removeDone(): number {
    let removed = 0;
    for (const task of this.tasks.values()) {
      if (task.done && this.tasks.delete(task.id)) removed++;
    }
    return removed;
  }

  /** Remove every task, done or not. Returns how many it removed. */
  removeAll(): number {
    const removed = this.tasks.size;
    this.tasks.clear();
    return removed;
  }

  /** Mark every task that is not done as done. Returns how many it changed. */
  completeAll(): number {
    let completed = 0;
    for (const task of this.tasks.values()) {
      if (!task.done) {
        task.done = true;
        completed++;
      }
    }
    return completed;
  }

  /** How many tasks there are, how many of them are done, and how many are not. */
  count(): { total: number; done: number; open: number } {
    let done = 0;
    for (const task of this.tasks.values()) if (task.done) done++;
    return { total: this.tasks.size, done, open: this.tasks.size - done };
  }
}
