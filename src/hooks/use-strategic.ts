import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useStrategicCycles() {
  return useQuery({
    queryKey: ['strategic-cycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_cycles')
        .select('*')
        .order('cycle_start', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useStrategicIdeas(cycleId: string | null) {
  return useQuery({
    queryKey: ['strategic-ideas', cycleId],
    enabled: !!cycleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_ideas')
        .select('*')
        .eq('cycle_id', cycleId!)
        .order('overall_rank', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLatestApprovedIdeas() {
  return useQuery({
    queryKey: ['strategic-ideas-approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_ideas')
        .select('*, strategic_cycles(cycle_start, cycle_end)')
        .eq('status', 'approved')
        .order('overall_rank', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateStrategicIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from('strategic_ideas')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategic-ideas'] });
      qc.invalidateQueries({ queryKey: ['strategic-ideas-approved'] });
    },
  });
}

export function useDeleteStrategicIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('strategic_ideas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategic-ideas'] });
    },
  });
}

export function useGenerateStrategicIdeas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cycleStart: string; cycleEnd: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-strategic-ideas', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategic-cycles'] });
      qc.invalidateQueries({ queryKey: ['strategic-ideas'] });
      qc.invalidateQueries({ queryKey: ['strategic-ideas-approved'] });
      toast.success('Strategic ideas generated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteStrategicCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('strategic_cycles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategic-cycles'] });
      qc.invalidateQueries({ queryKey: ['strategic-ideas'] });
    },
  });
}
