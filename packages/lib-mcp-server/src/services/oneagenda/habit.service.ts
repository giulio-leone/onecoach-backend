/**
 * Habit Service for MCP Tools
 *
 * Servizio server-side per gestione habit OneAgenda
 * Usa Prisma direttamente invece di API HTTP calls
 */

import { getDbClient } from '@giulio-leone/core';
const prisma = getDbClient() as import('@prisma/client').PrismaClient;
import type { HabitFrequency } from '@prisma/client';

export interface CreateHabitInput {
  title: string;
  frequency: HabitFrequency;
  description?: string;
  color?: string;
}

export interface UpdateHabitInput {
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  color?: string;
}

export interface HabitWithDetails {
  id: string;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  color: string | null;
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calcola lo streak corrente e migliore basandosi sui log
 */
function calculateStreaks(logs: Array<{ date: Date; completed: boolean }>): {
  currentStreak: number;
  bestStreak: number;
} {
  if (logs.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Ordina i log per data decrescente
  const sortedLogs = [...logs]
    .filter((l: any) => l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedLogs.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const log of sortedLogs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    if (lastDate === null) {
      tempStreak = 1;
      lastDate = logDate;
    } else {
      const diffDays = Math.round((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        tempStreak = 1;
      }
      lastDate = logDate;
    }
  }

  if (tempStreak > bestStreak) {
    bestStreak = tempStreak;
  }

  // Verifica se lo streak corrente è attivo (ultimo log è oggi o ieri)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstLog = sortedLogs[0];
  if (firstLog) {
    const lastLogDate = new Date(firstLog.date);
    lastLogDate.setHours(0, 0, 0, 0);
    const daysSinceLastLog = Math.round(
      (today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastLog <= 1) {
      currentStreak = tempStreak;
    }
  }

  return { currentStreak, bestStreak };
}

class HabitService {
  /**
   * Crea una nuova habit
   */
  async create(userId: string, input: CreateHabitInput): Promise<HabitWithDetails> {
    const habit = await prisma.agenda_habits.create({
      data: {
        name: input.title,
        description: input.description,
        frequency: input.frequency,
        color: input.color,
        userId,
      },
    });

    return {
      id: habit.id,
      title: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      color: habit.color,
      currentStreak: 0,
      bestStreak: 0,
      completedToday: false,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
    };
  }

  /**
   * Lista tutte le habit dell'utente
   */
  async list(userId: string): Promise<HabitWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habits = await prisma.agenda_habits.findMany({
      where: { userId },
      include: {
        agenda_habit_logs: {
          orderBy: { date: 'desc' },
          take: 100, // Ultimi 100 log per calcolare streaks
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return habits.map((habit: any) => {
      const todayLog = habit.agenda_habit_logs.find((log: any) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime() && log.completed;
      });

      const { currentStreak, bestStreak } = calculateStreaks(habit.agenda_habit_logs);

      return {
        id: habit.id,
        title: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        color: habit.color,
        currentStreak,
        bestStreak,
        completedToday: !!todayLog,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      };
    });
  }

  /**
   * Aggiorna una habit
   */
  async update(
    userId: string,
    habitId: string,
    input: UpdateHabitInput
  ): Promise<HabitWithDetails | null> {
    const existingHabit = await prisma.agenda_habits.findFirst({
      where: { id: habitId, userId },
    });

    if (!existingHabit) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habit = await prisma.agenda_habits.update({
      where: { id: habitId },
      data: {
        name: input.title,
        description: input.description,
        frequency: input.frequency,
        color: input.color,
      },
      include: {
        agenda_habit_logs: {
          orderBy: { date: 'desc' },
          take: 100,
        },
      },
    });

    const todayLog = habit.agenda_habit_logs.find((log: any) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });

    const { currentStreak, bestStreak } = calculateStreaks(habit.agenda_habit_logs);

    return {
      id: habit.id,
      title: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      color: habit.color,
      currentStreak,
      bestStreak,
      completedToday: !!todayLog,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
    };
  }

  /**
   * Elimina una habit
   */
  async delete(userId: string, habitId: string): Promise<boolean> {
    const existingHabit = await prisma.agenda_habits.findFirst({
      where: { id: habitId, userId },
    });

    if (!existingHabit) {
      return false;
    }

    await prisma.agenda_habits.delete({
      where: { id: habitId },
    });

    return true;
  }

  /**
   * Toggle completamento habit per oggi
   */
  async toggle(userId: string, habitId: string): Promise<HabitWithDetails | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habit = await prisma.agenda_habits.findFirst({
      where: { id: habitId, userId },
      include: {
        agenda_habit_logs: {
          orderBy: { date: 'desc' },
          take: 100,
        },
      },
    });

    if (!habit) {
      return null;
    }

    const todayLog = habit.agenda_habit_logs.find((log: any) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    if (todayLog) {
      // Toggle: se era completato rimuovilo, altrimenti segnalo come completato
      if (todayLog.completed) {
        await prisma.agenda_habit_logs.delete({
          where: { id: todayLog.id },
        });
      } else {
        await prisma.agenda_habit_logs.update({
          where: { id: todayLog.id },
          data: { completed: true },
        });
      }
    } else {
      // Crea nuovo log per oggi
      await prisma.agenda_habit_logs.create({
        data: {
          habitId,
          date: today,
          completed: true,
        },
      });
    }

    // Rileggi habit aggiornata
    const updatedHabit = await prisma.agenda_habits.findFirst({
      where: { id: habitId },
      include: {
        agenda_habit_logs: {
          orderBy: { date: 'desc' },
          take: 100,
        },
      },
    });

    if (!updatedHabit) return null;

    const newTodayLog = updatedHabit.agenda_habit_logs.find((log: any) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });

    const { currentStreak, bestStreak } = calculateStreaks(updatedHabit.agenda_habit_logs);

    return {
      id: updatedHabit.id,
      title: updatedHabit.name,
      description: updatedHabit.description,
      frequency: updatedHabit.frequency,
      color: updatedHabit.color,
      currentStreak,
      bestStreak,
      completedToday: !!newTodayLog,
      createdAt: updatedHabit.createdAt,
      updatedAt: updatedHabit.updatedAt,
    };
  }
}

export const habitService = new HabitService();
