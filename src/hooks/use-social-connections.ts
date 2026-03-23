import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SocialConn = {
  id: string;
  channel: string;
  account_name: string;
  connected: boolean;
  last_sync: string | null;
  followers: number | null;
  profile_url: string | null;
  webhook_url: string | null;
};

export function useSocialConnections() {
  return useQuery({
    queryKey: ['social-connections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('social_connections').select('*').order('created_at');
      if (error) throw error;
      return (data ?? []) as SocialConn[];
    },
  });
}
