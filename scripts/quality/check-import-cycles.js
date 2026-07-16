#!/usr/bin/env node

/**
 * Detect import cycles in src/ TypeScript modules.
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const srcRoot = path.join(repoRoot, 'src');
const supportedExtensions = new Set(['.ts', '.tsx']);
const importSpecifierPattern =
  /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;

const toPosixPath = (value) => value.split(path.sep).join('/');

const walk = (directoryPath, files) => {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(absolutePath, files);
      continue;
    }

    if (!supportedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    files.push(absolutePath);
  }
};

const resolveImportPath = (importingFilePath, specifier) => {
  let resolvedBase;

  if (specifier.startsWith('@/')) {
    resolvedBase = path.join(repoRoot, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    resolvedBase = path.resolve(path.dirname(importingFilePath), specifier);
  } else {
    return null;
  }

  const candidates = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
};

const buildGraph = (files) => {
  const graph = new Map();

  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    let match;

    importSpecifierPattern.lastIndex = 0;

    while ((match = importSpecifierPattern.exec(source)) !== null) {
      const specifier = match[1] || match[2] || match[3];
      if (!specifier) {
        continue;
      }

      const resolvedImport = resolveImportPath(filePath, specifier);
      if (!resolvedImport || !resolvedImport.startsWith(srcRoot)) {
        continue;
      }

      imports.push(resolvedImport);
    }

    graph.set(filePath, imports);
  });

  return graph;
};

const detectCycles = (graph) => {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = [];
  const seenKeys = new Set();

  const visit = (node) => {
    if (visiting.has(node)) {
      const cycleStart = stack.indexOf(node);
      if (cycleStart >= 0) {
        const cycle = stack
          .slice(cycleStart)
          .concat(node)
          .map((filePath) => toPosixPath(path.relative(repoRoot, filePath)));
        const key = cycle.join(' -> ');

        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          cycles.push(cycle);
        }
      }
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visiting.add(node);
    stack.push(node);

    const dependencies = graph.get(node) || [];
    dependencies.forEach((dependency) => visit(dependency));

    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  [...graph.keys()].forEach((node) => visit(node));

  return cycles;
};

if (!fs.existsSync(srcRoot)) {
  console.error('Import cycle check failed: src/ directory was not found.');
  process.exit(1);
}

const files = [];
walk(srcRoot, files);

const graph = buildGraph(files);
const cycles = detectCycles(graph);

if (cycles.length > 0) {
  console.error('Import cycle violations detected:\n');
  cycles.forEach((cycle, index) => {
    console.error(`${index + 1}. ${cycle.join(' -> ')}`);
  });
  process.exit(1);
}

console.log('Import cycle check passed.');
