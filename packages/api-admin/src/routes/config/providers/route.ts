/**
 * Admin Provider Config API Route
 *
 * GET: Restituisce lo stato delle chiavi API per i provider AI
 * PUT: Aggiorna/crea chiave API per un provider (solo admin) - sincronizza con Vercel
 * DELETE: Elimina API key da Vercel per un provider (solo admin)
 */

import { NextResponse } from 'next/server';
import { AIProviderConfigService, PROVIDER_MAP } from '@giulio-leone/lib-ai';
import type { ProviderName } from '@giulio-leone/lib-ai';
import { deleteEnvVar, getEnvVarByKey } from '@giulio-leone/lib-vercel-admin';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';
import { requireAdmin } from '@giulio-leone/lib-core/auth/guards';

export const dynamic = 'force-dynamic';

const ALLOWED_PROVIDERS: ProviderName[] = ['google', 'anthropic', 'openai', 'xai', 'openrouter'];

export async function GET() {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const configs = await AIProviderConfigService.listConfigs();
    const providerMeta = AIProviderConfigService.listProviderMeta();
    const providers = providerMeta.map((meta) => {
      const match = configs.find((config) => config.provider === meta.provider);
      return {
        ...meta,
        defaultModel: match?.defaultModel ?? meta.defaultModel ?? null,
      };
    });

    return NextResponse.json({
      configs,
      providers,
    });
  } catch (error: unknown) {
    logError('Errore nel recupero delle configurazioni provider', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(_req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const body = await _req.json();
    const { provider, apiKey, isEnabled, changeReason, defaultModel, defaultProvider } = body as {
      provider?: ProviderName;
      apiKey?: string;
      isEnabled?: boolean;
      changeReason?: string;
      defaultModel?: string | null;
      defaultProvider?: string | null;
    };

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'provider non valido' }, { status: 400 });
    }

    if (apiKey !== undefined && typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'apiKey deve essere una stringa' }, { status: 400 });
    }

    const updated = await AIProviderConfigService.upsertConfig({
      provider,
      apiKey: apiKey?.trim() ? apiKey.trim() : undefined,
      isEnabled,
      defaultModel,
      defaultProvider,
      updatedBy: userOrError.id,
      changeReason,
    });

    // Verifica stato sincronizzazione Vercel
    // Se apiKey è stata fornita, verifica che sia stata sincronizzata correttamente
    const mapping = PROVIDER_MAP[provider];
    let vercelSynced = false;
    let vercelError: string | undefined = undefined;

    // Verifica sempre lo stato Vercel per avere informazioni accurate
    const vercelStatus = await getEnvVarByKey(mapping.env);

    if (apiKey?.trim()) {
      // Se abbiamo provato a sincronizzare, verifica che la env var esista
      vercelSynced = vercelStatus.success && vercelStatus.data !== undefined;
      vercelError = vercelStatus.error;

      // Se la sincronizzazione è fallita, l'errore dovrebbe essere già nel vercelStatus
      if (!vercelSynced && !vercelError) {
        vercelError =
          'Impossibile verificare lo stato di sincronizzazione con Vercel. Verifica che VERCEL_API_TOKEN, VERCEL_PROJECT_ID e VERCEL_TEAM_ID siano configurati.';
      }
    } else {
      // Se non abbiamo sincronizzato, verifica solo se esiste già
      vercelSynced = vercelStatus.success && vercelStatus.data !== undefined;
      vercelError = vercelStatus.error;
    }

    return NextResponse.json({
      success: true,
      config: updated,
      vercel: {
        synced: vercelSynced,
        error: vercelError,
      },
    });
  } catch (error: unknown) {
    logError("Errore nell'aggiornamento della configurazione provider", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}

/**
 * DELETE: Elimina API key da Vercel per un provider
 */
export async function DELETE(req: Request) {
  const userOrError = await requireAdmin();

  if (userOrError instanceof NextResponse) {
    return userOrError;
  }

  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as ProviderName | null;

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'provider non valido o mancante' }, { status: 400 });
    }

    const mapping = PROVIDER_MAP[provider];
    const envKey = mapping.env;

    // Trova env var su Vercel
    const getResult = await getEnvVarByKey(envKey);

    if (!getResult.success || !getResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: `API key per ${provider} non trovata su Vercel`,
        },
        { status: 404 }
      );
    }

    // Elimina da Vercel
    const deleteResult = await deleteEnvVar(getResult.data.id);

    if (!deleteResult.success) {
      logError(`Errore eliminazione API key ${provider} da Vercel`, {
        error: deleteResult.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: deleteResult.error || "Errore nell'eliminazione da Vercel",
        },
        { status: 500 }
      );
    }

    // Aggiorna metadata nel DB (rimuovi vercelEnvVarId)
    const config = await AIProviderConfigService.getConfig(provider);
    if (config) {
      await AIProviderConfigService.upsertConfig({
        provider,
        isEnabled: config.isEnabled,
        defaultModel: config.defaultModel,
        updatedBy: userOrError.id,
        changeReason: 'API key eliminata da Vercel',
      });
    }

    return NextResponse.json({
      success: true,
      message: `API key per ${provider} eliminata con successo da Vercel`,
    });
  } catch (error: unknown) {
    logError("Errore nell'eliminazione della API key provider", error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
