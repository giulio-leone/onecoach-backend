/**
 * AI SDK Compatibility Layer Type Declarations
 *
 * Provides TypeScript types for the ai-sdk-compat.js module.
 */

import type { ModelMessage, UIMessage } from 'ai';

/**
 * CoreMessage is an alias for ModelMessage in AI SDK v6
 */
export type CoreMessage = ModelMessage;

/**
 * Convert UI messages to core/model messages
 */
export declare function convertToCoreMessages(messages: UIMessage[]): CoreMessage[];

/**
 * Convert UI messages to model messages
 */
export declare function convertToModelMessages(messages: UIMessage[]): ModelMessage[];
