import { EventEmitter } from 'node:events';
import type { AppSource, RunningApp } from './source.js';

export interface AppEvent {
  type: 'open' | 'close';
  pid: number;
  bundleId: string | null;
  name: string;
  at: string; // ISO-8601 timestamp
}

export interface AppUsage {
  bundleId: string | null;
  name: string;
  launches: number;
  running: boolean;
  totalMs: number;
}

export interface AppTrackerOptions {
  source: AppSource;
  intervalMs?: number;
  maxEvents?: number;
  now?: () => number;
}

interface Session extends RunningApp {
  startedAt: number;
}

interface UsageEntry {
  bundleId: string | null;
  name: string;
  launches: number;
  closedMs: number;
}

interface AppTrackerEvents {
  event: [AppEvent];
  pollError: [unknown];
}

function usageKey(app: RunningApp): string {
  return app.bundleId ?? `name:${app.name}`;
}

// Polls an AppSource and diffs consecutive snapshots by pid. A pid that
// appears is an "open", a pid that disappears is a "close" — so relaunching an
// app (new pid) is reported as a close followed by an open.
//
// Apps already running at the first poll form the baseline: no "open" event is
// emitted for them, but their usage time is counted from that first poll.
export class AppTracker extends EventEmitter<AppTrackerEvents> {
  readonly #source: AppSource;
  readonly #intervalMs: number;
  readonly #maxEvents: number;
  readonly #now: () => number;

  #sessions = new Map<number, Session>();
  #usage = new Map<string, UsageEntry>();
  #events: AppEvent[] = [];
  #baselined = false;
  #timer: NodeJS.Timeout | undefined;
  #running = false;
  #lastError: string | null = null;

  constructor(options: AppTrackerOptions) {
    super();
    this.#source = options.source;
    this.#intervalMs = options.intervalMs ?? 2000;
    this.#maxEvents = options.maxEvents ?? 10_000;
    this.#now = options.now ?? Date.now;
  }

  get lastError(): string | null {
    return this.#lastError;
  }

  start(): void {
    if (this.#running) return;
    this.#running = true;
    const loop = async () => {
      await this.poll();
      if (this.#running) this.#timer = setTimeout(loop, this.#intervalMs);
    };
    void loop();
  }

  stop(): void {
    this.#running = false;
    clearTimeout(this.#timer);
  }

  async poll(): Promise<AppEvent[]> {
    let snapshot: RunningApp[];
    try {
      snapshot = await this.#source();
      this.#lastError = null;
    } catch (err) {
      this.#lastError = err instanceof Error ? err.message : String(err);
      this.emit('pollError', err);
      return [];
    }

    const now = this.#now();
    const at = new Date(now).toISOString();
    const current = new Map(snapshot.map((app) => [app.pid, app]));
    const emitted: AppEvent[] = [];

    for (const [pid, session] of this.#sessions) {
      if (current.has(pid)) continue;
      this.#sessions.delete(pid);
      this.#entry(session).closedMs += now - session.startedAt;
      emitted.push({ type: 'close', pid, bundleId: session.bundleId, name: session.name, at });
    }

    for (const [pid, app] of current) {
      if (this.#sessions.has(pid)) continue;
      this.#sessions.set(pid, { ...app, startedAt: now });
      const entry = this.#entry(app);
      if (this.#baselined) {
        entry.launches += 1;
        emitted.push({ type: 'open', pid, bundleId: app.bundleId, name: app.name, at });
      }
    }
    this.#baselined = true;

    for (const event of emitted) {
      this.#events.push(event);
      this.emit('event', event);
    }
    if (this.#events.length > this.#maxEvents) {
      this.#events.splice(0, this.#events.length - this.#maxEvents);
    }
    return emitted;
  }

  running(): RunningApp[] {
    return [...this.#sessions.values()]
      .map(({ pid, bundleId, name }) => ({ pid, bundleId, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  events(options: { since?: number; limit?: number } = {}): AppEvent[] {
    const { since, limit } = options;
    let result = since === undefined
      ? this.#events
      : this.#events.filter((e) => Date.parse(e.at) >= since);
    if (limit !== undefined) result = result.slice(-limit);
    return [...result];
  }

  usage(): AppUsage[] {
    const now = this.#now();
    const openMs = new Map<string, number>();
    for (const session of this.#sessions.values()) {
      const key = usageKey(session);
      openMs.set(key, (openMs.get(key) ?? 0) + now - session.startedAt);
    }
    return [...this.#usage]
      .map(([key, entry]) => ({
        bundleId: entry.bundleId,
        name: entry.name,
        launches: entry.launches,
        running: openMs.has(key),
        totalMs: entry.closedMs + (openMs.get(key) ?? 0),
      }))
      .sort((a, b) => b.totalMs - a.totalMs);
  }

  #entry(app: RunningApp): UsageEntry {
    const key = usageKey(app);
    let entry = this.#usage.get(key);
    if (!entry) {
      entry = { bundleId: app.bundleId, name: app.name, launches: 0, closedMs: 0 };
      this.#usage.set(key, entry);
    }
    return entry;
  }
}
