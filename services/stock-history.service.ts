import { supabase, SupabaseAPI } from "@/lib/supabase"
import { CachedAPI } from "@/lib/cache"
import type { StockHistoryEntry } from "@/components/providers/auth-provider"

export class StockHistoryService {
  static async getAll(forceRefresh: boolean = false): Promise<StockHistoryEntry[]> {
    return CachedAPI.fetchWithCache(
      'stock_history',
      async () => {
        try {
          const { data, error } = await supabase
            .from('stock_history')
            .select('*')
            .order('date', { ascending: false })

          if (error) throw error

          return data?.map(entry => ({
            itemName: entry.item_name,
            quantity: entry.quantity,
            type: entry.type as "new_item" | "stock_addition" | "stock_dispatch",
            description: entry.description,
            date: entry.date,
            addedBy: entry.added_by,
            timestamp: entry.created_at
          })) || []
        } catch (error) {
          console.error('Error fetching stock history:', error)
          throw error
        }
      },
      2 * 60 * 1000, // 2 minutes cache (shorter as history changes frequently)
      forceRefresh
    )
  }

  static async create(entry: Omit<StockHistoryEntry, "timestamp">): Promise<StockHistoryEntry> {
    try {
      const { data, error } = await SupabaseAPI.insert<any>('stock_history', {
        item_name: entry.itemName,
        quantity: entry.quantity,
        type: entry.type,
        description: entry.description,
        date: entry.date,
        added_by: entry.addedBy
      })

      if (error) throw error

      // Invalidate cache after successful creation
      CachedAPI.invalidateCache('stock_history')

      return {
        itemName: data.item_name,
        quantity: data.quantity,
        type: data.type,
        description: data.description,
        date: data.date,
        addedBy: data.added_by,
        timestamp: data.created_at
      }
    } catch (error) {
      console.error('Error creating stock history entry:', error)
      throw error
    }
  }

  static async createBulk(entries: Omit<StockHistoryEntry, "timestamp">[]): Promise<StockHistoryEntry[]> {
    try {
      const insertData = entries.map(entry => ({
        item_name: entry.itemName,
        quantity: entry.quantity,
        type: entry.type,
        description: entry.description,
        date: entry.date,
        added_by: entry.addedBy
      }))

      const { data, error } = await supabase
        .from('stock_history')
        .insert(insertData)
        .select()

      if (error) throw error

      // Invalidate cache after successful bulk creation
      CachedAPI.invalidateCache('stock_history')

      return data?.map(entry => ({
        itemName: entry.item_name,
        quantity: entry.quantity,
        type: entry.type,
        description: entry.description,
        date: entry.date,
        addedBy: entry.added_by,
        timestamp: entry.created_at
      })) || []
    } catch (error) {
      console.error('Error creating bulk stock history entries:', error)
      throw error
    }
  }

  static async deleteAll(): Promise<void> {
    try {
      const { error } = await SupabaseAPI.delete('stock_history', (query) => 
        query.neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
      )

      if (error) throw error

      // Invalidate cache after successful deletion
      CachedAPI.invalidateCache('stock_history')
    } catch (error) {
      console.error('Error deleting all stock history:', error)
      throw error
    }
  }

  static async deleteByDateAndUser(date: string, addedBy: string): Promise<void> {
    try {
      const { error } = await SupabaseAPI.delete('stock_history', (query) => 
        query.eq('date', date).eq('added_by', addedBy)
      )

      if (error) throw error

      // Invalidate cache after successful deletion
      CachedAPI.invalidateCache('stock_history')
    } catch (error) {
      console.error('Error deleting stock history by date and user:', error)
      throw error
    }
  }

  static async deleteByType(type: "new_item" | "stock_addition" | "stock_dispatch"): Promise<void> {
    try {
      const { error } = await SupabaseAPI.delete('stock_history', (query) => 
        query.eq('type', type)
      )

      if (error) throw error

      // Invalidate cache after successful deletion
      CachedAPI.invalidateCache('stock_history')
    } catch (error) {
      console.error('Error deleting stock history by type:', error)
      throw error
    }
  }

  static async deleteByDescription(description: string): Promise<void> {
    try {
      const { error } = await SupabaseAPI.delete('stock_history', (query) => 
        query.eq('description', description)
      )

      if (error) throw error

      // Invalidate cache after successful deletion
      CachedAPI.invalidateCache('stock_history')
    } catch (error) {
      console.error('Error deleting stock history by description:', error)
      throw error
    }
  }
}
