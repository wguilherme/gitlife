export class Rating {
  constructor(public readonly value: number) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 1 || this.value > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    if (!Number.isInteger(this.value)) {
      throw new Error('Rating must be an integer');
    }
  }

  // Static factory methods
  static onestar(): Rating {
    return new Rating(1);
  }

  static twoStars(): Rating {
    return new Rating(2);
  }

  static threeStars(): Rating {
    return new Rating(3);
  }

  static fourStars(): Rating {
    return new Rating(4);
  }

  static fiveStars(): Rating {
    return new Rating(5);
  }

  // Comparison methods
  equals(other: Rating): boolean {
    return this.value === other.value;
  }

  isHigherThan(other: Rating): boolean {
    return this.value > other.value;
  }

  isLowerThan(other: Rating): boolean {
    return this.value < other.value;
  }

  // Display methods
  toString(): string {
    return `${this.value}/5`;
  }

  toStars(): string {
    return '★'.repeat(this.value) + '☆'.repeat(5 - this.value);
  }

  // Quality assessment
  getQuality(): 'poor' | 'fair' | 'good' | 'very-good' | 'excellent' {
    switch (this.value) {
      case 1:
        return 'poor';
      case 2:
        return 'fair';
      case 3:
        return 'good';
      case 4:
        return 'very-good';
      case 5:
        return 'excellent';
      default:
        return 'good';
    }
  }

  getQualityColor(): string {
    switch (this.value) {
      case 1:
        return 'red';
      case 2:
        return 'orange';
      case 3:
        return 'yellow';
      case 4:
        return 'blue';
      case 5:
        return 'green';
      default:
        return 'gray';
    }
  }

  // Business logic
  isPositiveReview(): boolean {
    return this.value >= 4;
  }

  isNegativeReview(): boolean {
    return this.value <= 2;
  }

  isNeutralReview(): boolean {
    return this.value === 3;
  }

  // Get all possible ratings
  static getAll(): Rating[] {
    return [
      Rating.onestar(),
      Rating.twoStars(),
      Rating.threeStars(),
      Rating.fourStars(),
      Rating.fiveStars(),
    ];
  }

  // Average calculation helper (static method)
  static average(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return Number((sum / ratings.length).toFixed(1));
  }
}