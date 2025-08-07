"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Package, PlusCircle, Save, X, Delete, Trash2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth, type StockItem } from "@/components/providers/auth-provider"

export function CurrentStockTab() {
  const { user, addBulkStockHistory, stockItems, updateStockItems, addNewStockItem, deleteStockItem } = useAuth()
  const { toast } = useToast()
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false)
  const [addNewItemDialogOpen, setAddNewItemDialogOpen] = useState(false)
  const [stockAdditions, setStockAdditions] = useState<{ [key: string]: number }>({})
  const [newItemData, setNewItemData] = useState({
    name: "",
    quantity: 0,
    description: "",
  })

  // Define the preferred order for stock items
  const getOrderedStockItems = useMemo(() => {
    const preferredOrder = [
      "SLS01",
      "SLS02", 
      "SLS01 Extra",
      "Token",
      "STK01",
      "PART I",
      "PART II",
      "PART III"
    ];

    // Create a map for quick lookup of preferred order
    const orderMap = new Map(preferredOrder.map((item, index) => [item, index]));

    // Sort stock items based on preferred order
    return [...stockItems].sort((a, b) => {
      const aOrder = orderMap.get(a.name);
      const bOrder = orderMap.get(b.name);

      // If both items are in preferred order, sort by their position
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }

      // If only 'a' is in preferred order, it comes first
      if (aOrder !== undefined) {
        return -1;
      }

      // If only 'b' is in preferred order, it comes first
      if (bOrder !== undefined) {
        return 1;
      }

      // If neither is in preferred order, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [stockItems]);

  // Initialize stock additions with 0 for all items
  useEffect(() => {
    const initialAdditions: { [key: string]: number } = {}
    getOrderedStockItems.forEach(item => {
      initialAdditions[item.name] = 0
    })
    setStockAdditions(initialAdditions)
  }, [getOrderedStockItems])

  const handleAddStock = async () => {
    // Check if any stock additions were made
    const hasAdditions = Object.values(stockAdditions).some(value => value > 0)
    
    if (!hasAdditions) {
      toast({
        title: "No Changes",
        description: "Please add stock quantities before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      // Update stock items by adding the new quantities to existing ones
      const updatedItems = getOrderedStockItems.map(item => ({
        ...item,
        quantity: item.quantity + (stockAdditions[item.name] || 0)
      }))

      await updateStockItems(updatedItems)

      // Create bulk history entries for all items that had additions
      const historyEntries = Object.entries(stockAdditions)
        .filter(([_, addition]) => addition > 0)
        .map(([itemName, addition]) => ({
          itemName,
          quantity: addition,
          type: "stock_addition" as const,
          description: "Stock added",
          date: new Date().toISOString(),
          addedBy: user?.name || "Unknown",
        }))

      // Add all entries with the same timestamp
      await addBulkStockHistory(historyEntries)

      // Reset additions
      const resetAdditions: { [key: string]: number } = {}
      getOrderedStockItems.forEach(item => {
        resetAdditions[item.name] = 0
      })
      setStockAdditions(resetAdditions)

      setAddStockDialogOpen(false)

      const addedItemsCount = Object.values(stockAdditions).filter(value => value > 0).length
      toast({
        title: "Success",
        description: `Stock updated for ${addedItemsCount} item(s) successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddNewItem = async () => {
    if (!newItemData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Item name is required.",
        variant: "destructive",
      })
      return
    }

    // Check if item name already exists
    if (getOrderedStockItems.some(item => item.name.toLowerCase() === newItemData.name.toLowerCase())) {
      toast({
        title: "Validation Error",
        description: "An item with this name already exists.",
        variant: "destructive",
      })
      return
    }

    try {
      const newItem: StockItem = {
        id: Date.now().toString(), // This will be replaced by Supabase
        name: newItemData.name,
        quantity: newItemData.quantity,
        description: newItemData.description,
      }

      // Add new stock item and update inventory columns
      await addNewStockItem(newItem)

      // Add to stock history
      await addBulkStockHistory([{
        itemName: newItemData.name,
        quantity: newItemData.quantity,
        type: "new_item",
        description: "New item created",
        date: new Date().toISOString(),
        addedBy: user?.name || "Unknown",
      }])

      toast({
        title: "Success",
        description: `New item "${newItemData.name}" added successfully. It will now appear as columns in the Inventory Overview.`,
      })

      setAddNewItemDialogOpen(false)
      setNewItemData({
        name: "",
        quantity: 0,
        description: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openAddStockDialog = () => {
    // Reset stock additions to 0
    const resetAdditions: { [key: string]: number } = {}
    getOrderedStockItems.forEach(item => {
      resetAdditions[item.name] = 0
    })
    setStockAdditions(resetAdditions)
    setAddStockDialogOpen(true)
  }

  const openAddNewItemDialog = () => {
    setNewItemData({
      name: "",
      quantity: 0,
      description: "",
    })
    setAddNewItemDialogOpen(true)
  }

  const updateStockAddition = (itemName: string, value: number) => {
    setStockAdditions(prev => ({
      ...prev,
      [itemName]: value
    }))
  }

  const handleDeleteItem = async (item: StockItem) => {
    try {
      await deleteStockItem(item.id)
      toast({
        title: "Success",
        description: `"${item.name}" has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Current Inventory Stock
            </CardTitle>
            <p className="text-gray-600 mt-1">
              View current stock levels and add new stock
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={openAddStockDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
              disabled={getOrderedStockItems.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Stock
            </Button>
            <Button
              onClick={openAddNewItemDialog}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {getOrderedStockItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Stock Items
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first stock item to begin inventory
                management.
              </p>
              <Button
                onClick={openAddNewItemDialog}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getOrderedStockItems.map((item) => (
                <Card
                  key={item.id}
                  className="relative hover:shadow-lg transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                        CURRENT
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.name}
                        </h3>
                        <div className="flex items-baseline space-x-2">
                          <span
                            className={`text-3xl font-bold ${
                              item.quantity < 0
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-sm text-gray-500">units</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>

                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Enter the quantities you want to add to
                each item. The new amounts will be added to the existing stock
                levels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getOrderedStockItems.map((item) => (
                <Card key={item.id} className="border-2 border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          {item.name}
                        </h4>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Current: {item.quantity}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`add-${item.id}`}
                          className="text-sm text-gray-600"
                        >
                          Add Quantity
                        </Label>
                        <Input
                          id={`add-${item.id}`}
                          type="text"
                          value={stockAdditions[item.name]?.toString() || "0"}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : Number.parseInt(e.target.value) || 0;
                            updateStockAddition(item.name, Math.max(0, value));
                          }}
                          className="text-center text-lg font-semibold"
                          placeholder="0"
                        />
                      </div>

                      {stockAdditions[item.name] > 0 && (
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>New Total:</strong>{" "}
                            {item.quantity + stockAdditions[item.name]} units
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setAddStockDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddStock}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog
        open={addNewItemDialogOpen}
        onOpenChange={setAddNewItemDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Adding a new item will automatically
                create corresponding columns in the Inventory Overview table for
                both "Items Required" and "Items Dispatched".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={newItemData.name}
                onChange={(e) =>
                  setNewItemData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter item name (e.g., SLS03, PART IV)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="text"
                value={newItemData.quantity.toString()}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? 0
                      : Number.parseInt(e.target.value) || 0;
                  setNewItemData((prev) => ({ ...prev, quantity: value }));
                }}
                placeholder="Enter initial quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newItemData.description}
                onChange={(e) =>
                  setNewItemData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter item description"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddNewItemDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewItem}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
