import { ReadingItem } from '../../../domain/entities/ReadingItem';
import { Priority } from '../../../domain/value-objects/Priority';
import { IReadingRepository } from '../../../domain/repositories/IReadingRepository';
import { CreateReadingItemDTO, ReadingItemDTO } from '../../dto/ReadingItemDTO';

export interface ICreateReadingItemUseCase {
  execute(data: CreateReadingItemDTO): Promise<ReadingItemDTO>;
}

export class CreateReadingItemUseCase implements ICreateReadingItemUseCase {
  constructor(private readonly repository: IReadingRepository) {}

  async execute(data: CreateReadingItemDTO): Promise<ReadingItemDTO> {
    // Validate input
    if (!data.title.trim()) {
      throw new Error('Title is required');
    }
    if (!data.author.trim()) {
      throw new Error('Author is required');
    }

    // Create domain entity
    const readingItem = ReadingItem.create({
      id: this.generateId(),
      title: data.title.trim(),
      author: data.author.trim(),
      priority: data.priority ? new Priority(data.priority) : Priority.medium(),
      tags: data.tags || [],
    });

    // Add notes if provided
    const itemWithNotes = data.notes 
      ? new ReadingItem(
          readingItem.id,
          readingItem.title,
          readingItem.author,
          readingItem.status,
          readingItem.priority,
          readingItem.tags,
          readingItem.progress,
          readingItem.rating,
          data.notes.trim(),
          readingItem.startDate,
          readingItem.finishDate,
          readingItem.createdAt,
          readingItem.updatedAt
        )
      : readingItem;

    // Save to repository
    const savedItem = await this.repository.save(itemWithNotes);

    // Convert to DTO
    return this.toDTO(savedItem);
  }

  private generateId(): string {
    return `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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