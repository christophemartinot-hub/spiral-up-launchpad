import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CampaignRow = {
  id: string;
  name: string;
  description: string;
  brief: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  channels: string[];
  content_pillars: string[];
  budget: number;
  goals: string[];
  progress: number;
  owner_name: string;
  created_at: string;
  updated_at: string;
};

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CampaignRow[];
    },
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as CampaignRow | null;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<CampaignRow>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
