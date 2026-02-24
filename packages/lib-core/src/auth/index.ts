/**
 * Auth Module Exports
 *
 * Centralized exports for authentication utilities
 */

export * from './session';
export * from './guards';
// export * from './guards-client'; // Moved to lib-api-client
export * from './config';
export * from './admin-seed';
export * from './admin-utils';
export * from './roles';
export * from './access-control';
// NativeSession is only imported directly in React Native (Expo) context
// Do not re-export here — it pulls in expo-secure-store / async-storage
export * from './supabase-token';
