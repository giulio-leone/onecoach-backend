/**
 * Global Dialog Utilities - Cross-platform (Native)
 *
 * Provides global functions to replace window.alert, window.confirm, window.prompt
 * Uses React Native Alert API for mobile
 *
 * Usage:
 *   import { dialog } from '@giulio-leone/lib-stores/utils/dialog-global';
 *   await dialog.alert('Message');
 *   const confirmed = await dialog.confirm('Are you sure?');
 *   const value = await dialog.prompt('Enter value:');
 */

import { Alert } from 'react-native';
import { useDialogStore } from '../dialog.store';

// Get dialog functions from store (can be called outside React components)
const getDialogStore = () => useDialogStore.getState();

export const dialog = {
  alert: async (message: string, title?: string): Promise<void> => {
    try {
      const store = getDialogStore();
      return store.alert(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      // Fallback to React Native Alert if store not initialized
      return new Promise<void>((resolve) => {
        Alert.alert(title || 'Avviso', message, [{ text: 'OK', onPress: () => resolve() }]);
      });
    }
  },

  confirm: async (message: string, title?: string): Promise<boolean> => {
    try {
      const store = getDialogStore();
      return store.confirm(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      // Fallback to React Native Alert confirm if store not initialized
      return new Promise<boolean>((resolve) => {
        Alert.alert(title || 'Conferma', message, [
          { text: 'Annulla', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Conferma', onPress: () => resolve(true) },
        ]);
      });
    }
  },

  prompt: async (
    message: string,
    defaultValue?: string,
    title?: string
  ): Promise<string | null> => {
    try {
      const store = getDialogStore();
      return store.prompt(message, { title, defaultValue });
    } catch (_error: unknown) {
      // Fallback to React Native Alert prompt if store not initialized
      return new Promise<string | null>((resolve) => {
        Alert.prompt(
          title || 'Input',
          message,
          [
            { text: 'Annulla', style: 'cancel', onPress: () => resolve(null) },
            { text: 'OK', onPress: (text?: string) => resolve(text || null) },
          ],
          'plain-text',
          defaultValue
        );
      });
    }
  },

  info: async (message: string, title?: string): Promise<void> => {
    try {
      const store = getDialogStore();
      return store.info(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      return new Promise<void>((resolve) => {
        Alert.alert(title || 'Info', message, [{ text: 'OK', onPress: () => resolve() }]);
      });
    }
  },

  success: async (message: string, title?: string): Promise<void> => {
    try {
      const store = getDialogStore();
      return store.success(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      return new Promise<void>((resolve) => {
        Alert.alert(title || 'Successo', message, [{ text: 'OK', onPress: () => resolve() }]);
      });
    }
  },

  warning: async (message: string, title?: string): Promise<void> => {
    try {
      const store = getDialogStore();
      return store.warning(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      return new Promise<void>((resolve) => {
        Alert.alert(title || 'Attenzione', message, [{ text: 'OK', onPress: () => resolve() }]);
      });
    }
  },

  error: async (message: string, title?: string): Promise<void> => {
    try {
      const store = getDialogStore();
      return store.error(message, title ? { title } : undefined);
    } catch (_error: unknown) {
      return new Promise<void>((resolve) => {
        Alert.alert(title || 'Errore', message, [{ text: 'OK', onPress: () => resolve() }]);
      });
    }
  },
};
