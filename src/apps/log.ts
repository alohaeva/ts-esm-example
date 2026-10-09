import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AppEvent } from './tracker.js';

// Appends each event as one JSON line, so the history survives restarts and
// can be inspected with standard tools (`tail -f`, `jq`). Writes are chained
// so lines land in the order the events were emitted.
export function createJsonlLogger(path: string): (event: AppEvent) => Promise<void> {
  let queue: Promise<unknown> = mkdir(dirname(path), { recursive: true });
  return (event) => {
    const write = queue.then(() => appendFile(path, JSON.stringify(event) + '\n'));
    queue = write.catch(() => {});
    return write;
  };
}
