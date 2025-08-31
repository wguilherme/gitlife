import { ReadingItem } from '../../../domain/entities/ReadingItem';
import { IReadingRepository } from '../../../domain/repositories/IReadingRepository';
import { ReadingDomainService } from '../../../domain/services/ReadingDomainService';
import { Status } from '../../../domain/value-objects/Status';
import { ReadingItemDTO, FinishReadingDTO } from '../../dto/ReadingItemDTO';

export interface IFinishReadingUseCase {
  execute(id: string, data: FinishReadingDTO): Promise<ReadingItemDTO>;
}

export class FinishReadingUseCase implements IFinishReadingUseCase {
  constructor(
    private readonly repository: IReadingRepository,
    private readonly domainService: ReadingDomainService
  ) {}

  async execute(id: string, data: FinishReadingDTO): Promise<ReadingItemDTO> {
    // Find the item
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error(`Reading item with id ${id} not found`);
    }

    // Validate business rules
    if (!this.domainService.canMoveToStatus(item, Status.finished())) {
      throw new Error('Cannot finish reading: item is not currently being read');
    }

    // Validate rating if provided
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Finish reading (domain logic)
    let updatedItem = item.finishReading(data.rating);

    // Add notes if provided
    if (data.notes) {
      updatedItem = new ReadingItem(
        updatedItem.id,
        updatedItem.title,
        updatedItem.author,
        updatedItem.status,
        updatedItem.priority,
        updatedItem.tags,
        updatedItem.progress,
        updatedItem.rating,
        data.notes.trim(),
        updatedItem.startDate,
        updatedItem.finishDate,
        updatedItem.createdAt,
        new Date()
      );
    }

    // Save to repository
    const savedItem = await this.repository.save(updatedItem);

    // Convert to DTO
    return this.toDTO(savedItem);
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