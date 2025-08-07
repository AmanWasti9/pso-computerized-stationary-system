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
    let visibilityCheckInterval: NodeJS.Timeout | null = null
    let lastActivity = Date.now()

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

    // Enhanced token refresh with better timing
    const setupTokenRefresh = (session: any) => {
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
      }

      if (!session?.expires_at) return

      // Calculate when to refresh (5 minutes before expiry for more safety)
      const expiresAt = session.expires_at * 1000 // Convert to milliseconds
      const refreshTime = expiresAt - Date.now() - (5 * 60 * 1000) // 5 minutes before expiry
      
      console.log(`Token expires at: ${new Date(expiresAt).toLocaleString()}`)
      console.log(`Will refresh in: ${Math.max(0, refreshTime / 1000)} seconds`)
      
      if (refreshTime > 0) {
        tokenRefreshTimer = setTimeout(async () => {
          console.log('Proactively refreshing token (scheduled)...')
          await refreshTokenSafely()
        }, refreshTime)
      } else {
        // Token is already expired or about to expire, refresh immediately
        console.log('Token expired or about to expire, refreshing immediately...')
        refreshTokenSafely()
      }
    }

    // Safe token refresh with retry logic
    const refreshTokenSafely = async (retryCount = 0) => {
      try {
        console.log(`Attempting token refresh (attempt ${retryCount + 1}/4)...`)
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('Token refresh failed:', error)
          
          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
            console.log(`Retrying token refresh in ${delay}ms...`)
            setTimeout(() => refreshTokenSafely(retryCount + 1), delay)
          } else {
            console.error('Token refresh failed after 4 attempts, signing out...')
            await supabase.auth.signOut()
          }
        } else if (data.session) {
          const expiresAt = data.session.expires_at * 1000
          const timeUntilExpiry = expiresAt - Date.now()
          console.log(`Token refreshed successfully! New expiry: ${new Date(expiresAt).toLocaleString()}`)
          console.log(`Time until new expiry: ${Math.round(timeUntilExpiry / 1000)} seconds`)
          setupTokenRefresh(data.session)
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Retrying after error in ${delay}ms...`)
          setTimeout(() => refreshTokenSafely(retryCount + 1), delay)
        } else {
          console.error('Token refresh failed after 4 attempts due to errors')
        }
      }
    }

    // Enhanced session validation with token refresh
    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session validation error:', error)
          return
        }
        
        if (!session) {
          console.log('No session found, clearing user state')
          setUser(null)
          setStockItems([])
          setInventoryItems([])
          setStockHistory([])
          return
        }

        // Check if token is close to expiry (within 5 minutes)
        const expiresAt = session.expires_at * 1000
        const timeUntilExpiry = expiresAt - Date.now()
        
        if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
          console.log('Token expiring soon, refreshing...')
          await refreshTokenSafely()
        }
      } catch (error) {
        console.error('Session validation error:', error)
      }
    }

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking session...')
        const timeSinceLastActivity = Date.now() - lastActivity
        
        // Always check session when page becomes visible
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session check error on visibility change:', error)
            return
          }
          
          if (session) {
            // Check if token is close to expiry (within 10 minutes)
            const expiresAt = session.expires_at * 1000
            const timeUntilExpiry = expiresAt - Date.now()
            
            console.log(`Token check on visibility: expires in ${Math.round(timeUntilExpiry / 1000)} seconds`)
            
            // If token expires within 10 minutes or page was hidden for more than 2 minutes, refresh immediately
            if (timeUntilExpiry < 10 * 60 * 1000 || timeSinceLastActivity > 2 * 60 * 1000) {
              console.log('Refreshing token due to visibility change...')
              await refreshTokenSafely()
            }
          } else {
            console.log('No session found on visibility change')
          }
        } catch (error) {
          console.error('Error checking session on visibility change:', error)
        }
        
        lastActivity = Date.now()
      } else {
        console.log('Page became hidden')
      }
    }

    // Track user activity
    const updateActivity = () => {
      lastActivity = Date.now()
    }

    // Handle window focus (when user returns to tab)
    const handleWindowFocus = async () => {
      console.log('Window focused, checking session immediately...')
      await handleVisibilityChange() // Reuse the visibility change logic
    }

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('click', updateActivity)
    document.addEventListener('keydown', updateActivity)
    document.addEventListener('scroll', updateActivity)

    checkSession()

    // Set up periodic session validation (every 2 minutes for more frequent checks)
    sessionCheckInterval = setInterval(validateSession, 2 * 60 * 1000)

    // Set up visibility-based checks (every 30 seconds when page is visible)
    visibilityCheckInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastActivity = Date.now() - lastActivity
        // If no activity for 10 minutes, validate session
        if (timeSinceLastActivity > 10 * 60 * 1000) {
          validateSession()
        }
      }
    }, 30 * 1000)

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
        lastActivity = Date.now()
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
        if (visibilityCheckInterval) {
          clearInterval(visibilityCheckInterval)
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('Token refreshed, setting up next refresh')
        setupTokenRefresh(session)
        lastActivity = Date.now()
      }
    })

    return () => {
      subscription.unsubscribe()
      
      // Clear all timers
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
      }
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval)
      }
      if (visibilityCheckInterval) {
        clearInterval(visibilityCheckInterval)
      }
      
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('click', updateActivity)
      document.removeEventListener('keydown', updateActivity)
      document.removeEventListener('scroll', updateActivity)
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
