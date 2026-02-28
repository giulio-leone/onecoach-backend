/**
 * MCP Memory Tools
 *
 * Tools for accessing and updating user memory for AI personalization.
 *
 * @module lib-mcp-server/tools/memory
 */

import { z } from 'zod';
import { type MemoryDomain, userMemoryService, timelineService } from '@giulio-leone/lib-core';
import type { McpTool, McpContext } from '../../types'; // Assuming types are here or widely available

// ============================================================================
// GET MEMORY TOOL
// ============================================================================

const memoryGetSchema = z.object({
  domain: z
    .enum(['workout', 'nutrition', 'oneagenda', 'projects', 'tasks', 'habits', 'general'])
    .optional()
    .describe('Domain to retrieve memory for. If not specified, returns all domains.'),
  includeHistory: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include history items in response'),
  includePatterns: z
    .boolean()
    .optional()
    .default(true)
    .describe('Include identified patterns in response'),
  includeInsights: z.boolean().optional().default(true).describe('Include insights in response'),
  historyLimit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of history items to return'),
});

type MemoryGetArgs = z.infer<typeof memoryGetSchema>;

export const memoryGetTool: McpTool<MemoryGetArgs> = {
  name: 'memory_get',
  description:
    'Retrieves user memory with patterns, insights, and history for personalization. Use this to understand user preferences and behavior patterns.',
  parameters: memoryGetSchema,
  execute: async (args: MemoryGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const memory = await userMemoryService.getMemory(context.userId, {
      domain: args.domain as MemoryDomain | undefined,
      includeHistory: args.includeHistory,
      includePatterns: args.includePatterns,
      includeInsights: args.includeInsights,
      historyLimit: args.historyLimit,
    });

    const domainMemory = args.domain
      ? ((memory as Record<string, unknown>)[args.domain as MemoryDomain] as Record<
          string,
          any
        > | null)
      : null;

    return {
      content: [
        {
          type: 'text',
          text: args.domain
            ? `📋 **Memoria ${args.domain}**
            
${
  domainMemory
    ? `Pattern: ${domainMemory.patterns?.length || 0}
Insights: ${domainMemory.insights?.length || 0}
History: ${domainMemory.history?.length || 0} items`
    : 'Nessun dato disponibile'
}

${domainMemory?.patterns?.length ? `\n**Pattern Identificati:**\n${(domainMemory.patterns as Array<{ type: string; description: string; confidence: number }>).map((p: any) => `- ${p.type}: ${p.description} (${(p.confidence * 100).toFixed(0)}%)`).join('\n')}` : ''}

${domainMemory?.insights?.length ? `\n**Insights:**\n${(domainMemory.insights as Array<{ category: string; insight: string }>).map((i: any) => `- ${i.category}: ${i.insight}`).join('\n')}` : ''}`
            : `📋 **Memoria Completa Utente**

Usa questo contesto per personalizzare risposte e suggerimenti.`,
        },
      ],
      memory,
    };
  },
};

// ============================================================================
// UPDATE MEMORY TOOL
// ============================================================================

const memoryUpdateSchema = z.object({
  domain: z
    .enum(['workout', 'nutrition', 'oneagenda', 'projects', 'tasks', 'habits', 'general'])
    .describe('Domain to update memory for'),
  preferences: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Preferences to update (merged with existing)'),
  addPattern: z
    .object({
      type: z.string(),
      description: z.string(),
      confidence: z.number().min(0).max(1),
      evidence: z.array(z.string()).optional(),
      suggestions: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Add a new pattern to memory'),
  addInsight: z
    .object({
      category: z.string(),
      insight: z.string(),
      basedOn: z.string(),
      confidence: z.number().min(0).max(1),
      relevance: z.number().min(0).max(1).optional(),
    })
    .optional()
    .describe('Add a new insight to memory'),
});

type MemoryUpdateArgs = z.infer<typeof memoryUpdateSchema>;

export const memoryUpdateTool: McpTool<MemoryUpdateArgs> = {
  name: 'memory_update',
  description:
    'Updates user memory with new preferences, patterns, or insights. Use this when you learn something new about the user that should be remembered.',
  parameters: memoryUpdateSchema,
  execute: async (args: MemoryUpdateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    if (args.addPattern) {
      await userMemoryService.addPattern(context.userId, args.domain as MemoryDomain, {
        ...args.addPattern,
        frequency: 1,
        evidence: args.addPattern.evidence || [],
      });
    }

    if (args.addInsight) {
      await userMemoryService.addInsight(context.userId, args.domain as MemoryDomain, {
        ...args.addInsight,
        relevance: args.addInsight.relevance ?? 0.5,
      });
    }

    if (args.preferences) {
      await userMemoryService.updateMemory(context.userId, {
        domain: args.domain as MemoryDomain,
        updates: {
          preferences: args.preferences,
        },
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Memoria aggiornata per dominio: ${args.domain}

${args.preferences ? '✓ Preferenze aggiornate' : ''}
${args.addPattern ? '✓ Pattern aggiunto' : ''}
${args.addInsight ? '✓ Insight aggiunto' : ''}`,
        },
      ],
    };
  },
};

// ============================================================================
// DELETE MEMORY PREFERENCE TOOL
// ============================================================================

const memoryDeletePreferenceSchema = z.object({
  domain: z
    .enum(['workout', 'nutrition', 'oneagenda', 'projects', 'tasks', 'habits', 'general'])
    .describe('Domain to delete preference from'),
  preferenceKey: z.string().describe('Key of the preference to delete'),
});

type MemoryDeletePreferenceArgs = z.infer<typeof memoryDeletePreferenceSchema>;

export const memoryDeletePreferenceTool: McpTool<MemoryDeletePreferenceArgs> = {
  name: 'memory_delete_preference',
  description:
    'Deletes a specific preference from user memory. Use this when a user preference is no longer valid or has changed.',
  parameters: memoryDeletePreferenceSchema,
  execute: async (args: MemoryDeletePreferenceArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const memory = await userMemoryService.getMemory(context.userId, {
      domain: args.domain as MemoryDomain,
    });

    const domainMemory = (memory as Record<string, unknown>)[args.domain as MemoryDomain] as
      | Record<string, unknown>
      | undefined;
    if (!domainMemory) {
      throw new Error(`No memory found for domain: ${args.domain}`);
    }

    const updatedPreferences = { ...(domainMemory.preferences as Record<string, unknown>) };
    delete updatedPreferences[args.preferenceKey];

    await userMemoryService.updateMemory(context.userId, {
      domain: args.domain as MemoryDomain,
      updates: {
        preferences: updatedPreferences,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Preferenza "${args.preferenceKey}" rimossa dal dominio ${args.domain}`,
        },
      ],
    };
  },
};

// ============================================================================
// TIMELINE TOOLS
// ============================================================================

const timelineCreateSchema = z.object({
  eventType: z
    .enum(['progress', 'injury', 'goal', 'milestone', 'note'])
    .describe('Type of timeline event'),
  domain: z
    .enum(['workout', 'nutrition', 'oneagenda', 'projects', 'tasks', 'habits', 'general'])
    .optional()
    .describe('Domain this event belongs to'),
  title: z.string().min(1).max(200).describe('Event title'),
  description: z.string().max(2000).optional().describe('Event description'),
  data: z.record(z.string(), z.unknown()).optional().describe('Additional event data'),
  date: z.string().describe('Event date (ISO date string)'),
});

type TimelineCreateArgs = z.infer<typeof timelineCreateSchema>;

export const timelineCreateTool: McpTool<TimelineCreateArgs> = {
  name: 'timeline_create',
  description:
    'Creates a timeline event in user memory. Use this to record significant events like progress milestones, injuries, goal completions, etc.',
  parameters: timelineCreateSchema,
  execute: async (args: TimelineCreateArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const event = await timelineService.createEvent(context.userId, {
      eventType: args.eventType,
      domain: args.domain as MemoryDomain | undefined,
      title: args.title,
      description: args.description,
      data: args.data,
      date: args.date,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Evento timeline creato: ${args.title}

Tipo: ${args.eventType}
Dominio: ${args.domain || 'generale'}
Data: ${args.date}`,
        },
      ],
      event,
    };
  },
};

const timelineGetSchema = z.object({
  eventType: z
    .enum(['progress', 'injury', 'goal', 'milestone', 'note'])
    .optional()
    .describe('Filter by event type'),
  domain: z
    .enum(['workout', 'nutrition', 'oneagenda', 'projects', 'tasks', 'habits', 'general'])
    .optional()
    .describe('Filter by domain'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Maximum number of events to return'),
});

type TimelineGetArgs = z.infer<typeof timelineGetSchema>;

export const timelineGetTool: McpTool<TimelineGetArgs> = {
  name: 'timeline_get',
  description:
    'Retrieves timeline events from user memory. Use this to understand user history, progress, and significant events.',
  parameters: timelineGetSchema,
  execute: async (args: TimelineGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const events = await timelineService.getTimeline(context.userId, {
      eventType: args.eventType,
      domain: args.domain as MemoryDomain | undefined,
      limit: args.limit,
    });

    return {
      content: [
        {
          type: 'text',
          text: `📅 **Timeline Eventi** (${events.length} trovati)

${
  events.length > 0
    ? events
        .map(
          (e: {
            title: string;
            eventType: string;
            date: string;
            description?: string;
          }) => `- **${e.title}** (${e.eventType})
  Data: ${e.date}
  ${e.description ? `Descrizione: ${e.description}` : ''}`
        )
        .join('\n\n')
    : 'Nessun evento trovato'
}`,
        },
      ],
      events,
    };
  },
};

// ============================================================================
// VERSIONING TOOLS
// ============================================================================

const versionSaveSchema = z.object({
  changeNote: z.string().optional().describe('Optional note about what changed'),
});

type VersionSaveArgs = z.infer<typeof versionSaveSchema>;

export const versionSaveTool: McpTool<VersionSaveArgs> = {
  name: 'memory_save_version',
  description:
    'Saves a snapshot of current memory state as a new version. Use this before making significant changes to allow rollback.',
  parameters: versionSaveSchema,
  execute: async (args: VersionSaveArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    await userMemoryService.saveVersion(
      context.userId,
      'manual',
      args.changeNote || 'Snapshot manuale'
    );

    return {
      content: [
        {
          type: 'text',
          text: `✅ Versione memoria salvata${args.changeNote ? `: ${args.changeNote}` : ''}`,
        },
      ],
    };
  },
};

const versionGetSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe('Maximum number of versions to return'),
});

type VersionGetArgs = z.infer<typeof versionGetSchema>;

export const versionGetTool: McpTool<VersionGetArgs> = {
  name: 'memory_get_versions',
  description: 'Retrieves version history of user memory. Use this to see past states and changes.',
  parameters: versionGetSchema,
  execute: async (args: VersionGetArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const versions = await userMemoryService.getVersionHistory(context.userId, args.limit || 20);

    return {
      content: [
        {
          type: 'text',
          text: `📚 **Cronologia Versioni** (${versions.length} versioni)

${
  versions.length > 0
    ? versions
        .map(
          (v) => `- Versione ${v.versionNumber} (${v.changeType})
  ${v.changeNote ? `Note: ${v.changeNote}` : ''}
  Creato: ${v.createdAt.toISOString().split('T')[0]}
  Da: ${v.changedBy || 'sistema'}`
        )
        .join('\n\n')
    : 'Nessuna versione salvata'
}`,
        },
      ],
      versions,
    };
  },
};

const versionRestoreSchema = z.object({
  versionNumber: z.number().int().min(1).describe('Version number to restore'),
});

type VersionRestoreArgs = z.infer<typeof versionRestoreSchema>;

export const versionRestoreTool: McpTool<VersionRestoreArgs> = {
  name: 'memory_restore_version',
  description:
    'Restores memory to a specific previous version. Use this to undo changes or revert to a previous state.',
  parameters: versionRestoreSchema,
  execute: async (args: VersionRestoreArgs, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User ID required');
    }

    const restored = await userMemoryService.restoreVersion(context.userId, args.versionNumber);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Memoria ripristinata alla versione ${args.versionNumber}

La versione corrente è stata salvata automaticamente prima del ripristino.`,
        },
      ],
      restored,
    };
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const memoryTools = [
  memoryGetTool,
  memoryUpdateTool,
  memoryDeletePreferenceTool,
  timelineCreateTool,
  timelineGetTool,
  versionSaveTool,
  versionGetTool,
  versionRestoreTool,
] as const;

import { arrayToToolRecord } from '../../utils/helpers';

export const memoryToolsRecord = arrayToToolRecord(memoryTools);
