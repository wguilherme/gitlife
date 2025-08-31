import { Priority } from '../value-objects/Priority';
import { Status } from '../value-objects/Status';
import { Rating } from '../value-objects/Rating';
import { Progress } from '../value-objects/Progress';

export class ReadingItem {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly author: string,
    public readonly status: Status,
    public readonly priority: Priority,
    public readonly tags: string[],
    public readonly progress?: Progress,
    public readonly rating?: Rating,
    public readonly notes?: string,
    public readonly startDate?: Date,
    public readonly finishDate?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title.trim()) {
      throw new Error('Title cannot be empty');
    }
    if (!this.author.trim()) {
      throw new Error('Author cannot be empty');
    }
    if (this.status.isFinished() && !this.finishDate) {
      throw new Error('Finished items must have a finish date');
    }
    if (this.status.isReading() && !this.startDate) {
      throw new Error('Reading items must have a start date');
    }
  }

  // Business logic methods
  startReading(): ReadingItem {
    if (!this.status.canStartReading()) {
      throw new Error('Cannot start reading: item is not in "to-read" status');
    }

    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      Status.reading(),
      this.priority,
      this.tags,
      Progress.initial(),
      this.rating,
      this.notes,
      new Date(),
      this.finishDate,
      this.createdAt,
      new Date()
    );
  }

  updateProgress(progressValue: number): ReadingItem {
    if (!this.status.isReading()) {
      throw new Error('Cannot update progress: item is not being read');
    }

    const newProgress = new Progress(progressValue);
    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      this.status,
      this.priority,
      this.tags,
      newProgress,
      this.rating,
      this.notes,
      this.startDate,
      this.finishDate,
      this.createdAt,
      new Date()
    );
  }

  finishReading(rating?: number): ReadingItem {
    if (!this.status.isReading()) {
      throw new Error('Cannot finish reading: item is not being read');
    }

    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      Status.finished(),
      this.priority,
      this.tags,
      Progress.complete(),
      rating ? new Rating(rating) : this.rating,
      this.notes,
      this.startDate,
      new Date(),
      this.createdAt,
      new Date()
    );
  }

  updatePriority(priority: Priority): ReadingItem {
    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      this.status,
      priority,
      this.tags,
      this.progress,
      this.rating,
      this.notes,
      this.startDate,
      this.finishDate,
      this.createdAt,
      new Date()
    );
  }

  addTag(tag: string): ReadingItem {
    if (this.tags.includes(tag)) {
      return this;
    }

    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      this.status,
      this.priority,
      [...this.tags, tag],
      this.progress,
      this.rating,
      this.notes,
      this.startDate,
      this.finishDate,
      this.createdAt,
      new Date()
    );
  }

  removeTag(tag: string): ReadingItem {
    const newTags = this.tags.filter(t => t !== tag);
    if (newTags.length === this.tags.length) {
      return this;
    }

    return new ReadingItem(
      this.id,
      this.title,
      this.author,
      this.status,
      this.priority,
      newTags,
      this.progress,
      this.rating,
      this.notes,
      this.startDate,
      this.finishDate,
      this.createdAt,
      new Date()
    );
  }

  // Static factory methods
  static create(params: {
    id: string;
    title: string;
    author: string;
    priority?: Priority;
    tags?: string[];
  }): ReadingItem {
    return new ReadingItem(
      params.id,
      params.title,
      params.author,
      Status.toRead(),
      params.priority || Priority.medium(),
      params.tags || []
    );
  }

  // Convert to plain object for serialization
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      status: this.status.value,
      priority: this.priority.value,
      tags: this.tags,
      progress: this.progress?.value,
      rating: this.rating?.value,
      notes: this.notes,
      startDate: this.startDate?.toISOString(),
      finishDate: this.finishDate?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  // Create from plain object
  static fromJSON(data: any): ReadingItem {
    return new ReadingItem(
      data.id,
      data.title,
      data.author,
      new Status(data.status),
      new Priority(data.priority),
      data.tags || [],
      data.progress ? new Progress(data.progress) : undefined,
      data.rating ? new Rating(data.rating) : undefined,
      data.notes,
      data.startDate ? new Date(data.startDate) : undefined,
      data.finishDate ? new Date(data.finishDate) : undefined,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
}