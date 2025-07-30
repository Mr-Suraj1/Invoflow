import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { InventoryForm, InventoryResponse, inventoryResponseSchema } from '@/lib/schemas';

// Query Keys
const QUERY_KEYS = {
  inventory: ['inventory'] as const,
} as const;

// API Functions
const api = {
  // Inventory
  getInventory: async (): Promise<InventoryResponse[]> => {
    const response = await fetch('/api/inventory');
    if (!response.ok) throw new Error('Failed to fetch inventory');
    const data = await response.json();
    return z.array(inventoryResponseSchema).parse(data);
  },

  createInventory: async (inventory: InventoryForm): Promise<InventoryResponse> => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory),
    });
    if (!response.ok) throw new Error('Failed to create inventory');
    const data = await response.json();
    return inventoryResponseSchema.parse(data);
  },

  updateInventory: async ({ id, inventory }: { id: string; inventory: InventoryForm }): Promise<InventoryResponse> => {
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventory),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    const data = await response.json();
    return inventoryResponseSchema.parse(data);
  },

  deleteInventory: async (id: string): Promise<void> => {
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete inventory');
  },
};

// Query Hooks
export const useInventory = () => {
  return useQuery({
    queryKey: QUERY_KEYS.inventory,
    queryFn: api.getInventory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation Hooks
export const useCreateInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createInventory,
    onSuccess: (newInventory) => {
      queryClient.setQueryData(QUERY_KEYS.inventory, (old: InventoryResponse[] = []) => [newInventory, ...old]);
      toast.success('Inventory added successfully');
    },
    onError: (error) => {
      console.error('Create inventory error:', error);
      toast.error('Failed to add inventory');
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateInventory,
    onSuccess: (updatedInventory) => {
      queryClient.setQueryData(QUERY_KEYS.inventory, (old: InventoryResponse[] = []) =>
        old.map(inv => inv.id === updatedInventory.id ? updatedInventory : inv)
      );
      toast.success('Inventory updated successfully');
    },
    onError: (error) => {
      console.error('Update inventory error:', error);
      toast.error('Failed to update inventory');
    },
  });
};

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteInventory,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(QUERY_KEYS.inventory, (old: InventoryResponse[] = []) =>
        old.filter(inv => inv.id !== deletedId)
      );
      toast.success('Inventory deleted successfully');
    },
    onError: (error) => {
      console.error('Delete inventory error:', error);
      toast.error('Failed to delete inventory');
    },
  });
}; 