import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CHANNEL_CONFIG, ChannelType } from '@/data/types';
import { ExternalLink, RefreshCw, CheckCircle2, XCircle, Users, Loader2, Plus, Save, Trash2, Edit2, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlanningConfig, useUpdatePlanningConfig } from '@/hooks/use-editorial';

type SocialConn = {
  id: string;
  channel: string;
  account_name: string;
  connected: boolean;
  last_sync: string | null;
  followers: number | null;
  profile_url: string | null;
  webhook_url: string | null;
};

function useSocialConnections() {
  return useQuery({
    queryKey: ['social-connections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('social_connections').select('*').order('created_at');
      if (error) throw error;
      return (data ?? []) as SocialConn[];
    },
  });
}

const INTELLIGENCE_MODES = [
  { value: 'assist', label: '💡 Assist', description: 'Suggestions only — based on brand knowledge and pillars. No learning from behavior.' },
  { value: 'learning', label: '🧠 Learning', description: 'Suggestions improve from your approvals, edits, rejections, and performance data.' },
  { value: 'strategic', label: '🎯 Strategic', description: 'Prioritizes brand strategy and long-term positioning over short-term engagement.' },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: connections, isLoading } = useSocialConnections();
  const { data: config, isLoading: configLoading } = usePlanningConfig();
  const updateConfig = useUpdatePlanningConfig();
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ account_name: '', profile_url: '', followers: '', webhook_url: '' });
  const [adding, setAdding] = useState(false);
  const [newConn, setNewConn] = useState({ channel: 'linkedin', account_name: '', profile_url: '' });

  const currentMode = (config as any)?.intelligence_mode || 'learning';
  const topicCooldown = (config as any)?.topic_cooldown_cycles || 3;

  const toggleMut = useMutation({
    mutationFn: async ({ id, connected }: { id: string; connected: boolean }) => {
      const { error } = await supabase.from('social_connections').update({
        connected,
        last_sync: connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-connections'] }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...updates }: Record<string, any>) => {
      const { error } = await supabase.from('social_connections').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-connections'] }); setEditing(null); },
  });

  const addMut = useMutation({
    mutationFn: async (conn: Record<string, any>) => {
      const { error } = await supabase.from('social_connections').insert(conn as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-connections'] }); setAdding(false); setNewConn({ channel: 'linkedin', account_name: '', profile_url: '' }); toast.success('Account added'); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_connections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['social-connections'] }); toast.success('Account removed'); },
  });

  const toggleConnection = (conn: SocialConn) => {
    const newConnected = !conn.connected;
    const cfg = CHANNEL_CONFIG[conn.channel as ChannelType];
    toast.success(newConnected ? `Connected to ${cfg?.label || conn.channel}` : `Disconnected from ${cfg?.label || conn.channel}`);
    toggleMut.mutate({ id: conn.id, connected: newConnected });
  };

  const startEdit = (conn: SocialConn) => {
    setEditing(conn.id);
    setEditForm({ account_name: conn.account_name, profile_url: conn.profile_url || '', followers: conn.followers?.toString() || '', webhook_url: conn.webhook_url || '' });
  };

  const saveEdit = (id: string) => {
    updateMut.mutate({ id, account_name: editForm.account_name, profile_url: editForm.profile_url || null, followers: editForm.followers ? parseInt(editForm.followers) : null, webhook_url: editForm.webhook_url || null });
    toast.success('Account updated');
  };

  const handleModeChange = (mode: string) => {
    updateConfig.mutate({ intelligence_mode: mode } as any, {
      onSuccess: () => toast.success(`Intelligence mode set to ${mode}`),
    });
  };

  const handleCooldownChange = (value: number) => {
    updateConfig.mutate({ topic_cooldown_cycles: value } as any, {
      onSuccess: () => toast.success(`Topic cooldown set to ${value} cycles`),
    });
  };

  const availableChannels = Object.keys(CHANNEL_CONFIG) as ChannelType[];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage intelligence mode, social accounts, and preferences.</p>
      </div>

      {/* Editorial Intelligence Mode */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Brain className="w-5 h-5" /> Editorial Intelligence Mode
          </CardTitle>
          <CardDescription>Control how the AI learns and generates content suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {INTELLIGENCE_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => handleModeChange(mode.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      currentMode === mode.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="font-display font-semibold text-sm">{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Label className="text-sm font-medium whitespace-nowrap">Topic Cooldown</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={topicCooldown}
                  onChange={e => handleCooldownChange(parseInt(e.target.value) || 3)}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">cycles before a topic can repeat</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Social Connections */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">Social Account Connections</CardTitle>
              <CardDescription>Connect your social media accounts to publish content directly from Spiral Up.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Account</Button>
          </div>
        </CardHeader>
        <CardContent>
          {adding && (
            <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-muted/30 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Channel</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newConn.channel} onChange={e => setNewConn(f => ({ ...f, channel: e.target.value }))}>
                    {availableChannels.map(ch => <option key={ch} value={ch}>{CHANNEL_CONFIG[ch].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Name</label>
                  <Input value={newConn.account_name} onChange={e => setNewConn(f => ({ ...f, account_name: e.target.value }))} placeholder="@spiralup" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Profile URL</label>
                  <Input value={newConn.profile_url} onChange={e => setNewConn(f => ({ ...f, profile_url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button size="sm" onClick={() => addMut.mutate(newConn)} disabled={!newConn.account_name.trim()}>Add</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="divide-y divide-border">
              {(connections || []).map(conn => {
                const cfg = CHANNEL_CONFIG[conn.channel as ChannelType] || { label: conn.channel, color: 'hsl(0 0% 50%)', icon: '🔗' };
                const isEditing = editing === conn.id;

                return (
                  <div key={conn.id} className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${cfg.color}15` }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">{conn.account_name}</p>
                        {conn.connected && conn.followers && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{conn.followers.toLocaleString()} followers</span>
                          </div>
                        )}
                        {conn.webhook_url && (
                          <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">⚡ Webhook connected</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {conn.connected ? (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                          </span>
                        ) : (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="w-3.5 h-3.5" /> Disconnected
                          </span>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(conn)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMut.mutate(conn.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        <Switch checked={conn.connected} onCheckedChange={() => toggleConnection(conn)} />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-3 ml-14 p-3 rounded-lg bg-muted/30 border space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Name</label>
                            <Input value={editForm.account_name} onChange={e => setEditForm(f => ({ ...f, account_name: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Profile URL</label>
                            <Input value={editForm.profile_url} onChange={e => setEditForm(f => ({ ...f, profile_url: e.target.value }))} placeholder="https://..." />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Followers</label>
                            <Input type="number" value={editForm.followers} onChange={e => setEditForm(f => ({ ...f, followers: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook URL (Make.com / Zapier)</label>
                            <Input value={editForm.webhook_url} onChange={e => setEditForm(f => ({ ...f, webhook_url: e.target.value }))} placeholder="https://hook.eu2.make.com/..." />
                            <p className="text-[10px] text-muted-foreground mt-1">Paste your Make.com (or other automation) webhook URL to auto-publish content to this channel.</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => saveEdit(conn.id)} className="gap-1.5"><Save className="w-3.5 h-3.5" /> Save</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
