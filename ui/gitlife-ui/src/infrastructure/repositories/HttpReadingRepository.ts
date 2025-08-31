import { IReadingRepository, ReadingItemFilters } from '../../domain/repositories/IReadingRepository';
import { ReadingItem } from '../../domain/entities/ReadingItem';
import { Status } from '../../domain/value-objects/Status';
import { Priority } from '../../domain/value-objects/Priority';
import { Progress } from '../../domain/value-objects/Progress';
import { Rating } from '../../domain/value-objects/Rating';
import { IApiClient } from '../../application/ports/IApiClient';
import { ReadingItemDTO } from '../../application/dto/ReadingItemDTO';

export class HttpReadingRepository implements IReadingRepository {
  constructor(private readonly apiClient: IApiClient) {}

  async findAll(filters?: ReadingItemFilters): Promise<ReadingItem[]> {
    const dtoFilters = filters ? {
      status: filters.status?.value,
      tag: filters.tag,
      search: filters.search,
    } : undefined;

    const dtos = await this.apiClient.getReadingItems(dtoFilters);
    return dtos.map(dto => this.toDomain(dto));
  }

  async findById(id: string): Promise<ReadingItem | null> {
    try {
      const dto = await this.apiClient.getReadingItem(id);
      return this.toDomain(dto);
    } catch (error) {
      // If 404, return null
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async findByStatus(status: Status): Promise<ReadingItem[]> {
    return this.findAll({ status });
  }

  async findByTag(tag: string): Promise<ReadingItem[]> {
    return this.findAll({ tag });
  }

  async search(query: string): Promise<ReadingItem[]> {
    return this.findAll({ search: query });
  }

  async count(filters?: ReadingItemFilters): Promise<number> {
    const items = await this.findAll(filters);
    return items.length;
  }

  async save(item: ReadingItem): Promise<ReadingItem> {
    const dto = this.toDTO(item);
    
    // Try to find existing item to determine if we should create or update
    const existingItem = await this.findById(item.id);
    
    let savedDto: ReadingItemDTO;
    if (existingItem) {
      // Update existing item
      savedDto = await this.apiClient.updateReadingItem(item.id, {
        title: dto.title,
        author: dto.author,
        priority: dto.priority,
        tags: dto.tags,
        notes: dto.notes,
      });
    } else {
      // Create new item
      savedDto = await this.apiClient.createReadingItem({
        title: dto.title,
        author: dto.author,
        priority: dto.priority,
        tags: dto.tags,
        notes: dto.notes,
      });
    }
    
    return this.toDomain(savedDto);
  }

  async saveMany(items: ReadingItem[]): Promise<ReadingItem[]> {
    const savedItems: ReadingItem[] = [];
    for (const item of items) {
      const savedItem = await this.save(item);
      savedItems.push(savedItem);
    }
    return savedItems;
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.deleteReadingItem(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  async updateStatus(id: string, status: Status): Promise<ReadingItem> {
    let dto: ReadingItemDTO;
    
    if (status.isReading()) {
      dto = await this.apiClient.startReading(id);
    } else if (status.isFinished()) {
      dto = await this.apiClient.finishReading(id, {});
    } else {
      throw new Error(`Cannot update to status: ${status.value}`);
    }
    
    return this.toDomain(dto);
  }

  async updateProgress(id: string, progress: number): Promise<ReadingItem> {
    const dto = await this.apiClient.updateProgress(id, { progress });
    return this.toDomain(dto);
  }

  async getStatistics(): Promise<{
    total: number;
    toRead: number;
    reading: number;
    finished: number;
    averageRating: number;
  }> {
    const allItems = await this.findAll();
    
    const toRead = allItems.filter(item => item.status.isToRead()).length;
    const reading = allItems.filter(item => item.status.isReading()).length;
    const finished = allItems.filter(item => item.status.isFinished()).length;
    
    const ratedItems = allItems.filter(item => item.rating);
    const averageRating = ratedItems.length > 0
      ? ratedItems.reduce((sum, item) => sum + item.rating!.value, 0) / ratedItems.length
      : 0;
    
    return {
      total: allItems.length,
      toRead,
      reading,
      finished,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // Private conversion methods
  private toDomain(dto: ReadingItemDTO): ReadingItem {
    return new ReadingItem(
      dto.id,
      dto.title,
      dto.author,
      new Status(dto.status),
      new Priority(dto.priority),
      dto.tags,
      dto.progress ? new Progress(dto.progress) : undefined,
      dto.rating ? new Rating(dto.rating) : undefined,
      dto.notes,
      dto.startDate ? new Date(dto.startDate) : undefined,
      dto.finishDate ? new Date(dto.finishDate) : undefined,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  private toDTO(item: ReadingItem): ReadingItemDTO {
    return {
      id: item.id,
      title: item.title,
      author: item.author,
      status: item.status.value,
      priority: item.priority.value,
      tags: item.tags,
      progress: item.progress?.value,
      rating: item.rating?.value,
      notes: item.notes,
      startDate: item.startDate?.toISOString(),
      finishDate: item.finishDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}