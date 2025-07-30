import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { ItemForm, ItemResponse, itemResponseSchema } from '@/lib/schemas';

// Query Keys
const QUERY_KEYS = {
  items: ['items'] as const,
} as const;

// API Functions
const api = {
  // Items
  getItems: async (): Promise<ItemResponse[]> => {
    const response = await fetch('/api/items');
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();
    return z.array(itemResponseSchema).parse(data);
  },

  createItem: async (item: ItemForm): Promise<ItemResponse> => {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create item');
    const data = await response.json();
    return itemResponseSchema.parse(data);
  },

  updateItem: async ({ id, item }: { id: string; item: ItemForm }): Promise<ItemResponse> => {
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update item');
    const data = await response.json();
    return itemResponseSchema.parse(data);
  },

  deleteItem: async (id: string): Promise<void> => {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
  },
};

// Query Hooks
export const useItems = () => {
  return useQuery({
    queryKey: QUERY_KEYS.items,
    queryFn: api.getItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation Hooks
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData(QUERY_KEYS.items, (old: ItemResponse[] = []) => [newItem, ...old]);
      toast.success('Item created successfully');
    },
    onError: (error) => {
      console.error('Create item error:', error);
      toast.error('Failed to create item');
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateItem,
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(QUERY_KEYS.items, (old: ItemResponse[] = []) =>
        old.map(item => item.id === updatedItem.id ? updatedItem : item)
      );
      toast.success('Item updated successfully');
    },
    onError: (error) => {
      console.error('Update item error:', error);
      toast.error('Failed to update item');
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteItem,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(QUERY_KEYS.items, (old: ItemResponse[] = []) =>
        old.filter(item => item.id !== deletedId)
      );
      toast.success('Item deleted successfully');
    },
    onError: (error) => {
      console.error('Delete item error:', error);
      toast.error('Failed to delete item');
    },
  });
}; 