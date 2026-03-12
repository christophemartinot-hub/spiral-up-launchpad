import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingUp, TrendingDown, BarChart3, Save, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { usePerformanceSummary, usePerformanceData, useUpsertPerformance, usePerformanceConfig, useUpdatePerformanceConfig } from '@/hooks/use-performance';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { useEffect } from 'react';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function PerformanceDashboard() {
  const { data: summary, isLoading } = usePerformanceSummary();
  const { data: perfConfig, isLoading: configLoading } = usePerformanceConfig();
  const updateConfig = useUpdatePerformanceConfig();
  const [configForm, setConfigForm] = useState<any>(null);
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  useEffect(() => {
    if (perfConfig && !configForm) setConfigForm({ ...perfConfig });
  }, [perfConfig]);

  const handleSaveConfig = () => {
    if (!configForm) return;
    const { id, created_at, updated_at, ...updates } = configForm;
    updateConfig.mutate(updates, { onSuccess: () => toast.success('Learning config saved') });
  };

  const addToList = (field: string) => {
    const val = newItem[field]?.trim();
    if (!val) return;
    setConfigForm((f: any) => ({ ...f, [field]: [...(f[field] || []), val] }));
    setNewItem(n => ({ ...n, [field]: '' }));
  };

  const removeFromList = (field: string, i: number) => {
    setConfigForm((f: any) => ({ ...f, [field]: (f[field] || []).filter((_: any, idx: number) => idx !== i) }));
  };

  // Chart data
  const channelData = summary ? Object.entries(summary.byChannel).map(([name, v]) => ({
    name, engagement: v.totalEngagement, clicks: v.totalClicks, impressions: v.totalImpressions, count: v.count,
  })).sort((a, b) => b.engagement - a.engagement) : [];

  const pillarData = summary ? Object.entries(summary.byPillar).map(([name, v]) => ({
    name: name.length > 15 ? name.slice(0, 15) + '…' : name, engagement: v.totalEngagement, clicks: v.totalClicks, count: v.count,
  })).sort((a, b) => b.engagement - a.engagement) : [];

  const formatData = summary ? Object.entries(summary.byFormat).map(([name, v]) => ({
    name: name.replace(/_/g, ' '), value: v.totalEngagement, count: v.count,
  })).sort((a, b) => b.value - a.value) : [];

  const visualData = summary ? Object.entries(summary.byVisual).filter(([k]) => k !== 'none').map(([name, v]) => ({
    name: name.replace(/_/g, ' '), value: v.totalEngagement, count: v.count,
  })).sort((a, b) => b.value - a.value) : [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Performance Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Learn from content performance to improve future editorial plans, suggestions, and visuals.
        </p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="outcomes">🎯 Outcome Signals</TabsTrigger>
          <TabsTrigger value="details">📋 Detailed Data</TabsTrigger>
          <TabsTrigger value="learnings">🧠 Learnings</TabsTrigger>
          <TabsTrigger value="config">⚙️ AI Learning Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !summary ? (
            <Card className="shadow-card">
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No Performance Data Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start tracking content performance by adding metrics for published items. The AI will use this data to improve future suggestions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Total Tracked</p>
                    <p className="text-2xl font-bold mt-1">{summary.total}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Top Performer</p>
                    <p className="text-sm font-semibold mt-1 truncate">{summary.topPost.topic || 'N/A'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">{summary.topPost.engagement} engagement</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Needs Attention</p>
                    <p className="text-sm font-semibold mt-1 truncate">{summary.lowPost.topic || 'N/A'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">{summary.lowPost.engagement} engagement</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Channels Active</p>
                    <p className="text-2xl font-bold mt-1">{Object.keys(summary.byChannel).length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement by Channel</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={channelData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement by Pillar</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={pillarData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="engagement" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Performance by Format</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={formatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                          {formatData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Performance by Visual Type</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={visualData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                          {visualData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details">
          <PerformanceTable />
        </TabsContent>

        <TabsContent value="learnings">
          <PerformanceLearnings />
        </TabsContent>

        <TabsContent value="config">
          {configLoading || !configForm ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Configure how the AI learns from performance data.</p>
                <Button size="sm" onClick={handleSaveConfig} disabled={updateConfig.isPending} className="gap-1.5">
                  {updateConfig.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Config
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Weight Distribution</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Engagement Weight</span><span>{Math.round((configForm.engagement_weight || 0.5) * 100)}%</span></div>
                      <Slider value={[configForm.engagement_weight * 100]} onValueChange={([v]) => setConfigForm((f: any) => ({ ...f, engagement_weight: v / 100 }))} max={100} step={5} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Conversion Weight</span><span>{Math.round((configForm.conversion_weight || 0.3) * 100)}%</span></div>
                      <Slider value={[configForm.conversion_weight * 100]} onValueChange={([v]) => setConfigForm((f: any) => ({ ...f, conversion_weight: v / 100 }))} max={100} step={5} />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>Strategic Priority Weight</span><span>{Math.round((configForm.strategic_weight || 0.2) * 100)}%</span></div>
                      <Slider value={[configForm.strategic_weight * 100]} onValueChange={([v]) => setConfigForm((f: any) => ({ ...f, strategic_weight: v / 100 }))} max={100} step={5} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Repetition Limit</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">Max times a successful pattern can repeat before rotation</p>
                    <Input type="number" min={1} max={10} value={configForm.repetition_limit} onChange={e => setConfigForm((f: any) => ({ ...f, repetition_limit: parseInt(e.target.value) || 3 }))} />
                  </CardContent>
                </Card>
              </div>

              {/* List configs */}
              {(['favored_patterns', 'deprioritized_types', 'primary_metrics', 'blog_success_signals', 'social_success_signals', 'email_success_signals'] as const).map(field => (
                <Card key={field} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(configForm[field] || []).map((item: string, i: number) => (
                        <Badge key={i} variant="secondary" className="gap-1 pr-1">
                          {item}
                          <button onClick={() => removeFromList(field, i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder={`Add...`} value={newItem[field] || ''} onChange={e => setNewItem(n => ({ ...n, [field]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(field); } }} />
                      <Button variant="outline" size="sm" onClick={() => addToList(field)}><Plus className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Performance Table ───
function PerformanceTable() {
  const { data: items, isLoading } = usePerformanceData();
  const upsert = useUpsertPerformance();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const handleSave = (isNew = false) => {
    upsert.mutate(form, {
      onSuccess: () => {
        toast.success(isNew ? 'Performance record added' : 'Performance record updated');
        setEditing(null);
        setShowAdd(false);
        setForm({});
      },
    });
  };

  const fields = ['channel', 'content_format', 'content_pillar', 'topic', 'visual_type', 'impressions', 'reach', 'clicks', 'engagement', 'saves', 'shares', 'comments', 'conversions'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items?.length || 0} performance records</p>
        <Button size="sm" onClick={() => { setShowAdd(true); setForm({ channel: '', content_format: '', topic: '' }); }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Record
        </Button>
      </div>

      {showAdd && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">New Performance Record</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {fields.map(f => (
                <div key={f}>
                  <label className="text-xs text-muted-foreground">{f.replace(/_/g, ' ')}</label>
                  <Input value={form[f] || ''} onChange={e => setForm((prev: any) => ({ ...prev, [f]: e.target.value }))} className="mt-1" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSave(true)} disabled={upsert.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setForm({}); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(items || []).map((item: any) => (
          <Card key={item.id} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{item.channel}</Badge>
                  <Badge variant="secondary">{item.content_format?.replace(/_/g, ' ')}</Badge>
                  <span className="text-sm font-medium">{item.topic || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>👁 {item.impressions}</span>
                  <span>💬 {item.engagement}</span>
                  <span>🔗 {item.clicks}</span>
                  <span>🔄 {item.shares}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Learnings ───
function PerformanceLearnings() {
  const { data: summary } = usePerformanceSummary();

  if (!summary) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Add performance data to see AI-generated learnings.</p>
        </CardContent>
      </Card>
    );
  }

  // Extract learnings
  const learnings: { type: 'success' | 'warning' | 'info'; message: string }[] = [];

  // Top channel
  const topChannel = Object.entries(summary.byChannel).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0];
  if (topChannel) learnings.push({ type: 'success', message: `${topChannel[0]} is your strongest channel with ${topChannel[1].totalEngagement} total engagement across ${topChannel[1].count} posts.` });

  // Underused pillars
  const pillarEntries = Object.entries(summary.byPillar).sort((a, b) => a[1].count - b[1].count);
  if (pillarEntries.length > 1) {
    const least = pillarEntries[0];
    learnings.push({ type: 'warning', message: `"${least[0]}" pillar has only ${least[1].count} tracked items. Consider increasing coverage.` });
  }

  // Top format
  const topFormat = Object.entries(summary.byFormat).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0];
  if (topFormat) learnings.push({ type: 'info', message: `${topFormat[0].replace(/_/g, ' ')} format drives the most engagement (${topFormat[1].totalEngagement} total).` });

  // Visual insight
  const topVisual = Object.entries(summary.byVisual).filter(([k]) => k !== 'none').sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0];
  if (topVisual) learnings.push({ type: 'success', message: `${topVisual[0].replace(/_/g, ' ')} visual type performs best (${topVisual[1].totalEngagement} engagement).` });

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm">🧠 AI-Extracted Learnings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {learnings.map((l, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${
              l.type === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
              l.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
              'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              {l.type === 'success' ? '✅' : l.type === 'warning' ? '⚠️' : 'ℹ️'} {l.message}
            </div>
          ))}
          {learnings.length === 0 && <p className="text-sm text-muted-foreground">Not enough data to extract learnings yet.</p>}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm">📈 Suggested Adjustments for Next Cycle</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {topChannel && <p className="text-sm">• Double down on <strong>{topChannel[0]}</strong> — it's driving the most engagement.</p>}
          {pillarEntries.length > 1 && <p className="text-sm">• Increase content for <strong>{pillarEntries[0][0]}</strong> pillar to maintain editorial balance.</p>}
          {topFormat && <p className="text-sm">• Prioritize <strong>{topFormat[0].replace(/_/g, ' ')}</strong> format — it resonates most with your audience.</p>}
          {topVisual && <p className="text-sm">• Use more <strong>{topVisual[0].replace(/_/g, ' ')}</strong> visuals — they outperform other types.</p>}
          <p className="text-sm">• Keep varying content to avoid pattern fatigue — even top performers need rotation.</p>
        </CardContent>
      </Card>
    </div>
  );
}
