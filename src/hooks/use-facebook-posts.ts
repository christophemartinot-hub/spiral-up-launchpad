import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useFacebookPosts() {
  return useQuery({
    queryKey: ['facebook-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateFacebookPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('facebook_posts')
        .insert(post as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facebook-posts'] }),
  });
}

export function useUpdateFacebookPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from('facebook_posts')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facebook-posts'] }),
  });
}

export function useDeleteFacebookPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('facebook_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facebook-posts'] }),
  });
}
