import { NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import { PayoutProfileService } from '@giulio-leone/lib-marketplace';

export const dynamic = 'force-dynamic';

type Params = Promise<{ userId: string }>;

export async function GET(_: Request, ctx: { params: Params }) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) return userOrError;
  const { userId } = await ctx.params;
  const profile = await PayoutProfileService.getProfile(userId);
  return NextResponse.json({ profile });
}

export async function PUT(_req: Request, ctx: { params: Params }) {
  const userOrError = await requireAdmin();
  if (userOrError instanceof NextResponse) return userOrError;
  const { userId } = await ctx.params;
  const body = await _req.json();
  const profile = await PayoutProfileService.upsertProfile(userId, body);
  return NextResponse.json({ profile });
}
