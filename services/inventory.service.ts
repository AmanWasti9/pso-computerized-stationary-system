import { supabase } from "@/lib/supabase"
import type { InventoryItem } from "@/components/providers/auth-provider"

export class InventoryService {
  static async getAll(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(item => ({
        id: item.id,
        location: item.location,
        requestDate: item.request_date,
        dispatchedDate: item.dispatched_date,
        requiredItems: item.required_items || {},
        dispatchedItems: item.dispatched_items || {},
        comment: item.comment,
        createdBy: item.created_by
      })) || []
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  }

  static async create(item: Omit<InventoryItem, "id" | "createdBy">, userId: string): Promise<InventoryItem> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          location: item.location,
          request_date: item.requestDate || null,
          dispatched_date: item.dispatchedDate || null,
          required_items: item.requiredItems,
          dispatched_items: item.dispatchedItems,
          comment: item.comment,
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        location: data.location,
        requestDate: data.request_date,
        dispatchedDate: data.dispatched_date,
        requiredItems: data.required_items || {},
        dispatchedItems: data.dispatched_items || {},
        comment: data.comment,
        createdBy: data.created_by
      }
    } catch (error) {
      console.error('Error creating inventory item:', error)
      throw error
    }
  }

  static async update(id: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      const updateData: any = {}
      
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.requestDate !== undefined) updateData.request_date = updates.requestDate
      if (updates.dispatchedDate !== undefined) updateData.dispatched_date = updates.dispatchedDate
      if (updates.requiredItems !== undefined) updateData.required_items = updates.requiredItems
      if (updates.dispatchedItems !== undefined) updateData.dispatched_items = updates.dispatchedItems
      if (updates.comment !== undefined) updateData.comment = updates.comment

      const { error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      throw error
    }
  }

  static async updateAllItemsWithNewStockItem(itemName: string): Promise<void> {
    try {
      // Get all inventory items
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')

      if (fetchError) throw fetchError

      if (inventoryData && inventoryData.length > 0) {
        // Update each inventory item to include the new stock item with 0 values
        const updates = inventoryData.map(invItem => {
          const updatedRequiredItems = { ...invItem.required_items, [itemName]: 0 }
          const updatedDispatchedItems = { ...invItem.dispatched_items, [itemName]: 0 }
          
          return supabase
            .from('inventory_items')
            .update({
              required_items: updatedRequiredItems,
              dispatched_items: updatedDispatchedItems
            })
            .eq('id', invItem.id)
        })

        await Promise.all(updates)
      }
    } catch (error) {
      console.error('Error updating inventory items with new stock item:', error)
      throw error
    }
  }
}
