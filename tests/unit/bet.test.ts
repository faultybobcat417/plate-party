import { BetApiError, validateBalance } from "../../src/api/bet";

const mockGetFirstAsync = jest.fn();

jest.mock("../../src/db/connection", () => ({
  getDb: jest.fn(async () => {
    throw new Error("getDb not implemented in mock");
  }),
  openSQLiteDatabase: jest.fn(async () => ({
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: jest.fn(async () => []),
    runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
    withExclusiveTransactionAsync: jest.fn(async (callback) => {
      await callback({
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: jest.fn(),
        runAsync: jest.fn(),
      });
    }),
  })),
}));

describe("BetApiError", () => {
  it("preserves the cause", () => {
    const cause = new Error("original");
    const error = new BetApiError("wrapped", cause);
    expect(error.message).toBe("wrapped");
    expect(error.cause).toBe(cause);
    expect(error.name).toBe("BetApiError");
  });
});

describe("validateBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves when the member has sufficient balance", async () => {
    mockGetFirstAsync.mockResolvedValue({
      plate_balance: 10,
      reserved_plate_balance: 0,
    });

    await expect(validateBalance("party-1", "user-1", 5)).resolves.toBeUndefined();
  });

  it("throws when the member does not exist", async () => {
    mockGetFirstAsync.mockResolvedValue(null);

    await expect(validateBalance("party-1", "user-1", 1)).rejects.toThrow(BetApiError);
  });

  it("throws when the member has insufficient balance", async () => {
    mockGetFirstAsync.mockResolvedValue({
      plate_balance: 2,
      reserved_plate_balance: 0,
    });

    await expect(validateBalance("party-1", "user-1", 5)).rejects.toThrow(BetApiError);
  });
});
