import { supabase, SupabaseAPI } from "@/lib/supabase"
import { CachedAPI } from "@/lib/cache"
import type { StockItem } from "@/components/providers/auth-provider"

export class StockService {
  static async getAll(forceRefresh: boolean = false): Promise<StockItem[]> {
    return CachedAPI.fetchWithCache(
      'stock_items',
      async () => {
        try {
          const { data, error } = await SupabaseAPI.select<any>('stock_items', '*')

          if (error) throw error

          return data?.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            description: item.description || ''
          })) || []
        } catch (error) {
          console.error('Error fetching stock items:', error)
          throw error
        }
      },
      5 * 60 * 1000, // 5 minutes cache
      forceRefresh
    )
  }

  static async create(item: Omit<StockItem, "id">): Promise<StockItem> {
    try {
      const { data, error } = await SupabaseAPI.insert<any>('stock_items', {
        name: item.name,
        quantity: item.quantity,
        description: item.description
      })

      if (error) throw error

      // Invalidate cache after successful creation
      CachedAPI.invalidateCache('stock_items')

      return {
        id: data.id,
        name: data.name,
        quantity: data.quantity,
        description: data.description || ''
      }
    } catch (error) {
      console.error('Error creating stock item:', error)
      throw error
    }
  }

  static async updateQuantity(id: string, quantity: number): Promise<void> {
    try {
      const { error } = await SupabaseAPI.update('stock_items', { quantity }, { id })

      if (error) throw error

      // Invalidate cache after successful update
      CachedAPI.invalidateCache('stock_items')
    } catch (error) {
      console.error('Error updating stock quantity:', error)
      throw error
    }
  }

  static async updateMultiple(items: StockItem[]): Promise<void> {
    try {
      const updates = items.map(item => 
        SupabaseAPI.update('stock_items', { quantity: item.quantity }, { id: item.id })
      )

      await Promise.all(updates)

      // Invalidate cache after successful updates
      CachedAPI.invalidateCache('stock_items')
    } catch (error) {
      console.error('Error updating multiple stock items:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      console.log('Attempting to delete stock item with ID:', id)
      const { data, error } = await SupabaseAPI.delete('stock_items', { id })

      console.log('Delete result:', { data, error })
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      // Invalidate cache after successful deletion
      CachedAPI.invalidateCache('stock_items')
      
      console.log('Stock item deleted successfully')
    } catch (error) {
      console.error('Error deleting stock item:', error)
      throw error
    }
  }
}
