import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useEditorialFeedback() {
  return useQuery({
    queryKey: ['editorial-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_feedback').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecordFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (feedback: Record<string, unknown>) => {
      const { error } = await supabase.from('editorial_feedback').insert(feedback as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editorial-feedback'] }),
  });
}

export function useFeedbackSummary() {
  return useQuery({
    queryKey: ['feedback-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('editorial_feedback').select('*');
      if (error) throw error;
      const items = data ?? [];
      if (items.length === 0) return null;

      const total = items.length;
      const approved = items.filter(i => i.action_type === 'approved_clean').length;
      const approvedEdited = items.filter(i => i.action_type === 'approved_edited').length;
      const rejected = items.filter(i => i.action_type === 'rejected').length;
      const regenerated = items.filter(i => i.action_type === 'regenerated').length;

      // Most approved topics/pillars
      const topicCounts: Record<string, { approved: number; rejected: number; edited: number }> = {};
      const pillarCounts: Record<string, { approved: number; rejected: number }> = {};
      const ctaChanges: string[] = [];
      const visualChanges: string[] = [];
      const titleEdits: number = items.filter(i => i.title_changed).length;
      const contentEdits: number = items.filter(i => i.content_changed).length;
      const ctaEdits: number = items.filter(i => i.cta_changed).length;
      const visualEdits: number = items.filter(i => i.visual_changed).length;

      for (const item of items) {
        const topic = item.original_topic || 'unknown';
        if (!topicCounts[topic]) topicCounts[topic] = { approved: 0, rejected: 0, edited: 0 };
        if (item.action_type === 'approved_clean') topicCounts[topic].approved++;
        if (item.action_type === 'approved_edited') topicCounts[topic].edited++;
        if (item.action_type === 'rejected') topicCounts[topic].rejected++;

        const pillar = item.original_content_pillar || 'none';
        if (!pillarCounts[pillar]) pillarCounts[pillar] = { approved: 0, rejected: 0 };
        if (item.action_type?.startsWith('approved')) pillarCounts[pillar].approved++;
        if (item.action_type === 'rejected') pillarCounts[pillar].rejected++;
      }

      // Sort topics by approval rate
      const topApproved = Object.entries(topicCounts)
        .map(([topic, c]) => ({ topic, total: c.approved + c.edited + c.rejected, approved: c.approved + c.edited, rejected: c.rejected, edited: c.edited }))
        .sort((a, b) => b.approved - a.approved);

      const topRejected = [...topApproved].sort((a, b) => b.rejected - a.rejected);

      const mostEdited = Object.entries(topicCounts)
        .map(([topic, c]) => ({ topic, edited: c.edited }))
        .filter(t => t.edited > 0)
        .sort((a, b) => b.edited - a.edited);

      return {
        total, approved, approvedEdited, rejected, regenerated,
        approvalRate: total > 0 ? Math.round(((approved + approvedEdited) / total) * 100) : 0,
        cleanApprovalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        editRate: total > 0 ? Math.round((approvedEdited / total) * 100) : 0,
        titleEdits, contentEdits, ctaEdits, visualEdits,
        topApproved: topApproved.slice(0, 5),
        topRejected: topRejected.filter(t => t.rejected > 0).slice(0, 5),
        mostEdited: mostEdited.slice(0, 5),
        pillarCounts,
      };
    },
  });
}
