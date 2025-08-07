"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { StockService } from '@/services/stock.service'
import { InventoryService } from '@/services/inventory.service'
import { StockHistoryService } from '@/services/stock-history.service'
import { Stock, Inventory, StockHistory } from '@/types'
import { toast } from '@/hooks/use-toast'

interface AuthContextType {
  user: any | null
  loading: boolean
  inventory: Inventory[]
  stock: Stock[]
  stockHistory: StockHistory[]
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  loadData: (forceRefresh?: boolean) => Promise<void>
  
  // Inventory methods
  addInventoryItem: (item: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateInventoryItem: (id: string, updates: Partial<Inventory>) => Promise<void>
  
  // Stock History methods
  addStockHistory: (entry: Omit<StockHistory, 'id' | 'created_at'>) => Promise<void>
  addBulkStockHistory: (entries: Omit<StockHistory, 'id' | 'created_at'>[]) => Promise<void>
  deleteStockHistoryEntry: (id: string) => Promise<void>
  deleteStockHistoryByType: (type: string) => Promise<void>
  deleteStockHistoryByDescription: (description: string) => Promise<void>
  
  // Stock methods
  updateStockItems: (items: Stock[]) => Promise<void>
  addNewStockItem: (item: Omit<Stock, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  deleteStockItem: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [stock, setStock] = useState<Stock[]>([])
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async (forceRefresh = false) => {
    if (!session?.user) return

    try {
      setLoading(true)
      
      const [stockData, inventoryData, stockHistoryData] = await Promise.all([
        StockService.getAll(forceRefresh),
        InventoryService.getAll(forceRefresh),
        StockHistoryService.getAll(forceRefresh)
      ])

      setStock(stockData)
      setInventory(inventoryData)
      setStockHistory(stockHistoryData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    if (session?.user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [session, status])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid credentials",
          variant: "destructive",
        })
        return false
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      })
      return true
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await signOut({ redirect: false })
      setInventory([])
      setStock([])
      setStockHistory([])
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Signup failed')
        return false
      }

      // After successful signup, automatically sign in
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (loginResult?.error) {
        toast.error('Account created but login failed. Please try logging in manually.')
        return false
      }

      toast.success('Account created successfully!')
      return true
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Signup failed')
      return false
    }
  }

  // Inventory methods
  const addInventoryItem = async (item: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newItem = await InventoryService.create({
        ...item,
        user_id: session?.user?.id || ''
      })
      setInventory(prev => [...prev, newItem])
      toast.success('Inventory item added')
    } catch (error) {
      console.error('Error adding inventory item:', error)
      toast.error('Failed to add inventory item')
    }
  }

  const updateInventoryItem = async (id: string, updates: Partial<Inventory>) => {
    try {
      const updatedItem = await InventoryService.update(id, updates)
      setInventory(prev => prev.map(item => item.id === id ? updatedItem : item))
      toast.success('Inventory item updated')
    } catch (error) {
      console.error('Error updating inventory item:', error)
      toast.error('Failed to update inventory item')
    }
  }

  // Stock History methods
  const addStockHistory = async (entry: Omit<StockHistory, 'id' | 'created_at'>) => {
    try {
      const newEntry = await StockHistoryService.create({
        ...entry,
        user_id: session?.user?.id || ''
      })
      setStockHistory(prev => [...prev, newEntry])
      toast.success('Stock history entry added')
    } catch (error) {
      console.error('Error adding stock history:', error)
      toast.error('Failed to add stock history entry')
    }
  }

  const addBulkStockHistory = async (entries: Omit<StockHistory, 'id' | 'created_at'>[]) => {
    try {
      const entriesWithUser = entries.map(entry => ({
        ...entry,
        user_id: session?.user?.id || ''
      }))
      const newEntries = await StockHistoryService.createBulk(entriesWithUser)
      setStockHistory(prev => [...prev, ...newEntries])
      toast.success(`${newEntries.length} stock history entries added`)
    } catch (error) {
      console.error('Error adding bulk stock history:', error)
      toast.error('Failed to add stock history entries')
    }
  }

  const deleteStockHistoryEntry = async (id: string) => {
    try {
      await StockHistoryService.delete(id)
      setStockHistory(prev => prev.filter(entry => entry.id !== id))
      toast.success('Stock history entry deleted')
    } catch (error) {
      console.error('Error deleting stock history entry:', error)
      toast.error('Failed to delete stock history entry')
    }
  }

  const deleteStockHistoryByType = async (type: string) => {
    try {
      await StockHistoryService.deleteByType(type)
      setStockHistory(prev => prev.filter(entry => entry.type !== type))
      toast.success(`All ${type} entries deleted`)
    } catch (error) {
      console.error('Error deleting stock history by type:', error)
      toast.error('Failed to delete stock history entries')
    }
  }

  const deleteStockHistoryByDescription = async (description: string) => {
    try {
      await StockHistoryService.deleteByDescription(description)
      setStockHistory(prev => prev.filter(entry => entry.description !== description))
      toast.success('Stock history entries deleted')
    } catch (error) {
      console.error('Error deleting stock history by description:', error)
      toast.error('Failed to delete stock history entries')
    }
  }

  // Stock methods
  const updateStockItems = async (items: Stock[]) => {
    try {
      const updatedItems = await StockService.updateBulk(items)
      setStock(prev => {
        const updated = [...prev]
        updatedItems.forEach(item => {
          const index = updated.findIndex(s => s.id === item.id)
          if (index !== -1) {
            updated[index] = item
          }
        })
        return updated
      })
      toast.success('Stock items updated')
    } catch (error) {
      console.error('Error updating stock items:', error)
      toast.error('Failed to update stock items')
    }
  }

  const addNewStockItem = async (item: Omit<Stock, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newItem = await StockService.create({
        ...item,
        user_id: session?.user?.id || ''
      })
      setStock(prev => [...prev, newItem])
      toast.success('Stock item added')
    } catch (error) {
      console.error('Error adding stock item:', error)
      toast.error('Failed to add stock item')
    }
  }

  const deleteStockItem = async (id: string) => {
    try {
      await StockService.delete(id)
      setStock(prev => prev.filter(item => item.id !== id))
      toast.success('Stock item deleted')
    } catch (error) {
      console.error('Error deleting stock item:', error)
      toast.error('Failed to delete stock item')
    }
  }

  const value: AuthContextType = {
    user: session?.user || null,
    loading: status === 'loading' || loading,
    inventory,
    stock,
    stockHistory,
    login,
    logout,
    signup,
    loadData,
    addInventoryItem,
    updateInventoryItem,
    addStockHistory,
    addBulkStockHistory,
    deleteStockHistoryEntry,
    deleteStockHistoryByType,
    deleteStockHistoryByDescription,
    updateStockItems,
    addNewStockItem,
    deleteStockItem,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a NextAuthProvider')
  }
  return context
}