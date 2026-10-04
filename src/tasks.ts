export interface Task {
  id: number;
  title: string;
  done: boolean;
}

export class ValidationError extends Error {}

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
    if (typeof title !== 'string' || title.trim() === '') throw new ValidationError('title must be text');
    const task: Task = { id: this.nextId++, title: title.trim(), done: false };
    this.tasks.set(task.id, task);
    return task;
  }

  /** Mark a task done. Returns it, or undefined when there is no such task. */
  complete(id: number): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.done = true;
    return task;
  }

  /** Mark a task not done again. Returns it, or undefined when there is no such task. */
  reopen(id: number): Task | undefined {
    const task = this.tasks.get(id);
    if (task) task.done = false;
    return task;
  }

  remove(id: number): boolean {
    return this.tasks.delete(id);
  }

  /** How many tasks there are, and how many of them are done. */
  count(): { total: number; done: number } {
    let done = 0;
    for (const task of this.tasks.values()) if (task.done) done++;
    return { total: this.tasks.size, done };
  }
}
