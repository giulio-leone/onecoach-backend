/**
 * Tax Info API Route
 *
 * Endpoint per gestire dati fiscali utente
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@giulio-leone/lib-core';
import { prisma } from '@giulio-leone/lib-core';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * GET: Recupera dati fiscali utente
 */
export async function GET(): Promise<Response> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const userData = await prisma.user_payout_profiles.findUnique({
      where: { userId: user.id },
      select: {
        taxCode: true,
        beneficiaryName: true,
        addressLine1: true,
        iban: true,
      },
    });

    return NextResponse.json({
      taxInfo: userData || {
        taxCode: null,
        beneficiaryName: null,
        addressLine1: null,
        iban: null,
      },
    });
  } catch (error: unknown) {
    logError('Errore nel recupero dei dati fiscali', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * PUT: Aggiorna dati fiscali utente
 */
export async function PUT(_req: Request): Promise<Response> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await _req.json();
    const { taxId, businessName, address, iban } = body;

    // Validazioni opzionali
    if (iban && iban.length > 0) {
      const ibanRegex = /^IT[0-9]{2}[A-Z0-9]{23}$/;
      if (!ibanRegex.test(iban.replace(/\s/g, '').toUpperCase())) {
        return NextResponse.json({ error: 'IBAN non valido' }, { status: 400 });
      }
    }

    if (taxId && taxId.length > 0) {
      const cfRegex =
        /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$/i;
      if (!cfRegex.test(taxId)) {
        return NextResponse.json({ error: 'Codice Fiscale non valido' }, { status: 400 });
      }
    }

    // Check if profile exists
    const existingProfile = await prisma.user_payout_profiles.findUnique({
      where: { userId: user.id },
    });

    let updated;
    if (existingProfile) {
      // Update existing profile
      updated = await prisma.user_payout_profiles.update({
        where: { userId: user.id },
        data: {
          taxCode: taxId?.trim() || null,
          beneficiaryName: businessName?.trim() || null,
          addressLine1: address?.trim() || null,
          iban: iban?.replace(/\s/g, '').toUpperCase() || null,
        },
        select: {
          taxCode: true,
          beneficiaryName: true,
          addressLine1: true,
          iban: true,
        },
      });
    } else {
      // Create new profile
      updated = await prisma.user_payout_profiles.create({
        data: {
          userId: user.id,
          taxCode: taxId?.trim() || null,
          beneficiaryName: businessName?.trim() || '',
          addressLine1: address?.trim() || null,
          iban: iban?.replace(/\s/g, '').toUpperCase() || null,
        },
        select: {
          taxCode: true,
          beneficiaryName: true,
          addressLine1: true,
          iban: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      taxInfo: updated,
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento dei dati fiscali", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
