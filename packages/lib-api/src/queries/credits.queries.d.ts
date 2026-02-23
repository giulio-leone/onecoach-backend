/**
 * Credits Query Keys and Functions
 *
 * Standardized query keys and query functions for credits-related queries
 */
/**
 * Credit balance response
 */
export interface CreditBalanceResponse {
  balance: number;
  hasUnlimitedCredits: boolean;
  totalConsumed: number;
  totalAdded: number;
  lastTransaction?: {
    id: string;
    type: 'ADDED' | 'CONSUMED';
    amount: number;
    createdAt: string;
  } | null;
}
/**
 * Credit transaction
 */
export interface CreditTransaction {
  id: string;
  type: 'ADDED' | 'CONSUMED';
  amount: number;
  description: string;
  createdAt: string;
}
/**
 * Credit history response
 */
export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
}
/**
 * Query keys for credits queries
 */
export declare const creditsKeys: {
  readonly all: readonly ['credits'];
  readonly balance: () => readonly ['credits', 'balance'];
  readonly history: (limit?: number) => readonly ['credits', 'history', number | undefined];
};
/**
 * Query functions for credits
 */
export declare const creditsQueries: {
  /**
   * Get credit balance
   */
  getBalance: () => Promise<CreditBalanceResponse>;
  /**
   * Get credit history
   */
  getHistory: (limit?: number) => Promise<CreditHistoryResponse>;
};
//# sourceMappingURL=credits.queries.d.ts.map
