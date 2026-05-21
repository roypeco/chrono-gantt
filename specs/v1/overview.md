# Chrono Gantt v1 Specification

## Overview

An Obsidian plugin that reads frontmatter properties from MD files and renders a horizontally scrollable Gantt chart.

---

## Data

### Scan target

- Directory specified in plugin settings
- Scans the target directory and **one level of subdirectories** (no deeper)

### Frontmatter properties

```yaml
---
start: 2026-05-01   # YYYY-MM-DD
end: 2026-05-15     # YYYY-MM-DD
status: in-progress
---
```

- Files missing `start`, `end`, or with an invalid format are **skipped**
- Files with an undefined or unrecognized `status` are also **skipped**

### Status values and colors

| Status | Color |
|---|---|
| `not-started` | Gray |
| `in-progress` | Blue |
| `in-review` | Amber |
| `ready-for-release` | Purple |
| `done` | Green |

---

## Gantt Chart View

### How to open

- Click the **ribbon icon** (left sidebar) to open as a tab in the main area (`ItemView`)

### Layout

```
[ Gantt Chart View ]
┌─────────────────────────────────────────────────┐
│ [Day|Week|Month]                    [↻ Refresh] │  ← Toolbar
├──────────────┬──────────────────────────────────┤
│ Task name    │ ← Timeline (horizontal scroll) → │
│ (fixed)      │                                  │
│ Task A       │        ██████                    │
│ Task B       │              ████████            │
└──────────────┴──────────────────────────────────┘
```

- Left column (task names) is **fixed**
- Only the timeline scrolls **horizontally**

### Time scale

- Three-step toggle: **Day / Week / Month**
- No zoom animation in v1

### Task bar display

- Shows **filename (without extension)** on the bar
- **Clicking** a bar opens the corresponding MD file in Obsidian

### Today line

- A **red vertical line** marking the current date, always visible

### Task sort order

- Sorted by `start` date **ascending** (earliest at top)

### Data refresh

- Clicking **↻ Refresh** in the toolbar rescans the directory and re-renders
- Switching to the tab (inactive → active) also triggers a re-render automatically
- No file-watch based auto-refresh

### Empty states

- Directory not configured:
  ```
  No target directory is configured.
  [Open settings]
  ```
- No tasks found:
  ```
  No tasks found.
  Target: <configured directory path>
  ```

---

## Plugin Settings

| Setting | Default | Description |
|---|---|---|
| Scan directory | *(empty)* | Root folder of MD files to display in the Gantt chart |
