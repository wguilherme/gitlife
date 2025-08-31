import { IReadingRepository } from '../../../domain/repositories/IReadingRepository';
import { ReadingDomainService } from '../../../domain/services/ReadingDomainService';
import { ReadingStatisticsDTO } from '../../dto/ReadingItemDTO';

export interface IGetReadingStatisticsUseCase {
  execute(): Promise<ReadingStatisticsDTO>;
}

export class GetReadingStatisticsUseCase implements IGetReadingStatisticsUseCase {
  constructor(
    private readonly repository: IReadingRepository,
    private readonly domainService: ReadingDomainService
  ) {}

  async execute(): Promise<ReadingStatisticsDTO> {
    // Get all items
    const allItems = await this.repository.findAll();

    // Get basic statistics from repository
    const basicStats = await this.repository.getStatistics();

    // Calculate advanced statistics using domain service
    const advancedStats = this.domainService.calculateStatistics(allItems);
    
    // Calculate reading streak
    const currentStreak = this.domainService.calculateReadingStreak(allItems);

    // Combine all statistics
    return {
      total: basicStats.total,
      toRead: basicStats.toRead,
      reading: basicStats.reading,
      finished: basicStats.finished,
      averageRating: basicStats.averageRating,
      finishedThisYear: advancedStats.finishedThisYear,
      readingVelocity: advancedStats.readingVelocity,
      mostReadTags: advancedStats.mostReadTags,
      favoriteAuthors: advancedStats.favoriteAuthors,
      currentStreak,
    };
  }
}