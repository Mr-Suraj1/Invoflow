import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Bill {
  id: string;
  billNumber: string;
  invoiceNumber: string;
  billDate: string;
  subtotal: string;
  taxRate: string;
  tax: string;
  extraChargesTotal: string;
  total: string;
  status: 'due' | 'paid';
  notes: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  items: Array<{
    id: string;
    inventoryId: string;
    quantity: string;
    sellingPrice: string;
    total: string;
    inventory: {
      id: string;
      item: {
        id: string;
        name: string;
        sku: string;
        unit: string | null;
      };
    };
  }>;
  extraCharges?: Array<{
    id: string;
    name: string;
    amount: string;
  }>;
}

export const useBills = () => {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async (): Promise<Bill[]> => {
      const response = await fetch('/api/bills');
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      return response.json();
    },
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (billData: any) => {
      console.log('Sending bill data to API:', billData);
      
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API success response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Bill creation successful, invalidating queries...');
      // Invalidate and refetch bills data
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      // Also invalidate inventory data since stock was updated
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('Bill creation failed:', error);
    },
  });
};

export const useUpdateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...billData }: { id: string } & any) => {
      console.log('Updating bill:', id, billData);
      
      const response = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Bill update successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error) => {
      console.error('Bill update failed:', error);
    },
  });
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (billId: string) => {
      console.log('Deleting bill:', billId);
      
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Bill deletion successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('Bill deletion failed:', error);
    },
  });
};

export const useUpdateBillStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log('Updating bill status:', id, status);
      
      const response = await fetch(`/api/bills/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Status update API error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log('Bill status update successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error) => {
      console.error('Bill status update failed:', error);
    },
  });
}; 

export const useBillDetails = (billId: string) => {
  return useQuery({
    queryKey: ['bill', billId],
    queryFn: async (): Promise<Bill> => {
      if (!billId) {
        throw new Error('Bill ID is required');
      }
      
      const response = await fetch(`/api/bills/${billId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill details');
      }
      return response.json();
    },
    enabled: !!billId, // Only run the query if billId is provided
  });
}; 