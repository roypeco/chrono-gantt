import { App, TFile, TFolder } from 'obsidian';
import type { Task, TaskGroup, TaskStatus } from './types';

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

// A file before parent/subtask resolution. start/end/status may be missing:
// a parent only needs a valid status (its dates are derived from subtasks).
interface RawEntry {
  file: string;
  filePath: string;
  start: Date | null;
  end: Date | null;
  status: TaskStatus | null;
  parent: string | null;
}

// Obsidian's properties UI may store a field as a list (e.g. "status:\n  - done")
// depending on the registered property type — unwrap to the first element.
function unwrapList(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function readEntry(app: App, file: TFile, startField: string, endField: string): RawEntry | null {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!fm) return null;
  const rawStatus = unwrapList(fm.status);
  const status = VALID_STATUSES.has(rawStatus as TaskStatus) ? (rawStatus as TaskStatus) : null;
  // Accept both a plain name and a wiki link ([[name]])
  const rawParent = unwrapList(fm.parent);
  const parent =
    typeof rawParent === 'string' ? rawParent.trim().replace(/^\[\[|\]\]$/g, '') : null;
  return {
    file: file.basename,
    filePath: file.path,
    start: parseDate(unwrapList(fm[startField])),
    end: parseDate(unwrapList(fm[endField])),
    status,
    parent: parent || null,
  };
}

function toTask(e: RawEntry): Task {
  return { file: e.file, filePath: e.filePath, start: e.start!, end: e.end!, status: e.status! };
}

export function scanTasks(app: App, scanDir: string, startField: string, endField: string): TaskGroup[] {
  const root = scanDir
    ? app.vault.getAbstractFileByPath(scanDir)
    : app.vault.getRoot();

  if (!(root instanceof TFolder)) return [];

  const entries: RawEntry[] = [];
  const collect = (file: TFile) => {
    const e = readEntry(app, file, startField, endField);
    if (e) entries.push(e);
  };

  for (const child of root.children) {
    if (child instanceof TFile && child.extension === 'md') {
      collect(child);
    } else if (child instanceof TFolder) {
      for (const grandchild of child.children) {
        if (grandchild instanceof TFile && grandchild.extension === 'md') {
          collect(grandchild);
        }
      }
    }
  }

  const byName = new Map<string, RawEntry>();
  for (const e of entries) byName.set(e.file, e);

  // Names referenced as parent by at least one valid subtask. The referenced
  // file must exist in scope and carry a valid status.
  const parentNames = new Set<string>();
  for (const e of entries) {
    if (!e.start || !e.end || !e.status || !e.parent || e.parent === e.file) continue;
    const target = byName.get(e.parent);
    if (target && target.status) parentNames.add(e.parent);
  }

  const childrenOf = new Map<string, Task[]>();
  const standalone: Task[] = [];

  for (const e of entries) {
    if (parentNames.has(e.file)) continue; // parents are placed when groups are built
    if (!e.start || !e.end || !e.status) continue;
    const isSubtask =
      e.parent && e.parent !== e.file && parentNames.has(e.parent);
    if (isSubtask) {
      const list = childrenOf.get(e.parent!) ?? [];
      list.push(toTask(e));
      childrenOf.set(e.parent!, list);
    } else {
      standalone.push(toTask(e));
    }
  }

  const groups: TaskGroup[] = standalone.map(t => ({ parent: t, subtasks: [] }));

  for (const name of parentNames) {
    const entry = byName.get(name)!;
    const subtasks = childrenOf.get(name) ?? [];
    if (subtasks.length === 0) {
      // All referencing subtasks were invalid; fall back to the parent's own dates
      if (entry.start && entry.end) groups.push({ parent: toTask(entry), subtasks: [] });
      continue;
    }
    subtasks.sort((a, b) => a.start.getTime() - b.start.getTime());
    const start = new Date(Math.min(...subtasks.map(t => t.start.getTime())));
    const end = new Date(Math.max(...subtasks.map(t => t.end.getTime())));
    groups.push({
      parent: { file: entry.file, filePath: entry.filePath, start, end, status: entry.status! },
      subtasks,
    });
  }

  groups.sort((a, b) => a.parent.start.getTime() - b.parent.start.getTime());
  return groups;
}
