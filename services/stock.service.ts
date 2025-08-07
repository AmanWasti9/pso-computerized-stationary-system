import { supabase } from "@/lib/supabase"
import type { StockItem } from "@/components/providers/auth-provider"

export class StockService {
  static async getAll(): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name')

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
  }

  static async create(item: Omit<StockItem, "id">): Promise<StockItem> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          name: item.name,
          quantity: item.quantity,
          description: item.description
        })
        .select()
        .single()

      if (error) throw error

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
      const { error } = await supabase
        .from('stock_items')
        .update({ quantity })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating stock quantity:', error)
      throw error
    }
  }

  static async updateMultiple(items: StockItem[]): Promise<void> {
    try {
      const updates = items.map(item => 
        supabase
          .from('stock_items')
          .update({ quantity: item.quantity })
          .eq('id', item.id)
      )

      await Promise.all(updates)
    } catch (error) {
      console.error('Error updating multiple stock items:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      console.log('Attempting to delete stock item with ID:', id)
      const { data, error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id)

      console.log('Delete result:', { data, error })
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      console.log('Stock item deleted successfully')
    } catch (error) {
      console.error('Error deleting stock item:', error)
      throw error
    }
  }
}
