export const openDatabaseAsync = jest.fn(async () => ({
  execAsync: jest.fn(async () => undefined),
  getFirstAsync: jest.fn(async () => null),
  getAllAsync: jest.fn(async () => []),
  runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
  withExclusiveTransactionAsync: jest.fn(async (callback) => {
    await callback({
      execAsync: jest.fn(async () => undefined),
      getFirstAsync: jest.fn(async () => null),
      getAllAsync: jest.fn(async () => []),
      runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
    });
  }),
  closeAsync: jest.fn(async () => undefined),
  databasePath: ":memory:",
}));

export const SQLiteDatabase = jest.fn();
