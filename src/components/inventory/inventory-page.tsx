"use client";

import { useState } from 'react';
import { Plus, Warehouse, Search, Trash2, Package, Filter, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Imports for optimized architecture
import { useInventoryStore } from '@/stores/inventory-store';
import { 
  useInventory, 
  useDeleteInventory
} from '@/hooks/use-inventory';
import { useItems } from '@/hooks/use-items';
import { useSuppliers } from '@/hooks/use-suppliers';

export default function InventoryPage() {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Zustand store (UI state only)
  const {
    searchTerm,
    setSearchTerm,
    itemFilter,
    setItemFilter,
    supplierFilter,
    setSupplierFilter,
    getFilteredInventory,
    getTotalInventory,
    getTotalValue,
  } = useInventoryStore();

  // TanStack Query hooks
  const { data: inventory = [], isLoading: isLoadingInventory } = useInventory();
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  
  // Mutations
  const deleteInventoryMutation = useDeleteInventory();

  // Date filtering logic
  const getFilteredInventoryByDate = () => {
    if (dateFilter === 'all') return inventory;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return inventory.filter(inv => {
      const purchaseDate = new Date(inv.purchaseDate);
      
      switch (dateFilter) {
        case 'today':
          return purchaseDate >= today;
        case 'week':
          return purchaseDate >= startOfWeek;
        case 'month':
          return purchaseDate >= startOfMonth;
        case 'custom':
          if (!customDateRange.from || !customDateRange.to) return true;
          const fromDate = new Date(customDateRange.from);
          const toDate = new Date(customDateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          return purchaseDate >= fromDate && purchaseDate <= toDate;
        default:
          return true;
      }
    });
  };

  // Get computed values from store using current data
  const dateFilteredInventory = getFilteredInventoryByDate();
  const currentFilteredInventory = getFilteredInventory(dateFilteredInventory);
  const currentTotalInventory = getTotalInventory(dateFilteredInventory);
  const currentTotalValue = getTotalValue(dateFilteredInventory);



  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    deleteInventoryMutation.mutate(id);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Loading state
  const isLoading = isLoadingInventory || isLoadingItems || isLoadingSuppliers;

  if (isLoading) {
    return <div className="container mx-auto p-4 sm:p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Inventory Management
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Track stock levels, suppliers, and purchase information
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium hidden sm:inline">Filter:</span>
          </div>
          
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Till Now</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customDateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      format(customDateRange.from, "LLL dd, y")
                    ) : (
                      <span>From date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.from}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !customDateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.to ? (
                      format(customDateRange.to, "LLL dd, y")
                    ) : (
                      <span>To date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDateRange.to}
                    onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {dateFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setCustomDateRange({ from: undefined, to: undefined });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}

          <Button 
            className="w-full sm:w-auto"
            onClick={() => window.location.href = '/purchase-bills/new'}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Bill
          </Button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTotalInventory}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentTotalValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(dateFilteredInventory.map(inv => inv.itemId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, SKU, or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            {currentFilteredInventory.length} of {currentTotalInventory} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFilteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground dark:text-white">No inventory found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dateFilteredInventory.length === 0 ? 'Get started by adding your first stock item.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Batch/Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFilteredInventory.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{inv.item.name}</div>
                          <div className="text-sm text-muted-foreground">{inv.item.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {inv.supplier ? inv.supplier.name : 'No Supplier'}
                      </TableCell>
                      <TableCell>
                        <div>
                          {inv.batchNumber && <div className="text-sm">Batch: {inv.batchNumber}</div>}
                          {inv.location && <div className="text-sm text-muted-foreground">{inv.location}</div>}
                          {!inv.batchNumber && !inv.location && '-'}
                        </div>
                      </TableCell>
                      <TableCell>{parseFloat(inv.quantity).toFixed(2)} {inv.item.unit || 'pcs'}</TableCell>
                      <TableCell>{parseFloat(inv.availableQuantity).toFixed(2)} {inv.item.unit || 'pcs'}</TableCell>
                      <TableCell>₹{parseFloat(inv.costPrice).toFixed(2)}</TableCell>
                      <TableCell>₹{parseFloat(inv.item.sellingPrice).toFixed(2)}</TableCell>
                      <TableCell>{formatDate(inv.purchaseDate)}</TableCell>
                      <TableCell>₹{(parseFloat(inv.costPrice) * parseFloat(inv.quantity)).toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Warehouse className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDelete(inv.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  );
} 