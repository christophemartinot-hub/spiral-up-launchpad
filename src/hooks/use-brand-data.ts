import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Brand Core ───
export function useBrandCore() {
  return useQuery({
    queryKey: ['brand-core'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_core').select('*').limit(1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateBrandCore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('brand_core').select('id').limit(1).single();
      if (!existing) throw new Error('No brand core row');
      const { error } = await supabase.from('brand_core').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brand-core'] }),
  });
}

// ─── Founder Profile ───
export function useFounderProfile() {
  return useQuery({
    queryKey: ['founder-profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('founder_profile').select('*').limit(1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateFounderProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('founder_profile').select('id').limit(1).single();
      if (!existing) throw new Error('No founder profile row');
      const { error } = await supabase.from('founder_profile').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['founder-profile'] }),
  });
}

// ─── SPIRAL Principles ───
export function useSpiralPrinciples() {
  return useQuery({
    queryKey: ['spiral-principles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('spiral_principles').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateSpiralPrinciple() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from('spiral_principles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spiral-principles'] }),
  });
}

// ─── Voice Rules ───
export function useVoiceRules() {
  return useQuery({
    queryKey: ['voice-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('voice_rules').select('*').limit(1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateVoiceRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('voice_rules').select('id').limit(1).single();
      if (!existing) throw new Error('No voice rules row');
      const { error } = await supabase.from('voice_rules').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-rules'] }),
  });
}

// ─── Content Pillars ───
export function useContentPillars() {
  return useQuery({
    queryKey: ['content-pillars'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_content_pillars').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertContentPillar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pillar: Record<string, unknown>) => {
      const { error } = await supabase.from('brand_content_pillars').upsert({ ...pillar, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-pillars'] }),
  });
}

export function useDeleteContentPillar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brand_content_pillars').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-pillars'] }),
  });
}

// ─── Brand Assets ───
export function useBrandAssets() {
  return useQuery({
    queryKey: ['brand-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertBrandAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Record<string, unknown>) => {
      const { error } = await supabase.from('brand_assets').upsert({ ...asset, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brand-assets'] }),
  });
}

export function useDeleteBrandAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brand_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brand-assets'] }),
  });
}

// ─── Website Pages ───
export function useWebsitePages() {
  return useQuery({
    queryKey: ['website-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('website_pages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertWebsitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Record<string, unknown>) => {
      const { error } = await supabase.from('website_pages').upsert({ ...page, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-pages'] }),
  });
}

export function useDeleteWebsitePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('website_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-pages'] }),
  });
}

// ─── Offers ───
export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offers').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offer: Record<string, unknown>) => {
      const { error } = await supabase.from('offers').upsert({ ...offer, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

// ─── Example Content ───
export function useExampleContent() {
  return useQuery({
    queryKey: ['example-content'],
    queryFn: async () => {
      const { data, error } = await supabase.from('example_content').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertExampleContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { error } = await supabase.from('example_content').upsert({ ...item, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['example-content'] }),
  });
}

export function useDeleteExampleContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('example_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['example-content'] }),
  });
}
