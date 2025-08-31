export class Progress {
  constructor(public readonly value: number) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 0 || this.value > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    if (!Number.isInteger(this.value)) {
      throw new Error('Progress must be an integer');
    }
  }

  // Static factory methods
  static initial(): Progress {
    return new Progress(0);
  }

  static complete(): Progress {
    return new Progress(100);
  }

  static fromPercentage(percentage: number): Progress {
    return new Progress(Math.round(percentage));
  }

  // Business logic methods
  isComplete(): boolean {
    return this.value === 100;
  }

  isStarted(): boolean {
    return this.value > 0;
  }

  isEmpty(): boolean {
    return this.value === 0;
  }

  // Progress operations
  increase(amount: number): Progress {
    const newValue = Math.min(100, this.value + amount);
    return new Progress(newValue);
  }

  decrease(amount: number): Progress {
    const newValue = Math.max(0, this.value - amount);
    return new Progress(newValue);
  }

  setTo(value: number): Progress {
    return new Progress(value);
  }

  // Comparison methods
  equals(other: Progress): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: Progress): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Progress): boolean {
    return this.value < other.value;
  }

  // Display methods
  toString(): string {
    return `${this.value}%`;
  }

  toDecimal(): number {
    return this.value / 100;
  }

  // Progress categories for UI
  getCategory(): 'not-started' | 'in-progress' | 'almost-done' | 'complete' {
    if (this.value === 0) return 'not-started';
    if (this.value === 100) return 'complete';
    if (this.value >= 90) return 'almost-done';
    return 'in-progress';
  }

  getCategoryColor(): string {
    switch (this.getCategory()) {
      case 'not-started':
        return 'gray';
      case 'in-progress':
        return 'blue';
      case 'almost-done':
        return 'orange';
      case 'complete':
        return 'green';
      default:
        return 'gray';
    }
  }

  // Calculate estimated reading time remaining (if total pages known)
  estimateRemainingTime(totalPages: number, pagesPerDay: number): number {
    if (this.isComplete()) return 0;
    
    const remainingProgress = 100 - this.value;
    const remainingPages = (totalPages * remainingProgress) / 100;
    return Math.ceil(remainingPages / pagesPerDay);
  }
}