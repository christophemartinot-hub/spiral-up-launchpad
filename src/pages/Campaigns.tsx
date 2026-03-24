import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCampaigns, useCreateCampaign, useUpdateCampaignStatus, useDeleteCampaign, CampaignRow } from '@/hooks/use-campaigns';
import { useSocialConnections } from '@/hooks/use-social-connections';
import { CHANNEL_CONFIG, ChannelType } from '@/data/types';
import {
  Plus, Loader2, Play, Pause, Archive, Trash2, MoreHorizontal,
  Rocket, CheckCircle2, XCircle, ExternalLink, Settings, Wifi, WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  active: { label: 'Active', className: 'bg-success/15 text-success' },
  paused: { label: 'Paused', className: 'bg-warning/15 text-warning' },
  completed: { label: 'Completed', className: 'bg-primary/15 text-primary' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground/60' },
};

function PlatformStatusPanel() {
  const { data: connections, isLoading } = useSocialConnections();

  const platforms: ChannelType[] = ['linkedin', 'instagram', 'facebook', 'tiktok', 'email'];

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-base">Platform Status</CardTitle>
            <CardDescription>Connection status for your publishing channels.</CardDescription>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {platforms.map(ch => {
            const cfg = CHANNEL_CONFIG[ch];
            const conn = (connections || []).find(c => c.channel === ch);
            const isConnected = conn?.connected === true;
            const hasWebhook = !!conn?.webhook_url;

            return (
              <div
                key={ch}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  isConnected ? 'border-success/30 bg-success/5' : 'border-border bg-muted/30'
                }`}
              >
                <span className="text-2xl block mb-1">{cfg.icon}</span>
                <p className="text-xs font-semibold">{cfg.label}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {isConnected ? (
                    <Wifi className="w-3 h-3 text-success" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={`text-[10px] font-medium ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {isConnected && !hasWebhook && ch !== 'email' && (
                  <p className="text-[9px] text-warning mt-1">⚠ No webhook</p>
                )}
                {isConnected && hasWebhook && (
                  <p className="text-[9px] text-success mt-1">⚡ Webhook ready</p>
                )}
                {!isConnected && (
                  <Link to="/settings" className="text-[9px] text-primary hover:underline mt-1 block">
                    Set up →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCampaignDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const createMut = useCreateCampaign();

  const handleCreate = () => {
    if (!name.trim()) return;
    createMut.mutate(
      {
        name: name.trim(),
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'draft',
      } as any,
      {
        onSuccess: () => {
          toast.success(`Campaign "${name}" created`);
          setOpen(false);
          setName('');
          setDescription('');
          setStartDate('');
          setEndDate('');
          onCreated?.();
        },
        onError: (e) => toast.error('Failed to create campaign', { description: e.message }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Plus className="w-4 h-4" /> New Campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Create Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Campaign Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Growth Sprint" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Create Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CampaignActions({ campaign }: { campaign: CampaignRow }) {
  const updateStatus = useUpdateCampaignStatus();
  const deleteMut = useDeleteCampaign();

  const actions = [];
  if (campaign.status === 'draft' || campaign.status === 'paused') {
    actions.push({ label: 'Activate', icon: Play, status: 'active', color: 'text-success' });
  }
  if (campaign.status === 'active') {
    actions.push({ label: 'Pause', icon: Pause, status: 'paused', color: 'text-warning' });
    actions.push({ label: 'Complete', icon: CheckCircle2, status: 'completed', color: 'text-primary' });
  }
  if (campaign.status !== 'archived') {
    actions.push({ label: 'Archive', icon: Archive, status: 'archived', color: 'text-muted-foreground' });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map(a => (
          <DropdownMenuItem
            key={a.status}
            onClick={() => {
              updateStatus.mutate({ id: campaign.id, status: a.status }, {
                onSuccess: () => toast.success(`Campaign ${a.label.toLowerCase()}d`),
              });
            }}
            className={a.color}
          >
            <a.icon className="w-4 h-4 mr-2" />
            {a.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => {
            if (confirm('Delete this campaign? This cannot be undone.')) {
              deleteMut.mutate(campaign.id, {
                onSuccess: () => toast.success('Campaign deleted'),
              });
            }
          }}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Campaigns() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [filter, setFilter] = useState('all');

  const filtered = (campaigns || []).filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold">Campaigns & Platforms</h1>
          <p className="text-muted-foreground mt-1">Manage your campaigns and platform connections.</p>
        </div>
        <CreateCampaignDialog />
      </div>

      {/* Platform Status */}
      <PlatformStatusPanel />

      {/* Campaigns List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold">Campaigns</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Rocket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display font-semibold mb-1">
                {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first campaign to start organizing content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(campaign => {
              const style = STATUS_STYLES[campaign.status] || STATUS_STYLES.draft;
              return (
                <Card key={campaign.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{campaign.name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.className}`}>
                            {style.label}
                          </span>
                        </div>
                        {campaign.description && (
                          <p className="text-xs text-muted-foreground truncate">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          {campaign.start_date && (
                            <span>{campaign.start_date} → {campaign.end_date || '...'}</span>
                          )}
                          {((campaign.channels as string[]) || []).length > 0 && (
                            <span>
                              {(campaign.channels as string[]).map(ch => CHANNEL_CONFIG[ch as ChannelType]?.icon || '').join(' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <CampaignActions campaign={campaign} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
