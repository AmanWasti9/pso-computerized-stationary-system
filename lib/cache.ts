// Cache utility for optimizing data loading and reducing API calls
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  cacheHits: number;
  cacheMisses: number;
  apiCalls: number;
  averageResponseTime: number;
}

export class CacheManager {
  private static cache = new Map<string, CacheEntry>()
  private static cleanupInterval: NodeJS.Timeout | null = null
  private static stats: CacheStats = {
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    averageResponseTime: 0
  }
  private static responseTimes: number[] = []
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  static {
    // Start cleanup interval when class is first loaded
    this.startCleanup()
  }

  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Also store in localStorage for persistence across sessions
    if (typeof window !== 'undefined') {
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          ttl
        }
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData))
      } catch (error) {
        console.warn('Failed to store cache in localStorage:', error)
      }
    }
  }

  static get<T>(key: string): T | null {
    // First check memory cache
    const memoryItem = this.cache.get(key)
    if (memoryItem && this.isValid(memoryItem)) {
      this.stats.cacheHits++
      return memoryItem.data
    }

    // Then check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          const item = JSON.parse(stored)
          if (this.isValid(item)) {
            // Restore to memory cache
            this.cache.set(key, item)
            this.stats.cacheHits++
            return item.data
          } else {
            // Remove expired item
            localStorage.removeItem(`cache_${key}`)
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cache from localStorage:', error)
      }
    }

    this.stats.cacheMisses++
    return null
  }

  static invalidate(key: string): void {
    this.cache.delete(key)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  static invalidatePattern(pattern: string): void {
    // Invalidate memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }

    // Invalidate localStorage cache
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cache_') && key.includes(pattern)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  static clear(): void {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    
    // Reset stats
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      averageResponseTime: 0
    }
    this.responseTimes = []
  }

  static recordApiCall(responseTime: number): void {
    this.stats.apiCalls++
    this.responseTimes.push(responseTime)
    
    // Keep only last 100 response times for average calculation
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100)
    }
    
    // Calculate average response time
    this.stats.averageResponseTime = Math.round(
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
    )
  }

  static getStats(): CacheStats {
    return { ...this.stats }
  }

  private static isValid(item: { timestamp: number; ttl: number }): boolean {
    return Date.now() - item.timestamp < item.ttl
  }

  // Cleanup expired items periodically
  static startCleanup(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        // Clean memory cache
        for (const [key, item] of this.cache.entries()) {
          if (!this.isValid(item)) {
            this.cache.delete(key)
          }
        }

        // Clean localStorage cache
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)
          if (storageKey && storageKey.startsWith('cache_')) {
            try {
              const item = JSON.parse(localStorage.getItem(storageKey) || '{}')
              if (!this.isValid(item)) {
                keysToRemove.push(storageKey)
              }
            } catch {
              keysToRemove.push(storageKey)
            }
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }, 60000) // Clean every minute
    }
  }
}

// Enhanced fetch wrapper with caching and retry logic
export class CachedAPI {
  static async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000, // 5 minutes default
    forceRefresh: boolean = false
  ): Promise<T> {
    const startTime = Date.now()
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = CacheManager.get<T>(key)
      if (cached !== null) {
        return cached
      }
    }

    try {
      // Fetch fresh data
      const data = await fetchFn()
      
      // Record API call performance
      const responseTime = Date.now() - startTime
      CacheManager.recordApiCall(responseTime)
      
      // Cache the result
      CacheManager.set(key, data, ttl)
      
      return data
    } catch (error) {
      // Record failed API call
      const responseTime = Date.now() - startTime
      CacheManager.recordApiCall(responseTime)
      
      // If fetch fails, try to return stale data as fallback
      if (!forceRefresh) {
        const stale = CacheManager.get<T>(key)
        if (stale !== null) {
          console.warn(`Fetch failed for ${key}, returning stale data:`, error)
          return stale
        }
      }
      
      throw error
    }
  }

  static invalidateCache(pattern: string): void {
    CacheManager.invalidatePattern(pattern)
  }
}

// Initialize cleanup on module load
if (typeof window !== 'undefined') {
  CacheManager.startCleanup()
}