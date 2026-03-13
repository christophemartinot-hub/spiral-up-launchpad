import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail, Loader2, Sparkles, Check, Edit3, Send, Calendar, Eye,
  Users, Clock, AlertCircle, X, Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useEmailCampaigns, useCreateEmailCampaign, useUpdateEmailCampaign,
  useDeleteEmailCampaign, useGenerateBlogEmail, useSubscriberCount, useSendCampaign,
} from '@/hooks/use-performance';
import { useEditorialItems, useEditorialPlans } from '@/hooks/use-editorial';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  ready: { label: 'Ready', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  sent: { label: 'Sent', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export default function EmailDistribution() {
  const { data: campaigns, isLoading: campaignsLoading } = useEmailCampaigns();
  const { data: subscriberCount } = useSubscriberCount();
  const { data: plans } = useEditorialPlans();
  const latestPlanId = plans?.[0]?.id || null;
  const { data: editorialItems } = useEditorialItems(latestPlanId);
  const createCampaign = useCreateEmailCampaign();
  const updateCampaign = useUpdateEmailCampaign();
  const deleteCampaign = useDeleteEmailCampaign();
  const generateEmail = useGenerateBlogEmail();
  const sendCampaign = useSendCampaign();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  // Blog items that are approved
  const approvedBlogs = (editorialItems || []).filter(
    (item: any) => item.status === 'approved' && (item.content_format === 'blog_post' || item.channel === 'blog')
  );

  const handleGenerateFromBlog = (item: any) => {
    generateEmail.mutate(item, {
      onSuccess: (data) => {
        createCampaign.mutate({
          editorial_item_id: item.id,
          subject_line: data.email.subject_line || '',
          preview_text: data.email.preview_text || '',
          intro_text: data.email.intro_text || '',
          blog_summary: data.email.blog_summary || '',
          cta_text: data.email.cta_text || 'Read the full article',
          cta_url: data.email.cta_url || '',
          visual_recommendation: data.email.visual_recommendation || '',
          plain_text_fallback: data.email.plain_text_fallback || '',
          recipient_segment: 'all',
          recipient_count: subscriberCount || 0,
          status: 'draft',
        }, {
          onSuccess: () => toast.success('Email campaign created from blog post'),
        });
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to generate email'),
    });
  };

  const handleSave = () => {
    if (!selectedCampaign) return;
    const { id, created_at, updated_at, editorial_items, ...updates } = form;
    updateCampaign.mutate({ id: selectedCampaign.id, ...updates }, {
      onSuccess: () => { toast.success('Campaign saved'); setEditing(false); },
    });
  };

  const handleApprove = (campaign: any) => {
    updateCampaign.mutate({ id: campaign.id, status: 'approved' }, {
      onSuccess: () => toast.success('Email approved ✓'),
    });
  };

  const handleSchedule = (campaign: any) => {
    updateCampaign.mutate({ id: campaign.id, status: 'scheduled' }, {
      onSuccess: () => toast.success('Email scheduled'),
    });
  };

  const handleSend = (campaign: any) => {
    sendCampaign.mutate(campaign.id, {
      onSuccess: (data) => {
        toast.success(`Email sent to ${data.totalSent} subscribers`);
        setSelectedCampaign(null);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to send email'),
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Email Distribution</h1>
        <p className="text-muted-foreground mt-1">
          Convert approved blog posts into email campaigns and send to your subscriber base.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-2xl font-bold mt-1">{subscriberCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Active Subscribers</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Mail className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-2xl font-bold mt-1">{campaigns?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-2xl font-bold mt-1">{campaigns?.filter((c: any) => c.status === 'draft').length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Send className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-2xl font-bold mt-1">{campaigns?.filter((c: any) => c.status === 'sent').length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Approved blogs to convert */}
        <Card className="shadow-card lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Approved Blogs → Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedBlogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No approved blog posts ready for email conversion.</p>
            ) : (
              approvedBlogs.map((item: any) => (
                <div key={item.id} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
                  <p className="text-sm font-medium truncate">{item.working_title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.content_pillar}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full gap-1.5 text-xs"
                    onClick={() => handleGenerateFromBlog(item)}
                    disabled={generateEmail.isPending}
                  >
                    {generateEmail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Generate Email Version
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Campaign list */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (campaigns || []).length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No email campaigns yet. Convert an approved blog post to create one.</p>
              </div>
            ) : (
              (campaigns || []).map((campaign: any) => {
                const statusConf = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                return (
                  <div
                    key={campaign.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:border-primary/30 ${selectedCampaign?.id === campaign.id ? 'border-primary/50 bg-primary/5' : ''}`}
                    onClick={() => { setSelectedCampaign(campaign); setForm(campaign); setEditing(false); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConf.color}`}>{statusConf.label}</span>
                          <Badge variant="outline" className="text-[10px]">{campaign.recipient_segment}</Badge>
                        </div>
                        <p className="text-sm font-semibold truncate">{campaign.subject_line || 'No subject'}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{campaign.preview_text || 'No preview text'}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        {campaign.sent_at ? (
                          <span>Sent {format(new Date(campaign.sent_at), 'MMM d')}</span>
                        ) : campaign.scheduled_send_date ? (
                          <span>Scheduled {format(new Date(campaign.scheduled_send_date), 'MMM d')}</span>
                        ) : (
                          <span>{format(new Date(campaign.created_at), 'MMM d')}</span>
                        )}
                      </div>
                    </div>

                    {/* Performance metrics for sent campaigns */}
                    {campaign.status === 'sent' && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>📤 {campaign.total_sent} sent</span>
                        <span>👁 {campaign.total_opened} opened ({campaign.open_rate}%)</span>
                        <span>🔗 {campaign.total_clicked} clicked ({campaign.click_rate}%)</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign detail / editor */}
      {selectedCampaign && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Campaign Detail</CardTitle>
              <div className="flex gap-2">
                {!editing && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                )}
                {(selectedCampaign.status === 'draft' || selectedCampaign.status === 'ready') && (
                  <Button size="sm" variant="outline" onClick={() => handleApprove(selectedCampaign)} className="gap-1.5 text-green-600">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                {selectedCampaign.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => handleSchedule(selectedCampaign)} className="gap-1.5 text-purple-600">
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </Button>
                )}
                {(selectedCampaign.status === 'approved' || selectedCampaign.status === 'scheduled') && (
                  <Button size="sm" onClick={() => handleSend(selectedCampaign)} disabled={sendCampaign.isPending} className="gap-1.5">
                    {sendCampaign.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Now
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setSelectedCampaign(null); setEditing(false); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject Line</p>
                {editing ? (
                  <Input value={form.subject_line || ''} onChange={e => setForm((f: any) => ({ ...f, subject_line: e.target.value }))} />
                ) : (
                  <p className="text-sm font-semibold">{selectedCampaign.subject_line}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Preview Text</p>
                {editing ? (
                  <Input value={form.preview_text || ''} onChange={e => setForm((f: any) => ({ ...f, preview_text: e.target.value }))} />
                ) : (
                  <p className="text-sm">{selectedCampaign.preview_text || '—'}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Intro Text</p>
              {editing ? (
                <Textarea rows={3} value={form.intro_text || ''} onChange={e => setForm((f: any) => ({ ...f, intro_text: e.target.value }))} />
              ) : (
                <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">{selectedCampaign.intro_text || '—'}</div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Blog Summary</p>
              {editing ? (
                <Textarea rows={4} value={form.blog_summary || ''} onChange={e => setForm((f: any) => ({ ...f, blog_summary: e.target.value }))} />
              ) : (
                <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">{selectedCampaign.blog_summary || '—'}</div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">CTA Text</p>
                {editing ? (
                  <Input value={form.cta_text || ''} onChange={e => setForm((f: any) => ({ ...f, cta_text: e.target.value }))} />
                ) : (
                  <Badge variant="secondary">{selectedCampaign.cta_text}</Badge>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">CTA URL</p>
                {editing ? (
                  <Input value={form.cta_url || ''} onChange={e => setForm((f: any) => ({ ...f, cta_url: e.target.value }))} />
                ) : (
                  <p className="text-sm text-primary truncate">{selectedCampaign.cta_url || '—'}</p>
                )}
              </div>
            </div>

            {selectedCampaign.visual_recommendation && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Visual Recommendation</p>
                {editing ? (
                  <Textarea rows={2} value={form.visual_recommendation || ''} onChange={e => setForm((f: any) => ({ ...f, visual_recommendation: e.target.value }))} />
                ) : (
                  <p className="text-sm">{selectedCampaign.visual_recommendation}</p>
                )}
              </div>
            )}

            {editing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recipient Segment</p>
                  <Select value={form.recipient_segment || 'all'} onValueChange={v => setForm((f: any) => ({ ...f, recipient_segment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subscribers</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Scheduled Send Date</p>
                  <Input type="datetime-local" value={form.scheduled_send_date ? format(new Date(form.scheduled_send_date), "yyyy-MM-dd'T'HH:mm") : ''} onChange={e => setForm((f: any) => ({ ...f, scheduled_send_date: e.target.value }))} />
                </div>
              </div>
            )}

            {editing && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleSave} disabled={updateCampaign.isPending} className="gap-1.5">
                  {updateCampaign.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(selectedCampaign); }}>Cancel</Button>
              </div>
            )}

            {/* Email provider notice */}
            <div className="bg-accent/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Emails are sent via Resend from <span className="font-medium text-foreground">connect@spiralingup.works</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
