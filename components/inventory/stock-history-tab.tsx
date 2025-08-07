"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, TrendingUp, Trash2, Filter } from 'lucide-react'
import { useAuth } from "@/components/providers/auth-provider"
import { useState } from "react"
import { toast } from "sonner"

export function StockHistoryTab() {
  const { stockHistory, stockItems, deleteStockHistoryEntry, deleteStockHistoryByType, deleteStockHistoryByDescription } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState<string>("")

  // Filter to only show stock additions (exclude dispatch entries)
  const stockAdditionsOnly = stockHistory.filter(entry => 
    entry.type === 'new_item' || entry.type === 'stock_addition'
  )

  // Group stock history by transaction (same date/time and user)
  const groupedHistory = stockAdditionsOnly.reduce((groups, entry) => {
    const key = `${entry.date}-${entry.addedBy}`
    if (!groups[key]) {
      groups[key] = {
        date: entry.date,
        addedBy: entry.addedBy,
        items: {},
        total: 0,
        description: entry.description || "Stock added"
      }
    }
    groups[key].items[entry.itemName] = entry.quantity
    groups[key].total += entry.quantity
    return groups
  }, {} as { [key: string]: { date: string, addedBy: string, items: { [key: string]: number }, total: number, description: string } })

  const historyEntries = Object.values(groupedHistory).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const handleDeleteEntry = async (date: string, addedBy: string) => {
    try {
      await deleteStockHistoryEntry(date, addedBy)
      toast.success("Stock history entry deleted successfully")
    } catch (error) {
      toast.error("Failed to delete stock history entry")
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedFilter) {
      toast.error("Please select a filter option")
      return
    }

    try {
      switch (selectedFilter) {
        case "new_item":
          await deleteStockHistoryByType("new_item")
          toast.success("All New Item History deleted successfully")
          break
        case "stock_addition":
          await deleteStockHistoryByType("stock_addition")
          toast.success("All Stock Added History deleted successfully")
          break
        case "stock_dispatch":
          await deleteStockHistoryByType("stock_dispatch")
          toast.success("All Dispatched Item History deleted successfully")
          break
        default:
          await deleteStockHistoryByDescription(selectedFilter)
          toast.success(`All entries with description "${selectedFilter}" deleted successfully`)
      }
      setSelectedFilter("")
    } catch (error) {
      toast.error("Failed to delete stock history entries")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-gray-600" />
                Stock History
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {historyEntries.length} stock addition{historyEntries.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select filter to delete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_item">Delete New Item History</SelectItem>
                  <SelectItem value="stock_addition">Delete Stock Added History</SelectItem>
                  <SelectItem value="stock_dispatch">Delete Dispatched Item History</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleBulkDelete}
                disabled={!selectedFilter}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyEntries.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock History</h3>
              <p className="text-gray-600">Stock additions and new items will appear here once you start adding stock.</p>
            </div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Items</h3>
              <p className="text-gray-600">Add stock items first to view history in a structured format.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 w-48">Date & Time</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24 text-center">Action</TableHead>
                    {stockItems.map((item) => (
                      <TableHead key={item.id} className="font-semibold text-gray-700 w-20 text-center">
                        {item.name}
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-gray-700 w-20 text-center">Total</TableHead>
                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyEntries.map((entry, index) => (
                    <TableRow key={index} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(entry.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-medium">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Add
                        </Badge>
                      </TableCell>
                      {stockItems.map((item) => (
                        <TableCell key={item.id} className="text-center">
                          {entry.items[item.name] ? (
                            <span className="font-semibold text-green-600">
                              +{entry.items[item.name]}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className="font-bold text-green-600">
                          +{entry.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          onClick={() => handleDeleteEntry(entry.date, entry.addedBy)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
