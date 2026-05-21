import { Plugin } from 'obsidian';
import { ChronoGanttSettingTab, DEFAULT_SETTINGS } from './settings';
import { GanttView, GANTT_VIEW_TYPE } from './gantt-view';
import { STYLES } from './styles';
import type { PluginSettings } from './types';

export default class ChronoGanttPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();

    const styleEl = document.createElement('style');
    styleEl.id = 'chrono-gantt-styles';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    this.registerView(GANTT_VIEW_TYPE, leaf => new GanttView(leaf, () => this.settings));

    this.addRibbonIcon('calendar', 'Chrono Gantt を開く', () => this.activateView());

    this.addSettingTab(
      new ChronoGanttSettingTab(this.app, this, this.settings, () => this.saveSettings())
    );
  }

  onunload() {
    document.getElementById('chrono-gantt-styles')?.remove();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async activateView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(GANTT_VIEW_TYPE);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = workspace.getLeaf('tab');
    await leaf.setViewState({ type: GANTT_VIEW_TYPE, active: true });
    workspace.revealLeaf(leaf);
  }
}
