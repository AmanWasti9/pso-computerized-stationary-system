"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AddItemForm } from "@/components/inventory/add-item-form"
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function AddInventoryPage() {
  const { user, isLoading } = useAuth()

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Items</h1>
          <p className="text-gray-600">Add new inventory items based on your role</p>
        </div>

        <AddItemForm />
      </div>
    </DashboardLayout>
  )
}
