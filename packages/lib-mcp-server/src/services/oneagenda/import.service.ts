import type { Prisma } from '@prisma/client';
import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;
import type {
  AIParseContext,
  ImportOptions,
  BaseImportResult,
} from '@giulio-leone/lib-shared/import-core';
import { BaseImportService, parseWithVisionAI } from '@giulio-leone/lib-shared/import-core';
import type {
  ImportedOneAgenda,
  ImportedProject,
  ImportedTask,
  ImportedHabit,
} from './imported-oneagenda.schema';
import { ImportedOneAgendaSchema } from './imported-oneagenda.schema';

export interface OneAgendaImportResult extends BaseImportResult {
  projectIds?: string[];
  habitIds?: string[];
  parseResult?: ImportedOneAgenda;
}

/**
 * Service for importing OneAgenda data (projects, tasks, habits).
 * Extends BaseImportService for standardized workflow.
 *
 * TAIRaw = ImportedOneAgenda (what AI returns)
 * TParsed = ImportedOneAgenda (same, no transformation needed)
 * TResult = OneAgendaImportResult
 */
export class OneAgendaImportService extends BaseImportService<
  ImportedOneAgenda,
  ImportedOneAgenda,
  OneAgendaImportResult
> {
  protected getLoggerName(): string {
    return 'OneAgendaImport';
  }

  protected buildPrompt(_options?: Partial<ImportOptions>): string {
    return `Analizza il file (progetti/attività/abitudini) e restituisci SOLO JSON con struttura:
{
  "projects": [
    {
      "title": string,
      "description": string,
      "status": "ACTIVE" | "COMPLETED" | "ARCHIVED" | "ON_HOLD",
      "dueDate": ISO string,
      "color": string,
      "tasks": [
        {
          "title": string,
          "description": string,
          "status": "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED",
          "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          "dueDate": ISO string,
          "subtasks": [ ...nested tasks... ]
        }
      ]
    }
  ],
  "tasks": [ same schema as tasks, used when non è specificato un progetto ],
  "habits": [
    {
      "title": string,
      "description": string,
      "frequency": "DAILY" | "WEEKLY",
      "color": string
    }
  ]
}
Regole:
- Mantieni gerarchia di task (subtasks).
- Se il file contiene solo task senza progetto, mettili in "tasks".
- Usa date in formato ISO (YYYY-MM-DD o ISO 8601) se presenti.
- Non aggiungere testo extra, solo JSON valido.`;
  }

  protected async processParsed(
    parsed: ImportedOneAgenda,
    _userId: string,
    _options?: Partial<ImportOptions>
  ): Promise<ImportedOneAgenda> {
    // No complex post-processing needed for OneAgenda
    // Logic for normalization is handled during persistence
    return parsed;
  }

  protected async persist(
    processed: ImportedOneAgenda,
    userId: string
  ): Promise<Partial<OneAgendaImportResult>> {
    const parseResult = processed;
    const projectIds: string[] = [];
    const habitIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Projects + tasks
      for (const project of parseResult.projects || []) {
        const projectId = await this.persistProject(tx, userId, project);
        projectIds.push(projectId);
      }

      // Standalone tasks -> fallback project
      if (parseResult.tasks && parseResult.tasks.length > 0) {
        const fallbackProjectId = await this.persistProject(tx, userId, {
          title: 'Imported Tasks',
          description: 'Tasks importati via AI',
          tasks: parseResult.tasks,
        });
        projectIds.push(fallbackProjectId);
      }

      // Habits
      for (const habit of parseResult.habits || []) {
        const habitId = await this.persistHabit(tx, userId, habit);
        habitIds.push(habitId);
      }
    });

    return {
      projectIds,
      habitIds,
      parseResult,
    };
  }

  protected createErrorResult(errors: string[]): Partial<OneAgendaImportResult> {
    return {
      success: false,
      errors,
    };
  }

  // ==================== HELPERS ====================

  private async persistProject(
    tx: Prisma.TransactionClient,
    userId: string,
    project: ImportedProject
  ): Promise<string> {
    const created = await tx.agenda_projects.create({
      data: {
        name: project.title,
        description: project.description,
        endDate: project.dueDate ? new Date(project.dueDate) : null,
        status: normalizeProjectStatus(project.status),
        color: project.color,
        userId,
      },
    });

    // Tasks with ordering
    if (project.tasks && project.tasks.length > 0) {
      let order = 0;
      for (const task of project.tasks) {
        await this.persistTask(tx, userId, created.id, task, null, order++);
      }
    }

    return created.id;
  }

  private async persistTask(
    tx: Prisma.TransactionClient,
    userId: string,
    projectId: string,
    task: ImportedTask,
    parentId: string | null,
    order: number
  ): Promise<string> {
    const created = await tx.agenda_tasks.create({
      data: {
        title: task.title,
        description: task.description,
        status: normalizeTaskStatus(task.status),
        priority: normalizeTaskPriority(task.priority),
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        order,
        projectId,
        parentId,
        userId,
      },
    });

    if (task.subtasks && task.subtasks.length > 0) {
      let childOrder = 0;
      for (const sub of task.subtasks) {
        await this.persistTask(tx, userId, projectId, sub, created.id, childOrder++);
      }
    }

    return created.id;
  }

  private async persistHabit(
    tx: Prisma.TransactionClient,
    userId: string,
    habit: ImportedHabit
  ): Promise<string> {
    const created = await tx.agenda_habits.create({
      data: {
        name: habit.title,
        description: habit.description,
        frequency: normalizeHabitFrequency(habit.frequency),
        color: habit.color,
        userId,
      },
    });
    return created.id;
  }
}

export function createOneAgendaAIContext(userId: string): AIParseContext<ImportedOneAgenda> {
  return {
    parseWithAI: (content: string, mimeType: string, prompt: string) =>
      parseWithVisionAI<ImportedOneAgenda>({
        contentBase64: content,
        mimeType,
        prompt,
        schema: ImportedOneAgendaSchema,
        userId,
        fileType: mimeType.startsWith('image/')
          ? 'image'
          : mimeType === 'application/pdf'
            ? 'pdf'
            : 'document',
      }),
  };
}

// ==================== NORMALIZERS ====================

function normalizeProjectStatus(status?: string): 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD' {
  if (!status) return 'ACTIVE';
  const upper = status.toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD'].includes(upper)) {
    return upper as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  }
  return 'ACTIVE';
}

function normalizeTaskStatus(
  status?: string
): 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED' {
  if (!status) return 'TODO';
  const upper = status.toUpperCase();
  if (['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'].includes(upper)) {
    return upper as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  }
  return 'TODO';
}

function normalizeTaskPriority(priority?: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (!priority) return 'MEDIUM';
  const upper = priority.toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upper)) {
    return upper as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }
  return 'MEDIUM';
}

function normalizeHabitFrequency(frequency?: string): 'DAILY' | 'WEEKLY' {
  if (!frequency) return 'DAILY';
  const upper = frequency.toUpperCase();
  if (['DAILY', 'WEEKLY'].includes(upper)) {
    return upper as 'DAILY' | 'WEEKLY';
  }
  return 'DAILY';
}
