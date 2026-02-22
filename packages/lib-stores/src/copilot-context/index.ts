/**
 * Copilot Context Framework
 * 
 * Domain-agnostic framework for managing copilot context.
 * 
 * Key Features:
 * - Generic domain registry (no hardcoded domains)
 * - 7 actions instead of 30+
 * - ~150 LOC instead of 800+
 * - Type-safe with generics
 * 
 * @example
 * ```ts
 * // 1. Register domains at app startup
 * import { registerAllDomains } from '@giulio-leone/lib-stores/copilot-context';
 * registerAllDomains();
 * 
 * // 2. Use in components
 * import { useCopilotContext } from '@giulio-leone/lib-stores/copilot-context';
 * 
 * const { data, update, init } = useCopilotContext<WorkoutProgram>('workout');
 * 
 * // Initialize with resource
 * init(programId, program);
 * 
 * // Update data
 * update(newProgram);
 * ```
 * 
 * @module lib-stores/copilot-context
 */

// Types
export type {
  DomainConfig,
  CopilotContextState,
  CopilotContextActions,
  CopilotContextStore,
  DomainRegistry,
  DomainRegistryEntry,
} from './copilot-context.types';

// Store
export {
  useCopilotContextStore,
  registerDomain,
  getDomainConfig,
  getRegisteredDomains,
  selectActiveDomain,
  selectContext,
  selectData,
  selectLastToolModification,
} from './copilot-context.store';

// Hooks
export {
  useCopilotContext,
  useCopilotToolNotification,
  useRegisteredDomains,
} from './copilot-context.hooks';

// Domains
export * from './domains';
