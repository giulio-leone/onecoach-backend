/**
 * MCP Tools: Body Measurements Analytics
 *
 * Tools for analyzing body measurements trends and comparisons.
 *
 * @module lib-mcp-server/tools/body-measurements/analytics
 */

import { z } from 'zod';
import type { McpTool } from '../../types';
import { prisma } from '@giulio-leone/lib-core';

// ==================== ANALYZE TRENDS ====================

const analyzeParams = z.object({
  userId: z.string().optional(),
  days: z.number().int().min(7).max(365).default(30).describe('Analysis period in days'),
  metrics: z
    .array(z.string())
    .optional()
    .describe('Specific metrics to analyze (e.g. weight, bodyFat)'),
});

export const bodyMeasurementsAnalyzeTool: McpTool<z.infer<typeof analyzeParams>> = {
  name: 'body_measurements_analyze',
  description: 'Analyze body measurement trends over a period (weight change, body comp progress).',
  parameters: analyzeParams,
  execute: async (args, context) => {
    const userId = args.userId || context.userId;
    if (!userId) throw new Error('User ID required');

    const since = new Date();
    since.setDate(since.getDate() - args.days);

    const measurements = await prisma.body_measurements.findMany({
      where: {
        userId,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    });

    if (measurements.length === 0) {
      return {
        content: [{ type: 'text', text: 'No measurements found for this period.' }],
        analysis: { count: 0 },
      };
    }

    // Force non-null assertion since length > 0
    const first = measurements[0]!;
    const last = measurements[measurements.length - 1]!;

    // Helper statistics
    // Use keyof body_measurements but restrict to numeric fields we care about
    type NumericMeasurementKey = 'weight' | 'bodyFat' | 'muscleMass' | 'waist';

    const calculateTrend = (key: NumericMeasurementKey) => {
      // Safe access and number conversion
      const startVal = first[key];
      const endVal = last[key];

      const start = startVal !== null ? Number(startVal) : 0;
      const end = endVal !== null ? Number(endVal) : 0;

      if (!start) return null; // Avoid division by zero or invalid start

      return {
        start,
        end,
        delta: Number((end - start).toFixed(2)),
        percent: Number((((end - start) / start) * 100).toFixed(1)),
      };
    };

    const weightTrend = calculateTrend('weight');
    const bodyFatTrend = calculateTrend('bodyFat');
    const muscleTrend = calculateTrend('muscleMass');
    const waistTrend = calculateTrend('waist');

    // BMI Calculation if possible
    let currentBMI: number | null = null;
    let bmiCategory = 'Unknown';
    // BMI Calculation temporarily disabled due to missing height scheme
    // if (last.weight && last.height) {
    //     const hM = Number(last.height) / 100;
    //     currentBMI = Number((Number(last.weight) / (hM * hM)).toFixed(1));
    //     if (currentBMI < 18.5) bmiCategory = 'Underweight';
    //     else if (currentBMI < 25) bmiCategory = 'Normal weight';
    //     else if (currentBMI < 30) bmiCategory = 'Overweight';
    //     else bmiCategory = 'Obese';
    // }

    return {
      content: [
        {
          type: 'text',
          text: `📊 **Body Analysis** (${args.days} days)
          
**Weight:** ${last.weight ?? '-'} kg (${weightTrend ? (weightTrend.delta > 0 ? '+' : '') + weightTrend.delta + 'kg' : 'stable'})
**Body Fat:** ${last.bodyFat ?? '-'}% (${bodyFatTrend ? (bodyFatTrend.delta > 0 ? '+' : '') + bodyFatTrend.delta + '%' : 'stable'})
**BMI:** ${currentBMI ?? '-'} (${bmiCategory})

Recorded ${measurements.length} entries.`,
        },
      ],
      analysis: {
        period: args.days,
        entries: measurements.length,
        current: {
          weight: last.weight,
          bodyFat: last.bodyFat,
          muscleMass: last.muscleMass,
          bmi: currentBMI,
          bmiCategory,
        },
        trends: {
          weight: weightTrend,
          bodyFat: bodyFatTrend,
          muscleMass: muscleTrend,
          waist: waistTrend,
        },
      },
    };
  },
};

// ==================== COMPARE ====================

const compareParams = z.object({
  userId: z.string().optional(),
  dateA: z.string().describe('First date (ISO)'),
  dateB: z.string().describe('Second date (ISO)'),
});

export const bodyMeasurementsCompareTool: McpTool<z.infer<typeof compareParams>> = {
  name: 'body_measurements_compare',
  description: 'Compare measurements between two specific dates.',
  parameters: compareParams,
  execute: async (args, context) => {
    const userId = args.userId || context.userId;
    if (!userId) throw new Error('User ID required');

    const dateA = new Date(args.dateA);
    const dateB = new Date(args.dateB);

    // Find closest measurement to dates? Or exact?
    // Let's try exact first, usually users pick from list.
    // Or findFirst with date lte/gte range?
    // Let's stick to simple "find entry on this day".

    const [entryA, entryB] = await Promise.all([
      prisma.body_measurements.findFirst({ where: { userId, date: dateA } }),
      prisma.body_measurements.findFirst({ where: { userId, date: dateB } }),
    ]);

    if (!entryA || !entryB) {
      return {
        content: [{ type: 'text', text: 'One or both dates have no data.' }],
        success: false,
      };
    }

    const numericKeys = [
      'weight',
      'bodyFat',
      'muscleMass',
      'waterPercentage',
      'visceralFat',
      'chest',
      'waist',
      'hips',
      'arm',
      'thigh',
      'calf',
      'neck',
      'shoulders',
    ] as const;

    const comparison: Record<string, unknown> = {};
    const diffs: Record<string, unknown> = {};

    numericKeys.forEach((key: any) => {
      const valA = Number(entryA[key as keyof typeof entryA]) || 0;
      const valB = Number(entryB[key as keyof typeof entryB]) || 0;
      if (valA || valB) {
        comparison[key] = { A: valA, B: valB };
        diffs[key] = Number((valB - valA).toFixed(2));
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `⚖️ **Comparison**
${args.dateA} vs ${args.dateB}

Weight: ${entryA.weight} -> ${entryB.weight} (${(diffs as any).weight > 0 ? '+' : ''}${(diffs as any).weight})
Body Fat: ${entryA.bodyFat}% -> ${entryB.bodyFat}% (${(diffs as any).bodyFat > 0 ? '+' : ''}${(diffs as any).bodyFat}%)
Muscle: ${entryA.muscleMass} -> ${entryB.muscleMass} (${(diffs as any).muscleMass > 0 ? '+' : ''}${(diffs as any).muscleMass})`,
        },
      ],
      comparison,
      diffs,
      dates: { A: entryA.date, B: entryB.date },
    };
  },
};
