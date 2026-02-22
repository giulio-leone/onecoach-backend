/**
 * Config Environment Variables - Re-export from lib-config
 *
 * Re-exporta le funzioni di configurazione da @giulio-leone/lib-config
 * per mantenere la compatibilità con i package che importano da @onecoach/lib-core/config/env
 */

export {
  getAIProviderKey,
  getOpenRouterConfig,
  getAllAIProviderKeys,
  hasAnyAIProviderKey,
} from '@giulio-leone/lib-config/env';
