import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Performance Data ───
export function usePerformanceData() {
  return useQuery({
    queryKey: ['content-performance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_performance').select('*').order('publish_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertPerformance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: { id?: string } & Record<string, unknown>) => {
      if (record.id) {
        const { error } = await supabase.from('content_performance').update({ ...record, updated_at: new Date().toISOString() } as any).eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_performance').insert(record as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-performance'] }),
  });
}

export function useDeletePerformance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_performance').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-performance'] }),
  });
}

// ─── Performance Config ───
export function usePerformanceConfig() {
  return useQuery({
    queryKey: ['performance-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('performance_config').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useUpdatePerformanceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('performance_config').select('id').limit(1).single();
      if (!existing) throw new Error('No performance config');
      const { error } = await supabase.from('performance_config').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['performance-config'] }),
  });
}

// ─── Performance Summaries ───
export function usePerformanceSummary() {
  return useQuery({
    queryKey: ['performance-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('content_performance').select('*');
      if (error) throw error;
      const items = data ?? [];
      if (items.length === 0) return null;

      // By channel
      const byChannel: Record<string, { count: number; totalEngagement: number; totalClicks: number; totalImpressions: number }> = {};
      // By pillar
      const byPillar: Record<string, { count: number; totalEngagement: number; totalClicks: number }> = {};
      // By format
      const byFormat: Record<string, { count: number; totalEngagement: number }> = {};
      // By visual type
      const byVisual: Record<string, { count: number; totalEngagement: number }> = {};

      let topPost = items[0];
      let lowPost = items[0];

      for (const item of items) {
        // Channel
        const ch = item.channel || 'unknown';
        if (!byChannel[ch]) byChannel[ch] = { count: 0, totalEngagement: 0, totalClicks: 0, totalImpressions: 0 };
        byChannel[ch].count++;
        byChannel[ch].totalEngagement += item.engagement || 0;
        byChannel[ch].totalClicks += item.clicks || 0;
        byChannel[ch].totalImpressions += item.impressions || 0;

        // Pillar
        const pl = item.content_pillar || 'none';
        if (!byPillar[pl]) byPillar[pl] = { count: 0, totalEngagement: 0, totalClicks: 0 };
        byPillar[pl].count++;
        byPillar[pl].totalEngagement += item.engagement || 0;
        byPillar[pl].totalClicks += item.clicks || 0;

        // Format
        const fmt = item.content_format || 'unknown';
        if (!byFormat[fmt]) byFormat[fmt] = { count: 0, totalEngagement: 0 };
        byFormat[fmt].count++;
        byFormat[fmt].totalEngagement += item.engagement || 0;

        // Visual
        const vt = item.visual_type || 'none';
        if (!byVisual[vt]) byVisual[vt] = { count: 0, totalEngagement: 0 };
        byVisual[vt].count++;
        byVisual[vt].totalEngagement += item.engagement || 0;

        // Top / low
        if ((item.engagement || 0) > (topPost.engagement || 0)) topPost = item;
        if ((item.engagement || 0) < (lowPost.engagement || 0)) lowPost = item;
      }

      return { byChannel, byPillar, byFormat, byVisual, topPost, lowPost, total: items.length, items };
    },
  });
}

// ─── Subscribers ───
export function useSubscribers() {
  return useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubscriberCount() {
  return useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// ─── Email Campaigns ───
export function useEmailCampaigns() {
  return useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('email_campaigns').select('*, editorial_items(working_title, channel, content_format)').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEmailCampaign(id: string | null) {
  return useQuery({
    queryKey: ['email-campaign', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('email_campaigns').select('*, editorial_items(*)').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Record<string, unknown>) => {
      const { data, error } = await supabase.from('email_campaigns').insert(campaign as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-campaigns'] }),
  });
}

export function useUpdateEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from('email_campaigns').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      qc.invalidateQueries({ queryKey: ['email-campaign'] });
    },
  });
}

export function useDeleteEmailCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-campaigns'] }),
  });
}

// ─── Send Campaign via Resend ───
export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { campaignId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      qc.invalidateQueries({ queryKey: ['email-campaign'] });
    },
  });
}

// ─── Generate Email from Blog ───
export function useGenerateBlogEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.functions.invoke('generate-editorial-plan', {
        body: { action: 'generate_blog_email', item },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-campaigns'] }),
  });
}
