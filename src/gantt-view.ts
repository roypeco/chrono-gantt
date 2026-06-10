import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { scanTasks } from './scanner';
import type { PluginSettings, Task, TaskGroup, TaskStatus, TimeScale } from './types';

export const GANTT_VIEW_TYPE = 'chrono-gantt-view';

const ROW_H = 36;
const HEADER_H = 40;
const LEFT_W = 200;
const PADDING_DAYS = 7;

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

export class GanttView extends ItemView {
  private groups: TaskGroup[] = [];
  private scale: TimeScale = 'week';

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

  private renderChart(el: HTMLElement) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allDates = this.groups.flatMap(g =>
      [g.parent, ...g.subtasks].flatMap(t => [t.start, t.end])
    );
    const rangeStart = addDays(new Date(Math.min(...allDates.map(d => d.getTime()))), -PADDING_DAYS);
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
    for (const group of this.groups) {
      this.renderRow(
        outer,
        group.parent,
        group.subtasks.length > 0 ? 'parent' : 'single',
        rangeStart, ppd, totalW, todayX
      );
      let lastRow: HTMLElement | null = null;
      for (const sub of group.subtasks) {
        lastRow = this.renderRow(outer, sub, 'subtask', rangeStart, ppd, totalW, todayX);
      }
      lastRow?.addClass('cg-group-end');
    }

    // Scroll so today is visible (roughly centered in the timeline area)
    requestAnimationFrame(() => {
      outer.scrollLeft = Math.max(0, todayX - (outer.clientWidth - LEFT_W) / 2);
    });
  }

  private renderRow(
    outer: HTMLElement,
    task: Task,
    kind: 'single' | 'subtask' | 'parent',
    rangeStart: Date,
    ppd: number,
    totalW: number,
    todayX: number
  ): HTMLElement {
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
    bar.onclick = () => {
      const f = this.app.vault.getAbstractFileByPath(task.filePath);
      if (f instanceof TFile) this.app.workspace.getLeaf(false).openFile(f);
    };

    return row;
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
