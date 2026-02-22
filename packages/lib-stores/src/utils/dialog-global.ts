/**
 * Global Dialog Utilities
 *
 * Provides global functions to replace window.alert, window.confirm, window.prompt
 * These functions use Zustand store directly (can be called outside React components)
 *
 * Usage:
 *   import { dialog } from '@giulio-leone/lib-stores/utils/dialog-global';
 *   await dialog.alert('Message');
 *   const confirmed = await dialog.confirm('Are you sure?');
 *   const value = await dialog.prompt('Enter value:');
 */

import { useDialogStore } from '../dialog.store';

// Get dialog functions from store (can be called outside React components)
const getDialogStore = () => useDialogStore.getState();

export const dialog = {
    alert: async (message: string, title?: string): Promise<void> => {
        if (typeof window === 'undefined') {
            // Server-side fallback
            return;
        }
        const store = getDialogStore();
        return store.alert(message, title ? { title } : undefined);
    },

    confirm: async (message: string, title?: string): Promise<boolean> => {
        if (typeof window === 'undefined') {
            // Server-side fallback
            return false;
        }
        const store = getDialogStore();
        return store.confirm(message, title ? { title } : undefined);
    },

    prompt: async (
        message: string,
        defaultValue?: string,
        title?: string
    ): Promise<string | null> => {
        if (typeof window === 'undefined') {
            // Server-side fallback
            return null;
        }
        const store = getDialogStore();
        return store.prompt(message, { defaultValue, title });
    },

    info: async (message: string, title?: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }
        const store = getDialogStore();
        return store.info(message, title ? { title } : undefined);
    },

    success: async (message: string, title?: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }
        const store = getDialogStore();
        return store.success(message, title ? { title } : undefined);
    },

    warning: async (message: string, title?: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }
        const store = getDialogStore();
        return store.warning(message, title ? { title } : undefined);
    },

    error: async (message: string, title?: string): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }
        const store = getDialogStore();
        return store.error(message, title ? { title } : undefined);
    },
};
