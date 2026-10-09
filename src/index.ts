import { buildServer } from './server.js';
import { AppTracker } from './apps/tracker.js';
import { macosAppSource } from './apps/source.js';
import { createJsonlLogger } from './apps/log.js';

// App tracking reads NSWorkspace through osascript, so it only runs on macOS.
const appTracker = process.platform === 'darwin'
  ? new AppTracker({ source: macosAppSource })
  : undefined;

const app = buildServer({ appTracker });

if (appTracker) {
  const logEvent = createJsonlLogger(process.env['APP_EVENTS_FILE'] ?? 'data/app-events.jsonl');
  appTracker.on('event', (event) => {
    app.log.info(event, `app ${event.type}: ${event.name}`);
    logEvent(event).catch((err) => app.log.error(err, 'failed to write app event'));
  });
  appTracker.on('pollError', (err) => app.log.error(err, 'failed to list running apps'));
  appTracker.start();
  app.addHook('onClose', async () => appTracker.stop());
} else {
  app.log.warn('App tracking requires macOS; /api/apps routes are disabled');
}

try {
  await app.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
