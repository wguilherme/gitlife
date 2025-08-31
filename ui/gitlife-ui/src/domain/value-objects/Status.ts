export class Status {
  private static readonly VALID_STATUSES = ['to-read', 'reading', 'finished'] as const;
  
  constructor(public readonly value: 'to-read' | 'reading' | 'finished') {
    this.validate();
  }

  private validate(): void {
    if (!Status.VALID_STATUSES.includes(this.value)) {
      throw new Error(`Invalid status: ${this.value}. Must be one of: ${Status.VALID_STATUSES.join(', ')}`);
    }
  }

  // Business logic methods
  isToRead(): boolean {
    return this.value === 'to-read';
  }

  isReading(): boolean {
    return this.value === 'reading';
  }

  isFinished(): boolean {
    return this.value === 'finished';
  }

  canStartReading(): boolean {
    return this.isToRead();
  }

  canFinish(): boolean {
    return this.isReading();
  }

  canUpdateProgress(): boolean {
    return this.isReading();
  }

  // Static factory methods
  static toRead(): Status {
    return new Status('to-read');
  }

  static reading(): Status {
    return new Status('reading');
  }

  static finished(): Status {
    return new Status('finished');
  }

  // Comparison
  equals(other: Status): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Display name for UI
  getDisplayName(): string {
    switch (this.value) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'finished':
        return 'Finished';
      default:
        return this.value;
    }
  }

  // Get next possible statuses
  getNextStatuses(): Status[] {
    switch (this.value) {
      case 'to-read':
        return [Status.reading()];
      case 'reading':
        return [Status.finished()];
      case 'finished':
        return [];
      default:
        return [];
    }
  }
}