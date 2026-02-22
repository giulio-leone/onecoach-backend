/**
 * Auth Query Keys and Functions
 *
 * Standardized query keys and query functions for authentication
 */
import type { User } from '@giulio-leone/lib-stores/auth.store';
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
export declare const authKeys: {
    readonly all: readonly ["auth"];
    readonly me: () => readonly ["auth", "me"];
};
/**
 * Query functions for auth
 */
export declare const authQueries: {
    /**
     * Get current user
     */
    getMe: () => Promise<User>;
    /**
     * Login
     */
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    /**
     * Register
     */
    register: (data: RegisterData) => Promise<AuthResponse>;
    /**
     * Logout
     */
    logout: () => Promise<void>;
    /**
     * Refresh access token
     */
    refresh: (request: RefreshTokenRequest) => Promise<RefreshTokenResponse>;
};
//# sourceMappingURL=auth.queries.d.ts.map