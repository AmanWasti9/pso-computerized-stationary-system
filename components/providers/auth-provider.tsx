"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { InventoryService } from "@/services/inventory.service"
import { StockService } from "@/services/stock.service"
import { StockHistoryService } from "@/services/stock-history.service"

export interface User {
  id: string
  email: string
  name: string
}

export interface StockItem {
  id: string
  name: string
  quantity: number
  description: string
}

export interface InventoryItem {
  id: string
  location: string
  requestDate?: string
  dispatchedDate?: string
  requiredItems: { [key: string]: number }
  dispatchedItems: { [key: string]: number }
  comment?: string
  createdBy: string
}

export interface StockHistoryEntry {
  itemName: string
  quantity: number
  type: "new_item" | "stock_addition" | "stock_dispatch"
  description?: string
  date: string
  addedBy: string
  timestamp?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  inventoryItems: InventoryItem[]
  addInventoryItem: (item: Omit<InventoryItem, "id" | "createdBy">) => Promise<void>
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  stockHistory: StockHistoryEntry[]
  addStockHistory: (entry: Omit<StockHistoryEntry, "timestamp">) => Promise<void>
  addBulkStockHistory: (entries: Omit<StockHistoryEntry, "timestamp">[]) => Promise<void>
  deleteStockHistoryEntry: (date: string, addedBy: string) => Promise<void>
  deleteStockHistoryByType: (type: "new_item" | "stock_addition" | "stock_dispatch") => Promise<void>
  deleteStockHistoryByDescription: (description: string) => Promise<void>
  stockItems: StockItem[]
  updateStockItems: (items: StockItem[]) => Promise<void>
  addNewStockItem: (item: StockItem) => Promise<void>
  deleteStockItem: (id: string) => Promise<void>
  refreshData: () => Promise<void>
  validateStockAvailability: (dispatchedItems: { [key: string]: number }, existingDispatchedItems?: { [key: string]: number }) => { isValid: boolean; insufficientItems: Array<{ name: string; available: number; requested: number }> }
  updateStockFromDispatch: (newDispatchedItems: { [key: string]: number }, oldDispatchedItems?: { [key: string]: number }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Load initial data with caching and error handling
  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true)
      
      // Check if user session is still valid before loading data
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.warn('Invalid session, skipping data load')
        return
      }

      const [stockData, inventoryData, historyData] = await Promise.all([
        StockService.getAll(forceRefresh),
        InventoryService.getAll(forceRefresh),
        StockHistoryService.getAll(forceRefresh)
      ])

      setStockItems(stockData)
      setInventoryItems(inventoryData)
      setStockHistory(historyData)
    } catch (error) {
      console.error('Error loading data:', error)
      
      // If error is auth-related, try to refresh token
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        console.log('Auth error detected, attempting token refresh...')
        try {
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError) {
            console.log('Token refreshed, retrying data load...')
            // Retry loading data after successful token refresh
            setTimeout(() => loadData(true), 1000)
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    await loadData(true) // Force refresh
  }

  useEffect(() => {
    let tokenRefreshTimer: NodeJS.Timeout | null = null
    let sessionCheckInterval: NodeJS.Timeout | null = null

    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          setIsLoading(false)
          return
        }
        
        if (session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name
            })
          }
          
          // Load data if user is authenticated
          await loadData()
          
          // Set up proactive token refresh
          setupTokenRefresh(session)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Setup proactive token refresh
    const setupTokenRefresh = (session: any) => {
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
      }

      // Calculate when to refresh (5 minutes before expiry)
      const expiresAt = session.expires_at * 1000 // Convert to milliseconds
      const refreshTime = expiresAt - Date.now() - (5 * 60 * 1000) // 5 minutes before expiry
      
      if (refreshTime > 0) {
        tokenRefreshTimer = setTimeout(async () => {
          console.log('Proactively refreshing token...')
          try {
            const { error } = await supabase.auth.refreshSession()
            if (error) {
              console.error('Proactive token refresh failed:', error)
            } else {
              console.log('Token refreshed proactively')
            }
          } catch (error) {
            console.error('Proactive token refresh error:', error)
          }
        }, refreshTime)
      }
    }

    // Periodic session validation
    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          console.log('Session invalid, clearing user state')
          setUser(null)
          setStockItems([])
          setInventoryItems([])
          setStockHistory([])
        }
      } catch (error) {
        console.error('Session validation error:', error)
      }
    }

    checkSession()

    // Set up periodic session validation (every 5 minutes)
    sessionCheckInterval = setInterval(validateSession, 5 * 60 * 1000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name
          })
        }
        
        await loadData()
        setupTokenRefresh(session)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state')
        setUser(null)
        setStockItems([])
        setInventoryItems([])
        setStockHistory([])
        
        // Clear timers
        if (tokenRefreshTimer) {
          clearTimeout(tokenRefreshTimer)
        }
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed, setting up next refresh')
        setupTokenRefresh(session)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
      }
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      if (data.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          return false
        }

        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name
          })
          
          // Load data after successful login
          await loadData()
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (error) throw error
      return !!data.user
    } catch (error) {
      console.error('Signup error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const addInventoryItem = async (item: Omit<InventoryItem, "id" | "createdBy">) => {
    if (!user) return

    try {
      const newItem = await InventoryService.create(item, user.id)
      setInventoryItems(prev => [newItem, ...prev])
    } catch (error) {
      console.error('Error adding inventory item:', error)
      throw error
    }
  }

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await InventoryService.update(id, updates)
      setInventoryItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      )
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  }

  const addStockHistory = async (entry: Omit<StockHistoryEntry, "timestamp">) => {
    try {
      const newEntry = await StockHistoryService.create(entry)
      setStockHistory(prev => [newEntry, ...prev])
    } catch (error) {
      console.error('Error adding stock history:', error)
      throw error
    }
  }

  const addBulkStockHistory = async (entries: Omit<StockHistoryEntry, "timestamp">[]) => {
    try {
      const newEntries = await StockHistoryService.createBulk(entries)
      setStockHistory(prev => [...newEntries, ...prev])
    } catch (error) {
      console.error('Error adding bulk stock history:', error)
      throw error
    }
  }

  const deleteStockHistoryEntry = async (date: string, addedBy: string) => {
    try {
      await StockHistoryService.deleteByDateAndUser(date, addedBy)
      setStockHistory(prev => prev.filter(entry => !(entry.date === date && entry.addedBy === addedBy)))
    } catch (error) {
      console.error('Error deleting stock history entry:', error)
      throw error
    }
  }

  const deleteStockHistoryByType = async (type: "new_item" | "stock_addition" | "stock_dispatch") => {
    try {
      await StockHistoryService.deleteByType(type)
      setStockHistory(prev => prev.filter(entry => entry.type !== type))
    } catch (error) {
      console.error('Error deleting stock history by type:', error)
      throw error
    }
  }

  const deleteStockHistoryByDescription = async (description: string) => {
    try {
      await StockHistoryService.deleteByDescription(description)
      setStockHistory(prev => prev.filter(entry => entry.description !== description))
    } catch (error) {
      console.error('Error deleting stock history by description:', error)
      throw error
    }
  }

  const updateStockItems = async (items: StockItem[]) => {
    try {
      await StockService.updateMultiple(items)
      setStockItems(items)
    } catch (error) {
      console.error('Error updating stock items:', error)
      throw error
    }
  }

  const addNewStockItem = async (newItem: StockItem) => {
    try {
      const createdItem = await StockService.create(newItem)
      setStockItems(prev => [...prev, createdItem])
      
      // Update all existing inventory items to include the new item with 0 values
      await InventoryService.updateAllItemsWithNewStockItem(newItem.name)
      
      // Update local inventory state
      setInventoryItems(prev => 
        prev.map(item => ({
          ...item,
          requiredItems: { ...item.requiredItems, [newItem.name]: 0 },
          dispatchedItems: { ...item.dispatchedItems, [newItem.name]: 0 }
        }))
      )
    } catch (error) {
      console.error('Error adding new stock item:', error)
      throw error
    }
  }

  const deleteStockItem = async (id: string) => {
    try {
      await StockService.delete(id)
      setStockItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting stock item:', error)
      throw error
    }
  }

  const validateStockAvailability = (
    dispatchedItems: { [key: string]: number }, 
    existingDispatchedItems?: { [key: string]: number }
  ) => {
    const insufficientItems: Array<{ name: string; available: number; requested: number }> = []
    
    Object.entries(dispatchedItems).forEach(([itemName, newQuantity]) => {
      const stockItem = stockItems.find(item => item.name === itemName)
      if (!stockItem) return
      
      const existingQuantity = existingDispatchedItems?.[itemName] || 0
      const netChange = newQuantity - existingQuantity
      
      // Only check if we're increasing the dispatched quantity
      if (netChange > 0) {
        const availableStock = stockItem.quantity
        if (availableStock < netChange) {
          insufficientItems.push({
            name: itemName,
            available: availableStock,
            requested: netChange
          })
        }
      }
    })
    
    return {
      isValid: insufficientItems.length === 0,
      insufficientItems
    }
  }

  const updateStockFromDispatch = async (
    newDispatchedItems: { [key: string]: number }, 
    oldDispatchedItems?: { [key: string]: number }
  ) => {
    try {
      const updatedStockItems = stockItems.map(stockItem => {
        const newQuantity = newDispatchedItems[stockItem.name] || 0
        const oldQuantity = oldDispatchedItems?.[stockItem.name] || 0
        const netChange = newQuantity - oldQuantity
        
        return {
          ...stockItem,
          quantity: Math.max(0, stockItem.quantity - netChange)
        }
      })
      
      await updateStockItems(updatedStockItems)
      
      // Add stock history entries for dispatched items
      const historyEntries: Omit<StockHistoryEntry, "timestamp">[] = []
      Object.entries(newDispatchedItems).forEach(([itemName, newQuantity]) => {
        const oldQuantity = oldDispatchedItems?.[itemName] || 0
        const netChange = newQuantity - oldQuantity
        
        if (netChange > 0) {
          historyEntries.push({
            itemName,
            quantity: netChange,
            type: "stock_dispatch",
            description: "Items dispatched",
            date: new Date().toISOString(),
            addedBy: user?.name || "System",
          })
        } else if (netChange < 0) {
          historyEntries.push({
            itemName,
            quantity: Math.abs(netChange),
            type: "stock_addition",
            description: "Dispatch quantity reduced (stock returned)",
            date: new Date().toISOString(),
            addedBy: user?.name || "System",
          })
        }
      })
      
      if (historyEntries.length > 0) {
        await addBulkStockHistory(historyEntries)
      }
    } catch (error) {
      console.error('Error updating stock from dispatch:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading,
        inventoryItems,
        addInventoryItem,
        updateInventoryItem,
        stockHistory,
        addStockHistory,
        addBulkStockHistory,
        deleteStockHistoryEntry,
        deleteStockHistoryByType,
        deleteStockHistoryByDescription,
        stockItems,
        updateStockItems,
        addNewStockItem,
        deleteStockItem,
        refreshData,
        validateStockAvailability,
        updateStockFromDispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
