import axios from 'axios';
import { 
  ReadingItem, 
  ReadingStats, 
  AddItemRequest, 
  UpdateProgressRequest, 
  FinishItemRequest,
  VaultStatus 
} from '../types/reading';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Reading API
export const readingApi = {
  // Get all reading items
  getAll: async (params?: { status?: string; tag?: string }): Promise<{ items: ReadingItem[]; count: number }> => {
    const response = await api.get('/reading', { params });
    return response.data;
  },

  // Get reading item by ID
  getById: async (id: string): Promise<ReadingItem> => {
    const response = await api.get(`/reading/${id}`);
    return response.data;
  },

  // Add new reading item
  add: async (item: AddItemRequest): Promise<void> => {
    await api.post('/reading', item);
  },

  // Start reading an item
  start: async (id: string): Promise<void> => {
    await api.put(`/reading/${id}/start`);
  },

  // Update reading progress
  updateProgress: async (id: string, progress: UpdateProgressRequest): Promise<void> => {
    await api.put(`/reading/${id}/progress`, progress);
  },

  // Finish reading an item
  finish: async (id: string, data: FinishItemRequest): Promise<void> => {
    await api.put(`/reading/${id}/finish`, data);
  },

  // Delete reading item
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reading/${id}`);
  },

  // Get reading statistics
  getStats: async (): Promise<ReadingStats> => {
    const response = await api.get('/reading/stats');
    return response.data;
  },
};

// Vault API
export const vaultApi = {
  // Get vault status
  getStatus: async (): Promise<VaultStatus> => {
    const response = await api.get('/vault/status');
    return response.data;
  },

  // Initialize vault
  init: async (remote?: string): Promise<void> => {
    await api.post('/vault/init', { remote });
  },

  // Clone vault
  clone: async (url: string): Promise<void> => {
    await api.post('/vault/clone', { url });
  },

  // Sync vault
  sync: async (): Promise<void> => {
    await api.post('/vault/sync');
  },
};

export default api;