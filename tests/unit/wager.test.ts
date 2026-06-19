import { validateWagerDraft, WagerApiError } from "../../src/api/wager";

jest.mock("../../src/db/connection", () => ({
  getDb: jest.fn(async () => {
    throw new Error("getDb not implemented in mock");
  }),
  openSQLiteDatabase: jest.fn(async () => ({
    getFirstAsync: jest.fn(async () => null),
    getAllAsync: jest.fn(async () => []),
    runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
    withExclusiveTransactionAsync: jest.fn(async (callback) => {
      await callback({
        getFirstAsync: jest.fn(),
        getAllAsync: jest.fn(),
        runAsync: jest.fn(),
      });
    }),
  })),
}));

const validInput = {
  partyId: "party-1",
  createdByUserId: "user-1",
  deviceId: "device-1",
  question: "Will it rain tomorrow?",
  options: [{ label: "Yes" }, { label: "No" }] as const,
  stakePlates: 2,
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
};

describe("WagerApiError", () => {
  it("preserves the cause", () => {
    const cause = new Error("original");
    const error = new WagerApiError("wrapped", cause);
    expect(error.message).toBe("wrapped");
    expect(error.cause).toBe(cause);
    expect(error.name).toBe("WagerApiError");
  });
});

describe("validateWagerDraft", () => {
  it("accepts a valid wager draft", () => {
    expect(() => validateWagerDraft(validInput)).not.toThrow();
  });

  it("throws when the question is too short", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        question: "Too?",
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when there are fewer than two options", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        options: [{ label: "Only" }],
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when there are more than six options", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        options: [
          { label: "A" },
          { label: "B" },
          { label: "C" },
          { label: "D" },
          { label: "E" },
          { label: "F" },
          { label: "G" },
        ],
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when option labels are empty", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        options: [{ label: "" }, { label: "No" }],
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when option labels are duplicated", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        options: [{ label: "Yes" }, { label: "yes" }],
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when stakePlates is not positive", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        stakePlates: 0,
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when the deadline is in the past", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        deadline: new Date(Date.now() - 1).toISOString(),
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when realMoneyAmountCents is negative", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        realMoneyAmountCents: -1,
      }),
    ).toThrow(WagerApiError);
  });

  it("throws when naPenaltyPlates is negative", () => {
    expect(() =>
      validateWagerDraft({
        ...validInput,
        naPenaltyPlates: -1,
      }),
    ).toThrow(WagerApiError);
  });
});
