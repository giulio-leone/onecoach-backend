'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Query Keys ---

export const progressPhotoKeys = {
  all: ['progress-photos'] as const,
  list: (params?: { bodyPart?: string; from?: string; to?: string }) =>
    [...progressPhotoKeys.all, 'list', params] as const,
  compare: (params: { from?: string; to?: string; bodyPart?: string }) =>
    [...progressPhotoKeys.all, 'compare', params] as const,
};

// --- Types ---

export interface ProgressPhoto {
  id: string;
  userId: string;
  url: string;
  bodyPart?: string;
  notes?: string;
  takenAt: string;
  createdAt: string;
}

export interface PhotoComparison {
  before: ProgressPhoto;
  after: ProgressPhoto;
}

// --- API ---

const photoApi = {
  upload: async (file: File, bodyPart?: string, notes?: string, takenAt?: string): Promise<ProgressPhoto> => {
    const formData = new FormData();
    formData.append('photo', file);
    if (bodyPart) formData.append('bodyPart', bodyPart);
    if (notes) formData.append('notes', notes);
    if (takenAt) formData.append('takenAt', takenAt);

    const res = await fetch('/api/progress-photos', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Upload failed');
    return res.json();
  },

  list: async (params?: { bodyPart?: string; from?: string; to?: string }): Promise<ProgressPhoto[]> => {
    const searchParams = new URLSearchParams();
    if (params?.bodyPart) searchParams.set('bodyPart', params.bodyPart);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    const qs = searchParams.toString();
    const res = await fetch(`/api/progress-photos${qs ? `?${qs}` : ''}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch photos');
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`/api/progress-photos?id=${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete photo');
  },

  compare: async (params: { from?: string; to?: string; bodyPart?: string }): Promise<PhotoComparison> => {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.bodyPart) searchParams.set('bodyPart', params.bodyPart);
    const res = await fetch(`/api/progress-photos/compare?${searchParams}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch comparison');
    return res.json();
  },
};

// --- Hooks ---

export function useProgressPhotos(params?: { bodyPart?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: progressPhotoKeys.list(params),
    queryFn: () => photoApi.list(params),
    staleTime: 60 * 1000,
  });
}

export function usePhotoComparison(params: { from?: string; to?: string; bodyPart?: string }) {
  return useQuery({
    queryKey: progressPhotoKeys.compare(params),
    queryFn: () => photoApi.compare(params),
    enabled: !!(params.from || params.to),
    staleTime: 60 * 1000,
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, bodyPart, notes, takenAt }: {
      file: File;
      bodyPart?: string;
      notes?: string;
      takenAt?: string;
    }) => photoApi.upload(file, bodyPart, notes, takenAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPhotoKeys.all });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => photoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPhotoKeys.all });
    },
  });
}
