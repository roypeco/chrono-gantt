# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development (watch mode):**
```bash
docker compose up
```

**Production build:**
```bash
docker compose run --rm dev npm run build
```

**Type check only:**
```bash
docker compose run --rm dev npm run typecheck
```

## Architecture

An Obsidian plugin built with TypeScript + esbuild. The entry point is `src/main.ts`, which exports a class extending Obsidian's `Plugin`. esbuild bundles everything into a CJS `main.js`, which Obsidian loads alongside `manifest.json`.

**Source files:**

| File | Role |
|---|---|
| `src/main.ts` | Plugin entry point — registers the view, ribbon icon, and settings tab |
| `src/types.ts` | Shared type definitions (`Task`, `PluginSettings`, `TaskStatus`, `TimeScale`) |
| `src/settings.ts` | `PluginSettingTab` implementation |
| `src/scanner.ts` | Scans the target directory and parses frontmatter via `metadataCache` |
| `src/gantt-view.ts` | `ItemView` rendering the Gantt chart |
| `src/styles.ts` | CSS injected into `document.head` at plugin load |

**Build output:**

The esbuild outfile is conditional:
- If `/obsidian-plugin` is mounted (via `docker-compose.override.yml`), outputs there directly
- Otherwise outputs to `main.js` in the project root

**Local development setup:** Create `docker-compose.override.yml` (gitignored) to mount your vault's plugin directory:

```yaml
services:
  dev:
    volumes:
      - /path/to/vault/.obsidian/plugins/chrono-gantt:/obsidian-plugin
```

## Key constraints

- All Obsidian APIs (`Plugin`, `ItemView`, `TFile`, etc.) must be imported from `"obsidian"`. They are marked `external` in esbuild and provided by the Obsidian runtime — never bundle them.
- esbuild target is ES2018 / CJS to match Obsidian's runtime environment.
- CSS is injected dynamically via a `<style>` tag in `document.head` (no separate `styles.css` file). The style element is removed in `onunload`.
- Frontmatter is read through `app.metadataCache.getFileCache(file)?.frontmatter` (synchronous). Files with missing or invalid `start`/`end`/`status` fields are silently skipped.
- The scanner reads the target directory and one level of subdirectories only (not fully recursive).
