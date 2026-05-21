# Chrono Gantt

MDファイルのfrontmatterプロパティからガントチャートを描画するObsidianプラグインです。

## 機能

- 横スクロール対応のガントチャートビュー
- 日 / 週 / 月 のタイムスケール切り替え
- ステータスに応じた色分けバー
- バーをクリックして対応ノートを開く
- 今日線（赤い縦線）の表示

## タスクのfrontmatter

対象ディレクトリ内の各MDファイルに以下のプロパティを記述します：

```yaml
---
start: 2026-05-01
end: 2026-05-15
status: in-progress
---
```

**ステータス一覧：**

| 値 | 色 |
|---|---|
| `not-started` | グレー |
| `in-progress` | ブルー |
| `in-review` | アンバー |
| `ready-for-release` | パープル |
| `done` | グリーン |

`start`・`end`・`status` のいずれかが欠けているファイルはスキップされます。

## インストール

### コミュニティプラグイン（推奨）

1. Obsidian 設定 → コミュニティプラグイン
2. **Chrono Gantt** を検索
3. インストールして有効化

### 手動インストール

1. [最新リリース](../../releases/latest) から `main.js` と `manifest.json` をダウンロード
2. `<vault>/.obsidian/plugins/chrono-gantt/` にコピー
3. 設定 → コミュニティプラグインで有効化

### BRAT

[BRAT](https://github.com/TfTHacker/obsidian42-brat) に `roypeco/chrono-gantt` を追加してください。

## 使い方

1. 設定 → Chrono Gantt を開く
2. **スキャン対象ディレクトリ** にタスクノートが入っているフォルダを指定（例: `Projects/2026`）
3. リボンのカレンダーアイコンをクリックしてガントビューを開く
4. **日 / 週 / 月** ボタンでタイムスケールを切り替え
5. **↻ 更新** で再スキャン・再描画

## 開発

### 必要環境

- Docker

### セットアップ

```bash
git clone https://github.com/roypeco/chrono-gantt
cd chrono-gantt
```

ビルド結果を直接 Vault に出力するため、`docker-compose.override.yml` を作成します：

```yaml
services:
  dev:
    volumes:
      - /path/to/your/vault/.obsidian/plugins/chrono-gantt:/obsidian-plugin
```

### watchモード（開発時）

```bash
docker compose up
```

### 本番ビルド

```bash
docker compose run --rm dev npm run build
```

### 型チェック

```bash
docker compose run --rm dev npm run typecheck
```
