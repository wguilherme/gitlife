import { ReadingItem } from '../../../domain/entities/ReadingItem';
import { IReadingRepository } from '../../../domain/repositories/IReadingRepository';
import { ReadingDomainService } from '../../../domain/services/ReadingDomainService';
import { Status } from '../../../domain/value-objects/Status';
import { ReadingItemDTO } from '../../dto/ReadingItemDTO';

export interface IStartReadingUseCase {
  execute(id: string): Promise<ReadingItemDTO>;
}

export class StartReadingUseCase implements IStartReadingUseCase {
  constructor(
    private readonly repository: IReadingRepository,
    private readonly domainService: ReadingDomainService
  ) {}

  async execute(id: string): Promise<ReadingItemDTO> {
    // Find the item
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error(`Reading item with id ${id} not found`);
    }

    // Check if user is already reading too many items
    const currentlyReadingItems = await this.repository.findByStatus(Status.reading());
    if (currentlyReadingItems.length >= 5) {
      throw new Error('You are already reading too many books. Please finish some before starting new ones.');
    }

    // Validate business rules through domain service
    if (!this.domainService.canMoveToStatus(item, Status.reading())) {
      throw new Error('Cannot start reading: item is not in "to-read" status');
    }

    // Start reading (domain logic)
    const updatedItem = item.startReading();

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