import { ReadingItem } from '../entities/ReadingItem';
import { Status } from '../value-objects/Status';
import { Priority } from '../value-objects/Priority';

export class ReadingDomainService {
  /**
   * Validates if a reading item can be moved to a target status
   */
  canMoveToStatus(item: ReadingItem, targetStatus: Status): boolean {
    const nextStatuses = item.status.getNextStatuses();
    return nextStatuses.some(status => status.equals(targetStatus));
  }

  /**
   * Calculates reading streak for a user based on their reading history
   */
  calculateReadingStreak(items: ReadingItem[]): number {
    const finishedItems = items
      .filter(item => item.status.isFinished() && item.finishDate)
      .sort((a, b) => b.finishDate!.getTime() - a.finishDate!.getTime());

    if (finishedItems.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    
    // Remove time component for date comparison
    currentDate.setHours(0, 0, 0, 0);

    for (const item of finishedItems) {
      const finishDate = new Date(item.finishDate!);
      finishDate.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (currentDate.getTime() - finishDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference <= 1) {
        streak++;
        currentDate = finishDate;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Suggests next items to read based on priority and tags
   */
  suggestNextReads(items: ReadingItem[], currentlyReading: ReadingItem[], maxSuggestions = 3): ReadingItem[] {
    const toReadItems = items.filter(item => item.status.isToRead());
    
    if (toReadItems.length === 0) return [];

    // Don't suggest more if user is already reading too many books
    if (currentlyReading.length >= 3) return [];

    const suggestions = toReadItems
      .sort((a, b) => {
        // First by priority (high to low)
        if (!a.priority.equals(b.priority)) {
          return b.priority.getNumericValue() - a.priority.getNumericValue();
        }
        // Then by creation date (older first)
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, maxSuggestions);

    return suggestions;
  }

  /**
   * Validates reading list balance (not too many items in one status)
   */
  validateListBalance(items: ReadingItem[]): {
    isBalanced: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const statusCounts = {
      'to-read': items.filter(item => item.status.isToRead()).length,
      'reading': items.filter(item => item.status.isReading()).length,
      'finished': items.filter(item => item.status.isFinished()).length,
    };

    // Warn if reading too many books at once
    if (statusCounts.reading > 5) {
      warnings.push('You are reading too many books at once. Consider finishing some before starting new ones.');
    }

    // Warn if to-read list is getting too large
    if (statusCounts['to-read'] > 50) {
      warnings.push('Your to-read list is very large. Consider prioritizing or removing some items.');
    }

    // Warn if no books are being read
    if (statusCounts.reading === 0 && statusCounts['to-read'] > 0) {
      warnings.push('You have books to read but none are currently being read. Start reading something!');
    }

    return {
      isBalanced: warnings.length === 0,
      warnings
    };
  }

  /**
   * Calculates reading statistics and insights
   */
  calculateStatistics(items: ReadingItem[]): {
    totalBooks: number;
    finishedThisYear: number;
    averageRating: number;
    mostReadTags: string[];
    readingVelocity: number; // books per month
    favoriteAuthors: string[];
  } {
    const currentYear = new Date().getFullYear();
    const finishedItems = items.filter(item => item.status.isFinished());
    
    const finishedThisYear = finishedItems.filter(
      item => item.finishDate && item.finishDate.getFullYear() === currentYear
    );

    // Calculate average rating
    const ratedItems = finishedItems.filter(item => item.rating);
    const averageRating = ratedItems.length > 0
      ? ratedItems.reduce((sum, item) => sum + item.rating!.value, 0) / ratedItems.length
      : 0;

    // Get most common tags
    const tagCounts = new Map<string, number>();
    finishedItems.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const mostReadTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate reading velocity (books per month this year)
    const monthsInYear = new Date().getMonth() + 1;
    const readingVelocity = finishedThisYear.length / monthsInYear;

    // Get favorite authors (most read)
    const authorCounts = new Map<string, number>();
    finishedItems.forEach(item => {
      authorCounts.set(item.author, (authorCounts.get(item.author) || 0) + 1);
    });
    const favoriteAuthors = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([author]) => author);

    return {
      totalBooks: items.length,
      finishedThisYear: finishedThisYear.length,
      averageRating: Math.round(averageRating * 10) / 10,
      mostReadTags,
      readingVelocity: Math.round(readingVelocity * 10) / 10,
      favoriteAuthors,
    };
  }

  /**
   * Generates reading goals based on current progress
   */
  generateReadingGoals(items: ReadingItem[]): {
    yearlyGoal: number;
    monthlyGoal: number;
    currentProgress: number;
    isOnTrack: boolean;
  } {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const finishedThisYear = items.filter(
      item => item.status.isFinished() && 
      item.finishDate && 
      item.finishDate.getFullYear() === currentYear
    ).length;

    // Suggest yearly goal based on current pace or historical data
    const suggestedYearlyGoal = Math.max(12, Math.ceil(finishedThisYear * (12 / currentMonth)));
    
    const monthlyGoal = Math.ceil(suggestedYearlyGoal / 12);
    const expectedProgress = (currentMonth / 12) * suggestedYearlyGoal;
    const isOnTrack = finishedThisYear >= expectedProgress * 0.8; // 80% tolerance

    return {
      yearlyGoal: suggestedYearlyGoal,
      monthlyGoal,
      currentProgress: finishedThisYear,
      isOnTrack,
    };
  }
}