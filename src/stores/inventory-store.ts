import { create } from 'zustand';
import type { InventoryResponse } from '@/lib/schemas';

interface InventoryState {
  // UI State
  searchTerm: string;
  itemFilter: string;
  supplierFilter: string;
  isInventoryDialogOpen: boolean;
  editingInventory: InventoryResponse | null;

  // Actions
  setSearchTerm: (term: string) => void;
  setItemFilter: (filter: string) => void;
  setSupplierFilter: (filter: string) => void;
  setInventoryDialogOpen: (open: boolean) => void;
  setEditingInventory: (inventory: InventoryResponse | null) => void;

  // Computed functions (take data as parameters to avoid circular dependencies)
  getFilteredInventory: (inventory: InventoryResponse[]) => InventoryResponse[];
  getTotalInventory: (inventory: InventoryResponse[]) => number;
  getTotalValue: (inventory: InventoryResponse[]) => number;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // UI State
  searchTerm: '',
  itemFilter: 'all',
  supplierFilter: 'all',
  isInventoryDialogOpen: false,
  editingInventory: null,

  // Actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  setItemFilter: (filter) => set({ itemFilter: filter }),
  setSupplierFilter: (filter) => set({ supplierFilter: filter }),
  setInventoryDialogOpen: (open) => set({ isInventoryDialogOpen: open }),
  setEditingInventory: (inventory) => set({ editingInventory: inventory }),

  // Computed functions
  getFilteredInventory: (inventory) => {
    const { searchTerm, itemFilter, supplierFilter } = get();
    
    return inventory.filter(inv => {
      const matchesSearch = !searchTerm || 
        inv.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.batchNumber && inv.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesItem = itemFilter === 'all' || inv.itemId === itemFilter;
      const matchesSupplier = supplierFilter === 'all' || inv.supplierId === supplierFilter;

      return matchesSearch && matchesItem && matchesSupplier;
    });
  },

  getTotalInventory: (inventory) => inventory.length,

  getTotalValue: (inventory) => 
    inventory.reduce((total, inv) => 
      total + (parseFloat(inv.item.costPrice) * parseFloat(inv.availableQuantity)), 0
    ),
})); 