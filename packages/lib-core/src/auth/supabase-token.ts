import jwt from 'jsonwebtoken';

export function signSupabaseToken(userId: string): string {
  const secret = process.env.ONECOAH_DB_SUPABASE_JWT_SECRET;
  if (!secret) {
    // In production this should probably throw, but for dev/build robustness we might warn
    // However, without this secret, Realtime won't work secured.
    throw new Error('ONECOAH_DB_SUPABASE_JWT_SECRET is not defined');
  }

  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: userId,
    // Optional: Add custom claims if needed for RLS
    // app_metadata: { provider: 'next_auth' },
  };

  // Sign the token with the secret
  // Supabase JWTs usually need to match the JWT secret in the Supabase project settings
  return jwt.sign(payload, secret, { expiresIn: '1h' }); // Short-lived, client should refresh if needed
}
