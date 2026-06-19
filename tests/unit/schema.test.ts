import {
  createDefaultHlc,
  createUuid,
  INITIAL_MEMBER_PLATES,
  partyMemberRoles,
  wagerStatuses,
  oracleTypes,
  oracleStatuses,
  naPolicies,
  resolutionKinds,
  betStatuses,
  poolTransactionReasons,
  paymentProviders,
  ledgerAccountTypes,
  ledgerSourceTables,
  syncTableNames,
  syncOperations,
  syncOutboxStatuses,
  DEFAULT_WAGER_STAKE_PLATES,
} from "../../src/db/schema";

describe("schema constants", () => {
  it("has initial member plates", () => {
    expect(INITIAL_MEMBER_PLATES).toBe(10);
  });

  it("has default wager stake plates", () => {
    expect(DEFAULT_WAGER_STAKE_PLATES).toBe(1);
  });

  it("defines party member roles", () => {
    expect(partyMemberRoles).toEqual(["host", "member"]);
  });

  it("defines wager statuses", () => {
    expect(wagerStatuses).toEqual(["open", "locked", "resolved", "void"]);
  });

  it("defines oracle types", () => {
    expect(oracleTypes).toEqual(["manual", "weather", "crypto"]);
  });

  it("defines oracle statuses", () => {
    expect(oracleStatuses).toEqual([
      "not_required",
      "pending",
      "validated",
      "failed",
    ]);
  });

  it("defines N/A policies", () => {
    expect(naPolicies).toEqual(["refund", "send_to_pool"]);
  });

  it("defines resolution kinds", () => {
    expect(resolutionKinds).toEqual(["manual", "oracle", "na"]);
  });

  it("defines bet statuses", () => {
    expect(betStatuses).toEqual(["pending", "locked", "won", "lost", "void"]);
  });

  it("defines pool transaction reasons", () => {
    expect(poolTransactionReasons).toEqual([
      "wager_loss",
      "na_penalty",
      "manual_adjustment",
    ]);
  });

  it("defines payment providers", () => {
    expect(paymentProviders).toEqual(["venmo", "cash_app", "paypal", "manual"]);
  });

  it("defines ledger account types", () => {
    expect(ledgerAccountTypes).toEqual([
      "member_available",
      "wager_escrow",
      "charity_pool",
    ]);
  });

  it("defines ledger source tables", () => {
    expect(ledgerSourceTables).toEqual([
      "bets",
      "pool_transactions",
      "ious",
      "manual_adjustments",
    ]);
  });

  it("defines sync table names", () => {
    expect(syncTableNames).toEqual([
      "users",
      "parties",
      "party_members",
      "wagers",
      "wager_options",
      "bets",
      "pool_transactions",
      "ious",
      "ledger_entries",
    ]);
  });

  it("defines sync operations", () => {
    expect(syncOperations).toEqual(["insert", "update", "delete", "upsert"]);
  });

  it("defines sync outbox statuses", () => {
    expect(syncOutboxStatuses).toEqual([
      "pending",
      "sending",
      "sent",
      "failed",
      "conflicted",
    ]);
  });
});

describe("createUuid", () => {
  it("returns a valid UUID v4 string", () => {
    const uuid = createUuid();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });

  it("returns unique UUIDs", () => {
    const uuids = new Set(Array.from({ length: 100 }, createUuid));
    expect(uuids.size).toBe(100);
  });
});

describe("createDefaultHlc", () => {
  it("returns a colon-delimited string", () => {
    const hlc = createDefaultHlc();
    expect(typeof hlc).toBe("string");
    expect(hlc.split(":")).toHaveLength(3);
  });

  it("includes a timestamp-like first segment", () => {
    const hlc = createDefaultHlc();
    const firstSegment = hlc.split(":")[0];
    expect(Number.isNaN(parseInt(firstSegment, 36))).toBe(false);
  });
});
