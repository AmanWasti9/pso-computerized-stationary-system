export interface User {
  id: string
  email: string
  name: string
  role?: string
  created_at?: string
  updated_at?: string
}

export interface Inventory {
  id: string
  name: string
  description?: string
  category?: string
  unit?: string
  minimum_stock?: number
  maximum_stock?: number
  reorder_point?: number
  cost_per_unit?: number
  supplier?: string
  location?: string
  barcode?: string
  sku?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Stock {
  id: string
  inventory_id: string
  quantity: number
  location?: string
  batch_number?: string
  expiry_date?: string
  cost_per_unit?: number
  supplier?: string
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface StockHistory {
  id: string
  inventory_id: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  previous_quantity?: number
  new_quantity?: number
  reason?: string
  description?: string
  reference_number?: string
  location?: string
  batch_number?: string
  cost_per_unit?: number
  supplier?: string
  notes?: string
  user_id: string
  created_at: string
}

export interface StockItem {
  id: string
  inventory_id: string
  quantity: number
  location?: string
  batch_number?: string
  expiry_date?: string
  cost_per_unit?: number
  supplier?: string
  notes?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  category?: string
  unit?: string
  minimum_stock?: number
  maximum_stock?: number
  reorder_point?: number
  cost_per_unit?: number
  supplier?: string
  location?: string
  barcode?: string
  sku?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface StockHistoryEntry {
  id: string
  inventory_id: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  previous_quantity?: number
  new_quantity?: number
  reason?: string
  description?: string
  reference_number?: string
  location?: string
  batch_number?: string
  cost_per_unit?: number
  supplier?: string
  notes?: string
  user_id: string
  created_at: string
}

export type { User, Inventory, Stock, StockHistory, StockItem, InventoryItem, StockHistoryEntry }