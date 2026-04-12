import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { stripMarkdownEdgeArtifacts } from '@/lib/utils';

const BLOG_TEXT_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'meta_description',
  'author',
  'content_pillar',
  'linkedin_version',
  'newsletter_version',
  'visual_concept',
  'visual_rationale',
  'visual_type',
] as const;

function sanitizeBlogPayload(payload: Record<string, unknown>) {
  const sanitizedPayload = { ...payload };

  for (const field of BLOG_TEXT_FIELDS) {
    const value = sanitizedPayload[field];
    if (typeof value === 'string') {
      sanitizedPayload[field] = stripMarkdownEdgeArtifacts(value);
    }
  }

  return sanitizedPayload;
}

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useBlogPost(id: string | null) {
  return useQuery({
    queryKey: ['blog-post', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Record<string, unknown>) => {
      const sanitizedPost = sanitizeBlogPayload(post);
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(sanitizedPost as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const sanitizedUpdates = sanitizeBlogPayload(updates);
      const { error } = await supabase
        .from('blog_posts')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      qc.invalidateQueries({ queryKey: ['blog-post'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
  });
}

export function usePublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blogPostId: string) => {
      const { data, error } = await supabase.functions.invoke('publish-blog', {
        body: { blogPostId, action: 'publish' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      qc.invalidateQueries({ queryKey: ['blog-post'] });
      toast.success(`Published! ${data.url}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUnpublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blogPostId: string) => {
      const { data, error } = await supabase.functions.invoke('publish-blog', {
        body: { blogPostId, action: 'unpublish' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      qc.invalidateQueries({ queryKey: ['blog-post'] });
      toast.success('Unpublished from website');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Utility: generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
