import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useStrategicCycles, useStrategicIdeas, useGenerateStrategicIdeas,
  useUpdateStrategicIdea, useDeleteStrategicIdea, useDeleteStrategicCycle,
} from '@/hooks/use-strategic';
import {
  Sparkles, Loader2, CheckCircle, XCircle, Pin, PinOff,
  Zap, AlertTriangle, Lightbulb, BookOpen, Target, TrendingUp,
  ChevronDown, ChevronUp, Trash2, ArrowRight, Brain,
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const IDEA_TYPE_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string; emoji: string }> = {
  tension: { label: 'Audience Tension', icon: AlertTriangle, emoji: '⚡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  opportunity: { label: 'Strategic Opportunity', icon: Zap, emoji: '🎯', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  myth: { label: 'Myth to Challenge', icon: AlertTriangle, emoji: '💥', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  lesson: { label: 'Lesson to Teach', icon: BookOpen, emoji: '📖', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  conversion: { label: 'Conversion Opportunity', icon: Target, emoji: '💰', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

const STATUS_STYLES: Record<string, string> = {
  suggested: 'bg-muted text-muted-foreground',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  pinned: 'bg-primary/10 text-primary',
};

export default function StrategicIdeas() {
  const { data: cycles = [], isLoading: cyclesLoading } = useStrategicCycles();
  const generateIdeas = useGenerateStrategicIdeas();
  const deleteCycle = useDeleteStrategicCycle();

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [cycleStart, setCycleStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cycleEnd, setCycleEnd] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('all');

  // Auto-select latest cycle
  const activeCycleId = selectedCycleId || cycles[0]?.id || null;
  const activeCycle = cycles.find(c => c.id === activeCycleId);

  const { data: ideas = [], isLoading: ideasLoading } = useStrategicIdeas(activeCycleId);

  const handleGenerate = async () => {
    await generateIdeas.mutateAsync({ cycleStart, cycleEnd });
  };

  const handleDeleteCycle = async (id: string) => {
    if (!confirm('Delete this strategic cycle and all its ideas?')) return;
    deleteCycle.mutate(id);
    if (selectedCycleId === id) setSelectedCycleId(null);
  };

  // Group ideas by type
  const grouped = useMemo(() => {
    const groups: Record<string, typeof ideas> = {
      tension: [], opportunity: [], myth: [], lesson: [], conversion: [],
    };
    ideas.forEach(i => {
      const type = i.idea_type || 'opportunity';
      if (groups[type]) groups[type].push(i);
    });
    return groups;
  }, [ideas]);

  const filteredIdeas = activeTab === 'all' ? ideas :
    activeTab === 'pinned' ? ideas.filter(i => i.pinned) :
    grouped[activeTab] || [];

  // Stats
  const approvedCount = ideas.filter(i => i.status === 'approved').length;
  const pinnedCount = ideas.filter(i => i.pinned).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
              <Brain className="w-7 h-7 text-primary" /> Strategic Idea Engine
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Decide what conversations to lead before generating content.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Generate Section */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cycle Start</label>
                <Input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cycle End</label>
                <Input type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateIdeas.isPending}
              className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 shrink-0"
            >
              {generateIdeas.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing brand intelligence...</>
              ) : (
                <><Brain className="w-4 h-4 mr-2" /> Generate Strategic Ideas</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cycle Selector */}
      {cycles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cycles.slice(0, 6).map(cycle => (
            <button
              key={cycle.id}
              onClick={() => setSelectedCycleId(cycle.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                activeCycleId === cycle.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30 text-muted-foreground'
              }`}
            >
              {format(parseISO(cycle.cycle_start), 'MMM d')} — {format(parseISO(cycle.cycle_end), 'MMM d')}
            </button>
          ))}
        </div>
      )}

      {/* Recommended Focus */}
      {activeCycle?.recommended_focus && (
        <Card className="shadow-card border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Recommended Focus</p>
                <p className="text-sm leading-relaxed">{activeCycle.recommended_focus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {ideas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(IDEA_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="text-center p-3 rounded-lg bg-muted/40">
              <p className="text-lg font-bold">{grouped[type]?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">{config.emoji} {config.label}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Ideas */}
      {activeCycleId && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All ({ideas.length})</TabsTrigger>
            <TabsTrigger value="tension">⚡ Tensions ({grouped.tension?.length || 0})</TabsTrigger>
            <TabsTrigger value="opportunity">🎯 Opportunities ({grouped.opportunity?.length || 0})</TabsTrigger>
            <TabsTrigger value="myth">💥 Myths ({grouped.myth?.length || 0})</TabsTrigger>
            <TabsTrigger value="lesson">📖 Lessons ({grouped.lesson?.length || 0})</TabsTrigger>
            <TabsTrigger value="conversion">💰 Conversions ({grouped.conversion?.length || 0})</TabsTrigger>
            <TabsTrigger value="pinned">📌 Pinned ({pinnedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {ideasLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredIdeas.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-16 text-center">
                  <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium">No ideas yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate strategic ideas to populate this view.</p>
                </CardContent>
              </Card>
            ) : (
              filteredIdeas.map(idea => (
                <StrategicIdeaCard key={idea.id} idea={idea} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Cycle History */}
      {cycles.length > 1 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-sm">Cycle History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cycles.map(cycle => (
              <div key={cycle.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(cycle.cycle_start), 'MMM d')} — {format(new Date(cycle.cycle_end), 'MMM d, yyyy')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{cycle.status}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCycleId(cycle.id)} className="text-xs h-7">View</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCycle(cycle.id)} className="text-xs h-7 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Individual Idea Card ───
function StrategicIdeaCard({ idea }: { idea: any }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDesc, setEditDesc] = useState(idea.description);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const updateIdea = useUpdateStrategicIdea();
  const deleteIdea = useDeleteStrategicIdea();
  const typeConfig = IDEA_TYPE_CONFIG[idea.idea_type] || IDEA_TYPE_CONFIG.opportunity;

  const handleApprove = () => updateIdea.mutate({ id: idea.id, status: 'approved' });
  const handleReject = () => {
    updateIdea.mutate({ id: idea.id, status: 'rejected', rejection_reason: rejectReason });
    setShowReject(false);
  };
  const handlePin = () => updateIdea.mutate({ id: idea.id, pinned: !idea.pinned });
  const handleSaveEdit = () => {
    updateIdea.mutate({ id: idea.id, title: editTitle, description: editDesc });
    setEditing(false);
  };
  const handleDelete = () => {
    if (!confirm('Delete this idea?')) return;
    deleteIdea.mutate(idea.id);
  };

  const scores = [
    { label: 'Audience', value: idea.audience_value_score },
    { label: 'Outcome', value: idea.outcome_potential_score },
    { label: 'Growth', value: idea.growth_potential_score },
    { label: 'Brand', value: idea.brand_relevance_score },
    { label: 'Offer', value: idea.offer_relevance_score },
    { label: 'Diversity', value: idea.diversity_score },
  ];

  return (
    <Card className={`shadow-card transition-all ${idea.pinned ? 'ring-1 ring-primary/30' : ''} ${idea.status === 'rejected' ? 'opacity-60' : ''}`}>
      <CardContent className="pt-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-lg">{typeConfig.emoji}</span>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mb-2" />
            ) : (
              <h3 className="text-sm font-semibold leading-tight">{idea.title}</h3>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge className={`text-[10px] border-0 ${typeConfig.color}`}>{typeConfig.label}</Badge>
              <Badge className={`text-[10px] border-0 ${STATUS_STYLES[idea.status] || STATUS_STYLES.suggested}`}>{idea.status}</Badge>
              {idea.pinned && <Badge className="text-[10px] border-0 bg-primary/10 text-primary">📌 Pinned</Badge>}
              {idea.related_pillar && <span className="text-[10px] text-muted-foreground">Pillar: {idea.related_pillar}</span>}
              <span className="text-[10px] font-semibold text-primary ml-auto">Score: {idea.overall_rank}/10</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {editing ? (
          <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {idea.tension_statement || idea.description}
          </p>
        )}

        {/* Scores bar */}
        <div className="flex gap-1.5 flex-wrap">
          {scores.filter(s => s.value > 0).map(s => (
            <div key={s.label} className="text-center px-2 py-1 rounded bg-muted/50">
              <p className="text-[10px] font-bold">{s.value}</p>
              <p className="text-[8px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Expanded details */}
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2 border-t border-border pt-3">
            {[
              { label: 'Why this matters now', value: idea.why_matters_now },
              { label: 'Why relevant to audience', value: idea.why_relevant_to_audience },
              { label: 'Why fits Spiral Up', value: idea.why_fits_spiral_up },
              { label: 'Why supports growth', value: idea.why_supports_growth },
              { label: 'Intended outcome', value: idea.intended_outcome },
              { label: 'Content potential', value: idea.content_potential },
              { label: 'Follower growth potential', value: idea.follower_growth_potential },
              { label: 'Business relevance', value: idea.business_relevance },
              { label: 'Who affected', value: idea.who_affected },
              { label: 'Related offer', value: idea.related_offer },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{f.label}</p>
                <p className="text-xs leading-relaxed">{f.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Reject reason dialog */}
        {showReject && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
            <Textarea placeholder="Why reject this idea?" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleReject} className="text-xs h-7">Confirm Reject</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReject(false)} className="text-xs h-7">Cancel</Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-[10px] h-7 gap-1">
            {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Details</>}
          </Button>

          {idea.status !== 'approved' && (
            <Button variant="ghost" size="sm" onClick={handleApprove} className="text-[10px] h-7 gap-1 text-success hover:text-success">
              <CheckCircle className="w-3 h-3" /> Approve
            </Button>
          )}
          {idea.status !== 'rejected' && (
            <Button variant="ghost" size="sm" onClick={() => setShowReject(true)} className="text-[10px] h-7 gap-1 text-destructive hover:text-destructive">
              <XCircle className="w-3 h-3" /> Reject
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handlePin} className="text-[10px] h-7 gap-1">
            {idea.pinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
          </Button>
          {editing ? (
            <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="text-[10px] h-7 gap-1 text-primary">Save Edit</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-[10px] h-7 gap-1">Edit</Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-[10px] h-7 gap-1 text-destructive ml-auto">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
