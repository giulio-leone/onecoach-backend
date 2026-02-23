/**
 * AI SDK Compatibility Layer
 *
 * Re-exports types and functions from 'ai' module in a way
 * that is compatible with TypeScript's verbatimModuleSyntax.
 */

// @ts-nocheck
export { CoreMessage, convertToCoreMessages, convertToModelMessages } from 'ai';
