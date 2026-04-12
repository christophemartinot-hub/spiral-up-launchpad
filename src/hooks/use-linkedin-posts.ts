import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sanitizePlainTextPayload } from '@/lib/utils';

export function useLinkedinPosts() {
  return useQuery({
    queryKey: ['linkedin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLinkedinPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const sanitizedPost = sanitizePlainTextPayload(post);
      const { data, error } = await supabase
        .from('linkedin_posts')
        .insert(sanitizedPost as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['linkedin-posts'] }),
  });
}

export function useUpdateLinkedinPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const sanitizedUpdates = sanitizePlainTextPayload(updates);
      const { error } = await supabase
        .from('linkedin_posts')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['linkedin-posts'] }),
  });
}

export function useDeleteLinkedinPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('linkedin_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['linkedin-posts'] }),
  });
}
