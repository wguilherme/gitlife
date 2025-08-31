import { ReadingItem } from '../entities/ReadingItem';
import { Status } from '../value-objects/Status';

export interface ReadingItemFilters {
  status?: Status;
  tag?: string;
  search?: string;
}

export interface IReadingRepository {
  // Query methods
  findAll(filters?: ReadingItemFilters): Promise<ReadingItem[]>;
  findById(id: string): Promise<ReadingItem | null>;
  findByStatus(status: Status): Promise<ReadingItem[]>;
  findByTag(tag: string): Promise<ReadingItem[]>;
  search(query: string): Promise<ReadingItem[]>;
  count(filters?: ReadingItemFilters): Promise<number>;

  // Command methods
  save(item: ReadingItem): Promise<ReadingItem>;
  saveMany(items: ReadingItem[]): Promise<ReadingItem[]>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;

  // Bulk operations
  updateStatus(id: string, status: Status): Promise<ReadingItem>;
  updateProgress(id: string, progress: number): Promise<ReadingItem>;
  
  // Statistics
  getStatistics(): Promise<{
    total: number;
    toRead: number;
    reading: number;
    finished: number;
    averageRating: number;
  }>;
}