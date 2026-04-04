#!/usr/bin/env node
/**
 * Deploy Hosting to Firebase.
 * Optional: FIREBASE_PROJECT or GCLOUD_PROJECT selects the Firebase project (overrides .firebaserc default).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const project =
  process.env.FIREBASE_PROJECT?.trim() || process.env.GCLOUD_PROJECT?.trim();

const args = ['deploy', '--only', 'hosting'];
if (process.env.CI === 'true' || process.env.CI === '1') {
  args.push('--non-interactive');
}
if (project) {
  args.push('--project', project);
}

const result = spawnSync('firebase', args, {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
