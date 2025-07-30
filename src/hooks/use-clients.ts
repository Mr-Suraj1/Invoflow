import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

// Use existing client schemas from main schemas file - define them here for now
const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const clientResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ClientForm = z.infer<typeof clientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;

// Query Keys
const QUERY_KEYS = {
  clients: ['clients'] as const,
} as const;

// API Functions
const api = {
  // Clients
  getClients: async (): Promise<ClientResponse[]> => {
    const response = await fetch('/api/clients');
    if (!response.ok) throw new Error('Failed to fetch clients');
    const data = await response.json();
    return z.array(clientResponseSchema).parse(data);
  },

  createClient: async (client: ClientForm): Promise<ClientResponse> => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
    const data = await response.json();
    return clientResponseSchema.parse(data);
  },

  updateClient: async ({ id, client }: { id: string; client: ClientForm }): Promise<ClientResponse> => {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to update client');
    const data = await response.json();
    return clientResponseSchema.parse(data);
  },

  deleteClient: async (id: string): Promise<void> => {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete client');
  },
};

// Query Hooks
export const useClients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.clients,
    queryFn: api.getClients,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Mutation Hooks
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createClient,
    onSuccess: (newClient) => {
      queryClient.setQueryData(QUERY_KEYS.clients, (old: ClientResponse[] = []) => [newClient, ...old]);
      toast.success('Client created successfully');
    },
    onError: (error) => {
      console.error('Create client error:', error);
      toast.error('Failed to create client');
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.updateClient,
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(QUERY_KEYS.clients, (old: ClientResponse[] = []) =>
        old.map(client => client.id === updatedClient.id ? updatedClient : client)
      );
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      console.error('Update client error:', error);
      toast.error('Failed to update client');
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteClient,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(QUERY_KEYS.clients, (old: ClientResponse[] = []) =>
        old.filter(client => client.id !== deletedId)
      );
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      console.error('Delete client error:', error);
      toast.error('Failed to delete client');
    },
  });
}; 