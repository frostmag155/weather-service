interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private storage = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 15 * 60 * 1000): void {
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.storage.get(key);
    
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.storage.delete(key);
      return null;
    }

    return item.data as T;
  }
}

export default new Cache();