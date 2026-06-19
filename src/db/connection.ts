import * as SQLite from "expo-sqlite";
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";

import { schema } from "./schema";

export const DATABASE_NAME = "plate-party.db";

export const SQLITE_OPEN_OPTIONS: SQLite.SQLiteOpenOptions = {
  enableChangeListener: true,
};

export type AppSchema = typeof schema;
export type AppDatabase = ExpoSQLiteDatabase<AppSchema> & {
  $client: SQLite.SQLiteDatabase;
};

export type DatabaseHealth = {
  databaseName: string;
  databasePath: string;
  foreignKeysEnabled: boolean;
  journalMode: string;
  busyTimeoutMs: number;
};

type ForeignKeyPragmaRow = {
  foreign_keys: number;
};

type JournalModePragmaRow = {
  journal_mode: string;
};

type BusyTimeoutPragmaRow = {
  timeout: number;
};

export class DatabaseConnectionError extends Error {
  public readonly cause: unknown;

  public constructor(message: string, cause: unknown) {
    super(message);
    this.name = "DatabaseConnectionError";
    this.cause = cause;
  }
}

let sqliteDatabasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let drizzleDatabasePromise: Promise<AppDatabase> | null = null;
let sqliteDatabase: SQLite.SQLiteDatabase | null = null;
let drizzleDatabase: AppDatabase | null = null;

const toDatabaseConnectionError = (
  message: string,
  error: unknown,
): DatabaseConnectionError => {
  if (error instanceof DatabaseConnectionError) {
    return error;
  }

  return new DatabaseConnectionError(message, error);
};

const configureSQLiteConnection = async (
  database: SQLite.SQLiteDatabase,
): Promise<void> => {
  try {
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA temp_store = MEMORY;
    `);
  } catch (error) {
    throw toDatabaseConnectionError("Failed to configure SQLite connection.", error);
  }
};

const createSQLiteDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    const database = await SQLite.openDatabaseAsync(
      DATABASE_NAME,
      SQLITE_OPEN_OPTIONS,
    );

    await configureSQLiteConnection(database);
    sqliteDatabase = database;

    return database;
  } catch (error) {
    sqliteDatabasePromise = null;
    sqliteDatabase = null;
    throw toDatabaseConnectionError("Failed to open SQLite database.", error);
  }
};

const createDrizzleDatabase = async (): Promise<AppDatabase> => {
  try {
    const database = await openSQLiteDatabase();
    const client = drizzle(database, { schema });
    drizzleDatabase = client;

    return client;
  } catch (error) {
    drizzleDatabasePromise = null;
    drizzleDatabase = null;
    throw toDatabaseConnectionError("Failed to create Drizzle database client.", error);
  }
};

export const openSQLiteDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    if (sqliteDatabase) {
      return sqliteDatabase;
    }

    sqliteDatabasePromise ??= createSQLiteDatabase();
    return await sqliteDatabasePromise;
  } catch (error) {
    throw toDatabaseConnectionError("Failed to get SQLite database.", error);
  }
};

export const getDb = async (): Promise<AppDatabase> => {
  try {
    if (drizzleDatabase) {
      return drizzleDatabase;
    }

    drizzleDatabasePromise ??= createDrizzleDatabase();
    return await drizzleDatabasePromise;
  } catch (error) {
    throw toDatabaseConnectionError("Failed to get Drizzle database client.", error);
  }
};

export const getDrizzleDatabase = getDb;
export const initializeDatabase = getDb;

export const getDatabaseHealth = async (): Promise<DatabaseHealth> => {
  try {
    const database = await openSQLiteDatabase();
    const [foreignKeys, journalMode, busyTimeout] = await Promise.all([
      database.getFirstAsync<ForeignKeyPragmaRow>("PRAGMA foreign_keys;"),
      database.getFirstAsync<JournalModePragmaRow>("PRAGMA journal_mode;"),
      database.getFirstAsync<BusyTimeoutPragmaRow>("PRAGMA busy_timeout;"),
    ]);

    return {
      databaseName: DATABASE_NAME,
      databasePath: database.databasePath,
      foreignKeysEnabled: foreignKeys?.foreign_keys === 1,
      journalMode: journalMode?.journal_mode ?? "unknown",
      busyTimeoutMs: busyTimeout?.timeout ?? 0,
    };
  } catch (error) {
    throw toDatabaseConnectionError("Failed to read SQLite database health.", error);
  }
};

export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    const pendingDatabase = sqliteDatabasePromise;
    const database = sqliteDatabase;

    drizzleDatabase = null;
    drizzleDatabasePromise = null;
    sqliteDatabase = null;
    sqliteDatabasePromise = null;

    if (pendingDatabase) {
      const openedDatabase = await pendingDatabase;
      await openedDatabase.closeAsync();
      return;
    }

    await database?.closeAsync();
  } catch (error) {
    throw toDatabaseConnectionError("Failed to close SQLite database.", error);
  }
};

export const resetDatabaseConnectionForTests = async (): Promise<void> => {
  try {
    await closeDatabaseConnection();
  } catch (error) {
    throw toDatabaseConnectionError("Failed to reset SQLite database connection.", error);
  }
};
