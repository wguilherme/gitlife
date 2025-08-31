import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpApiClient } from '../../infrastructure/api/HttpApiClient';
import { 
  ReadingItemDTO, 
  CreateReadingItemDTO, 
  UpdateReadingItemDTO, 
  UpdateProgressDTO, 
  FinishReadingDTO,
  ReadingItemFiltersDTO 
} from '../../application/dto/ReadingItemDTO';
import { useAppContext } from '../providers/AppProvider';

// Query keys for React Query
export const READING_KEYS = {
  all: ['reading'] as const,
  lists: () => [...READING_KEYS.all, 'list'] as const,
  list: (filters?: ReadingItemFiltersDTO) => [...READING_KEYS.lists(), { filters }] as const,
  details: () => [...READING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...READING_KEYS.details(), id] as const,
  statistics: () => [...READING_KEYS.all, 'statistics'] as const,
};

// API client instance
const apiClient = new HttpApiClient();

// Custom hooks
export const useReadingItems = (filters?: ReadingItemFiltersDTO) => {
  const { setError } = useAppContext();

  return useQuery({
    queryKey: READING_KEYS.list(filters),
    queryFn: async () => {
      try {
        const items = await apiClient.getReadingItems(filters);
        setError(null);
        return { items, count: items.length };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch reading items';
        setError(message);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useReadingItem = (id: string) => {
  const { setError } = useAppContext();

  return useQuery({
    queryKey: READING_KEYS.detail(id),
    queryFn: async () => {
      try {
        const item = await apiClient.getReadingItem(id);
        setError(null);
        return item;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch reading item';
        setError(message);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useCreateReadingItem = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async (data: CreateReadingItemDTO) => {
      return await apiClient.createReadingItem(data);
    },
    onSuccess: () => {
      // Invalidate and refetch reading items
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.statistics() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create reading item';
      setError(message);
    },
  });
};

export const useUpdateReadingItem = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReadingItemDTO }) => {
      return await apiClient.updateReadingItem(id, data);
    },
    onSuccess: (updatedItem) => {
      // Update the item in the cache
      queryClient.setQueryData(
        READING_KEYS.detail(updatedItem.id),
        updatedItem
      );
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update reading item';
      setError(message);
    },
  });
};

export const useDeleteReadingItem = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteReadingItem(id);
    },
    onSuccess: (_, id) => {
      // Remove the item from cache
      queryClient.removeQueries({ queryKey: READING_KEYS.detail(id) });
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.statistics() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to delete reading item';
      setError(message);
    },
  });
};

export const useStartReading = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.startReading(id);
    },
    onSuccess: (updatedItem) => {
      // Update the item in the cache
      queryClient.setQueryData(
        READING_KEYS.detail(updatedItem.id),
        updatedItem
      );
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.statistics() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to start reading';
      setError(message);
    },
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      return await apiClient.updateProgress(id, { progress });
    },
    onSuccess: (updatedItem) => {
      // Update the item in the cache
      queryClient.setQueryData(
        READING_KEYS.detail(updatedItem.id),
        updatedItem
      );
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update progress';
      setError(message);
    },
  });
};

export const useFinishReading = () => {
  const queryClient = useQueryClient();
  const { setError } = useAppContext();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FinishReadingDTO }) => {
      return await apiClient.finishReading(id, data);
    },
    onSuccess: (updatedItem) => {
      // Update the item in the cache
      queryClient.setQueryData(
        READING_KEYS.detail(updatedItem.id),
        updatedItem
      );
      // Invalidate lists to refresh them
      queryClient.invalidateQueries({ queryKey: READING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: READING_KEYS.statistics() });
      setError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to finish reading';
      setError(message);
    },
  });
};

export const useReadingStatistics = () => {
  const { setError } = useAppContext();

  return useQuery({
    queryKey: READING_KEYS.statistics(),
    queryFn: async () => {
      try {
        const stats = await apiClient.getStatistics();
        setError(null);
        return stats;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch statistics';
        setError(message);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};