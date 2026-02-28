declare module '@giulio-leone/constants' {
  export interface TokenLimits {
    DEFAULT_MAX_TOKENS: number;
    [key: string]: number;
  }

  export const TOKEN_LIMITS: TokenLimits;
  export const AI_REASONING_CONFIG: Record<string, unknown>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@giulio-leone/lib-vercel-admin' {
  export const createEnvVar: (...args: any[]) => Promise<any>;
  export const getEnvVarByKey: (...args: any[]) => Promise<any>;
  export const updateEnvVar: (...args: any[]) => Promise<any>;
  export const envVarExists: (...args: any[]) => Promise<boolean>;
}
