import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton pattern for client-side Supabase client with proper auth
let supabaseInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Enable Supabase Auth with enhanced token refresh
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Refresh token when it's 60 seconds before expiry
        refreshTokenMarginSeconds: 60,
        // Storage key for session persistence
        storageKey: 'inventory-auth-token',
        // Custom storage implementation for better reliability
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

    // Add global error handler for auth errors
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed automatically by Supabase')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing local storage')
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('inventory-auth-token')
        }
      }
    })
  }
  return supabaseInstance
})()

// Simplified API wrapper for database operations
export class SupabaseAPI {
  static async select<T>(
    table: string,
    query: string = '*',
    filters?: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      let queryBuilder = supabase.from(table).select(query)
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value)
        })
      }
      
      return await queryBuilder
    } catch (error) {
      console.error('Supabase select error:', error)
      return { data: null, error }
    }
  }

  static async insert<T>(
    table: string,
    data: any
  ): Promise<{ data: T | null; error: any }> {
    try {
      return await supabase.from(table).insert(data).select().single()
    } catch (error) {
      console.error('Supabase insert error:', error)
      return { data: null, error }
    }
  }

  static async update<T>(
    table: string,
    data: any,
    filters: Record<string, any>
  ): Promise<{ data: T | null; error: any }> {
    try {
      let queryBuilder = supabase.from(table).update(data)
      
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
      
      return await queryBuilder.select().single()
    } catch (error) {
      console.error('Supabase update error:', error)
      return { data: null, error }
    }
  }

  static async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: any; error: any }> {
    try {
      let queryBuilder = supabase.from(table).delete()
      
      Object.entries(filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value)
      })
      
      return await queryBuilder
    } catch (error) {
      console.error('Supabase delete error:', error)
      return { data: null, error }
    }
  }
}
