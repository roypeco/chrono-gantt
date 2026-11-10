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
