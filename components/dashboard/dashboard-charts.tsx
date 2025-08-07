"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useAuth } from "@/components/providers/auth-provider"
import { Calendar } from "lucide-react"

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
]

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export function DashboardCharts() {
  const { inventoryItems } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState("all")

  const { requestedData, dispatchedData } = useMemo(() => {
    // Filter items by selected month
    const filteredItems = selectedMonth === "all" 
      ? inventoryItems 
      : inventoryItems.filter(item => {
          if (!item.requestDate) return false
          const itemMonth = new Date(item.requestDate).getMonth() + 1
          return itemMonth.toString().padStart(2, '0') === selectedMonth
        })

    // Calculate requested items totals
    const requestedTotals: { [key: string]: number } = {}
    filteredItems.forEach(item => {
      Object.entries(item.requiredItems || {}).forEach(([itemName, quantity]) => {
        if (quantity > 0) {
          requestedTotals[itemName] = (requestedTotals[itemName] || 0) + quantity
        }
      })
    })

    // Calculate dispatched items totals
    const dispatchedTotals: { [key: string]: number } = {}
    filteredItems.forEach(item => {
      Object.entries(item.dispatchedItems || {}).forEach(([itemName, quantity]) => {
        if (quantity > 0) {
          dispatchedTotals[itemName] = (dispatchedTotals[itemName] || 0) + quantity
        }
      })
    })

    // Convert to chart data format
    const requestedData = Object.entries(requestedTotals).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }))

    const dispatchedData = Object.entries(dispatchedTotals).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }))

    return { requestedData, dispatchedData }
  }, [inventoryItems, selectedMonth])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.payload.name}</p>
          <p className="text-sm text-gray-600">
            Quantity: <span className="font-semibold text-blue-600">{data.value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ name, value, percent }: any) => {
    return `${value} (${(percent * 100).toFixed(0)}%)`
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard Analytics
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            Filter by Month:
          </span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="all">All Months</SelectItem> */}
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items Requested */}
        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-green-400 to-blue-500 rounded-full mr-3"></div>
              Items Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {requestedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestedData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // label={renderCustomLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {requestedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium">No data available</p>
                    <p className="text-sm">
                      No items requested for the selected period
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Dispatched */}
        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-3"></div>
              Items Dispatched
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {dispatchedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dispatchedData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // label={renderCustomLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {dispatchedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-medium">No data available</p>
                    <p className="text-sm">
                      No items dispatched for the selected period
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
