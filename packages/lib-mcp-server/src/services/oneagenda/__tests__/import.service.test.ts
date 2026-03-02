import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OneAgendaImportService } from '../import.service';
import type { AIParseContext } from '@giulio-leone/lib-shared/import-core';
import type { ImportedOneAgenda } from '../imported-oneagenda.schema';

vi.mock('@giulio-leone/lib-core', () => ({
  prisma: {
    $transaction: (fn: any) =>
      fn({
        agenda_projects: {
          create: vi.fn().mockResolvedValue({ id: 'proj_1' }),
        },
        agenda_tasks: {
          create: vi.fn().mockResolvedValue({ id: 'task_1' }),
        },
        agenda_habits: {
          create: vi.fn().mockResolvedValue({ id: 'habit_1' }),
        },
      }),
  },
}));

describe('OneAgendaImportService', () => {
  const aiContext: AIParseContext<ImportedOneAgenda> = {
    parseWithAI: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('importa progetti/task/habit e restituisce gli ID creati', async () => {
    (aiContext.parseWithAI as any).mockResolvedValue({
      projects: [
        {
          title: 'Project A',
          tasks: [
            {
              title: 'Task A1',
              subtasks: [{ title: 'Subtask A1.1' }],
            },
          ],
        },
      ],
      tasks: [{ title: 'Orphan Task' }],
      habits: [{ title: 'Drink water', frequency: 'DAILY' }],
    } as ImportedOneAgenda);

    const service = new OneAgendaImportService({
      aiContext,
      context: { userId: 'user_1' },
    });

    const result = await service.import(
      [
        {
          name: 'agenda.pdf',
          mimeType: 'application/pdf',
          content: 'YmFzZTY0',
        },
      ],
      'user_1',
      {}
    );

    expect(result.success).toBe(true);
    expect(result.projectIds?.length).toBeGreaterThan(0);
    expect(result.habitIds?.length).toBeGreaterThan(0);
  });
});
