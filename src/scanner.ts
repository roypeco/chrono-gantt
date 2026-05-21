import { App, TFile, TFolder } from 'obsidian';
import type { Task, TaskStatus } from './types';

const VALID_STATUSES = new Set<TaskStatus>([
  'not-started',
  'in-progress',
  'in-review',
  'ready-for-release',
  'done',
]);

// Handles both string "2026-05-01" and Date objects (js-yaml parses bare dates as Date)
function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  let year: number, month: number, day: number;
  if (value instanceof Date) {
    year = value.getUTCFullYear();
    month = value.getUTCMonth();
    day = value.getUTCDate();
  } else {
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    year = Number(m[1]);
    month = Number(m[2]) - 1;
    day = Number(m[3]);
  }
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function extractTask(app: App, file: TFile): Task | null {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!fm) return null;
  const start = parseDate(fm.start);
  const end = parseDate(fm.end);
  const status = fm.status as TaskStatus;
  if (!start || !end || !VALID_STATUSES.has(status)) return null;
  return { file: file.basename, filePath: file.path, start, end, status };
}

export function scanTasks(app: App, scanDir: string): Task[] {
  const root = scanDir
    ? app.vault.getAbstractFileByPath(scanDir)
    : app.vault.getRoot();

  if (!(root instanceof TFolder)) return [];

  const tasks: Task[] = [];

  for (const child of root.children) {
    if (child instanceof TFile && child.extension === 'md') {
      const t = extractTask(app, child);
      if (t) tasks.push(t);
    } else if (child instanceof TFolder) {
      for (const grandchild of child.children) {
        if (grandchild instanceof TFile && grandchild.extension === 'md') {
          const t = extractTask(app, grandchild);
          if (t) tasks.push(t);
        }
      }
    }
  }

  tasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  return tasks;
}
