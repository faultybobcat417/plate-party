import {
  assertBalancedEntries,
  getLedgerBalance,
  LedgerError,
  postLedgerTransaction,
  seedMemberOpeningBalance,
} from "../../src/api/ledger";

const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockWithExclusiveTransactionAsync = jest.fn();

jest.mock("../../src/db/connection", () => ({
  getDb: jest.fn(async () => {
    throw new Error("getDb not implemented in mock");
  }),
  openSQLiteDatabase: jest.fn(async () => ({
    getFirstAsync: mockGetFirstAsync,
    getAllAsync: jest.fn(async () => []),
    runAsync: mockRunAsync,
    withExclusiveTransactionAsync: mockWithExclusiveTransactionAsync,
  })),
}));

describe("assertBalancedEntries", () => {
  it("accepts a balanced two-sided transaction", () => {
    expect(() =>
      assertBalancedEntries([
        { accountType: "member_available", accountId: "user-1", plateDelta: -5 },
        { accountType: "wager_escrow", accountId: "wager-1", plateDelta: 5 },
      ]),
    ).not.toThrow();
  });

  it("accepts a balanced multi-sided transaction", () => {
    expect(() =>
      assertBalancedEntries([
        { accountType: "member_available", accountId: "user-1", plateDelta: -3 },
        { accountType: "member_available", accountId: "user-2", plateDelta: -2 },
        { accountType: "wager_escrow", accountId: "wager-1", plateDelta: 5 },
      ]),
    ).not.toThrow();
  });

  it("throws when the transaction is unbalanced", () => {
    expect(() =>
      assertBalancedEntries([
        { accountType: "member_available", accountId: "user-1", plateDelta: -5 },
        { accountType: "wager_escrow", accountId: "wager-1", plateDelta: 4 },
      ]),
    ).toThrow(LedgerError);
  });

  it("throws when there are fewer than two entries", () => {
    expect(() =>
      assertBalancedEntries([
        { accountType: "member_available", accountId: "user-1", plateDelta: -5 },
      ]),
    ).toThrow(LedgerError);
  });

  it("throws when an entry has a zero delta", () => {
    expect(() =>
      assertBalancedEntries([
        { accountType: "member_available", accountId: "user-1", plateDelta: -5 },
        { accountType: "wager_escrow", accountId: "wager-1", plateDelta: 0 },
      ]),
    ).toThrow(LedgerError);
  });
});

describe("getLedgerBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the balance for an account", async () => {
    mockGetFirstAsync.mockResolvedValue({ balance: 42 });
    const balance = await getLedgerBalance("member_available", "user-1", "party-1");
    expect(balance).toBe(42);
  });

  it("returns zero when no rows match", async () => {
    mockGetFirstAsync.mockResolvedValue(null);
    const balance = await getLedgerBalance("charity_pool", "party-1");
    expect(balance).toBe(0);
  });
});

describe("postLedgerTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when the transaction is unbalanced", async () => {
    mockWithExclusiveTransactionAsync.mockImplementation(async (callback) => {
      await callback({
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: jest.fn(),
      });
    });

    await expect(
      postLedgerTransaction({
        partyId: "party-1",
        sourceTable: "bets",
        sourceId: "bet-1",
        entries: [
          { accountType: "member_available", accountId: "user-1", plateDelta: -5 },
          { accountType: "wager_escrow", accountId: "wager-1", plateDelta: 3 },
        ],
      }),
    ).rejects.toThrow(LedgerError);
  });
});

describe("seedMemberOpeningBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when the amount is not positive", async () => {
    mockWithExclusiveTransactionAsync.mockImplementation(async (callback) => {
      await callback({
        runAsync: mockRunAsync,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: jest.fn(),
      });
    });

    await expect(seedMemberOpeningBalance("party-1", "user-1", 0)).rejects.toThrow(LedgerError);
  });
});
