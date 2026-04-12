import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sanitizePlainTextPayload } from '@/lib/utils';

export function useInstagramPosts() {
  return useQuery({
    queryKey: ['instagram-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateInstagramPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const sanitizedPost = sanitizePlainTextPayload(post);
      const { data, error } = await supabase
        .from('instagram_posts')
        .insert(sanitizedPost as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-posts'] }),
  });
}

export function useUpdateInstagramPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const sanitizedUpdates = sanitizePlainTextPayload(updates);
      const { error } = await supabase
        .from('instagram_posts')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-posts'] }),
  });
}

export function useDeleteInstagramPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('instagram_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-posts'] }),
  });
}
