import { create } from 'zustand';
import type { ItemResponse } from '@/lib/schemas';

interface ItemsState {
  // UI State
  searchTerm: string;
  categoryFilter: string;
  isItemDialogOpen: boolean;
  editingItem: ItemResponse | null;

  // Actions
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (filter: string) => void;
  setItemDialogOpen: (open: boolean) => void;
  setEditingItem: (item: ItemResponse | null) => void;

  // Computed functions (take data as parameters to avoid circular dependencies)
  getFilteredItems: (items: ItemResponse[]) => ItemResponse[];
  getTotalItems: (items: ItemResponse[]) => number;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  // UI State
  searchTerm: '',
  categoryFilter: 'all',
  isItemDialogOpen: false,
  editingItem: null,

  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  setCategoryFilter: (filter) => set({ categoryFilter: filter }),
  setItemDialogOpen: (open) => set({ isItemDialogOpen: open }),
  setEditingItem: (item) => set({ editingItem: item }),

  // Computed functions
  getFilteredItems: (items) => {
    const { searchTerm, categoryFilter } = get();
    
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  },

  getTotalItems: (items) => items.length,
})); 