import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type { PluginSettings } from './types';

export const DEFAULT_SETTINGS: PluginSettings = {
  scanDir: '',
  startField: 'start',
  endField: 'end',
};

export class ChronoGanttSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private settings: PluginSettings,
    private save: () => Promise<void>
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Chrono Gantt 設定' });

    new Setting(containerEl)
      .setName('スキャン対象ディレクトリ')
      .setDesc('ガントチャートに表示する MD ファイルの起点フォルダ（例: Projects/2026）')
      .addText(text =>
        text
          .setPlaceholder('Projects/2026')
          .setValue(this.settings.scanDir)
          .onChange(async value => {
            this.settings.scanDir = value.trim();
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName('開始日のフィールド名')
      .setDesc('フロントマターで開始日を表すフィールド名（例: start, 開始日）')
      .addText(text =>
        text
          .setPlaceholder('start')
          .setValue(this.settings.startField)
          .onChange(async value => {
            this.settings.startField = value.trim() || 'start';
            await this.save();
          })
      );

    new Setting(containerEl)
      .setName('終了日のフィールド名')
      .setDesc('フロントマターで終了日を表すフィールド名（例: end, 終了日）')
      .addText(text =>
        text
          .setPlaceholder('end')
          .setValue(this.settings.endField)
          .onChange(async value => {
            this.settings.endField = value.trim() || 'end';
            await this.save();
          })
      );
  }
}
