#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const isMacOs = os.platform() === 'darwin';
const iosDirectory = path.join(process.cwd(), 'ios');

if (!isMacOs) {
  process.stdout.write('[postinstall] Skipping CocoaPods install (non-macOS environment).\n');
  process.exit(0);
}

if (!fs.existsSync(iosDirectory)) {
  process.stdout.write('[postinstall] Skipping CocoaPods install (ios/ directory not found).\n');
  process.exit(0);
}

try {
  process.stdout.write('[postinstall] Running pod install in ios/ ...\n');
  execSync('pod install', {
    cwd: iosDirectory,
    stdio: 'inherit',
  });
} catch (error) {
  process.stderr.write(
    `[postinstall] CocoaPods install failed: ${
      error instanceof Error ? error.message : String(error)
    }\n`,
  );
  process.exit(1);
}
