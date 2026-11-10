# コントリビュートガイド

Chrono Gantt へのコントリビュートを歓迎します。バグ報告・機能の要望・PRのどれでも大丈夫です。

[English version](CONTRIBUTING.md)

## Issue

- **バグ報告**：再現手順、期待する動作、実際の動作を書いてください。可能ならObsidianのバージョンと、問題が起きるタスクのfrontmatterの例も添えてください
- **機能の要望**：何をしたいのか、なぜ必要なのかを書いてください

大きな変更をPRで出す前に、Issueで方針を相談してもらえると助かります。

## 開発環境

必要なのは Docker だけです。

```bash
git clone https://github.com/<your-account>/chrono-gantt
cd chrono-gantt
```

ビルド結果を自分の Vault に直接出力するには、`docker-compose.override.yml`（gitignore済み）を作成します：

```yaml
services:
  dev:
    volumes:
      - /path/to/your/vault/.obsidian/plugins/chrono-gantt:/obsidian-plugin
```

| 用途 | コマンド |
|---|---|
| watchモード | `docker compose up` |
| 本番ビルド | `docker compose run --rm dev npm run build` |
| 型チェック | `docker compose run --rm dev npm run typecheck` |

ビルド後、Obsidianでプラグインを再読み込みすると変更が反映されます。

## コードの構成と決まりごと

ソースファイルの役割は [CLAUDE.md](CLAUDE.md) にまとめています。特に次の点に注意してください。

- Obsidian の API（`Plugin`、`ItemView`、`TFile` など）は必ず `"obsidian"` から import する（バンドルしない）
- ビルドターゲットは ES2018 / CJS
- CSSは `src/styles.ts` に書き、プラグイン読み込み時に `<style>` タグとして挿入する（`styles.css` は使わない）
- frontmatterは `app.metadataCache.getFileCache(file)?.frontmatter` で読む

## 仕様書

機能の仕様は `specs/` にバージョンごとにまとめています（`specs/v1/`、`specs/v2/` …）。

- 動作が変わるPRでは、該当バージョンの仕様書も更新してください
- 仕様書は日本語版（`overview_ja.md`）と英語版（`overview.md`）の両方を更新してください

## PRの流れ

1. リポジトリをフォークし、`main` からブランチを作る（例: `feature/xxx`、`fix/xxx`）
2. 変更を加え、型チェックとビルドが通ることを確認する
3. Obsidian上で動作を確認する
4. `main` に向けてPRを出す。何を変えたか、どう確認したかを書いてください

PRを出すと、GitHub Actions で型チェックとビルドが自動で実行されます。通らない場合は修正をお願いします。

## ライセンス

コントリビュートした内容は、このリポジトリと同じ [MIT License](LICENSE) で公開されます。
