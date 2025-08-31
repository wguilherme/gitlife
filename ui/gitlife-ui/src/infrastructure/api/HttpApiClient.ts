import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IApiClient } from '../../application/ports/IApiClient';
import { 
  ReadingItemDTO, 
  CreateReadingItemDTO, 
  UpdateReadingItemDTO, 
  UpdateProgressDTO, 
  FinishReadingDTO, 
  ReadingItemFiltersDTO, 
  ReadingStatisticsDTO 
} from '../../application/dto/ReadingItemDTO';

export class HttpApiClient implements IApiClient {
  private readonly client: AxiosInstance;

  constructor(baseURL = 'http://localhost:8080/api') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status} for ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[API] Response error:', error.response?.data || error.message);
        
        // Transform error messages
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to GitLife server. Please make sure the server is running.');
        }
        
        throw error;
      }
    );
  }

  // Reading Items
  async getReadingItems(filters?: ReadingItemFiltersDTO): Promise<ReadingItemDTO[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);

    const response: AxiosResponse<{ items: ReadingItemDTO[] }> = await this.client.get(
      `/reading?${params.toString()}`
    );
    
    return response.data.items || [];
  }

  async getReadingItem(id: string): Promise<ReadingItemDTO> {
    const response: AxiosResponse<ReadingItemDTO> = await this.client.get(`/reading/${id}`);
    return response.data;
  }

  async createReadingItem(data: CreateReadingItemDTO): Promise<ReadingItemDTO> {
    const response: AxiosResponse<ReadingItemDTO> = await this.client.post('/reading', data);
    return response.data;
  }

  async updateReadingItem(id: string, data: UpdateReadingItemDTO): Promise<ReadingItemDTO> {
    const response: AxiosResponse<ReadingItemDTO> = await this.client.put(`/reading/${id}`, data);
    return response.data;
  }

  async deleteReadingItem(id: string): Promise<void> {
    await this.client.delete(`/reading/${id}`);
  }

  // Status Management
  async startReading(id: string): Promise<ReadingItemDTO> {
    await this.client.put(`/reading/${id}/start`);
    // Return the updated item by fetching it again
    return this.getReadingItem(id);
  }

  async updateProgress(id: string, data: UpdateProgressDTO): Promise<ReadingItemDTO> {
    const payload = {
      percentage: data.progress,
      current_page: data.currentPage
    };
    await this.client.put(`/reading/${id}/progress`, payload);
    // Return the updated item by fetching it again
    return this.getReadingItem(id);
  }

  async finishReading(id: string, data: FinishReadingDTO): Promise<ReadingItemDTO> {
    const payload = {
      rating: data.rating || 3,
      review: data.review || ''
    };
    await this.client.put(`/reading/${id}/finish`, payload);
    // Return the updated item by fetching it again
    return this.getReadingItem(id);
  }

  // Statistics
  async getStatistics(): Promise<ReadingStatisticsDTO> {
    const response: AxiosResponse<ReadingStatisticsDTO> = await this.client.get('/reading/stats');
    return response.data;
  }

  // Vault Management
  async getVaultStatus(): Promise<{
    initialized: boolean;
    connected: boolean;
    lastSync?: string;
    remoteUrl?: string;
  }> {
    const response = await this.client.get('/vault/status');
    return response.data;
  }

  async initializeVault(path: string): Promise<void> {
    await this.client.post('/vault/init', { path });
  }

  async cloneVault(url: string, path: string): Promise<void> {
    await this.client.post('/vault/clone', { url, path });
  }

  async syncVault(): Promise<void> {
    await this.client.post('/vault/sync');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Health endpoint is at root level, not under /api
      await this.client.get('http://localhost:8080/health');
      return true;
    } catch {
      return false;
    }
  }
}