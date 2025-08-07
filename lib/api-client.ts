import { supabase } from './supabase'

// Enhanced API client with automatic token refresh and retry logic
export class APIClient {
  private static maxRetries = 3
  private static retryDelay = 1000 // 1 second

  // Generic method to handle API calls with automatic retry on auth failures
  static async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    retryCount = 0
  ): Promise<{ data: T | null; error: any }> {
    try {
      const result = await operation()
      
      // Check if the error is auth-related
      if (result.error && this.isAuthError(result.error)) {
        console.log('Auth error detected, attempting token refresh...')
        
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && retryCount < this.maxRetries) {
          console.log('Token refreshed, retrying operation...')
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          return this.executeWithRetry(operation, retryCount + 1)
        } else if (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Force sign out if refresh fails
          await supabase.auth.signOut()
          return { data: null, error: { message: 'Authentication failed. Please sign in again.' } }
        }
      }
      
      return result
    } catch (error) {
      console.error('API operation failed:', error)
      return { data: null, error }
    }
  }

  // Check if an error is authentication-related
  private static isAuthError(error: any): boolean {
    if (!error) return false
    
    const authErrorCodes = [
      'PGRST301', // JWT expired
      'PGRST302', // JWT invalid
      'invalid_token',
      'token_expired',
      'unauthorized'
    ]
    
    const errorMessage = error.message?.toLowerCase() || ''
    const errorCode = error.code || ''
    
    return authErrorCodes.some(code => 
      errorCode.includes(code) || errorMessage.includes(code.toLowerCase())
    ) || errorMessage.includes('jwt') || errorMessage.includes('unauthorized')
  }

  // Enhanced database operations with retry logic
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

  // Bulk operations with retry logic
  static async bulkInsert<T>(
    table: string,
    data: any[]
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(async () => {
      return await supabase.from(table).insert(data).select()
    })
  }

  static async bulkUpdate<T>(
    table: string,
    updates: Array<{ filters: Record<string, any>; data: any }>
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(async () => {
      const results = []
      for (const update of updates) {
        let queryBuilder = supabase.from(table).update(update.data)
        
        Object.entries(update.filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })
        
        const result = await queryBuilder.select().single()
        if (result.error) {
          return { data: null, error: result.error }
        }
        results.push(result.data)
      }
      return { data: results as T[], error: null }
    })
  }

  static async bulkDelete(
    table: string,
    filtersList: Array<Record<string, any>>
  ): Promise<{ data: any; error: any }> {
    return this.executeWithRetry(async () => {
      for (const filters of filtersList) {
        let queryBuilder = supabase.from(table).delete()
        
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })
        
        const result = await queryBuilder
        if (result.error) {
          return { data: null, error: result.error }
        }
      }
      return { data: true, error: null }
    })
  }
}

// Export for backward compatibility
export const SupabaseAPI = APIClient