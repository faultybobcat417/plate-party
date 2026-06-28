import * as Crypto from "expo-crypto";

export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("randomInt requires a positive integer bound.");
  }

  const bytes = Crypto.getRandomBytes(4);
  const value =
    ((bytes[0] ?? 0) << 24) |
    ((bytes[1] ?? 0) << 16) |
    ((bytes[2] ?? 0) << 8) |
    (bytes[3] ?? 0);

  return (value >>> 0) % maxExclusive;
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick a random item from an empty list.");
  }

  return items[randomInt(items.length)] as T;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex] as T, result[index] as T];
  }
  return result;
}
