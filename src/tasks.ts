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

  /** Every task, in the order they were added. Given `done`, only the tasks that are, or are not, done. */
  all(done?: boolean): Task[] {
    const tasks = [...this.tasks.values()];
    return done === undefined ? tasks : tasks.filter((task) => task.done === done);
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

  /** How many tasks there are, and how many of them are done. */
  count(): { total: number; done: number } {
    let done = 0;
    for (const task of this.tasks.values()) if (task.done) done++;
    return { total: this.tasks.size, done };
  }
}
