export interface IStorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  exists(key: string): boolean;
}

export class LocalStorageAdapter implements IStorageAdapter {
  private readonly prefix: string;

  constructor(prefix = 'gitlife_') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to get item from localStorage:`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error(`Failed to set item in localStorage:`, error);
      throw new Error(`Failed to save data to local storage`);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`Failed to remove item from localStorage:`, error);
    }
  }

  clear(): void {
    try {
      // Only clear items with our prefix
      const keys = Object.keys(localStorage);
      keys
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error(`Failed to clear localStorage:`, error);
    }
  }

  exists(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Additional utility methods
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch {
      return [];
    }
  }

  getSize(): number {
    try {
      return this.getAllKeys().length;
    } catch {
      return 0;
    }
  }

  // Specific methods for common use cases
  setUserPreference(key: string, value: any): void {
    this.set(`user_pref_${key}`, value);
  }

  getUserPreference<T>(key: string, defaultValue?: T): T | null {
    const value = this.get<T>(`user_pref_${key}`);
    return value !== null ? value : defaultValue || null;
  }

  setCacheItem(key: string, value: any, ttlMinutes?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttlMinutes ? ttlMinutes * 60 * 1000 : undefined,
    };
    this.set(`cache_${key}`, item);
  }

  getCacheItem<T>(key: string): T | null {
    const item = this.get<{
      value: T;
      timestamp: number;
      ttl?: number;
    }>(`cache_${key}`);

    if (!item) return null;

    // Check if item has expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.remove(`cache_${key}`);
      return null;
    }

    return item.value;
  }
}