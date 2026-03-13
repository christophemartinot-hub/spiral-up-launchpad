import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Comments ───
export function useComments(filters?: { status?: string; channel?: string; priority?: string }) {
  return useQuery({
    queryKey: ['comments', filters],
    queryFn: async () => {
      let query = supabase.from('comment_inbox').select('*').order('comment_date', { ascending: false });
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.channel && filters.channel !== 'all') query = query.eq('channel', filters.channel);
      if (filters?.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCommentCounts() {
  return useQuery({
    queryKey: ['comment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('comment_inbox').select('status, channel, comment_type, priority');
      if (error) throw error;
      const items = data ?? [];
      const byStatus: Record<string, number> = {};
      const byChannel: Record<string, number> = {};
      const byType: Record<string, number> = {};
      for (const i of items) {
        byStatus[i.status] = (byStatus[i.status] || 0) + 1;
        byChannel[i.channel] = (byChannel[i.channel] || 0) + 1;
        byType[i.comment_type] = (byType[i.comment_type] || 0) + 1;
      }
      return { total: items.length, byStatus, byChannel, byType };
    },
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (comment: Record<string, unknown>) => {
      const { data, error } = await supabase.from('comment_inbox').insert(comment as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['comment-counts'] });
    },
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from('comment_inbox').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['comment-counts'] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comment_inbox').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['comment-counts'] });
    },
  });
}

// ─── Replies ───
export function useReplies(commentId: string | null) {
  return useQuery({
    queryKey: ['comment-replies', commentId],
    enabled: !!commentId,
    queryFn: async () => {
      const { data, error } = await supabase.from('comment_replies').select('*').eq('comment_id', commentId!).order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reply: Record<string, unknown>) => {
      const { data, error } = await supabase.from('comment_replies').insert(reply as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars: any) => {
      qc.invalidateQueries({ queryKey: ['comment-replies', vars.comment_id] });
    },
  });
}

export function useUpdateReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment_id, ...updates }: { id: string; comment_id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from('comment_replies').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
      return comment_id;
    },
    onSuccess: (commentId) => {
      qc.invalidateQueries({ queryKey: ['comment-replies', commentId] });
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// ─── AI Actions ───
export function useAnalyzeComment() {
  return useMutation({
    mutationFn: async (comment: any) => {
      const { data, error } = await supabase.functions.invoke('comment-response', {
        body: { action: 'analyze_comment', comment },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.analysis;
    },
  });
}

export function useGenerateReplies() {
  return useMutation({
    mutationFn: async (comment: any) => {
      const { data, error } = await supabase.functions.invoke('comment-response', {
        body: { action: 'generate_replies', comment },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.replies;
    },
  });
}

// ─── Feedback ───
export function useRecordReplyFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feedback: Record<string, unknown>) => {
      const { error } = await supabase.from('comment_reply_feedback').insert(feedback as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
