import { ReadingItemDTO, CreateReadingItemDTO, UpdateReadingItemDTO, UpdateProgressDTO, FinishReadingDTO, ReadingItemFiltersDTO, ReadingStatisticsDTO } from '../dto/ReadingItemDTO';

export interface IApiClient {
  // Reading Items
  getReadingItems(filters?: ReadingItemFiltersDTO): Promise<ReadingItemDTO[]>;
  getReadingItem(id: string): Promise<ReadingItemDTO>;
  createReadingItem(data: CreateReadingItemDTO): Promise<ReadingItemDTO>;
  updateReadingItem(id: string, data: UpdateReadingItemDTO): Promise<ReadingItemDTO>;
  deleteReadingItem(id: string): Promise<void>;

  // Status Management
  startReading(id: string): Promise<ReadingItemDTO>;
  updateProgress(id: string, data: UpdateProgressDTO): Promise<ReadingItemDTO>;
  finishReading(id: string, data: FinishReadingDTO): Promise<ReadingItemDTO>;

  // Statistics
  getStatistics(): Promise<ReadingStatisticsDTO>;

  // Vault Management
  getVaultStatus(): Promise<{
    initialized: boolean;
    connected: boolean;
    lastSync?: string;
    remoteUrl?: string;
  }>;
  
  initializeVault(path: string): Promise<void>;
  cloneVault(url: string, path: string): Promise<void>;
  syncVault(): Promise<void>;
}