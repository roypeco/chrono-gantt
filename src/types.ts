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

export interface PluginSettings {
  scanDir: string;
}
