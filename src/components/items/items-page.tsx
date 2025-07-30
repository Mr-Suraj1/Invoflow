"use client";


import { Plus, Package, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Imports for optimized architecture
import { useItemsStore } from '@/stores/items-store';
import { 
  useItems, 
  useCreateItem, 
  useUpdateItem, 
  useDeleteItem
} from '@/hooks/use-items';
import { ItemForm, itemSchema, categories, units } from '@/lib/schemas';

export default function ItemsPage() {
  // Zustand store (UI state only)
  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    isItemDialogOpen,
    setItemDialogOpen,
    editingItem,
    setEditingItem,
    getFilteredItems,
    getTotalItems,
  } = useItemsStore();

  // TanStack Query hooks
  const { data: items = [], isLoading: isLoadingItems } = useItems();
  
  // Mutations
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const deleteItemMutation = useDeleteItem();

  // Forms with Zod validation
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  // Watch form values for controlled components
  const watchedCategory = watch('category');
  const watchedUnit = watch('unit');

  // Get computed values from store using current data
  const currentFilteredItems = getFilteredItems(items);
  const currentTotalItems = getTotalItems(items);

  // Handle form submission
  const onSubmit = async (data: ItemForm) => {
    if (editingItem) {
      updateItemMutation.mutate(
        { id: editingItem.id, item: data },
        {
          onSuccess: () => {
            setItemDialogOpen(false);
            setEditingItem(null);
            reset();
          },
        }
      );
    } else {
      createItemMutation.mutate(data, {
        onSuccess: () => {
          setItemDialogOpen(false);
          reset();
        },
      });
    }
  };

  // Handle edit
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue('name', item.name);
    setValue('category', item.category || '');
    setValue('unit', item.unit || '');
    setValue('description', item.description || '');
    setValue('costPrice', parseFloat(item.costPrice));
    setValue('sellingPrice', parseFloat(item.sellingPrice));
    setValue('quantity', parseFloat(item.quantity));
    setItemDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    deleteItemMutation.mutate(id);
  };

  // Loading state
  const isLoading = isLoadingItems;

  if (isLoading) {
    return <div className="container mx-auto p-4 sm:p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Items Catalog
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Manage your items and product catalog
          </p>
        </div>
        
        <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingItem(null);
                reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Item name is required' })}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  {...register('costPrice', { 
                    required: 'Cost price is required',
                    min: { value: 0, message: 'Cost price must be positive' },
                    valueAsNumber: true
                  })}
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <p className="text-sm text-red-500 mt-1">{errors.costPrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Quantity (per unit)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 0.01, message: 'Quantity must be positive' },
                    valueAsNumber: true
                  })}
                  placeholder="1.00"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={watchedCategory || ''} 
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={watchedUnit || 'pcs'} 
                  onValueChange={(value) => setValue('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register('description')}
                  placeholder="Enter item description (optional)"
                />
              </div>

              <div>
                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  {...register('sellingPrice', { 
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Price must be positive' },
                    valueAsNumber: true
                  })}
                  placeholder="0.00"
                />
                {errors.sellingPrice && (
                  <p className="text-sm text-red-500 mt-1">{errors.sellingPrice.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {createItemMutation.isPending || updateItemMutation.isPending 
                    ? 'Saving...' 
                    : editingItem ? 'Update Item' : 'Add Item'
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setItemDialogOpen(false);
                    setEditingItem(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTotalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map(item => item.category)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTotalItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {currentFilteredItems.length} of {currentTotalItems} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFilteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground dark:text-white">No items found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {items.length === 0 ? 'Get started by adding your first item.' : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFilteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-muted-foreground">{item.unit || 'pcs'}</TableCell>
                      <TableCell>{parseFloat(item.quantity).toFixed(2)}</TableCell>
                      <TableCell>₹{parseFloat(item.costPrice).toFixed(2)}</TableCell>
                      <TableCell>₹{parseFloat(item.sellingPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Package className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item.id)}
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