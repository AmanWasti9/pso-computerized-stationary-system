"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { CombinedInventoryTable } from "@/components/inventory/combined-inventory-table"
import { CurrentStockTab } from "@/components/inventory/current-stock-tab"
import { StockHistoryTab } from "@/components/inventory/stock-history-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!isLoading && !user) {
      redirect("/")
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage your inventory, stock levels, and history</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Inventory Overview
              </TabsTrigger>
              <TabsTrigger 
                value="current-stock" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Current Stock
              </TabsTrigger>
              <TabsTrigger 
                value="stock-history" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Stock History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <CombinedInventoryTable />
            </TabsContent>

            <TabsContent value="current-stock" className="mt-6">
              <CurrentStockTab />
            </TabsContent>

            <TabsContent value="stock-history" className="mt-6">
              <StockHistoryTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
