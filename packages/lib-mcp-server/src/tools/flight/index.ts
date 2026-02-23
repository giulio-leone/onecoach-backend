import { z } from 'zod';
import type { McpTool } from '../../types';
import { KiwiMcpClient } from '../../clients/kiwi-client';

/**
 * Schema per la ricerca voli Kiwi
 */
const flightSearchSchema = z.object({
  flyFrom: z.string().min(1).describe('Città o codice aeroporto di partenza (es. Roma, PAR, CDG)'),
  flyTo: z.string().describe('Città o codice aeroporto di destinazione (es. Barcellona, LON, LHR)'),
  departureDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .describe('Data di partenza nel formato gg/mm/aaaa (es. 15/01/2025)'),
  departureDateFlexRange: z
    .number()
    .int()
    .min(0)
    .max(3)
    .optional()
    .default(0)
    .describe('Flessibilità data partenza in giorni (0-3 prima/dopo)'),
  returnDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/)
    .optional()
    .describe('Data di ritorno nel formato gg/mm/aaaa (es. 22/01/2025)'),
  returnDateFlexRange: z
    .number()
    .int()
    .min(0)
    .max(3)
    .optional()
    .default(0)
    .describe('Flessibilità data ritorno in giorni (0-3 prima/dopo)'),
  passengers: z
    .object({
      adults: z
        .number()
        .int()
        .min(0)
        .max(9)
        .optional()
        .default(1)
        .describe('Numero adulti (>12 anni)'),
      children: z
        .number()
        .int()
        .min(0)
        .max(8)
        .optional()
        .default(0)
        .describe('Numero bambini (3-11 anni)'),
      infants: z
        .number()
        .int()
        .min(0)
        .max(4)
        .optional()
        .default(0)
        .describe('Numero neonati (<2 anni)'),
    })
    .optional()
    .default({ adults: 1, children: 0, infants: 0 }),
  cabinClass: z
    .enum(['M', 'W', 'C', 'F'])
    .optional()
    .describe('Classe: M (economy), W (premium economy), C (business), F (first class)'),
  sort: z
    .enum(['price', 'duration', 'quality', 'date'])
    .optional()
    .default('date')
    .describe('Ordinamento risultati'),
  curr: z.string().optional().default('EUR').describe('Valuta per i prezzi (es. EUR, USD)'),
  locale: z
    .string()
    .min(2)
    .max(5)
    .optional()
    .default('it')
    .describe('Lingua per i nomi delle città e link (es. it, en, fr)'),
});

/**
 * Tool OneFlight per la ricerca voli via Kiwi.com MCP
 */
export const kiwiSearchFlightTool: McpTool = {
  name: 'kiwi_search_flight',
  description:
    'Cerca voli usando il motore di ricerca Kiwi.com. Restituisce una lista di voli con prezzi, orari e link per la prenotazione.',
  parameters: flightSearchSchema,
  execute: async (args, _context) => {
    const client = KiwiMcpClient.getInstance();
    return await client.callTool('search-flight', args);
  },
};
