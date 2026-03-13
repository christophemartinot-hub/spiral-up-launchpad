import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useAuditLog() {
  return useMutation({
    mutationFn: async (entry: {
      action: string;
      entity_type: string;
      entity_id?: string;
      details?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('audit_log').insert({
        user_id: user?.id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || '',
        details: entry.details || {},
      } as any);
      if (error) throw error;
    },
  });
}

export function useAuditLogEntries(entityType?: string, limit = 50) {
  return useQuery({
    queryKey: ['audit-log', entityType, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (entityType) query = query.eq('entity_type', entityType);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
