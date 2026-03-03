'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Query Keys ---

export const groupKeys = {
  all: ['groups'] as const,
  list: () => [...groupKeys.all, 'list'] as const,
  members: (groupId: string) => [...groupKeys.all, 'members', groupId] as const,
};

// --- Types ---

export interface ClientGroup {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { members: number };
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name?: string; email?: string; image?: string };
}

// --- API ---

const groupApi = {
  list: async (): Promise<ClientGroup[]> => {
    const res = await fetch('/api/coach/groups', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch groups');
    return res.json();
  },

  create: async (data: { name: string; description?: string }): Promise<ClientGroup> => {
    const res = await fetch('/api/coach/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to create group');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`/api/coach/groups?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete group');
  },

  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const res = await fetch(`/api/coach/groups/members?groupId=${groupId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  addMember: async (groupId: string, userId: string): Promise<GroupMember> => {
    const res = await fetch('/api/coach/groups/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ groupId, userId }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to add member');
    return res.json();
  },

  removeMember: async (memberId: string): Promise<void> => {
    const res = await fetch(`/api/coach/groups/members?id=${memberId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to remove member');
  },
};

// --- Hooks ---

export function useCoachGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: groupApi.list,
    staleTime: 60 * 1000,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => groupApi.getMembers(groupId),
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => groupApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupApi.addMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => groupApi.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
