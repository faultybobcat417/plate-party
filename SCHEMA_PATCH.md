# Schema Patch — Add to src/db/schema.ts

Find the `ledgerEntries` table definition and add the unique index callback:

```typescript
export const ledgerEntries = sqliteTable('ledger_entries', {
  // ... existing columns ...
}, (table) => ({
  uniqWagerResolutionIdx: uniqueIndex('uniq_wager_resolution_idx').on(
    table.wagerId,
    table.entryType,
    table.userId
  ),
}));
```

Also add `category` to the `wagers` table for market categorization:

```typescript
export const wagers = sqliteTable('wagers', {
  // ... existing columns ...
  category: text('category'), // <-- ADD THIS
  // ... rest of columns ...
});
```

After editing, run:
  npx drizzle-kit generate
  npx drizzle-kit migrate
