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

- The start/end field names are configurable in plugin settings (defaults: `start` / `end`)
- Files missing the start/end fields, or with an invalid format, are **skipped**
- Files with an undefined or unrecognized `status` are also **skipped** (the `status` field name is fixed)

### Parent / subtasks

Setting the `parent` field (fixed field name) groups a task under its parent as a subtask.

```yaml
# Design.md (subtask)
---
start: 2026-06-01
end: 2026-06-07
status: done
parent: Implement feature XXX   # parent task's file name (no extension); [[Implement feature XXX]] also accepted
---
```

- The parent must be an MD file within the scan scope with a valid `status` (file names must be unique within the scan scope)
- The parent's date range is **derived from its subtasks** (earliest start to latest end). The parent's own start/end are ignored when it has subtasks
- If the `parent` reference does not resolve or is invalid, the task is treated as a normal standalone task
- Nesting (subtasks of subtasks) is **not supported**; the `parent` field of a file that is itself referenced as a parent is ignored
- A parent with no valid subtasks is shown as a standalone task if it has its own start/end, otherwise skipped

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

### Parent / subtask display

```
│ Feature XXX  │   █████████████                  │  ← parent (top of the group)
│   Design     │   ████                           │  ← subtask
│   Implement  │       ██████                     │  ← subtask
│   Debug      │             ████                 │  ← subtask
```

- Within a group, the **parent bar sits at the top** with its subtasks listed below
- Subtask names are indented; the parent name and bar label are bold
- The parent bar has the same height as subtask bars (colored by the parent's own `status`)
- The last subtask row has a thicker bottom border to separate groups

### Task sort order

- Sorted by start date **ascending** (earliest at top)
- Parent groups are ordered among other tasks by the parent's (derived) start date; subtasks within a group are also sorted by start date ascending

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
| Start date field name | `start` | Frontmatter field name for the start date. Falls back to the default when left empty |
| End date field name | `end` | Frontmatter field name for the end date. Falls back to the default when left empty |
