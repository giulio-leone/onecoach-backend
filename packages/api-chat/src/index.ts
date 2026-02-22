/**
 * @giulio-leone/api-chat
 *
 * API routes per chat e conversations
 * Esporta route handlers che possono essere usati in apps/next/app/api/*
 */

// Chat routes
export { POST as chatPOST, OPTIONS as chatOPTIONS } from './routes/chat/route';

// Conversations routes
export { GET as conversationsGET, POST as conversationsPOST } from './routes/conversations/route';
export {
  GET as conversationByIdGET,
  PATCH as conversationByIdPATCH,
  DELETE as conversationByIdDELETE,
} from './routes/conversations/[conversationId]/route';
