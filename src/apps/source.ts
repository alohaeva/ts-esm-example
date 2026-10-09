import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface RunningApp {
  pid: number;
  bundleId: string | null;
  name: string;
}

// Returns a snapshot of the apps currently running. Injectable so the tracker
// can be driven by a fake source in tests and on non-macOS hosts.
export type AppSource = () => Promise<RunningApp[]>;

// JXA (JavaScript for Automation) script that asks NSWorkspace for running
// applications. Only "regular" apps (activation policy 0 — the ones that show
// up in the Dock and Cmd-Tab) are reported; agents and daemons are skipped.
// Reading NSWorkspace needs no Accessibility or Automation permission.
const JXA_SCRIPT = `
ObjC.import('AppKit');
const apps = $.NSWorkspace.sharedWorkspace.runningApplications;
const out = [];
for (let i = 0; i < apps.count; i++) {
  const app = apps.objectAtIndex(i);
  if (app.activationPolicy !== 0) continue;
  out.push({
    pid: app.processIdentifier,
    bundleId: ObjC.unwrap(app.bundleIdentifier) || null,
    name: ObjC.unwrap(app.localizedName) || '',
  });
}
JSON.stringify(out);
`;

export const macosAppSource: AppSource = async () => {
  const { stdout } = await execFileAsync('osascript', ['-l', 'JavaScript', '-e', JXA_SCRIPT], {
    timeout: 10_000,
  });
  return JSON.parse(stdout) as RunningApp[];
};
