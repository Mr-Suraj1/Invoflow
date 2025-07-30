"use client";

import { Plus, Search, Edit, Trash2, Truck, Building2, Phone, Mail, Globe, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Imports for optimized architecture
import { useSuppliersStore } from '@/stores/suppliers-store';
import { 
  useSuppliers, 
  useCreateSupplier, 
  useUpdateSupplier, 
  useDeleteSupplier 
} from '@/hooks/use-suppliers';
import { SupplierForm, supplierSchema } from '@/lib/schemas';

export function SuppliersPage() {
  // Zustand store (UI state only)
  const {
    searchTerm,
    setSearchTerm,
    isSupplierDialogOpen,
    setSupplierDialogOpen,
    editingSupplier,
    setEditingSupplier,
    getFilteredSuppliers,
    getTotalSuppliers,
  } = useSuppliersStore();

  // TanStack Query hooks
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  
  // Mutations
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  // Form with Zod validation
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors } 
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  });

  // Get computed values from store using current data
  const currentFilteredSuppliers = getFilteredSuppliers(suppliers);
  const currentTotalSuppliers = getTotalSuppliers(suppliers);

  // Handle form submission
  const onSubmit = async (data: SupplierForm) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate(
        { id: editingSupplier.id, supplier: data },
        {
          onSuccess: () => {
            setSupplierDialogOpen(false);
            setEditingSupplier(null);
            reset();
          },
        }
      );
    } else {
      createSupplierMutation.mutate(data, {
        onSuccess: () => {
          setSupplierDialogOpen(false);
          reset();
        },
      });
    }
  };

  // Handle edit
  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setValue('name', supplier.name);
    setValue('contactPerson', supplier.contactPerson || '');
    setValue('email', supplier.email || '');
    setValue('phone', supplier.phone || '');
    setValue('address', supplier.address || '');
    setValue('website', supplier.website || '');
    setValue('notes', supplier.notes || '');
    setSupplierDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    deleteSupplierMutation.mutate(id);
  };

  // Loading state
  if (isLoadingSuppliers) {
    return <div className="container mx-auto p-4 sm:p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Suppliers & Vendors
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        
        <Dialog open={isSupplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => {
                setEditingSupplier(null);
                reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Supplier name is required' })}
                  placeholder="Enter supplier name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  {...register('contactPerson')}
                  placeholder="Enter contact person name"
                />
                {errors.contactPerson && (
                  <p className="text-sm text-red-500 mt-1">{errors.contactPerson.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter supplier email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="Enter supplier phone"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder="Enter supplier address"
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional notes about this supplier"
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending || updateSupplierMutation.isPending 
                    ? 'Saving...' 
                    : editingSupplier ? 'Update Supplier' : 'Add Supplier'
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setSupplierDialogOpen(false);
                    setEditingSupplier(null);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTotalSuppliers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTotalSuppliers}</div>
            <p className="text-xs text-muted-foreground">All suppliers are active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Contact Info</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.email || s.phone).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {suppliers.length > 0 ? 
                `${Math.round((suppliers.filter(s => s.email || s.phone).length / suppliers.length) * 100)}% have contact info` :
                'No suppliers yet'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers by name, contact person, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>
            {currentFilteredSuppliers.length} of {currentTotalSuppliers} suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFilteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground dark:text-white">No suppliers found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {suppliers.length === 0 ? 'Get started by adding your first supplier.' : 'Try adjusting your search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFilteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {supplier.contactPerson || '-'}
                      </TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`mailto:${supplier.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {supplier.email}
                            </a>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`tel:${supplier.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {supplier.phone}
                            </a>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {supplier.address ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">
                              {supplier.address}
                            </span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {supplier.website ? (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Visit
                            </a>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Building2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(supplier.id)}
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