export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'in-review'
  | 'ready-for-release'
  | 'done';

export type TimeScale = 'day' | 'week' | 'month';

export interface Task {
  file: string;
  filePath: string;
  start: Date;
  end: Date;
  status: TaskStatus;
}

// A parent task with its subtasks. Standalone tasks are groups with no subtasks.
export interface TaskGroup {
  parent: Task;
  subtasks: Task[];
}

export interface PluginSettings {
  scanDir: string;
  startField: string;
  endField: string;
}
