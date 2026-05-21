# Chrono Gantt

Obsidian plugin that renders a Gantt chart from MD file frontmatter properties.

## Features

- Gantt chart view with horizontal scrolling
- Day / Week / Month time scale toggle
- Color-coded task bars by status
- Click a bar to open the corresponding note
- Today marker (red vertical line)

## Task frontmatter

Each MD file in your target directory needs these properties:

```yaml
---
start: 2026-05-01
end: 2026-05-15
status: in-progress
---
```

**Supported status values:**

| Value | Color |
|---|---|
| `not-started` | Gray |
| `in-progress` | Blue |
| `in-review` | Amber |
| `ready-for-release` | Purple |
| `done` | Green |

Files missing `start`, `end`, or `status` are silently skipped.

## Installation

### Community plugins (recommended)

1. Open Obsidian Settings → Community plugins
2. Search for **Chrono Gantt**
3. Install and enable

### Manual install

1. Download `main.js` and `manifest.json` from the [latest release](../../releases/latest)
2. Copy them to `<vault>/.obsidian/plugins/chrono-gantt/`
3. Enable the plugin in Settings → Community plugins

### BRAT

Add `roypeco/chrono-gantt` in [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Usage

1. Open Settings → Chrono Gantt
2. Set **Scan directory** to the folder containing your task notes (e.g. `Projects/2026`)
3. Click the calendar icon in the ribbon to open the Gantt view
4. Use **日 / 週 / 月** buttons to switch the time scale
5. Click **↻ 更新** to rescan and refresh

## Development

### Requirements

- Docker

### Setup

```bash
git clone https://github.com/roypeco/chrono-gantt
cd chrono-gantt
```

Create `docker-compose.override.yml` to output the build directly to your vault:

```yaml
services:
  dev:
    volumes:
      - /path/to/your/vault/.obsidian/plugins/chrono-gantt:/obsidian-plugin
```

### Watch mode

```bash
docker compose up
```

### Production build

```bash
docker compose run --rm dev npm run build
```

### Type check

```bash
docker compose run --rm dev npm run typecheck
```
