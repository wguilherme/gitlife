import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { readingApi } from '../services/api';
import { AddItemRequest, UpdateProgressRequest, FinishItemRequest } from '../types/reading';

// Query keys
export const READING_KEYS = {
  all: ['reading'] as const,
  lists: () => [...READING_KEYS.all, 'list'] as const,
  list: (filters?: { status?: string; tag?: string }) => [...READING_KEYS.lists(), { filters }] as const,
  details: () => [...READING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...READING_KEYS.details(), id] as const,
  stats: () => [...READING_KEYS.all, 'stats'] as const,
};

// Get all reading items
export const useReadingItems = (filters?: { status?: string; tag?: string }) => {
  return useQuery({
    queryKey: READING_KEYS.list(filters),
    queryFn: () => readingApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get reading item by ID
export const useReadingItem = (id: string) => {
  return useQuery({
    queryKey: READING_KEYS.detail(id),
    queryFn: () => readingApi.getById(id),
    enabled: !!id,
  });
};

// Get reading statistics
export const useReadingStats = () => {
  return useQuery({
    queryKey: READING_KEYS.stats(),
    queryFn: readingApi.getStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Add reading item mutation
export const useAddReadingItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: AddItemRequest) => readingApi.add(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.stats() });
    },
  });
};

// Start reading mutation
export const useStartReading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => readingApi.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.stats() });
    },
  });
};

// Update progress mutation
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: UpdateProgressRequest }) =>
      readingApi.updateProgress(id, progress),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.detail(id) });
    },
  });
};

// Finish reading mutation
export const useFinishReading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinishItemRequest }) =>
      readingApi.finish(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.stats() });
    },
  });
};

// Delete reading item mutation
export const useDeleteReadingItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => readingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.stats() });
    },
  });
};