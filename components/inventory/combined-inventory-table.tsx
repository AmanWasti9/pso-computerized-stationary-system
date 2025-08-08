"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAuth,
  type InventoryItem,
} from "@/components/providers/auth-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Save, X, MessageSquare, Plus, Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


export function CombinedInventoryTable() {
  const {
    user,
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    stockItems,
    validateStockAvailability,
    updateStockFromDispatch,
  } = useAuth();

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
      "PART III",
    ];

    // Create a map for quick lookup of preferred order
    const orderMap = new Map(
      preferredOrder.map((item, index) => [item, index])
    );

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

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<InventoryItem>>({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<InventoryItem>>({
    location: "",
    requestDate: "",
    dispatchedDate: "",
    requiredItems: {},
    dispatchedItems: {},
    comment: "",
  });
  const { toast } = useToast();

  // Initialize new row data with all stock items
  const initializeNewRowData = () => {
    const requiredItems: { [key: string]: number } = {};
    const dispatchedItems: { [key: string]: number } = {};

    getOrderedStockItems.forEach((item) => {
      requiredItems[item.name] = 0;
      dispatchedItems[item.name] = 0;
    });

    setNewRowData({
      location: "",
      requestDate: "",
      dispatchedDate: "",
      requiredItems,
      dispatchedItems,
      comment: "",
    });
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const totals: {
      [key: string]: {
        required: { [key: string]: number };
        dispatched: { [key: string]: number };
      };
    } = {};

    inventoryItems.forEach((item) => {
      // Process required items
      if (item.requestDate) {
        const monthKey = new Date(item.requestDate).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long" }
        );
        if (!totals[monthKey]) {
          totals[monthKey] = {
            required: {},
            dispatched: {},
          };
          // Initialize with all stock items
          getOrderedStockItems.forEach((stockItem) => {
            totals[monthKey].required[stockItem.name] = 0;
            totals[monthKey].dispatched[stockItem.name] = 0;
          });
        }

        Object.entries(item.requiredItems).forEach(([itemName, quantity]) => {
          totals[monthKey].required[itemName] =
            (totals[monthKey].required[itemName] || 0) + quantity;
        });
      }

      // Process dispatched items
      if (item.dispatchedDate) {
        const monthKey = new Date(item.dispatchedDate).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long" }
        );
        if (!totals[monthKey]) {
          totals[monthKey] = {
            required: {},
            dispatched: {},
          };
          // Initialize with all stock items
          getOrderedStockItems.forEach((stockItem) => {
            totals[monthKey].required[stockItem.name] = 0;
            totals[monthKey].dispatched[stockItem.name] = 0;
          });
        }

        Object.entries(item.dispatchedItems).forEach(([itemName, quantity]) => {
          totals[monthKey].dispatched[itemName] =
            (totals[monthKey].dispatched[itemName] || 0) + quantity;
        });
      }
    });

    return Object.entries(totals).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [inventoryItems, getOrderedStockItems]);

  // Calculate Grand Total
  const grandTotal = useMemo(() => {
    const totalRequired: { [key: string]: number } = {};
    const totalDispatched: { [key: string]: number } = {};

    getOrderedStockItems.forEach((stockItem) => {
      totalRequired[stockItem.name] = 0;
      totalDispatched[stockItem.name] = 0;
    });

    monthlyTotals.forEach(([_, data]) => {
      Object.entries(data.required).forEach(([itemName, qty]) => {
        totalRequired[itemName] = (totalRequired[itemName] || 0) + qty;
      });
      Object.entries(data.dispatched).forEach(([itemName, qty]) => {
        totalDispatched[itemName] = (totalDispatched[itemName] || 0) + qty;
      });
    });

    return { required: totalRequired, dispatched: totalDispatched };
  }, [monthlyTotals, getOrderedStockItems]);

  // FILTER BUTTON FUNC
  const availableMonths = useMemo(() => {
    return monthlyTotals.map(([month]) => month);
  }, [monthlyTotals]);

  // EXPORT PDF
  const handleExportToExcel = () => {
    const sheetData: any[][] = [];

    const requiredHeaders = getOrderedStockItems.map((item) => item.name);
    const dispatchedHeaders = getOrderedStockItems.map((item) => item.name);

    // Row 1: Grouped headers
    const headerRow1 = [
      "Location",
      "Request Date",
      ...Array(requiredHeaders.length).fill("Items Required"),
      "Dispatched Date",
      ...Array(dispatchedHeaders.length).fill("Items Dispatched"),
    ];

    // Row 2: Actual item headers
    const headerRow2 = ["", "", ...requiredHeaders, "", ...dispatchedHeaders];

    sheetData.push(headerRow1, headerRow2);

    // --- Data Rows
    inventoryItems.forEach((item) => {
      const row = [
        item.location,
        item.requestDate || "-",
        ...getOrderedStockItems.map((si) => item.requiredItems[si.name] ?? 0),
        item.dispatchedDate || "-",
        ...getOrderedStockItems.map((si) => item.dispatchedItems[si.name] ?? 0),
      ];
      sheetData.push(row);
    });

    // --- Monthly Summary
    // const monthMap: Record<
    //   string,
    //   { required: Record<string, number>; dispatched: Record<string, number> }
    // > = {};

    // inventoryItems.forEach((item) => {
    //   const month = item.requestDate?.slice(0, 7) || "Unknown"; // e.g., "2025-08"
    //   if (!monthMap[month]) {
    //     monthMap[month] = {
    //       required: {},
    //       dispatched: {},
    //     };
    //   }

    //   getOrderedStockItems.forEach((si) => {
    //     const reqVal = item.requiredItems[si.name] ?? 0;
    //     const dispVal = item.dispatchedItems[si.name] ?? 0;

    //     monthMap[month].required[si.name] =
    //       (monthMap[month].required[si.name] ?? 0) + reqVal;
    //     monthMap[month].dispatched[si.name] =
    //       (monthMap[month].dispatched[si.name] ?? 0) + dispVal;
    //   });
    // });

    // // Empty row before summary
    // sheetData.push([]);

    // // Add monthly summaries
    // for (const month of Object.keys(monthMap)) {
    //   const row = [
    //     `Summary for ${month}`,
    //     "",
    //     ...getOrderedStockItems.map(
    //       (si) => monthMap[month].required[si.name] ?? 0
    //     ),
    //     "",
    //     ...getOrderedStockItems.map(
    //       (si) => monthMap[month].dispatched[si.name] ?? 0
    //     ),
    //   ];
    //   sheetData.push(row);
    // }

    // Add Monthly Totals
    if (monthlyTotals.length > 0) {
      sheetData.push([]);
      sheetData.push(["Monthly Summary"]);

      monthlyTotals.forEach(([month, data]) => {
        const row = [
          month,
          "-",
          ...getOrderedStockItems.map((si) => data.required[si.name] ?? 0),
          "-",
          ...getOrderedStockItems.map((si) => data.dispatched[si.name] ?? 0),
          "-",
        ];
        sheetData.push(row);
      });
    }

    // --- Grand Total
    const grandTotalRequired: Record<string, number> = {};
    const grandTotalDispatched: Record<string, number> = {};

    getOrderedStockItems.forEach((si) => {
      grandTotalRequired[si.name] = 0;
      grandTotalDispatched[si.name] = 0;
    });

    inventoryItems.forEach((item) => {
      getOrderedStockItems.forEach((si) => {
        const reqVal = item.requiredItems[si.name] ?? 0;
        const dispVal = item.dispatchedItems[si.name] ?? 0;

        grandTotalRequired[si.name] += reqVal;
        grandTotalDispatched[si.name] += dispVal;
      });
    });

    const grandTotalRow = [
      "Grand Total",
      "",
      ...getOrderedStockItems.map((si) => grandTotalRequired[si.name]),
      "",
      ...getOrderedStockItems.map((si) => grandTotalDispatched[si.name]),
    ];

    sheetData.push([]);
    sheetData.push(grandTotalRow);

    // --- Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // --- Merge cells
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 0, c: 1 + requiredHeaders.length } },
      {
        s: { r: 0, c: 2 + requiredHeaders.length },
        e: { r: 1, c: 2 + requiredHeaders.length },
      },
      {
        s: { r: 0, c: 3 + requiredHeaders.length },
        e: { r: 0, c: 2 + requiredHeaders.length + dispatchedHeaders.length },
      },
    ];
    worksheet["!merges"] = merges;

    // --- Export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Inventory_Export.xlsx");
  };
  
  
  

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditingData({ ...item });
  };

  const handleSave = async () => {
    if (editingId && editingData) {
      try {
        // Find the original item to get existing dispatched items
        const originalItem = inventoryItems.find(item => item.id === editingId);
        if (!originalItem) {
          throw new Error("Original item not found");
        }

        // Get new dispatched items for stock update
        const newDispatchedItems = editingData.dispatchedItems || {};

        // Update the inventory item
        await updateInventoryItem(editingId, editingData);
        
        // Update stock quantities based on dispatched items changes
        if (editingData.dispatchedItems) {
          await updateStockFromDispatch(newDispatchedItems, originalItem.dispatchedItems);
        }
        
        setEditingId(null);
        setEditingData({});
        toast({
          title: "Success",
          description: "Item updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleCommentSave = async () => {
    if (selectedItem) {
      try {
        await updateInventoryItem(selectedItem.id, { comment: newComment });
        setCommentDialogOpen(false);
        setNewComment("");
        setSelectedItem(null);
        toast({
          title: "Success",
          description: "Comment updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update comment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const openCommentDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewComment(item.comment || "");
    setCommentDialogOpen(true);
  };

  const updateEditingData = (
    field: keyof InventoryItem,
    value: string | number | { [key: string]: number }
  ) => {
    setEditingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewRow = () => {
    setAddingNew(true);
    initializeNewRowData();
  };

  const handleSaveNewRow = async () => {
    if (!newRowData.location) {
      toast({
        title: "Validation Error",
        description: "Location is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get dispatched items for stock update
      const dispatchedItems = newRowData.dispatchedItems || {};

      // Add the inventory item
      await addInventoryItem(
        newRowData as Omit<InventoryItem, "id" | "createdBy">
      );
      
      // Update stock quantities based on dispatched items
      if (dispatchedItems && Object.values(dispatchedItems).some(qty => qty > 0)) {
        await updateStockFromDispatch(dispatchedItems);
      }
      
      setAddingNew(false);
      initializeNewRowData();
      toast({
        title: "Success",
        description: "New item added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelNewRow = () => {
    setAddingNew(false);
    initializeNewRowData();
  };

  const updateNewRowData = (
    field: keyof InventoryItem,
    value: string | number | { [key: string]: number }
  ) => {
    setNewRowData((prev) => ({ ...prev, [field]: value }));
  };

  const renderEditableCell = (
    item: InventoryItem,
    itemName: string,
    type: "required" | "dispatched"
  ) => {
    const isEditing = editingId === item.id;
    const itemsKey = type === "required" ? "requiredItems" : "dispatchedItems";
    const value =
      isEditing && editingData[itemsKey]
        ? (editingData[itemsKey] as { [key: string]: number })[itemName] || 0
        : item[itemsKey][itemName] || 0;

    if (isEditing) {
      return (
        <Input
          type="text"
          value={String(value)}
          onChange={(e) => {
            const numValue =
              e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0;
            const currentItems =
              (editingData[itemsKey] as { [key: string]: number }) ||
              item[itemsKey];
            updateEditingData(itemsKey, {
              ...currentItems,
              [itemName]: numValue,
            });
          }}
          className="w-12 text-center text-xs"
          placeholder="0"
        />
      );
    }

    return (
      <span className="block w-16 text-center text-xs">{value || "-"}</span>
    );
  };

  const renderNewRowInput = (
    itemName: string,
    type: "required" | "dispatched"
  ) => {
    const itemsKey = type === "required" ? "requiredItems" : "dispatchedItems";
    const value =
      (newRowData[itemsKey] as { [key: string]: number })?.[itemName] || 0;

    return (
      <Input
        type="text"
        value={String(value)}
        onChange={(e) => {
          const numValue =
            e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0;
          const currentItems =
            (newRowData[itemsKey] as { [key: string]: number }) || {};
          updateNewRowData(itemsKey, { ...currentItems, [itemName]: numValue });
        }}
        className="w-12 h-8 text-xs text-center"
        placeholder="0"
      />
    );
  };

  const totalColumns = getOrderedStockItems.length * 2 + 4; // 2 columns per stock item + location + 2 dates + comment + actions

  if (stockItems.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No stock items found. Please add stock items first to start
              managing inventory.
            </p>
            <p className="text-sm text-gray-500">
              Go to Current Stock tab to add new items.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Inventory Overview
        </CardTitle>
        <div className="flex space-x-2">
          {availableMonths.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={selectedMonth ?? "all"}
                onValueChange={(value) =>
                  setSelectedMonth(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
            onClick={handleExportToExcel}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
            onClick={handleAddNewRow}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="text-xs bg-gray-200">
              <TableRow>
                <TableHead rowSpan={2} className="w-32 text-center border-r">
                  Location
                </TableHead>
                <TableHead
                  colSpan={getOrderedStockItems.length + 1}
                  className="text-center border-r bg-green-50"
                >
                  Items Required
                </TableHead>
                <TableHead
                  colSpan={getOrderedStockItems.length + 1}
                  className="text-center bg-green-50"
                >
                  Items Dispatched
                </TableHead>
                <TableHead rowSpan={2} className="w-32 text-center">
                  Comment
                </TableHead>
                <TableHead rowSpan={2} className="w-16 text-center">
                  Actions
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="w-32 text-center border-r">
                  Request Date
                </TableHead>
                {getOrderedStockItems.map((stockItem) => (
                  <TableHead
                    key={`req-${stockItem.id}`}
                    className="w-16 text-center"
                  >
                    {stockItem.name}
                  </TableHead>
                ))}

                <TableHead className="w-32 text-center border-r">
                  Dispatched Date
                </TableHead>
                {getOrderedStockItems.map((stockItem) => (
                  <TableHead
                    key={`disp-${stockItem.id}`}
                    className="w-16 text-center"
                  >
                    {stockItem.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingNew && (
                <TableRow className="bg-blue-100/50 text-xs">
                  <TableCell className="font-medium w-32 border-r p-1">
                    <Input
                      type="text"
                      value={newRowData.location || ""}
                      onChange={(e) =>
                        updateNewRowData("location", e.target.value)
                      }
                      className="w-32 h-8"
                      placeholder="Enter location"
                    />
                  </TableCell>

                  {/* Items Required Data for New Row */}
                  <TableCell className="w-28 border-r p-1">
                    <Input
                      type="date"
                      value={(newRowData.requestDate as string) || ""}
                      onChange={(e) =>
                        updateNewRowData("requestDate", e.target.value)
                      }
                      className="w-32 h-8"
                    />
                  </TableCell>
                  {getOrderedStockItems.map((stockItem) => (
                    <TableCell key={`new-req-${stockItem.id}`} className="p-1">
                      {renderNewRowInput(stockItem.name, "required")}
                    </TableCell>
                  ))}

                  {/* Items Dispatched Data for New Row */}
                  <TableCell className="w-28 border-r p-1">
                    <Input
                      type="date"
                      value={(newRowData.dispatchedDate as string) || ""}
                      onChange={(e) =>
                        updateNewRowData("dispatchedDate", e.target.value)
                      }
                      className="w-32 h-8"
                    />
                  </TableCell>
                  {getOrderedStockItems.map((stockItem) => (
                    <TableCell key={`new-disp-${stockItem.id}`} className="p-1">
                      {renderNewRowInput(stockItem.name, "dispatched")}
                    </TableCell>
                  ))}

                  {/* Comment for New Row */}
                  <TableCell className="w-32 p-1">
                    <Textarea
                      value={(newRowData.comment as string) || ""}
                      onChange={(e) =>
                        updateNewRowData("comment", e.target.value)
                      }
                      className="w-24 h-8"
                      placeholder="Comment"
                    />
                  </TableCell>

                  {/* Actions for New Row */}
                  <TableCell className="w-16 p-1">
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveNewRow}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelNewRow}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {inventoryItems.length === 0 && !addingNew ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="text-center py-8 text-gray-500"
                  >
                    No inventory items found. Click "Add New" to create your
                    first inventory entry.
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems
                  .filter((item) => {
                    if (!selectedMonth) return true;

                    const requestMonth = item.requestDate
                      ? new Date(item.requestDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })
                      : null;

                    const dispatchedMonth = item.dispatchedDate
                      ? new Date(item.dispatchedDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )
                      : null;

                    return (
                      requestMonth === selectedMonth ||
                      dispatchedMonth === selectedMonth
                    );
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.requestDate || 0);
                    const dateB = new Date(b.requestDate || 0);
                    return dateB - dateA; // Descending order
                  })
                  .map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50/50 text-xs"
                    >
                      <TableCell className="font-medium w-32 border-r p-1">
                        {editingId === item.id ? (
                          <Input
                            type="text"
                            value={editingData.location || item.location}
                            onChange={(e) =>
                              updateEditingData("location", e.target.value)
                            }
                            className="w-32 h-8"
                            placeholder="Enter location"
                          />
                        ) : (
                          item.location
                        )}
                      </TableCell>

                      {/* Items Required Data */}
                      <TableCell className="w-32 border-r p-1">
                        {editingId === item.id ? (
                          <Input
                            type="date"
                            value={
                              (editingData.requestDate as string) ||
                              item.requestDate ||
                              ""
                            }
                            onChange={(e) =>
                              updateEditingData("requestDate", e.target.value)
                            }
                            className="w-32 text-center"
                          />
                        ) : (
                          <span className="w-28 p-4 whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.requestDate
                              ? (() => {
                                  const date = new Date(item.requestDate);
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  const month = String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0");
                                  const year = date.getFullYear();
                                  return `${day}-${month}-${year}`;
                                })()
                              : "-"}
                          </span>
                        )}
                      </TableCell>
                      {getOrderedStockItems.map((stockItem) => (
                        <TableCell
                          key={`${item.id}-req-${stockItem.id}`}
                          className="p-1"
                        >
                          {renderEditableCell(item, stockItem.name, "required")}
                        </TableCell>
                      ))}

                      {/* Items Dispatched Data */}
                      <TableCell className="w-32 border-r border-l p-1">
                        {editingId === item.id ? (
                          <Input
                            type="date"
                            value={
                              (editingData.dispatchedDate as string) ||
                              item.dispatchedDate ||
                              ""
                            }
                            onChange={(e) =>
                              updateEditingData(
                                "dispatchedDate",
                                e.target.value
                              )
                            }
                            className="w-32 text-center"
                          />
                        ) : (
                          <span className="w-28 p-4 whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.dispatchedDate
                              ? (() => {
                                  const date = new Date(item.dispatchedDate);
                                  const day = String(date.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  const month = String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0");
                                  const year = date.getFullYear();
                                  return `${day}-${month}-${year}`;
                                })()
                              : "-"}
                          </span>
                        )}
                      </TableCell>
                      {getOrderedStockItems.map((stockItem) => (
                        <TableCell
                          key={`${item.id}-disp-${stockItem.id}`}
                          className="p-1"
                        >
                          {renderEditableCell(
                            item,
                            stockItem.name,
                            "dispatched"
                          )}
                        </TableCell>
                      ))}

                      {/* Comment */}
                      <TableCell className="w-32 p-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCommentDialog(item)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {item.comment ? "View/Edit" : "Add Comment"}
                        </Button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="w-16 p-1">
                        {editingId === item.id ? (
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}

              {/* Monthly Totals Section */}
              {monthlyTotals.length > 0 && (
                <>
                  <TableRow className="bg-gray-200">
                    <TableCell
                      colSpan={totalColumns}
                      className="text-center font-bold text-lg py-4"
                    >
                      Monthly Summary
                    </TableCell>
                  </TableRow>
                  {monthlyTotals.map(([month, data]) => (
                    <TableRow
                      key={month}
                      className="bg-yellow-200 font-semibold hover:bg-yellow-200"
                    >
                      <TableCell className="font-bold w-32 border-r p-1 text-center">
                        {month}
                      </TableCell>

                      {/* Items Required Monthly Totals */}
                      <TableCell className="w-32 border-r p-1 text-center">
                        -
                      </TableCell>
                      {getOrderedStockItems.map((stockItem) => (
                        <TableCell
                          key={`month-req-${stockItem.id}`}
                          className="p-1 text-center"
                        >
                          {data.required[stockItem.name] || 0}
                        </TableCell>
                      ))}

                      {/* Items Dispatched Monthly Totals */}
                      <TableCell className="w-32 p-1 text-center">-</TableCell>
                      {getOrderedStockItems.map((stockItem) => (
                        <TableCell
                          key={`month-disp-${stockItem.id}`}
                          className="p-1 text-center"
                        >
                          {data.dispatched[stockItem.name] || 0}
                        </TableCell>
                      ))}

                      {/* Empty cells for Comment and Actions */}
                      <TableCell className="w-32 p-1">-</TableCell>
                      <TableCell className="w-16 p-1">-</TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Grand Total */}

              <TableRow className="bg-gray-200">
                <TableCell
                  colSpan={totalColumns}
                  className="text-center font-bold text-lg py-4"
                >
                  Grand Total
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell className="text-center border-r">-</TableCell>

                {/* Empty for Request Date */}
                <TableCell className="text-center border-r">-</TableCell>

                {/* Total Required Items */}
                {getOrderedStockItems.map((stockItem) => (
                  <TableCell
                    key={`grand-req-${stockItem.id}`}
                    className="text-center"
                  >
                    {grandTotal.required[stockItem.name] || 0}
                  </TableCell>
                ))}

                {/* Empty for Dispatched Date */}
                <TableCell className="text-center">-</TableCell>

                {/* Total Dispatched Items */}
                {getOrderedStockItems.map((stockItem) => (
                  <TableCell
                    key={`grand-disp-${stockItem.id}`}
                    className="text-center"
                  >
                    {grandTotal.dispatched[stockItem.name] || 0}
                  </TableCell>
                ))}

                {/* Empty for comment and actions */}
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comment for {selectedItem?.location}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment here..."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setCommentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCommentSave}>Save Comment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
