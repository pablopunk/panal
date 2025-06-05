export type LogListener = (msg: string) => void;
const listeners: Record<string, Set<LogListener>> = {};

export function addLogListener(id: string, fn: LogListener) {
  let set = listeners[id];
  if (!set) {
    set = new Set();
    listeners[id] = set;
  }
  set.add(fn);
}

export function removeLogListener(id: string, fn: LogListener) {
  const set = listeners[id];
  if (!set) return;
  set.delete(fn);
  if (set.size === 0) delete listeners[id];
}

export function broadcastLog(id: string, msg: string) {
  const set = listeners[id];
  if (!set) return;
  for (const fn of set) {
    fn(msg);
  }
}
