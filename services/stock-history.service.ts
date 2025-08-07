import { supabase } from "@/lib/supabase"
import type { StockHistoryEntry } from "@/components/providers/auth-provider"

export class StockHistoryService {
  static async getAll(): Promise<StockHistoryEntry[]> {
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
  }

  static async create(entry: Omit<StockHistoryEntry, "timestamp">): Promise<StockHistoryEntry> {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .insert({
          item_name: entry.itemName,
          quantity: entry.quantity,
          type: entry.type,
          description: entry.description,
          date: entry.date,
          added_by: entry.addedBy
        })
        .select()
        .single()

      if (error) throw error

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
      const { error } = await supabase
        .from('stock_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

      if (error) throw error
    } catch (error) {
      console.error('Error deleting stock history:', error)
      throw error
    }
  }

  static async deleteByDateAndUser(date: string, addedBy: string): Promise<void> {
    try {
      console.log('Attempting to delete stock history with date:', date, 'and addedBy:', addedBy)
      
      const { data, error } = await supabase
        .from('stock_history')
        .delete()
        .eq('date', date)
        .eq('added_by', addedBy)
        .select()

      console.log('Delete result:', { data, error })
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      console.log('Successfully deleted entries:', data)
    } catch (error) {
      console.error('Error deleting stock history by date and user:', error)
      throw error
    }
  }

  static async deleteByType(type: "new_item" | "stock_addition" | "stock_dispatch"): Promise<void> {
    try {
      console.log('Attempting to delete stock history by type:', type)
      
      const { data, error } = await supabase
        .from('stock_history')
        .delete()
        .eq('type', type)
        .select()

      console.log('Delete by type result:', { data, error })
      
      if (error) {
        console.error('Supabase delete by type error:', error)
        throw error
      }
      
      console.log('Successfully deleted entries by type:', data)
    } catch (error) {
      console.error('Error deleting stock history by type:', error)
      throw error
    }
  }

  static async deleteByDescription(description: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stock_history')
        .delete()
        .eq('description', description)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting stock history by description:', error)
      throw error
    }
  }
}
