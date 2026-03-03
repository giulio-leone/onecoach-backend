'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Query Keys ---

export const waterKeys = {
  all: ['water'] as const,
  intake: {
    lists: () => [...waterKeys.all, 'intake'] as const,
    list: (date?: string) => [...waterKeys.intake.lists(), date] as const,
  },
  summary: (period: string, date?: string) =>
    [...waterKeys.all, 'summary', period, date] as const,
  goal: () => [...waterKeys.all, 'goal'] as const,
};

// --- Types ---

export interface WaterIntakeEntry {
  id: string;
  userId: string;
  amountMl: number;
  loggedAt: string;
  createdAt: string;
}

export interface WaterSummary {
  totalMl: number;
  count: number;
  entries: WaterIntakeEntry[];
}

export interface WaterGoal {
  id: string;
  userId: string;
  dailyGoalMl: number;
}

// --- API Queries ---

const waterApi = {
  logIntake: async (amountMl: number): Promise<WaterIntakeEntry> => {
    const res = await fetch('/api/water-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amountMl }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to log water intake');
    return res.json();
  },

  getEntries: async (date?: string): Promise<WaterIntakeEntry[]> => {
    const url = date ? `/api/water-intake?date=${date}` : '/api/water-intake';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch water entries');
    return res.json();
  },

  deleteEntry: async (id: string): Promise<void> => {
    const res = await fetch(`/api/water-intake?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete entry');
  },

  getSummary: async (period: string, date?: string): Promise<WaterSummary> => {
    const params = new URLSearchParams({ period });
    if (date) params.set('date', date);
    const res = await fetch(`/api/water-intake/summary?${params}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  getGoal: async (): Promise<WaterGoal> => {
    const res = await fetch('/api/water-intake/goal', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch goal');
    return res.json();
  },

  updateGoal: async (dailyGoalMl: number): Promise<WaterGoal> => {
    const res = await fetch('/api/water-intake/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ dailyGoalMl }),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },
};

// --- Hooks ---

export function useWaterEntries(date?: string) {
  return useQuery({
    queryKey: waterKeys.intake.list(date),
    queryFn: () => waterApi.getEntries(date),
    staleTime: 30 * 1000,
  });
}

export function useWaterSummary(period: 'day' | 'week' | 'month' = 'day', date?: string) {
  return useQuery({
    queryKey: waterKeys.summary(period, date),
    queryFn: () => waterApi.getSummary(period, date),
    staleTime: 30 * 1000,
  });
}

export function useWaterGoal() {
  return useQuery({
    queryKey: waterKeys.goal(),
    queryFn: waterApi.getGoal,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountMl: number) => waterApi.logIntake(amountMl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waterKeys.all });
    },
  });
}

export function useDeleteWaterEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => waterApi.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waterKeys.all });
    },
  });
}

export function useUpdateWaterGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dailyGoalMl: number) => waterApi.updateGoal(dailyGoalMl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waterKeys.goal() });
    },
  });
}
