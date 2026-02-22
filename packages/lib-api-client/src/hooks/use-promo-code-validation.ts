/**
 * Promo Code Validation Hook
 *
 * Custom hook for validating promotion codes with debounce
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PromotionValidationResult } from '@giulio-leone/lib-marketplace';

interface UsePromoCodeValidationOptions {
  code: string;
  userId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onValidationChange?: (valid: boolean, promotion?: PromotionValidationResult['promotion']) => void;
}

export function usePromoCodeValidation({
  code,
  userId,
  enabled = true,
  debounceMs = 500,
  onValidationChange,
}: UsePromoCodeValidationOptions) {
  const [debouncedCode, setDebouncedCode] = useState(code);

  // Debounce code
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(code);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [code, debounceMs]);

  const shouldValidate = enabled && debouncedCode.trim().length > 0;

  const { data, isLoading, error } = useQuery<PromotionValidationResult>({
    queryKey: ['promo-code-validation', debouncedCode.trim().toUpperCase(), userId],
    queryFn: async () => {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: debouncedCode.trim().toUpperCase(),
          userId,
        }),
      });

      const data = await response.json();

      if (data.valid && data.promotion) {
        return {
          valid: true,
          promotion: data.promotion,
        };
      }

      return {
        valid: false,
        error: data.error || 'Codice non valido',
      };
    },
    enabled: shouldValidate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Notify parent of validation changes
  useEffect(() => {
    if (data) {
      onValidationChange?.(data.valid, data.promotion);
    } else if (!shouldValidate) {
      onValidationChange?.(false);
    }
  }, [data, shouldValidate, onValidationChange]);

  return {
    validationResult: shouldValidate ? data : null,
    isValidating: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Errore nella validazione') : null,
  };
}
