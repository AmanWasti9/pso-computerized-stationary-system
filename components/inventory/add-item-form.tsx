"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const locations = [
  "KTC",
  "Kot Lakhpat Lahore",
  "PR Lahore Cantt",
  "Daulat Pur",
  "Chakpirana",
  "LMT",
  "TDC Plant Lahore",
  "Sanghi",
  "Shershah",
  "Sihala",
  "New Faisalabad",
  "KTA",
  "PR Multan Cantt",
  "Kundian Depot",
  "Kotla Jam Depot",
]

export function AddItemForm() {
  const { user, addInventoryItem, stockItems } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState(() => {
    // Initialize with all stock items set to 0
    const requiredItems: { [key: string]: number } = {}
    const dispatchedItems: { [key: string]: number } = {}
    
    stockItems.forEach(item => {
      requiredItems[item.name] = 0
      dispatchedItems[item.name] = 0
    })

    return {
      location: "",
      requestDate: "",
      dispatchedDate: "",
      requiredItems,
      dispatchedItems,
      comment: "",
    }
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await addInventoryItem({
        location: formData.location,
        requestDate: formData.requestDate || undefined,
        dispatchedDate: formData.dispatchedDate || undefined,
        requiredItems: formData.requiredItems,
        dispatchedItems: formData.dispatchedItems,
        comment: formData.comment,
      })

      toast({
        title: "Success",
        description: "Inventory item added successfully.",
      })

      // Reset form
      const resetRequiredItems: { [key: string]: number } = {}
      const resetDispatchedItems: { [key: string]: number } = {}
      
      stockItems.forEach(item => {
        resetRequiredItems[item.name] = 0
        resetDispatchedItems[item.name] = 0
      })

      setFormData({
        location: "",
        requestDate: "",
        dispatchedDate: "",
        requiredItems: resetRequiredItems,
        dispatchedItems: resetDispatchedItems,
        comment: "",
      })

      router.push("/inventory")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string | number | { [key: string]: number }) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateItemQuantity = (itemName: string, type: 'required' | 'dispatched', value: number) => {
    const field = type === 'required' ? 'requiredItems' : 'dispatchedItems'
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [itemName]: value
      }
    }))
  }

  return (
    <Card className="max-w-6xl">
      <CardHeader>
        <CardTitle>Add New Inventory Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={formData.location} onValueChange={(value) => updateFormData("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestDate">Request Date</Label>
              <Input
                id="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={(e) => updateFormData("requestDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchedDate">Dispatched Date</Label>
              <Input
                id="dispatchedDate"
                type="date"
                value={formData.dispatchedDate}
                onChange={(e) => updateFormData("dispatchedDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Required Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">Items Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {stockItems.map((item) => (
                    <div key={`req-${item.id}`} className="space-y-2">
                      <Label htmlFor={`req-${item.id}`}>{item.name}</Label>
                      <Input
                        id={`req-${item.id}`}
                        type="number"
                        min="0"
                        value={formData.requiredItems[item.name] || 0}
                        onChange={(e) => updateItemQuantity(item.name, 'required', Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dispatched Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700">Items Dispatched</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {stockItems.map((item) => (
                    <div key={`disp-${item.id}`} className="space-y-2">
                      <Label htmlFor={`disp-${item.id}`}>{item.name}</Label>
                      <Input
                        id={`disp-${item.id}`}
                        type="number"
                        min="0"
                        value={formData.dispatchedItems[item.name] || 0}
                        onChange={(e) => updateItemQuantity(item.name, 'dispatched', Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => updateFormData("comment", e.target.value)}
              placeholder="Add any comments..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
