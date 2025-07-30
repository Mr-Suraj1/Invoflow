import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface BusinessProfile {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
}

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<BusinessProfile> => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    },
  });
};

export const useSaveProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: BusinessProfile) => {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}; 