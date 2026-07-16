#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const METRICS = ['statements', 'branches', 'functions', 'lines'];
const EPSILON = 0.01;

const summaryPath =
  process.env.COVERAGE_SUMMARY_PATH ||
  path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const baselinePath =
  process.env.COVERAGE_BASELINE_PATH ||
  path.join(process.cwd(), 'scripts', 'quality', 'coverage-baseline.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found: ${summaryPath}`);
  console.error('Run `npm run test:ci` first to generate coverage artifacts.');
  process.exit(1);
}

if (!fs.existsSync(baselinePath)) {
  console.error(`Coverage baseline not found: ${baselinePath}`);
  console.error('Create a baseline file with statements/branches/functions/lines percentages.');
  process.exit(1);
}

const summary = readJson(summaryPath);
const baseline = readJson(baselinePath);
const current = summary.total || {};

const failures = [];

for (const metric of METRICS) {
  const baselinePct = Number(baseline[metric]);
  const currentPct = Number(current[metric]?.pct);

  if (!Number.isFinite(baselinePct)) {
    console.error(`Invalid baseline value for "${metric}" in ${baselinePath}`);
    process.exit(1);
  }

  if (!Number.isFinite(currentPct)) {
    console.error(`Missing coverage metric "${metric}" in ${summaryPath}`);
    process.exit(1);
  }

  if (currentPct + EPSILON < baselinePct) {
    failures.push({ metric, baselinePct, currentPct });
  }
}

if (failures.length > 0) {
  console.error('Coverage regression detected (ratchet check failed):');
  for (const failure of failures) {
    console.error(
      `- ${failure.metric}: current=${failure.currentPct.toFixed(2)}% baseline=${failure.baselinePct.toFixed(2)}%`,
    );
  }
  process.exit(1);
}

console.log('Coverage ratchet check passed.');
for (const metric of METRICS) {
  const currentPct = Number(current[metric]?.pct || 0).toFixed(2);
  const baselinePct = Number(baseline[metric]).toFixed(2);
  console.log(`- ${metric}: current=${currentPct}% baseline=${baselinePct}%`);
}
