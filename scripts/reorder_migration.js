const fs = require('fs');

const MIGRATION_PATH = 'drizzle/migrations.ts';
const TABLE_ORDER = [
  'users',
  'parties',
  'party_members',
  'wagers',
  'wager_options',
  'bets',
  'pool_transactions',
  'ious',
  'ledger_entries',
  'challenges',
  'sync_outbox',
];

const content = fs.readFileSync(MIGRATION_PATH, 'utf8');

// Extract the SQL string literal for the single migration.
const match = content.match(/"m0000":\s*"([\s\S]*)"/);
if (!match) {
  console.error('Could not find m0000 migration SQL in manifest.');
  process.exit(1);
}

const rawSql = match[1]
  .replace(/\\n/g, '\n')
  .replace(/\\t/g, '\t')
  .replace(/\\"/g, '"');

const parts = rawSql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);

// Group statements by table. Each table's CREATE TABLE is followed by its indexes.
const tableStatements = new Map();
let currentTable = null;

for (const part of parts) {
  const tableMatch = part.match(/CREATE TABLE `([a-z_]+)`/);
  if (tableMatch) {
    currentTable = tableMatch[1];
    tableStatements.set(currentTable, [part]);
  } else if (currentTable) {
    tableStatements.get(currentTable).push(part);
  } else {
    console.error('Found index before any table:', part.slice(0, 40));
    process.exit(1);
  }
}

// Build dependency graph from FK references inside CREATE TABLE bodies.
const dependencies = new Map();
for (const [table, stmts] of tableStatements) {
  const createTable = stmts[0];
  const refs = new Set();
  const refMatches = createTable.matchAll(/FOREIGN KEY \([^)]+\) REFERENCES `([a-z_]+)`/g);
  for (const m of refMatches) {
    if (m[1] !== table) refs.add(m[1]);
  }
  dependencies.set(table, refs);
}

// Topological sort; fallback to TABLE_ORDER for deterministic tie-breaking.
const sortedTables = [];
const visited = new Set();
const visiting = new Set();

function visit(table) {
  if (visited.has(table)) return;
  if (visiting.has(table)) {
    console.error('Cycle detected in migration dependencies:', table);
    process.exit(1);
  }
  visiting.add(table);
  for (const dep of dependencies.get(table) || []) {
    if (tableStatements.has(dep)) visit(dep);
  }
  visiting.delete(table);
  visited.add(table);
  sortedTables.push(table);
}

for (const table of TABLE_ORDER) {
  if (tableStatements.has(table)) visit(table);
}
for (const table of tableStatements.keys()) {
  if (!visited.has(table)) visit(table);
}

// Reassemble statements preserving "table then its indexes" order.
const orderedStatements = [];
for (const table of sortedTables) {
  orderedStatements.push(...tableStatements.get(table));
}

const newSql = orderedStatements.join('\n\n--> statement-breakpoint\n\n');

// Escape the SQL string back to a TS string literal.
const escapedSql = newSql
  .replace(/\\/g, '\\\\')
  .replace(/"/g, '\\"')
  .replace(/\n/g, '\\n')
  .replace(/\t/g, '\\t');

const newContent = content.replace(/"m0000":\s*"[\s\S]*"/, `"m0000": "${escapedSql}"`);

fs.writeFileSync(MIGRATION_PATH, newContent);
console.log('Reordered migration statements. Table order:');
console.log(sortedTables.join(' -> '));
