// Standalone app tracker: prints app open/close events to the terminal and
// appends them to a JSONL file, without starting the HTTP server.
import { AppTracker } from './apps/tracker.js';
import { macosAppSource } from './apps/source.js';
import { createJsonlLogger } from './apps/log.js';

if (process.platform !== 'darwin') {
  console.error('App tracking requires macOS.');
  process.exit(1);
}

const file = process.env['APP_EVENTS_FILE'] ?? 'data/app-events.jsonl';
const logEvent = createJsonlLogger(file);
const tracker = new AppTracker({ source: macosAppSource });

tracker.on('event', (event) => {
  const time = new Date(event.at).toLocaleTimeString();
  const verb = event.type === 'open' ? 'opened' : 'closed';
  console.log(`${time}  ${verb.padEnd(6)}  ${event.name}  (${event.bundleId ?? 'no bundle id'}, pid ${event.pid})`);
  logEvent(event).catch((err) => console.error('Failed to write event:', err));
});
tracker.on('pollError', (err) => console.error('Failed to list running apps:', err));

process.on('SIGINT', () => {
  tracker.stop();
  console.log('\nUsage this session:');
  for (const u of tracker.usage()) {
    const minutes = (u.totalMs / 60_000).toFixed(1);
    console.log(`  ${u.name.padEnd(30)} ${minutes.padStart(8)} min  ${u.launches} launch(es)`);
  }
  process.exit(0);
});

console.log(`Tracking app launches and quits (logging to ${file}). Press Ctrl+C to stop.`);
tracker.start();
