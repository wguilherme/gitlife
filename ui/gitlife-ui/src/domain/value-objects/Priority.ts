export class Priority {
  private static readonly VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
  
  constructor(public readonly value: 'low' | 'medium' | 'high') {
    this.validate();
  }

  private validate(): void {
    if (!Priority.VALID_PRIORITIES.includes(this.value)) {
      throw new Error(`Invalid priority: ${this.value}. Must be one of: ${Priority.VALID_PRIORITIES.join(', ')}`);
    }
  }

  // Static factory methods
  static low(): Priority {
    return new Priority('low');
  }

  static medium(): Priority {
    return new Priority('medium');
  }

  static high(): Priority {
    return new Priority('high');
  }

  // Comparison methods
  equals(other: Priority): boolean {
    return this.value === other.value;
  }

  isHigherThan(other: Priority): boolean {
    const priorities = { low: 1, medium: 2, high: 3 };
    return priorities[this.value] > priorities[other.value];
  }

  isLowerThan(other: Priority): boolean {
    const priorities = { low: 1, medium: 2, high: 3 };
    return priorities[this.value] < priorities[other.value];
  }

  // Numeric value for sorting
  getNumericValue(): number {
    const priorities = { low: 1, medium: 2, high: 3 };
    return priorities[this.value];
  }

  toString(): string {
    return this.value;
  }

  // Display name for UI
  getDisplayName(): string {
    switch (this.value) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      default:
        return this.value;
    }
  }

  // Get color for UI
  getColor(): string {
    switch (this.value) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  }

  // Get all possible priorities
  static getAll(): Priority[] {
    return [Priority.low(), Priority.medium(), Priority.high()];
  }
}