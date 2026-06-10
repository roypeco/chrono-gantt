export const STYLES = `
.cg-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-size: 13px;
}

/* ── Toolbar ── */
.cg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid var(--background-modifier-border);
  flex-shrink: 0;
}
.cg-scale-group {
  display: flex;
  gap: 4px;
}
.cg-scale-btn {
  padding: 2px 10px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
  cursor: pointer;
  font-size: 12px;
}
.cg-scale-btn.cg-scale-active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border-color: var(--interactive-accent);
}
.cg-sync-btn {
  padding: 2px 12px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-primary);
  color: var(--text-normal);
  cursor: pointer;
  font-size: 12px;
}
.cg-sync-btn:hover {
  background: var(--background-modifier-hover);
}

/* ── Scroll container ── */
.cg-outer {
  flex: 1;
  overflow: auto;
  position: relative;
}

/* ── Header row (sticky top) ── */
.cg-header-row {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 3;
  height: 40px;
  min-width: max-content;
  background: var(--background-primary);
  border-bottom: 1px solid var(--background-modifier-border);
}
.cg-corner {
  width: 200px;
  min-width: 200px;
  position: sticky;
  left: 0;
  z-index: 4;
  background: var(--background-secondary);
  border-right: 1px solid var(--background-modifier-border);
  flex-shrink: 0;
}
.cg-header-right {
  position: relative;
  height: 40px;
  flex-shrink: 0;
}
.cg-date-label {
  position: absolute;
  top: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--text-muted);
  border-right: 1px solid var(--background-modifier-border);
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
}
.cg-date-label.cg-weekend {
  background: var(--background-secondary);
}

/* ── Task rows ── */
.cg-row {
  display: flex;
  min-width: max-content;
  border-bottom: 1px solid var(--background-modifier-border);
}
.cg-task-name {
  width: 200px;
  min-width: 200px;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--background-primary);
  border-right: 1px solid var(--background-modifier-border);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  font-size: 12px;
  flex-shrink: 0;
}
.cg-chart-cell {
  position: relative;
  height: 36px;
  flex-shrink: 0;
}

/* ── Parent / subtask rows ── */
.cg-subtask-name {
  padding-left: 28px;
}
.cg-parent-name {
  font-weight: 600;
}
.cg-group-end {
  border-bottom: 2px solid var(--background-modifier-border);
}

/* ── Today line ── */
.cg-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(239, 68, 68, 0.6);
  z-index: 0;
  pointer-events: none;
}

/* ── Task bar ── */
.cg-bar {
  position: absolute;
  top: 4px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
  z-index: 1;
  user-select: none;
}
.cg-bar:hover {
  filter: brightness(1.12);
}
.cg-bar-parent {
  font-weight: 600;
}

/* ── Empty state ── */
.cg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: var(--text-muted);
  padding: 32px;
}
.cg-empty p {
  margin: 0;
}
.cg-link {
  color: var(--interactive-accent);
  cursor: pointer;
  text-decoration: underline;
}
.cg-muted {
  color: var(--text-faint);
  font-size: 12px;
}
`;
