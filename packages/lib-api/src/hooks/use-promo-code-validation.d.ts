/**
 * Promo Code Validation Hook
 *
 * Custom hook for validating promotion codes with debounce
 */
type PromotionValidationResult = {
  valid: boolean;
  promotion?: {
    id?: string;
    code?: string;
    discountType?: string;
    discountValue?: number;
    expiresAt?: string | null;
    [key: string]: unknown;
  };
  error?: string;
};
interface UsePromoCodeValidationOptions {
  code: string;
  userId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onValidationChange?: (valid: boolean, promotion?: PromotionValidationResult['promotion']) => void;
}
export declare function usePromoCodeValidation({
  code,
  userId,
  enabled,
  debounceMs,
  onValidationChange,
}: UsePromoCodeValidationOptions): {
  validationResult: PromotionValidationResult | null | undefined;
  isValidating: boolean;
  error: string | null;
};
export {};
//# sourceMappingURL=use-promo-code-validation.d.ts.map
