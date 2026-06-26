/**
 * Mock database helper for Jest tests
 * 
 * NOTE: This is a lightweight mock using an in-memory object store.
 * For real SQLite testing, install better-sqlite3 or sql.js and adapt this helper.
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../../src/db/schema';

// Simple in-memory mock for SQLite
class MockExpoSQLite {
  private data: Map<string, any[]> = new Map();

  runSync(sql: string, params?: any[]) {
    // Simplified mock - real implementation would parse SQL
    return { changes: 0, lastInsertRowId: 0 };
  }

  getAllSync(sql: string, params?: any[]) {
    return [];
  }
}

export function createMockDb() {
  const mockDb = new MockExpoSQLite();
  // @ts-ignore - mock for testing
  const db = drizzle(mockDb as any, { schema });
  return db;
}

export function resetMockDb() {
  // Reset in-memory state between tests
}
