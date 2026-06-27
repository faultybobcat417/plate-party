import { db } from "../db/client";
import { users, ledgerEntries } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function deductPlates(
  userId: string,
  amount: number,
  type: string,
  referenceId?: string,
  referenceType?: string,
  metadata?: Record<string, any>
) {
  return await db.transaction(async (tx) => {
    const result = await tx
      .update(users)
      .set({
        plates: sql`${users.plates} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.plates} >= ${amount}`,
          sql`${users.deletedAt} IS NULL`
        )
      )
      .returning({ plates: users.plates });

    if (result.length === 0) {
      return { success: false, error: "Insufficient plates or user not found" };
    }

    const newBalance = result[0].plates;

    await tx.insert(ledgerEntries).values({
      userId,
      amount: -amount,
      balanceAfter: newBalance,
      type,
      referenceId,
      referenceType,
      metadata: metadata || {},
    });

    return { success: true, newBalance };
  });
}

export async function addPlates(
  userId: string,
  amount: number,
  type: string,
  referenceId?: string,
  referenceType?: string,
  metadata?: Record<string, any>
) {
  return await db.transaction(async (tx) => {
    const result = await tx
      .update(users)
      .set({
        plates: sql`${users.plates} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), sql`${users.deletedAt} IS NULL`))
      .returning({ plates: users.plates });

    const newBalance = result[0]?.plates ?? 0;

    await tx.insert(ledgerEntries).values({
      userId,
      amount: amount,
      balanceAfter: newBalance,
      type,
      referenceId,
      referenceType,
      metadata: metadata || {},
    });

    return { success: true, newBalance };
  });
}

export async function getPlateBalance(userId: string) {
  const result = await db
    .select({ plates: users.plates })
    .from(users)
    .where(and(eq(users.id, userId), sql`${users.deletedAt} IS NULL`))
    .limit(1);

  return result[0]?.plates ?? 0;
}

export async function getLedgerHistory(userId: string, limit: number = 50) {
  return await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .orderBy(sql`${ledgerEntries.createdAt} DESC`)
    .limit(limit);
}
