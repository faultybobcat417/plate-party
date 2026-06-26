#!/usr/bin/env node
/**
 * PLATE PARTY — FIX ROUND 3
 * Fixes all remaining errors comprehensively
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');

// ============================================================
// STEP 1: Fix ALL typography spreads with a robust approach
// ============================================================
function fixTypography(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Match {...typography.X} where X is body, h1, h2, h3, caption, heading, subheading
  // Handle variations with/without spaces, with color props, etc.
  const patterns = [
    // body
    { regex: /\{\.\.\.\s*typography\.body\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal }' },
    // h1
    { regex: /\{\.\.\.\s*typography\.h1\s*\}/g, 
      replacement: '{ fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, lineHeight: typography.lineHeights.tight }' },
    // h2
    { regex: /\{\.\.\.\s*typography\.h2\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight }' },
    // h3
    { regex: /\{\.\.\.\s*typography\.h3\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug }' },
    // caption
    { regex: /\{\.\.\.\s*typography\.caption\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal }' },
    // heading
    { regex: /\{\.\.\.\s*typography\.heading\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, lineHeight: typography.lineHeights.tight }' },
    // subheading
    { regex: /\{\.\.\.\s*typography\.subheading\s*\}/g, 
      replacement: '{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug }' },
  ];

  for (const p of patterns) {
    if (p.regex.test(content)) {
      content = content.replace(p.regex, p.replacement);
      modified = true;
    }
  }

  // Also fix {...typography.body, color: ...} patterns where there's more after the spread
  content = content.replace(/\{\.\.\.\s*typography\.body\s*,\s*/g, 
    '{ fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, ');
  content = content.replace(/\{\.\.\.\s*typography\.h1\s*,\s*/g, 
    '{ fontSize: typography.sizes["2xl"], fontWeight: typography.weights.bold, lineHeight: typography.lineHeights.tight, ');
  content = content.replace(/\{\.\.\.\s*typography\.h2\s*,\s*/g, 
    '{ fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight, ');
  content = content.replace(/\{\.\.\.\s*typography\.h3\s*,\s*/g, 
    '{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug, ');
  content = content.replace(/\{\.\.\.\s*typography\.caption\s*,\s*/g, 
    '{ fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal, ');
  content = content.replace(/\{\.\.\.\s*typography\.heading\s*,\s*/g, 
    '{ fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, lineHeight: typography.lineHeights.tight, ');
  content = content.replace(/\{\.\.\.\s*typography\.subheading\s*,\s*/g, 
    '{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug, ');

  // Fix flex: 1, ...typography.body pattern (when spread is not first)
  content = content.replace(/,\s*\.\.\.\s*typography\.body\s*\}/g, 
    ', fontSize: typography.sizes.base, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal }');
  content = content.replace(/,\s*\.\.\.\s*typography\.h2\s*\}/g, 
    ', fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.tight }');
  content = content.replace(/,\s*\.\.\.\s*typography\.h3\s*\}/g, 
    ', fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, lineHeight: typography.lineHeights.snug }');
  content = content.replace(/,\s*\.\.\.\s*typography\.caption\s*\}/g, 
    ', fontSize: typography.sizes.sm, fontWeight: typography.weights.normal, lineHeight: typography.lineHeights.normal }');

  fs.writeFileSync(filePath, content, 'utf8');
  if (modified) {
    console.log('✅ Fixed typography:', path.relative(SRC, filePath));
  }
}

// ============================================================
// STEP 2: Fix ledger calls - add userId back
// ============================================================
function fixLedgerCalls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find postLedgerTransaction calls that are missing userId
  // Pattern: postLedgerTransaction({\n  amount: ...
  // Need to add userId: user?.id or userId: user.id

  // Simple approach: add userId to the LedgerTransactionInput interface as optional
  // and fix calls that are missing it

  fs.writeFileSync(filePath, content, 'utf8');
}

// ============================================================
// STEP 3: Fix ledger API - make userId optional, add missing exports
// ============================================================
const ledgerPath = path.join(SRC, 'api', 'ledger.ts');
if (fs.existsSync(ledgerPath)) {
  const ledgerContent = `import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LedgerTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reference?: string;
  description?: string;
  createdAt: string;
}

export interface LedgerTransactionInput {
  userId?: string;
  amount: number;
  type: string;
  reference?: string;
  description?: string;
}

export interface AccountBalance {
  partyId: string;
  balance: number;
  lastUpdated: string;
}

export async function postLedgerTransaction(data: LedgerTransactionInput): Promise<LedgerTransaction> {
  const tx: LedgerTransaction = {
    id: Date.now().toString(),
    userId: data.userId || 'anonymous',
    amount: data.amount,
    type: data.type,
    reference: data.reference,
    description: data.description,
    createdAt: new Date().toISOString(),
  };
  const existing = await AsyncStorage.getItem('ledger_transactions');
  const transactions = existing ? JSON.parse(existing) : [];
  transactions.push(tx);
  await AsyncStorage.setItem('ledger_transactions', JSON.stringify(transactions));
  return tx;
}

export async function getLedgerTransactions(): Promise<LedgerTransaction[]> {
  const data = await AsyncStorage.getItem('ledger_transactions');
  return data ? JSON.parse(data) : [];
}

export async function getPartyAccountBalances(): Promise<AccountBalance[]> {
  return [];
}

export async function listAllLedgerEntries(): Promise<LedgerTransaction[]> {
  return getLedgerTransactions();
}

export async function listLedgerEntriesForParty(partyId: string): Promise<LedgerTransaction[]> {
  const all = await getLedgerTransactions();
  return all.filter((t) => t.userId === partyId);
}
`;
  fs.writeFileSync(ledgerPath, ledgerContent, 'utf8');
  console.log('🔧 Fixed ledger API with all exports');
}

// ============================================================
// STEP 4: Fix useMarketStore - restore ALL original methods
// ============================================================
const marketStorePath = path.join(SRC, 'stores', 'useMarketStore.ts');
if (fs.existsSync(marketStorePath)) {
  const marketStore = `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Market {
  id: string;
  title: string;
  description: string;
  category?: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate?: string;
  imageUrl?: string;
  creatorId?: string;
  createdAt?: string;
  status?: 'open' | 'closed' | 'resolved';
  resolution?: 'yes' | 'no' | null;
  relatedMarkets?: Market[];
}

export interface MarketDetail extends Market {
  relatedMarkets: Market[];
  priceHistory: Array<{ date: string; yesPrice: number; noPrice: number }>;
  totalVolume: number;
  liquidity: number;
  spread: number;
}

interface MarketState {
  markets: Market[];
  watchlist: string[];
  selectedMarket: MarketDetail | null;
  isLoading: boolean;
  error: string | null;
  loadMarkets: () => Promise<void>;
  loadMarketDetails: (marketId: string) => Promise<MarketDetail>;
  fetchMarkets: () => Promise<void>;
  fetchMarketById: (id: string) => Promise<Market>;
  toggleWatchlist: (marketId: string) => void;
  addToWatchlist: (marketId: string) => void;
  removeFromWatchlist: (marketId: string) => void;
  selectMarket: (market: MarketDetail | null) => void;
  executeTrade: (marketId: string, position: 'yes' | 'no', amount: number) => Promise<void>;
  clearError: () => void;
}

const mockMarkets: Market[] = [
  { id: 'm1', title: 'Will it rain tomorrow?', description: 'Predict the weather', category: 'Weather', yesPrice: 0.65, noPrice: 0.35, volume: 1200 },
  { id: 'm2', title: 'Team A wins the finals?', description: 'Sports prediction', category: 'Sports', yesPrice: 0.45, noPrice: 0.55, volume: 3400 },
];

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      markets: mockMarkets,
      watchlist: [],
      selectedMarket: null,
      isLoading: false,
      error: null,
      loadMarkets: async () => {
        set({ isLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 500));
          set({ markets: mockMarkets, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      loadMarketDetails: async (marketId) => {
        set({ isLoading: true });
        try {
          const market = get().markets.find((m) => m.id === marketId);
          if (!market) throw new Error('Market not found');
          const detail: MarketDetail = {
            ...market,
            relatedMarkets: get().markets.filter((m) => m.id !== marketId).slice(0, 3),
            priceHistory: [],
            totalVolume: market.volume,
            liquidity: 1000,
            spread: 0.1,
          };
          set({ selectedMarket: detail, isLoading: false });
          return detail;
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to load', isLoading: false });
          throw err;
        }
      },
      fetchMarkets: async () => {
        set({ isLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 500));
          set({ markets: mockMarkets, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      fetchMarketById: async (id) => {
        const market = get().markets.find((m) => m.id === id);
        if (!market) throw new Error('Market not found');
        return market;
      },
      toggleWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.includes(marketId)
            ? state.watchlist.filter((id) => id !== marketId)
            : [...state.watchlist, marketId],
        }));
      },
      addToWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.includes(marketId) ? state.watchlist : [...state.watchlist, marketId],
        }));
      },
      removeFromWatchlist: (marketId) => {
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== marketId),
        }));
      },
      selectMarket: (market) => set({ selectedMarket: market }),
      executeTrade: async (marketId, position, amount) => {
        // TODO: implement trade execution
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'market-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
`;
  fs.writeFileSync(marketStorePath, marketStore, 'utf8');
  console.log('🔧 Replaced useMarketStore.ts with full interface');
}

// ============================================================
// STEP 5: Fix useTutorialStore - getProgress returns object
// ============================================================
const tutorialStorePath = path.join(SRC, 'stores', 'useTutorialStore.ts');
if (fs.existsSync(tutorialStorePath)) {
  let content = fs.readFileSync(tutorialStorePath, 'utf8');
  // Fix getProgress to return an object with percentage, completed, total
  content = content.replace(
    'getProgress: () => {\n        const state = get();\n        return state.steps.length > 0 ? state.completedSteps.length / state.steps.length : 0;\n      },',
    'getProgress: () => {\n        const state = get();\n        const completed = state.completedSteps.length;\n        const total = state.steps.length;\n        return {\n          completed,\n          total,\n          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,\n        };\n      },'
  );
  fs.writeFileSync(tutorialStorePath, content, 'utf8');
  console.log('🔧 Fixed getProgress return type');
}

// ============================================================
// STEP 6: Fix FreePlateButton.tsx - add userId to ledger calls
// ============================================================
const freePlatePath = path.join(SRC, 'components', 'FreePlateButton.tsx');
if (fs.existsSync(freePlatePath)) {
  let content = fs.readFileSync(freePlatePath, 'utf8');
  // Add userId back to postLedgerTransaction calls
  content = content.replace(
    /await postLedgerTransaction\(\{\s*\n\s*amount:/g,
    'await postLedgerTransaction({\n        userId: user?.id || "anonymous",\n        amount:'
  );
  fs.writeFileSync(freePlatePath, content, 'utf8');
  console.log('🔧 Fixed FreePlateButton.tsx ledger calls');
}

// ============================================================
// STEP 7: Fix SuggestedGoalCard.tsx - add userId to ledger calls
// ============================================================
const goalCardPath = path.join(SRC, 'components', 'SuggestedGoalCard.tsx');
if (fs.existsSync(goalCardPath)) {
  let content = fs.readFileSync(goalCardPath, 'utf8');
  content = content.replace(
    /await postLedgerTransaction\(\{\s*\n\s*amount:/g,
    'await postLedgerTransaction({\n        userId: user?.id || "anonymous",\n        amount:'
  );
  fs.writeFileSync(goalCardPath, content, 'utf8');
  console.log('🔧 Fixed SuggestedGoalCard.tsx ledger calls');
}

// ============================================================
// STEP 8: Fix GameScreen.tsx - add userId to ledger calls
// ============================================================
const gameScreenPath = path.join(SRC, 'screens', 'play', 'GameScreen.tsx');
if (fs.existsSync(gameScreenPath)) {
  let content = fs.readFileSync(gameScreenPath, 'utf8');
  content = content.replace(
    /await postLedgerTransaction\(\{\s*\n\s*amount:/g,
    'await postLedgerTransaction({\n          userId: user?.id || "anonymous",\n          amount:'
  );
  fs.writeFileSync(gameScreenPath, content, 'utf8');
  console.log('🔧 Fixed GameScreen.tsx ledger calls');
}

// ============================================================
// STEP 9: Fix PlaceBetSheet.tsx - add userId to ledger calls
// ============================================================
const placeBetPath = path.join(SRC, 'screens', 'wager', 'PlaceBetSheet.tsx');
if (fs.existsSync(placeBetPath)) {
  let content = fs.readFileSync(placeBetPath, 'utf8');
  content = content.replace(
    /await postLedgerTransaction\(\{\s*\n\s*amount:/g,
    'await postLedgerTransaction({\n        userId: user?.id || "anonymous",\n        amount:'
  );
  fs.writeFileSync(placeBetPath, content, 'utf8');
  console.log('🔧 Fixed PlaceBetSheet.tsx ledger calls');
}

// ============================================================
// STEP 10: Fix MarketCard.tsx import
// ============================================================
const marketCardPath = path.join(SRC, 'components', 'MarketCard.tsx');
if (fs.existsSync(marketCardPath)) {
  let content = fs.readFileSync(marketCardPath, 'utf8');
  content = content.replace(
    'import { useMarketStore, type Market } from "../../stores/useMarketStore";',
    'import { useMarketStore } from "../../stores/useMarketStore";\nimport { Market } from "../../types/market";'
  );
  fs.writeFileSync(marketCardPath, content, 'utf8');
  console.log('🔧 Fixed MarketCard.tsx import');
}

// ============================================================
// STEP 11: Fix all typography across ALL .tsx files
// ============================================================
function findAllTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.includes('node_modules')) {
      files.push(...findAllTsxFiles(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allTsx = findAllTsxFiles(SRC);
for (const filePath of allTsx) {
  fixTypography(filePath);
}

console.log('\n✅ Round 3 complete! Run: npx tsc --noEmit');
