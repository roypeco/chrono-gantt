# Chrono Gantt v2 Specification

## Overview

Builds on the v1 specification and changes the task sort order and how many tasks are shown. Anything not covered here follows the v1 specification (`specs/v1/overview.md`).

---

## Gantt Chart View

### Task sort order (changed from v1)

- Sorted by start date **descending** (newest at top)
- Parent groups are ordered among other tasks by the parent's (derived) start date
- Subtasks within a group are still sorted by start date **ascending**

### Page size and load more (new)

```
│ Task P       │                    ██████        │  ← newest task
│ Task O       │                ████████          │
│ ...          │                                  │  ← up to 15 shown
├──────────────┤
│ [Load more (N remaining)]                       │
└──────────────┘
```

- Initially shows up to **15** tasks
- A parent and its subtasks count as **one** task (a group is never split)
- When tasks remain hidden, a "Load more (N remaining)" button appears below the list
  - Clicking it appends the next 15 tasks
  - The button disappears once everything is shown
  - The button stays pinned to the left edge while scrolling horizontally
- Loading more keeps the vertical and horizontal scroll position (the visible dates do not shift even if the timeline extends further into the past)
- The loaded count is kept across **↻ Refresh** and time-scale changes, and resets to 15 when the view is reopened

### Timeline range (changed from v1)

- From the earliest start to the latest end of the **visible** tasks (with 7 days of padding on each side)
- Hidden tasks are not included in the timeline range

### Drag to move tasks (new)

- **Dragging a task bar horizontally** moves the task by whole days while keeping its duration (snaps to one day at every time scale)
- While dragging, the new date range (e.g. `8/10 〜 8/17`) is shown above the bar
- On drop, the start/end fields (as named in settings) in the file's frontmatter are rewritten in `YYYY-MM-DD` format
  - If a value is stored as a list, the list form is kept and its first element is rewritten
- Dragging a parent bar moves **all of its subtasks** together (the parent's own frontmatter is not changed)
- Moving a subtask recalculates the parent's range from its subtasks
- A move of 0 days does nothing. Movement under 4px counts as a click and opens the file as before
- Rows keep their order after a move; **↻ Refresh** re-sorts them by start date
- A notice is shown if writing the file fails

### Resize by dragging an edge (new)

- Dragging the **left or right edge (6px each)** of a task bar changes only the start or end date (snaps to one day)
  - Hovering a bar highlights both edge handles and the cursor changes to `↔`
- The start can never pass the end (a task can shrink down to a single day where start = end)
- Behavior while dragging, on save, and on failure is the same as for drag to move
- **Parent bars have no handles** (their range is derived from subtasks; they can only be moved)
- Bars narrower than 20px have no handles so the bar itself can still be grabbed; switch to the day scale to resize short tasks
