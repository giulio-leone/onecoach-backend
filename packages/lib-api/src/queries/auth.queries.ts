/**
 * Auth Query Keys and Functions
 *
 * Standardized query keys and query functions for authentication
 */

import type { User } from '@giulio-leone/lib-stores';
/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'ATHLETE' | 'COACH';
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Query keys for auth queries
 */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
} as const;

/**
 * Query functions for auth
 */
export const authQueries = {
  /**
   * Get current user
   */
  getMe: async (): Promise<User> => {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHENTICATED');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data.user;
  },

  /**
   * Login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    if (!data.user || !data.accessToken) {
      throw new Error('Invalid response from server');
    }

    return data;
  },

  /**
   * Register
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();

    if (!result.user || !result.accessToken) {
      throw new Error('Invalid response from server');
    }

    return result;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error: unknown) {
      // Ignore errors, we'll clear local session anyway
      console.warn('Logout API call failed:', { error });
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (request: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    if (!data.accessToken) {
      throw new Error('Invalid refresh response');
    }

    return data;
  },
};
