#!/usr/bin/env node

/**
 * Firestore governance checks:
 * - required rules invariants are present
 * - required composite indexes are declared
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const rulesPath = path.join(repoRoot, 'firestore.rules');
const indexesPath = path.join(repoRoot, 'firestore.indexes.json');

const requiredRuleInvariants = [
  {
    label: 'append-only chat messages',
    pattern:
      /match\s+\/chats\/\{userId\}\/messages\/\{messageId\}[\s\S]*?allow update:\s*if false;/m,
  },
  {
    label: 'append-only resilience check-ins',
    pattern:
      /match\s+\/resilienceCheckIns\/\{userId\}\/entries\/\{checkInId\}[\s\S]*?allow update:\s*if false;/m,
  },
  {
    label: 'report-driven moderation integrity using getAfter',
    pattern: /getAfter\s*\(/m,
  },
  {
    label: 'chat message max length enforcement',
    pattern: /request\.resource\.data\.content\.size\(\)\s*<=\s*4000/m,
  },
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!fs.existsSync(rulesPath)) {
  fail('Firestore governance check failed: firestore.rules is missing.');
}

if (!fs.existsSync(indexesPath)) {
  fail('Firestore governance check failed: firestore.indexes.json is missing.');
}

const rules = fs.readFileSync(rulesPath, 'utf8');
const missingInvariants = requiredRuleInvariants.filter(
  (invariant) => !invariant.pattern.test(rules),
);

if (missingInvariants.length > 0) {
  console.error('Firestore governance check failed: required rule invariants are missing.');
  missingInvariants.forEach((invariant) => {
    console.error(`- ${invariant.label}`);
  });
  process.exit(1);
}

let indexesJson;
try {
  indexesJson = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
} catch (error) {
  fail(
    `Firestore governance check failed: firestore.indexes.json is invalid JSON. ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

const indexes = Array.isArray(indexesJson.indexes) ? indexesJson.indexes : [];

const hasIndex = (fields) =>
  indexes.some((index) => {
    if (index.collectionGroup !== 'posts' || !Array.isArray(index.fields)) {
      return false;
    }

    const normalized = index.fields
      .map((field) => `${field.fieldPath}:${field.order || field.arrayConfig || ''}`)
      .join('|');

    return normalized === fields.join('|');
  });

const requiredIndexes = [
  ['category:ASCENDING', 'createdAt:DESCENDING'],
  ['authorId:ASCENDING', 'createdAt:DESCENDING'],
];

const missingIndexes = requiredIndexes.filter((requiredIndex) => !hasIndex(requiredIndex));

if (missingIndexes.length > 0) {
  console.error('Firestore governance check failed: missing required composite indexes.');
  missingIndexes.forEach((indexFields) => {
    console.error(`- posts(${indexFields.join(', ')})`);
  });
  process.exit(1);
}

console.log('Firestore governance check passed.');
