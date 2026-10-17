export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export class ValidationError extends Error {}

/** The title as it is stored. Throws when it is not text, or is empty. */
function checked(title: unknown): string {
  if (typeof title !== 'string' || title.trim() === '') throw new ValidationError('title must be text');
  return title.trim();
}

/** The task list, kept in memory. One instance per server. */
export class TaskList {
  private readonly tasks = new Map<number, Task>();
  private nextId = 1;

  all(): Task[] {
    return [...this.tasks.values()];
  }

  get(id: number): Task | undefined {
    return this.tasks.get(id);
  }

  add(title: unknown): Task {
    const task: Task = { id: this.nextId++, title: checked(title), done: false };
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
