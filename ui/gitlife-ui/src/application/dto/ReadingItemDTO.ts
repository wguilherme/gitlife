export interface ReadingItemDTO {
  id: string;
  title: string;
  author: string;
  type: string; // book, article, video, course
  status: 'to-read' | 'reading' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  progress?: number;
  current_page?: number;
  rating?: number;
  review?: string;
  url?: string;
  added?: string; // ISO string
  started?: string; // ISO string
  finished?: string; // ISO string
}

export interface CreateReadingItemDTO {
  title: string;
  author: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
}

export interface UpdateReadingItemDTO {
  title?: string;
  author?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
}

export interface UpdateProgressDTO {
  progress: number;
  currentPage?: number;
}

export interface FinishReadingDTO {
  rating?: number;
  review?: string;
}

export interface ReadingItemFiltersDTO {
  status?: 'to-read' | 'reading' | 'done';
  tag?: string;
  search?: string;
}

export interface ReadingStatisticsDTO {
  total: number;
  toRead: number;
  reading: number;
  finished: number;
  averageRating: number;
  finishedThisYear: number;
  readingVelocity: number; // books per month
  mostReadTags: string[];
  favoriteAuthors: string[];
  currentStreak: number;
}

export interface ReadingGoalsDTO {
  yearlyGoal: number;
  monthlyGoal: number;
  currentProgress: number;
  isOnTrack: boolean;
}