/**
 * Admin Edge Config API Route
 *
 * GET: Ottiene tutti i valori o un valore specifico (?key=KEY) - solo admin
 * POST/PATCH: Aggiorna valori in Edge Config - solo admin
 * DELETE: Elimina un valore (?key=KEY) - solo admin
 *
 * NOTA: Per aggiornare valori, è necessario configurare su Vercel:
 * - EDGE_CONFIG: connection string del Edge Config (aggiunta automaticamente)
 * - EDGE_CONFIG_AUTH_TOKEN: token di scrittura per Edge Config (richiesto per operazioni di scrittura)
 *
 * NOTA IMPORTANTE: EDGE_CONFIG_AUTH_TOKEN ≠ VERCEL_API_TOKEN
 * - EDGE_CONFIG_AUTH_TOKEN: Token specifico per Edge Config (usato dal codice runtime)
 * - VERCEL_API_TOKEN: Token API Vercel generale (usato solo dagli script di setup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@giulio-leone/lib-core';
import {
  getEdgeConfigValue,
  getAllEdgeConfigValues,
  setEdgeConfigValue,
  setEdgeConfigValues,
  deleteEdgeConfigValue,
} from '@giulio-leone/lib-core/edge-config.service';
import { logError } from '@giulio-leone/lib-shared';

export const dynamic = 'force-dynamic';

/**
 * Valida la chiave Edge Config
 */
function validateKey(key: unknown): string {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new Error('La chiave deve essere una stringa non vuota');
  }
  if (key.length > 256) {
    throw new Error('La chiave non può superare 256 caratteri');
  }
  // Valida formato chiave (solo caratteri alfanumerici, underscore, trattino)
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    throw new Error('La chiave può contenere solo lettere, numeri, underscore e trattini');
  }
  return key.trim();
}

/**
 * Valida il valore Edge Config
 */
function validateValue(value: unknown): unknown {
  // Edge Config supporta: string, number, boolean, null, object, array
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    // Valida dimensione massima (circa 64KB quando serializzato)
    const serialized = JSON.stringify(value);
    if (serialized.length > 65536) {
      throw new Error('Il valore serializzato non può superare 64KB');
    }
    return value;
  }
  throw new Error(
    'Tipo di valore non supportato. Supportati: string, number, boolean, null, object, array'
  );
}

/**
 * Logga operazione per audit
 */
async function logOperation(
  _operation: 'read' | 'update' | 'delete',
  _key: string,
  _userId: string,
  _success: boolean,
  _error?: string
) {
  try {
    // Log strutturato per audit trail (rimosso per ridurre debug ingombrante)
  } catch (_error: unknown) {
    // Ignora errori di logging per non bloccare l'operazione principale
  }
}

/**
 * GET: Ottiene tutti i valori da Edge Config o un valore specifico se ?key=KEY
 */
export async function GET(request: NextRequest) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  const user = userOrError;
  let key: string | null = null;

  try {
    const searchParams = request.nextUrl.searchParams;
    key = searchParams.get('key');

    if (key) {
      // Valida chiave
      const validatedKey = validateKey(key);
      const value = await getEdgeConfigValue(validatedKey);
      await logOperation('read', validatedKey, user.id, true);
      return NextResponse.json({
        success: true,
        key: validatedKey,
        value,
      });
    }

    // Leggi tutti i valori
    const values = await getAllEdgeConfigValues();
    await logOperation('read', '*', user.id, true);
    return NextResponse.json({
      success: true,
      values,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logError('Errore nel recupero dei valori da Edge Config', error);
    await logOperation('read', key || '*', user.id, false, errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: error instanceof Error && error.message.includes('chiave') ? 400 : 500 }
    );
  }
}

/**
 * POST/PATCH: Aggiorna valori in Edge Config
 *
 * Body:
 * - key: string (chiave da aggiornare)
 * - value: unknown (nuovo valore)
 * OPPURE
 * - updates: Record<string, unknown> (multiple chiavi da aggiornare)
 */
async function handleUpdate(req: Request, user: { id: string }) {
  try {
    const body = await req.json();
    const { key, value, updates } = body;

    // Supporta sia aggiornamento singolo che multiplo
    if (updates && typeof updates === 'object') {
      // Aggiornamento multiplo
      const itemsArray = Object.entries(updates).map(([k, v]) => ({
        key: validateKey(k),
        value: validateValue(v),
      }));

      const result = await setEdgeConfigValues(itemsArray);

      if (!result.success) {
        await logOperation('update', '*', user.id, false, result.error);
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Errore nell'aggiornamento dei valori",
          },
          { status: 500 }
        );
      }

      await logOperation('update', '*', user.id, true);
      return NextResponse.json({
        success: true,
        message: 'Valori aggiornati con successo',
      });
    } else if (key && value !== undefined) {
      // Aggiornamento singolo
      const validatedKey = validateKey(key);
      const validatedValue = validateValue(value);

      const result = await setEdgeConfigValue(validatedKey, validatedValue);

      if (!result.success) {
        await logOperation('update', validatedKey, user.id, false, result.error);
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Errore nell'aggiornamento del valore",
          },
          { status: 500 }
        );
      }

      await logOperation('update', validatedKey, user.id, true);
      return NextResponse.json({
        success: true,
        message: `Chiave "${validatedKey}" aggiornata con successo`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Body non valido. Fornisci { key, value } per aggiornamento singolo o { updates: {...} } per aggiornamento multiplo.',
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logError("Errore nell'aggiornamento di Edge Config", error);
    await logOperation('update', 'unknown', user.id, false, errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: error instanceof Error && error.message.includes('chiave') ? 400 : 500 }
    );
  }
}

export async function POST(req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  return handleUpdate(req, userOrError);
}

export async function PATCH(req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  return handleUpdate(req, userOrError);
}

/**
 * DELETE: Elimina un valore da Edge Config
 */
export async function DELETE(request: NextRequest) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  const user = userOrError;
  let key: string | null = null;

  try {
    const searchParams = request.nextUrl.searchParams;
    key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Il parametro key è richiesto',
        },
        { status: 400 }
      );
    }

    const validatedKey = validateKey(key);
    const result = await deleteEdgeConfigValue(validatedKey);

    if (!result.success) {
      await logOperation('delete', validatedKey, user.id, false, result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Errore nell'eliminazione del valore",
        },
        { status: 500 }
      );
    }

    await logOperation('delete', validatedKey, user.id, true);
    return NextResponse.json({
      success: true,
      message: `Chiave "${validatedKey}" eliminata con successo`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logError("Errore nell'eliminazione di Edge Config", error);
    await logOperation('delete', key || 'unknown', user.id, false, errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: error instanceof Error && error.message.includes('chiave') ? 400 : 500 }
    );
  }
}
