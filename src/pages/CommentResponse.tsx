import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare, Inbox, CheckCircle2, AlertTriangle, Send, RefreshCw,
  Edit3, X, Clock, Eye, Loader2, Sparkles, Filter, Plus, TrendingUp,
  ThumbsUp, ThumbsDown, BarChart3, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useComments, useCommentCounts, useCreateComment, useUpdateComment,
  useReplies, useCreateReply, useUpdateReply,
  useAnalyzeComment, useGenerateReplies, useRecordReplyFeedback,
} from '@/hooks/use-comments';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: '💼', instagram: '📸', facebook: '👤', twitter: '𝕏', youtube: '▶️', blog: '📝',
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  new: { label: 'New', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  reviewed: { label: 'Reviewed', class: 'bg-muted text-muted-foreground' },
  reply_suggested: { label: 'Reply Suggested', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  awaiting_approval: { label: 'Awaiting Approval', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  approved: { label: 'Approved', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  sent: { label: 'Sent', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  ignored: { label: 'Ignored', class: 'bg-muted text-muted-foreground' },
  escalated: { label: 'Escalated', class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const SENTIMENT_CONFIG: Record<string, { icon: string; class: string }> = {
  positive: { icon: '😊', class: 'text-green-600' },
  neutral: { icon: '😐', class: 'text-muted-foreground' },
  negative: { icon: '😟', class: 'text-red-500' },
  mixed: { icon: '🤔', class: 'text-amber-500' },
};

const COMMENT_TYPE_LABELS: Record<string, string> = {
  appreciation: '🙏 Appreciation', question: '❓ Question', objection: '⚠️ Objection',
  disagreement: '💬 Disagreement', criticism: '🔴 Criticism', request_detail: '📋 Detail Request',
  spam: '🚫 Spam', irrelevant: '🔇 Irrelevant', lead_signal: '🎯 Lead Signal',
  collaboration_opportunity: '🤝 Collaboration', unknown: '❔ Unknown',
};

// ─── Comment Detail Panel ───
function CommentDetailPanel({ comment, onClose }: { comment: any; onClose: () => void }) {
  const { data: replies, isLoading: loadingReplies } = useReplies(comment.id);
  const createReply = useCreateReply();
  const updateReply = useUpdateReply();
  const updateComment = useUpdateComment();
  const analyzeComment = useAnalyzeComment();
  const generateReplies = useGenerateReplies();
  const recordFeedback = useRecordReplyFeedback();
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const statusConf = STATUS_CONFIG[comment.status] || STATUS_CONFIG.new;
  const sentimentConf = SENTIMENT_CONFIG[comment.sentiment] || SENTIMENT_CONFIG.neutral;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeComment.mutateAsync(comment);
      await updateComment.mutateAsync({
        id: comment.id,
        comment_type: analysis.comment_type,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        requires_reply: analysis.requires_reply,
        requires_human_review: analysis.requires_human_review,
        is_sensitive: analysis.is_sensitive,
        risk_flags: analysis.risk_flags,
        priority: analysis.priority,
        status: 'reviewed',
      });
      toast.success('Comment analyzed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReplies = async () => {
    setIsGenerating(true);
    try {
      const suggestions = await generateReplies.mutateAsync(comment);
      for (const s of suggestions) {
        await createReply.mutateAsync({
          comment_id: comment.id,
          reply_type: s.reply_type,
          reply_text: s.reply_text,
          tone: s.tone,
          status: 'suggested',
        });
      }
      await updateComment.mutateAsync({ id: comment.id, status: 'reply_suggested' });
      toast.success('Reply suggestions generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveReply = async (reply: any) => {
    const finalText = editingReplyId === reply.id ? editText : reply.reply_text;
    const wasEdited = finalText !== reply.reply_text;
    
    await updateReply.mutateAsync({
      id: reply.id,
      comment_id: comment.id,
      status: 'approved',
      approved_text: finalText,
    });
    await updateComment.mutateAsync({ id: comment.id, status: 'approved' });
    recordFeedback.mutate({
      comment_id: comment.id,
      reply_id: reply.id,
      action_type: wasEdited ? 'approved_edited' : 'approved',
      original_text: reply.reply_text,
      final_text: finalText,
      text_was_edited: wasEdited,
      tone_preference: reply.tone,
      length_preference: finalText.length < 100 ? 'short' : finalText.length < 300 ? 'medium' : 'long',
    });
    setEditingReplyId(null);
    toast.success('Reply approved');
  };

  const handleRejectReply = async (reply: any) => {
    await updateReply.mutateAsync({ id: reply.id, comment_id: comment.id, status: 'rejected' });
    recordFeedback.mutate({
      comment_id: comment.id,
      reply_id: reply.id,
      action_type: 'rejected',
      original_text: reply.reply_text,
    });
    toast.success('Reply rejected');
  };

  const handleIgnore = async () => {
    await updateComment.mutateAsync({ id: comment.id, status: 'ignored' });
    recordFeedback.mutate({ comment_id: comment.id, action_type: 'ignored' });
    toast.success('Comment ignored');
    onClose();
  };

  const handleEscalate = async () => {
    await updateComment.mutateAsync({ id: comment.id, status: 'escalated' });
    toast.success('Comment escalated for manual review');
  };

  const handleMarkSent = async (reply: any) => {
    await updateReply.mutateAsync({ id: reply.id, comment_id: comment.id, status: 'sent', sent_at: new Date().toISOString() });
    await updateComment.mutateAsync({ id: comment.id, status: 'sent' });
    toast.success('Reply marked as sent');
  };

  const REPLY_TYPE_LABELS: Record<string, string> = {
    short: '⚡ Short', thoughtful: '💭 Thoughtful', engagement_building: '🔗 Engagement',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-base">Comment Detail</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      {/* Comment card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{CHANNEL_ICONS[comment.channel] || '💬'}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConf.class}`}>{statusConf.label}</span>
            <span className={`text-sm ${sentimentConf.class}`}>{sentimentConf.icon}</span>
            {comment.comment_type !== 'unknown' && (
              <Badge variant="outline" className="text-[10px]">{COMMENT_TYPE_LABELS[comment.comment_type] || comment.comment_type}</Badge>
            )}
            {comment.is_sensitive && <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"><Shield className="w-2.5 h-2.5 mr-1" /> Sensitive</Badge>}
            {comment.priority === 'high' || comment.priority === 'urgent' ? (
              <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"><AlertTriangle className="w-2.5 h-2.5 mr-1" /> {comment.priority}</Badge>
            ) : null}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{comment.author_name} on {comment.post_title || 'a post'}</p>
            <p className="text-xs text-muted-foreground">{new Date(comment.comment_date).toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm">{comment.comment_text}</p>
          </div>
          {comment.risk_flags && comment.risk_flags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {comment.risk_flags.map((flag: string, i: number) => (
                <Badge key={i} variant="outline" className="text-[10px] text-red-500 border-red-300">{flag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {comment.status === 'new' && (
          <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={isAnalyzing} className="gap-1.5">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Analyze
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleGenerateReplies} disabled={isGenerating} className="gap-1.5">
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Replies
        </Button>
        <Button size="sm" variant="ghost" onClick={handleIgnore} className="gap-1.5 text-muted-foreground">
          <X className="w-3.5 h-3.5" /> Ignore
        </Button>
        <Button size="sm" variant="ghost" onClick={handleEscalate} className="gap-1.5 text-red-500">
          <AlertTriangle className="w-3.5 h-3.5" /> Escalate
        </Button>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reply Suggestions</p>
        {loadingReplies ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
        ) : (replies || []).length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No replies yet. Click "Generate Replies" to get AI suggestions.</p>
        ) : (
          (replies || []).map((reply: any) => (
            <Card key={reply.id} className={`shadow-sm ${reply.status === 'approved' ? 'border-green-300 dark:border-green-700' : reply.status === 'sent' ? 'border-emerald-300 dark:border-emerald-700' : ''}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{REPLY_TYPE_LABELS[reply.reply_type] || reply.reply_type}</Badge>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${(STATUS_CONFIG[reply.status] || STATUS_CONFIG.new).class}`}>
                      {(STATUS_CONFIG[reply.status] || STATUS_CONFIG.new).label}
                    </span>
                  </div>
                </div>
                {editingReplyId === reply.id ? (
                  <Textarea rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} className="text-sm" />
                ) : (
                  <p className="text-sm bg-muted/30 rounded p-2">{reply.approved_text || reply.reply_text}</p>
                )}
                {reply.status === 'suggested' && (
                  <div className="flex gap-2">
                    {editingReplyId === reply.id ? (
                      <>
                        <Button size="sm" onClick={() => handleApproveReply(reply)} className="gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Save & Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingReplyId(null)} className="text-xs">Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApproveReply(reply)} className="gap-1 text-xs text-green-600"><ThumbsUp className="w-3 h-3" /> Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingReplyId(reply.id); setEditText(reply.reply_text); }} className="gap-1 text-xs"><Edit3 className="w-3 h-3" /> Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRejectReply(reply)} className="gap-1 text-xs text-red-500"><ThumbsDown className="w-3 h-3" /> Reject</Button>
                      </>
                    )}
                  </div>
                )}
                {reply.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={() => handleMarkSent(reply)} className="gap-1 text-xs text-emerald-600"><Send className="w-3 h-3" /> Mark as Sent</Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Add Comment Dialog (for manual entry) ───
function AddCommentForm({ onDone }: { onDone: () => void }) {
  const createComment = useCreateComment();
  const [form, setForm] = useState({
    channel: 'linkedin', author_name: '', comment_text: '', post_title: '',
  });

  const handleSubmit = async () => {
    if (!form.comment_text.trim()) { toast.error('Comment text is required'); return; }
    await createComment.mutateAsync({
      ...form,
      status: 'new',
      comment_type: 'unknown',
      sentiment: 'neutral',
      urgency: 'normal',
      priority: 'normal',
    });
    toast.success('Comment added to inbox');
    onDone();
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-semibold">Add Comment Manually</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_ICONS).map(([k, icon]) => (
                <SelectItem key={k} value={k}>{icon} {k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Author name" value={form.author_name} onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))} />
        </div>
        <Input placeholder="Post title / reference" value={form.post_title} onChange={(e) => setForm((f) => ({ ...f, post_title: e.target.value }))} />
        <Textarea placeholder="Comment text..." rows={3} value={form.comment_text} onChange={(e) => setForm((f) => ({ ...f, comment_text: e.target.value }))} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={createComment.isPending} className="gap-1.5">
            {createComment.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add to Inbox
          </Button>
          <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function CommentResponse() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedComment, setSelectedComment] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: comments, isLoading } = useComments({
    status: statusFilter, channel: channelFilter,
  });
  const { data: counts } = useCommentCounts();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Comment Response</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered community management — analyze, respond, and learn from audience interactions.
        </p>
      </motion.div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="inbox" className="gap-1.5"><Inbox className="w-3.5 h-3.5" /> Inbox {counts?.byStatus?.new ? <Badge variant="secondary" className="text-[10px] ml-1">{counts.byStatus.new}</Badge> : null}</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
        </TabsList>

        {/* ─── INBOX TAB ─── */}
        <TabsContent value="inbox">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Comment list */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {Object.entries(CHANNEL_ICONS).map(([k, icon]) => (
                      <SelectItem key={k} value={k}>{icon} {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>

              {showAddForm && <AddCommentForm onDone={() => setShowAddForm(false)} />}

              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground p-8 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading comments...</div>
              ) : (comments || []).length === 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No comments yet. Add one manually or connect your social channels.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(comments || []).map((c: any) => {
                    const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.new;
                    const sn = SENTIMENT_CONFIG[c.sentiment] || SENTIMENT_CONFIG.neutral;
                    const isSelected = selectedComment?.id === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedComment(c)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{CHANNEL_ICONS[c.channel] || '💬'}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.class}`}>{st.label}</span>
                          <span className={`text-xs ${sn.class}`}>{sn.icon}</span>
                          {c.is_sensitive && <Shield className="w-3 h-3 text-red-500" />}
                          {(c.priority === 'high' || c.priority === 'urgent') && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{c.author_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.comment_text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{c.post_title ? `on "${c.post_title}"` : ''} • {new Date(c.comment_date).toLocaleDateString()}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Detail panel */}
            <div className="lg:col-span-3">
              {selectedComment ? (
                <CommentDetailPanel comment={selectedComment} onClose={() => setSelectedComment(null)} />
              ) : (
                <Card className="shadow-sm h-full min-h-[400px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select a comment to view details and manage replies</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── DASHBOARD TAB ─── */}
        <TabsContent value="dashboard">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total Comments</p>
                <p className="text-2xl font-display font-bold mt-1">{counts?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">New / Unreviewed</p>
                <p className="text-2xl font-display font-bold mt-1 text-blue-600">{counts?.byStatus?.new || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Awaiting Approval</p>
                <p className="text-2xl font-display font-bold mt-1 text-amber-600">
                  {(counts?.byStatus?.reply_suggested || 0) + (counts?.byStatus?.awaiting_approval || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Sent Replies</p>
                <p className="text-2xl font-display font-bold mt-1 text-emerald-600">{counts?.byStatus?.sent || 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-display">By Channel</CardTitle></CardHeader>
              <CardContent>
                {counts?.byChannel && Object.keys(counts.byChannel).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(counts.byChannel).sort((a, b) => b[1] - a[1]).map(([ch, count]) => (
                      <div key={ch} className="flex items-center justify-between">
                        <span className="text-sm">{CHANNEL_ICONS[ch] || '💬'} {ch}</span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No data yet</p>}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-display">By Type</CardTitle></CardHeader>
              <CardContent>
                {counts?.byType && Object.keys(counts.byType).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(counts.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{COMMENT_TYPE_LABELS[type] || type}</span>
                        <Badge variant="secondary">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No data yet</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
