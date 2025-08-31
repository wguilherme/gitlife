import { ReadingItem } from '../../../domain/entities/ReadingItem';
import { IReadingRepository } from '../../../domain/repositories/IReadingRepository';
import { ReadingItemDTO, UpdateProgressDTO } from '../../dto/ReadingItemDTO';

export interface IUpdateProgressUseCase {
  execute(id: string, data: UpdateProgressDTO): Promise<ReadingItemDTO>;
}

export class UpdateProgressUseCase implements IUpdateProgressUseCase {
  constructor(private readonly repository: IReadingRepository) {}

  async execute(id: string, data: UpdateProgressDTO): Promise<ReadingItemDTO> {
    // Find the item
    const item = await this.repository.findById(id);
    if (!item) {
      throw new Error(`Reading item with id ${id} not found`);
    }

    // Validate progress value
    if (data.progress < 0 || data.progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    // Update progress (domain logic with validation)
    const updatedItem = item.updateProgress(data.progress);

    // Auto-finish if progress reaches 100%
    const finalItem = data.progress === 100 
      ? updatedItem.finishReading()
      : updatedItem;

    // Save to repository
    const savedItem = await this.repository.save(finalItem);

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