import { create } from 'zustand';
import { SupplierResponse } from '@/lib/schemas';

interface SuppliersState {
  // Filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // UI State
  isSupplierDialogOpen: boolean;
  setSupplierDialogOpen: (open: boolean) => void;
  editingSupplier: SupplierResponse | null;
  setEditingSupplier: (supplier: SupplierResponse | null) => void;
  
  // Computed values (these take suppliers as parameter)
  getFilteredSuppliers: (suppliers: SupplierResponse[]) => SupplierResponse[];
  getTotalSuppliers: (suppliers: SupplierResponse[]) => number;
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  // Filters
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  // UI State
  isSupplierDialogOpen: false,
  setSupplierDialogOpen: (open) => set({ isSupplierDialogOpen: open }),
  editingSupplier: null,
  setEditingSupplier: (supplier) => set({ editingSupplier: supplier }),
  
  // Computed values
  getFilteredSuppliers: (suppliers) => {
    const { searchTerm } = get();
    let filtered = suppliers;

    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  },
  
  getTotalSuppliers: (suppliers) => suppliers.length,
})); 