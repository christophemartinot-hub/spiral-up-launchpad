import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Planning Config ───
export function usePlanningConfig() {
  return useQuery({
    queryKey: ['planning-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('planning_config').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useUpdatePlanningConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('planning_config').select('id').limit(1).single();
      if (!existing) throw new Error('No planning config');
      const { error } = await supabase.from('planning_config').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning-config'] }),
  });
}

// ─── Editorial Plans ───
export function useEditorialPlans() {
  return useQuery({
    queryKey: ['editorial-plans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_plans').select('*').order('cycle_start', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEditorialPlan(planId: string | null) {
  return useQuery({
    queryKey: ['editorial-plan', planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_plans').select('*').eq('id', planId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteEditorialPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('editorial_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-plans'] });
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
    },
  });
}

// ─── Editorial Items ───
export function useEditorialItems(planId: string | null) {
  return useQuery({
    queryKey: ['editorial-items', planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_items').select('*').eq('plan_id', planId!).order('publish_date').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllPendingItems() {
  return useQuery({
    queryKey: ['editorial-items-pending'],
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_items').select('*, editorial_plans(cycle_start, cycle_end)').in('status', ['suggested', 'under_review']).order('publish_date');
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── All Editorial Items (cross-plan, for Week Review timeline) ───
export function useAllEditorialItems() {
  return useQuery({
    queryKey: ['editorial-items-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_items')
        .select('*, editorial_plans(cycle_start, cycle_end, cadence)')
        .order('publish_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateEditorialItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from('editorial_items').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-pending'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-all'] });
    },
  });
}

export function useDeleteEditorialItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('editorial_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-pending'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-all'] });
    },
  });
}

// ─── Generate Plan ───
export function useGenerateEditorialPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { config: any; cycleStart: string; cycleEnd: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-editorial-plan', { body: params });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-plans'] });
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-pending'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-all'] });
      qc.invalidateQueries({ queryKey: ['learning-memory'] });
    },
  });
}

// ─── Regenerate Item ───
export function useRegenerateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.functions.invoke('generate-editorial-plan', {
        body: { action: 'regenerate_item', item },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { error: updateError } = await supabase.from('editorial_items').update({
        ...data.item,
        status: 'suggested',
        visual_status: data.item.visual_type ? 'suggested' : 'none',
        rejection_reason: '',
        updated_at: new Date().toISOString(),
      } as any).eq('id', item.id);
      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-pending'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-all'] });
    },
  });
}

// ─── Regenerate Visual Only ───
export function useRegenerateVisual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.functions.invoke('generate-editorial-plan', {
        body: { action: 'regenerate_visual', item },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { error: updateError } = await supabase.from('editorial_items').update({
        ...data.visual,
        visual_status: 'suggested',
        updated_at: new Date().toISOString(),
      } as any).eq('id', item.id);
      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editorial-items'] });
      qc.invalidateQueries({ queryKey: ['editorial-items-pending'] });
    },
  });
}

// ─── Visual Config ───
export function useVisualConfig() {
  return useQuery({
    queryKey: ['visual-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('visual_config').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useUpdateVisualConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: existing } = await supabase.from('visual_config').select('id').limit(1).single();
      if (!existing) throw new Error('No visual config');
      const { error } = await supabase.from('visual_config').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visual-config'] }),
  });
}

// ─── Learning Memory ───
export function useLearningMemory() {
  return useQuery({
    queryKey: ['learning-memory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_memory').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Cycle Completion Check ───
export function useCycleCompletionStatus(planId: string | null) {
  return useQuery({
    queryKey: ['cycle-completion', planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_items').select('status').eq('plan_id', planId!);
      if (error) throw error;
      const items = data ?? [];
      if (items.length === 0) return { complete: false, total: 0, decided: 0, pct: 0 };
      const decided = items.filter(i => ['approved', 'rejected', 'scheduled', 'published'].includes(i.status)).length;
      const pct = Math.round((decided / items.length) * 100);
      return { complete: pct >= 80, total: items.length, decided, pct };
    },
  });
}
