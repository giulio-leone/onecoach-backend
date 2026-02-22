/**
 * Coach Clients API
 * GET /api/coach/clients - Get coach's clients (users who purchased plans)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, roleSatisfies } from '@giulio-leone/lib-core/auth';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

export interface CoachClient {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  programsPurchased: number;
  lastActive: Date | null;
  totalSpent: number;
  purchases: Array<{
    id: string;
    planTitle: string;
    planType: string;
    purchasedAt: Date;
    price: number;
  }>;
}

/**
 * GET /api/coach/clients
 * Get coach's clients (users who purchased plans from this coach)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a coach
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !roleSatisfies('COACH', user.role)) {
      return NextResponse.json({ error: 'Coach role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastActive';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get all completed purchases for this coach's plans
    const purchases = await prisma.plan_purchases.findMany({
      where: {
        marketplace_plan: {
          coachId: session.user.id,
        },
        status: 'COMPLETED',
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            updatedAt: true,
          },
        },
        marketplace_plan: {
          select: {
            id: true,
            title: true,
            planType: true,
          },
        },
      },
      orderBy: {
        purchasedAt: 'desc',
      },
    });

    // Group purchases by user
    const clientsMap = new Map<string, CoachClient>();

    for (const purchase of purchases) {
      if (!purchase.users) continue;

      const userId = purchase.users.id;
      const existingClient = clientsMap.get(userId);

      if (existingClient) {
        existingClient.programsPurchased += 1;
        existingClient.totalSpent += Number(purchase.price);
        existingClient.purchases.push({
          id: purchase.id,
          planTitle: purchase.marketplace_plan.title,
          planType: purchase.marketplace_plan.planType,
          purchasedAt: purchase.purchasedAt,
          price: Number(purchase.price),
        });
        // Update last active if this purchase is more recent
        if (
          purchase.purchasedAt > (existingClient.lastActive || new Date(0)) ||
          (purchase.users.updatedAt &&
            purchase.users.updatedAt > (existingClient.lastActive || new Date(0)))
        ) {
          existingClient.lastActive =
            purchase.purchasedAt > (purchase.users.updatedAt || new Date(0))
              ? purchase.purchasedAt
              : purchase.users.updatedAt;
        }
      } else {
        clientsMap.set(userId, {
          id: userId,
          name: purchase.users.name,
          email: purchase.users.email,
          image: purchase.users.image,
          programsPurchased: 1,
          lastActive:
            purchase.purchasedAt > (purchase.users.updatedAt || new Date(0))
              ? purchase.purchasedAt
              : purchase.users.updatedAt,
          totalSpent: Number(purchase.price),
          purchases: [
            {
              id: purchase.id,
              planTitle: purchase.marketplace_plan.title,
              planType: purchase.marketplace_plan.planType,
              purchasedAt: purchase.purchasedAt,
              price: Number(purchase.price),
            },
          ],
        });
      }
    }

    // Convert map to array and filter by search query
    let clients = Array.from(clientsMap.values());

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      clients = clients.filter(
        (client: any) =>
          client.name?.toLowerCase().includes(query) || client.email.toLowerCase().includes(query)
      );
    }

    // Sort clients
    clients.sort((a, b) => {
      let aValue: string | number | Date | null;
      let bValue: string | number | Date | null;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'programsPurchased':
          aValue = a.programsPurchased;
          bValue = b.programsPurchased;
          break;
        case 'lastActive':
        default:
          aValue = a.lastActive || new Date(0);
          bValue = b.lastActive || new Date(0);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return NextResponse.json({
      clients,
      total: clients.length,
    });
  } catch (error: unknown) {
    logError('Internal server error', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
