import { z } from 'zod';
import type { McpTool, McpContext } from '../../types';
import { exerciseService } from '@giulio-leone/one-workout';
import { exerciseQuerySchema } from '@giulio-leone/schemas';

const readParameters = exerciseQuerySchema.extend({
  id: z.string().optional(),
  slug: z.string().optional(),
});

export const exerciseReadTool: McpTool = {
  name: 'exercise_read',
  description: 'Reads exercises by ID, slug, or search criteria.',
  parameters: readParameters,
  execute: async (args, context: McpContext) => {
    if (!context.userId) {
      throw new Error('Unauthorized: User authentication required');
    }

    if (args.id) {
      return await exerciseService.getById(args.id, args.locale, {
        includeTranslations: args.includeTranslations,
        includeUnapproved: args.includeUnapproved || context.isAdmin, // Allow admin to see unapproved
      });
    }

    if (args.slug) {
      return await exerciseService.getBySlug(args.slug, args.locale, {
        includeTranslations: args.includeTranslations,
        includeUnapproved: args.includeUnapproved || context.isAdmin,
      });
    }

    return await exerciseService.list({
      ...args,
      includeUnapproved: args.includeUnapproved || context.isAdmin, // Defaults logic
    });
  },
};
