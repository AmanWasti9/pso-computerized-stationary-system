import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = "https://mmlrujbbhepfsvakbvaj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbHJ1amJiaGVwZnN2YWtidmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDI0MzcsImV4cCI6MjA2OTgxODQzN30.i29L3FtK5YG-X-jBsCKxJiTrVqXnymWUT08GiQgouHs";

// Singleton pattern for client-side Supabase client with optimizations
let supabaseInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Automatically refresh tokens when they expire
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
        // Detect session in URL (for OAuth flows)
        detectSessionInUrl: true,
        // Storage key for session
        storageKey: 'inventory-auth-token',
        // Custom storage implementation for better performance
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key)
            }
            return null
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value)
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key)
            }
          }
        }
      },
      // Global configuration for better performance
      global: {
        headers: {
          'x-client-info': 'inventory-management@1.0.0'
        }
      },
      // Realtime configuration
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    // Add global error handler for token refresh issues
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        // Clear any cached data
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('inventory-cache')
        }
      }
    })
  }
  return supabaseInstance
})()

// Enhanced API wrapper with retry logic and token refresh handling
export class SupabaseAPI {
  private static async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    maxRetries: number = 3
  ): Promise<{ data: T | null; error: any }> {
    let lastError: any = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()
        
        // If we get an auth error, try to refresh the session
        if (result.error?.message?.includes('JWT') || result.error?.code === 'PGRST301') {
          console.log(`Auth error detected on attempt ${attempt}, refreshing session...`)
          
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error('Failed to refresh session:', refreshError)
            return result
          }
          
          // Retry the operation after refresh
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
        }
        
        return result
      } catch (error) {
        lastError = error
        console.error(`Attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        }
      }
    }
    
    return { data: null, error: lastError }
  }

  static async select<T>(
    table: string,
    query: string = '*',
    filters?: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(async () => {
      let queryBuilder = supabase.from(table).select(query)
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })
      }
      
      return await queryBuilder
    })
  }

  static async insert<T>(
    table: string,
    data: any
  ): Promise<{ data: T | null; error: any }> {
    return this.executeWithRetry(async () => {
      return await supabase.from(table).insert(data).select().single()
    })
  }

  static async update<T>(
    table: string,
    data: any,
    filters: Record<string, any>
  ): Promise<{ data: T | null; error: any }> {
    return this.executeWithRetry(async () => {
      let queryBuilder = supabase.from(table).update(data)
      
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
      
      return await queryBuilder.select().single()
    })
  }

  static async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: any; error: any }> {
    return this.executeWithRetry(async () => {
      let queryBuilder = supabase.from(table).delete()
      
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
      
      return await queryBuilder
    })
  }
}
