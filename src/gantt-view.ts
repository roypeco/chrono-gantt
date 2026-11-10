import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { scanTasks } from './scanner';
import type { PluginSettings, Task, TaskGroup, TaskStatus, TimeScale } from './types';

export const GANTT_VIEW_TYPE = 'chrono-gantt-view';

const ROW_H = 36;
const HEADER_H = 40;
const LEFT_W = 200;
const PADDING_DAYS = 7;
const PAGE_SIZE = 15;
// Pointer movement (px) before a press on a bar becomes a drag instead of a click
const DRAG_THRESHOLD = 4;
// Bars narrower than this (px) get no resize handles
const MIN_RESIZE_W = 20;

const PX_PER_DAY: Record<TimeScale, number> = {
  day: 40,
  week: 20,
  month: 6,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  'not-started': '#9e9e9e',
  'in-progress': '#2196f3',
  'in-review': '#f59e0b',
  'ready-for-release': '#9c27b0',
  'done': '#4caf50',
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Keep the list form if Obsidian's properties UI stored the field as a list
function setDateField(fm: Record<string, unknown>, key: string, d: Date) {
  const cur = fm[key];
  if (Array.isArray(cur) && cur.length > 0) cur[0] = fmtDate(d);
  else fm[key] = fmtDate(d);
}

type RowKind = 'single' | 'subtask' | 'parent';
type DragMode = 'move' | 'start' | 'end';

interface DateUpdate {
  task: Task;
  start: Date;
  end: Date;
}

interface RowContext {
  outer: HTMLElement;
  group: TaskGroup;
  groupIndex: number;
  rangeStart: Date;
  ppd: number;
  totalW: number;
  todayX: number;
}

export class GanttView extends ItemView {
  private groups: TaskGroup[] = [];
  private scale: TimeScale = 'week';
  private visibleCount = PAGE_SIZE;
  private saving = false;

  constructor(leaf: WorkspaceLeaf, private getSettings: () => PluginSettings) {
    super(leaf);
  }

  getViewType() { return GANTT_VIEW_TYPE; }
  getDisplayText() { return 'Chrono Gantt'; }
  getIcon() { return 'calendar'; }

  async onOpen() { await this.render(); }

  private async render() {
    const settings = this.getSettings();
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('cg-view');

    if (!settings.scanDir) {
      this.renderToolbar(containerEl);
      this.renderEmpty(containerEl, 'unconfigured');
      return;
    }

    this.groups = scanTasks(this.app, settings.scanDir, settings.startField, settings.endField);
    this.renderToolbar(containerEl);

    if (this.groups.length === 0) {
      this.renderEmpty(containerEl, 'no-tasks', settings.scanDir);
      return;
    }

    this.renderChart(containerEl);
  }

  private loadMore() {
    this.rerenderChart(() => { this.visibleCount += PAGE_SIZE; });
  }

  // Redraw only the chart, applying `mutate` first, without losing the scroll position
  private rerenderChart(mutate: () => void) {
    const outer = this.containerEl.querySelector<HTMLElement>('.cg-outer');
    const prevTop = outer?.scrollTop ?? 0;
    const prevStart = this.visibleRangeStart();
    const prevLeft = outer?.scrollLeft ?? 0;

    mutate();
    outer?.remove();
    const next = this.renderChart(this.containerEl, false);

    // Keep the same dates in view even if the timeline range grew to the left
    const shift = daysBetween(this.visibleRangeStart(), prevStart) * PX_PER_DAY[this.scale];
    next.scrollTop = prevTop;
    next.scrollLeft = prevLeft + shift;
  }

  private visibleGroups(): TaskGroup[] {
    return this.groups.slice(0, this.visibleCount);
  }

  private visibleRangeStart(): Date {
    const times = this.visibleGroups().flatMap(g =>
      [g.parent, ...g.subtasks].map(t => t.start.getTime())
    );
    return addDays(new Date(Math.min(...times)), -PADDING_DAYS);
  }

  private renderToolbar(el: HTMLElement) {
    const bar = el.createDiv('cg-toolbar');

    const group = bar.createDiv('cg-scale-group');
    const scales: [string, TimeScale][] = [['日', 'day'], ['週', 'week'], ['月', 'month']];
    for (const [label, scale] of scales) {
      const btn = group.createEl('button', { text: label, cls: 'cg-scale-btn' });
      if (scale === this.scale) btn.addClass('cg-scale-active');
      btn.onclick = () => { this.scale = scale; this.render(); };
    }

    const syncBtn = bar.createEl('button', { text: '↻ 更新', cls: 'cg-sync-btn' });
    syncBtn.onclick = () => this.render();
  }

  private renderEmpty(el: HTMLElement, reason: 'unconfigured' | 'no-tasks', dir?: string) {
    const wrap = el.createDiv('cg-empty');
    if (reason === 'unconfigured') {
      wrap.createEl('p', { text: '対象ディレクトリが設定されていません。' });
      const a = wrap.createEl('a', { text: '設定を開く', cls: 'cg-link' });
      a.onclick = () => {
        // @ts-ignore - internal Obsidian API
        this.app.setting?.open();
        // @ts-ignore
        this.app.setting?.openTabById('chrono-gantt');
      };
    } else {
      wrap.createEl('p', { text: 'タスクが見つかりませんでした。' });
      wrap.createEl('p', { text: `対象: ${dir}`, cls: 'cg-muted' });
    }
  }

  private renderChart(el: HTMLElement, scrollToToday = true): HTMLElement {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = this.visibleGroups();
    const allDates = groups.flatMap(g =>
      [g.parent, ...g.subtasks].flatMap(t => [t.start, t.end])
    );
    const rangeStart = this.visibleRangeStart();
    const rangeEnd = addDays(new Date(Math.max(...allDates.map(d => d.getTime()))), PADDING_DAYS);

    const ppd = PX_PER_DAY[this.scale];
    const totalW = daysBetween(rangeStart, rangeEnd) * ppd;
    const todayX = daysBetween(rangeStart, today) * ppd;

    const outer = el.createDiv('cg-outer');

    // Sticky header row
    const headerRow = outer.createDiv('cg-header-row');
    headerRow.createDiv('cg-corner'); // top-left fixed corner

    const headerRight = headerRow.createDiv('cg-header-right');
    headerRight.style.width = totalW + 'px';
    this.renderTimeHeader(headerRight, rangeStart, rangeEnd, ppd);

    // Task rows — within a group, the parent bar comes first with subtasks below it
    groups.forEach((group, gi) => {
      const ctx = { outer, group, groupIndex: gi, rangeStart, ppd, totalW, todayX };
      this.renderRow(ctx, group.parent, group.subtasks.length > 0 ? 'parent' : 'single');
      let lastRow: HTMLElement | null = null;
      for (const sub of group.subtasks) {
        lastRow = this.renderRow(ctx, sub, 'subtask');
      }
      lastRow?.addClass('cg-group-end');
    });

    const remaining = this.groups.length - groups.length;
    if (remaining > 0) {
      const moreRow = outer.createDiv('cg-more-row');
      const btn = moreRow.createEl('button', {
        text: `さらに読み込む（残り ${remaining} 件）`,
        cls: 'cg-more-btn',
      });
      btn.onclick = () => this.loadMore();
    }

    // Scroll so today is visible (roughly centered in the timeline area)
    if (scrollToToday) {
      requestAnimationFrame(() => {
        outer.scrollLeft = Math.max(0, todayX - (outer.clientWidth - LEFT_W) / 2);
      });
    }
    return outer;
  }

  private renderRow(ctx: RowContext, task: Task, kind: RowKind): HTMLElement {
    const { outer, groupIndex, rangeStart, ppd, totalW, todayX } = ctx;
    const row = outer.createDiv('cg-row');

    const nameCell = row.createDiv('cg-task-name');
    if (kind === 'subtask') nameCell.addClass('cg-subtask-name');
    if (kind === 'parent') nameCell.addClass('cg-parent-name');
    nameCell.setText(task.file);
    nameCell.title = task.file;

    const chartCell = row.createDiv('cg-chart-cell');
    chartCell.style.width = totalW + 'px';

    // Today line (behind bars)
    if (todayX >= 0 && todayX <= totalW) {
      const todayLine = chartCell.createDiv('cg-today-line');
      todayLine.style.left = todayX + 'px';
    }

    // Task bar
    const left = daysBetween(rangeStart, task.start) * ppd;
    const width = Math.max(daysBetween(task.start, task.end) * ppd, ppd / 2);
    const bar = chartCell.createDiv('cg-bar');
    if (kind === 'parent') bar.addClass('cg-bar-parent');
    bar.style.left = left + 'px';
    bar.style.width = width + 'px';
    bar.style.background = STATUS_COLOR[task.status];
    bar.setText(task.file);
    bar.title = `${task.file}\n${fmtDate(task.start)} 〜 ${fmtDate(task.end)}\n${task.status}`;
    bar.dataset.group = String(groupIndex);
    // Parent ranges are derived from subtasks, so only leaf bars get resize handles.
    // Very short bars skip them so there is still room to grab the bar itself.
    if (kind !== 'parent' && width >= MIN_RESIZE_W) {
      bar.createDiv('cg-bar-handle cg-bar-handle-start');
      bar.createDiv('cg-bar-handle cg-bar-handle-end');
    }
    this.attachDrag(bar, task, kind, ctx);

    return row;
  }

  // Dragging the bar body moves the task by whole days (a parent bar moves all its subtasks);
  // dragging an edge handle changes only the start or end date.
  // A press without movement opens the file.
  private attachDrag(bar: HTMLElement, task: Task, kind: RowKind, ctx: RowContext) {
    bar.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 || this.saving) return;
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);

      const target = e.target as HTMLElement;
      const mode: DragMode = target.hasClass('cg-bar-handle-start')
        ? 'start'
        : target.hasClass('cg-bar-handle-end') ? 'end' : 'move';

      const { outer, group, groupIndex, rangeStart, ppd } = ctx;
      const moving = mode === 'move' && kind === 'parent'
        ? Array.from(outer.querySelectorAll<HTMLElement>(`.cg-bar[data-group="${groupIndex}"]`))
        : [bar];
      const startX = e.clientX;
      const origLeft = bar.style.left;
      const origWidth = bar.style.width;
      let dragging = false;
      let days = 0;
      let newStart = task.start;
      let newEnd = task.end;
      let tip: HTMLElement | null = null;

      const reset = () => {
        for (const b of moving) b.style.transform = '';
        bar.style.left = origLeft;
        bar.style.width = origWidth;
        bar.removeClass('cg-bar-dragging');
        tip?.remove();
      };

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (!dragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD) return;
          dragging = true;
          bar.addClass('cg-bar-dragging');
          tip = bar.parentElement!.createDiv('cg-drag-tip');
        }
        days = Math.round(dx / ppd);

        if (mode === 'move') {
          newStart = addDays(task.start, days);
          newEnd = addDays(task.end, days);
          for (const b of moving) b.style.transform = `translateX(${days * ppd}px)`;
        } else {
          // Never let the start pass the end (a same-day task is allowed)
          if (mode === 'start') {
            newStart = addDays(task.start, days);
            if (newStart > task.end) newStart = task.end;
          } else {
            newEnd = addDays(task.end, days);
            if (newEnd < task.start) newEnd = task.start;
          }
          bar.style.left = daysBetween(rangeStart, newStart) * ppd + 'px';
          bar.style.width = Math.max(daysBetween(newStart, newEnd) * ppd, ppd / 2) + 'px';
        }

        if (tip) {
          tip.style.left = daysBetween(rangeStart, newStart) * ppd + 'px';
          tip.setText(`${fmtShort(newStart)} 〜 ${fmtShort(newEnd)}`);
        }
      };

      const finish = (ev: PointerEvent) => {
        bar.removeEventListener('pointermove', onMove);
        bar.removeEventListener('pointerup', finish);
        bar.removeEventListener('pointercancel', finish);
        if (!dragging) {
          if (ev.type === 'pointerup') this.openTask(task);
          return;
        }
        const unchanged =
          newStart.getTime() === task.start.getTime() && newEnd.getTime() === task.end.getTime();
        if (ev.type === 'pointercancel' || unchanged) {
          reset();
          return;
        }
        const updates: DateUpdate[] = mode === 'move' && kind === 'parent'
          ? group.subtasks.map(t => ({ task: t, start: addDays(t.start, days), end: addDays(t.end, days) }))
          : [{ task, start: newStart, end: newEnd }];
        this.saveDates(group, updates);
      };

      bar.addEventListener('pointermove', onMove);
      bar.addEventListener('pointerup', finish);
      bar.addEventListener('pointercancel', finish);
    });
  }

  private openTask(task: Task) {
    const f = this.app.vault.getAbstractFileByPath(task.filePath);
    if (f instanceof TFile) this.app.workspace.getLeaf(false).openFile(f);
  }

  // Write the new dates to each file's frontmatter, then redraw.
  // The row order is kept as-is until the next refresh so the changed task doesn't jump away.
  private async saveDates(group: TaskGroup, updates: DateUpdate[]) {
    const { startField, endField } = this.getSettings();
    const saved: DateUpdate[] = [];
    this.saving = true;
    try {
      for (const u of updates) {
        const f = this.app.vault.getAbstractFileByPath(u.task.filePath);
        if (!(f instanceof TFile)) throw new Error(`File not found: ${u.task.filePath}`);
        await this.app.fileManager.processFrontMatter(f, fm => {
          setDateField(fm, startField, u.start);
          setDateField(fm, endField, u.end);
        });
        saved.push(u);
      }
    } catch (err) {
      console.error('[chrono-gantt] failed to update dates', err);
      new Notice('タスクの日付を更新できませんでした');
    } finally {
      this.saving = false;
    }

    this.rerenderChart(() => {
      for (const u of saved) {
        u.task.start = u.start;
        u.task.end = u.end;
      }
      if (group.subtasks.length > 0) {
        group.parent.start = new Date(Math.min(...group.subtasks.map(t => t.start.getTime())));
        group.parent.end = new Date(Math.max(...group.subtasks.map(t => t.end.getTime())));
      }
    });
  }

  private renderTimeHeader(el: HTMLElement, start: Date, end: Date, ppd: number) {
    if (this.scale === 'day') {
      let cur = new Date(start);
      while (cur <= end) {
        const lbl = el.createDiv('cg-date-label');
        lbl.style.left = daysBetween(start, cur) * ppd + 'px';
        lbl.style.width = ppd + 'px';
        lbl.setText(`${cur.getMonth() + 1}/${cur.getDate()}`);
        const dow = cur.getDay();
        if (dow === 0 || dow === 6) lbl.addClass('cg-weekend');
        cur = addDays(cur, 1);
      }
    } else if (this.scale === 'week') {
      // Start from the Monday on or after rangeStart
      let cur = new Date(start);
      const dow = cur.getDay();
      if (dow !== 1) cur = addDays(cur, ((8 - dow) % 7) || 7);
      while (cur <= end) {
        const lbl = el.createDiv('cg-date-label');
        lbl.style.left = daysBetween(start, cur) * ppd + 'px';
        lbl.style.width = 7 * ppd + 'px';
        lbl.setText(`${cur.getMonth() + 1}/${cur.getDate()}`);
        cur = addDays(cur, 7);
      }
    } else {
      // Month scale — one label per calendar month
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
        const lbl = el.createDiv('cg-date-label');
        lbl.style.left = Math.max(0, daysBetween(start, cur)) * ppd + 'px';
        lbl.style.width = daysInMonth * ppd + 'px';
        lbl.setText(`${cur.getFullYear()}年${cur.getMonth() + 1}月`);
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    }
  }
}
