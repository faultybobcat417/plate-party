import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import { getDb, openSQLiteDatabase } from "./connection";
import { migrations } from "../../drizzle/migrations";

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  const sqlite = await openSQLiteDatabase();

  try {
    await sqlite.execAsync("PRAGMA foreign_keys = OFF;");
    await migrate(db, migrations as unknown as Parameters<typeof migrate>[1]);
  } finally {
    await sqlite.execAsync("PRAGMA foreign_keys = ON;");
  }
}
