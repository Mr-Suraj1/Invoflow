import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { SupplierForm, SupplierResponse, supplierResponseSchema } from '@/lib/schemas';

// Query Keys
const QUERY_KEYS = {
  suppliers: ['suppliers'] as const,
} as const;

// API Functions
const api = {
  // Suppliers
  getSuppliers: async (): Promise<SupplierResponse[]> => {
    const response = await fetch('/api/suppliers');
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    const data = await response.json();
    return z.array(supplierResponseSchema).parse(data);
  },

  createSupplier: async (supplier: SupplierForm): Promise<SupplierResponse> => {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    if (!response.ok) throw new Error('Failed to create supplier');
    const data = await response.json();
    return supplierResponseSchema.parse(data);
  },

  updateSupplier: async ({ id, supplier }: { id: string; supplier: SupplierForm }): Promise<SupplierResponse> => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    if (!response.ok) throw new Error('Failed to update supplier');
    const data = await response.json();
    return supplierResponseSchema.parse(data);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete supplier');
  },
};

// Query Hooks
export const useSuppliers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: api.getSuppliers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Mutation Hooks
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createSupplier,
    onSuccess: (newSupplier) => {
      queryClient.setQueryData(QUERY_KEYS.suppliers, (old: SupplierResponse[] = []) => [newSupplier, ...old]);
      toast.success('Supplier created successfully');
    },
    onError: (error) => {
      console.error('Create supplier error:', error);
      toast.error('Failed to create supplier');
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateSupplier,
    onSuccess: (updatedSupplier) => {
      queryClient.setQueryData(QUERY_KEYS.suppliers, (old: SupplierResponse[] = []) =>
        old.map(supplier => supplier.id === updatedSupplier.id ? updatedSupplier : supplier)
      );
      toast.success('Supplier updated successfully');
    },
    onError: (error) => {
      console.error('Update supplier error:', error);
      toast.error('Failed to update supplier');
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteSupplier,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(QUERY_KEYS.suppliers, (old: SupplierResponse[] = []) =>
        old.filter(supplier => supplier.id !== deletedId)
      );
      toast.success('Supplier deleted successfully');
    },
    onError: (error) => {
      console.error('Delete supplier error:', error);
      toast.error('Failed to delete supplier');
    },
  });
}; 