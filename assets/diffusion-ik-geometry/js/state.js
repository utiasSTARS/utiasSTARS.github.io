/* The (robot, constraint) selection shared by the constraint table and both widgets. */

const listeners = new Set();
const state = { robot: "ur5", constraint: "line_orient", source: "init" };

export function getSelection() {
  return { robot: state.robot, constraint: state.constraint, source: state.source };
}

export function select(robot, constraint, source = "user") {
  if (robot === state.robot && constraint === state.constraint) return;
  state.robot = robot;
  state.constraint = constraint;
  state.source = source;
  listeners.forEach((fn) => fn(getSelection()));
}

export function onSelect(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
