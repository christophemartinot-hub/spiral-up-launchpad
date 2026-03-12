import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignStatusBadge, ContentStatusBadge } from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import { demoCampaigns, demoContent, demoUsers, demoApprovals } from '@/data/demo';
import { PILLAR_CONFIG } from '@/data/types';
import { ArrowLeft, Target, Calendar, DollarSign, User } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();
  const campaign = demoCampaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const owner = demoUsers.find(u => u.id === campaign.ownerId);
  const content = demoContent.filter(c => c.campaignId === campaign.id);
  const approvals = demoApprovals.filter(a => content.some(c => c.id === a.contentId));

  const statusCounts = content.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold">{campaign.name}</h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <Calendar className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">{campaign.startDate} → {campaign.endDate}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <User className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="text-sm font-medium">{owner?.name}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <DollarSign className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-medium">{campaign.budget ? `$${campaign.budget.toLocaleString()}` : '—'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <Target className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-medium">{campaign.progress}%</p>
            <Progress value={campaign.progress} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Channels & Pillars */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Channels</p>
          <div className="flex flex-wrap gap-1">
            {campaign.channels.map(ch => <ChannelBadge key={ch} channel={ch} size="md" />)}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Content Pillars</p>
          <div className="flex flex-wrap gap-1">
            {campaign.contentPillars.map(p => (
              <span key={p} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-card text-sm">
                {PILLAR_CONFIG[p].emoji} {PILLAR_CONFIG[p].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Brief */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-base">Campaign Brief</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed">{campaign.brief}</p></CardContent>
      </Card>

      {/* Goals */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-base">Goals</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {campaign.goals.map(g => (
              <span key={g} className="text-sm px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">{g}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({approvals.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <div className="grid gap-3">
            {content.map(item => {
              const author = demoUsers.find(u => u.id === item.authorId);
              return (
                <Card key={item.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{PILLAR_CONFIG[item.pillar].emoji} {item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{author?.name} • {item.type} • {item.publishDate || 'Unscheduled'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={item.channel} />
                        <ContentStatusBadge status={item.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <div className="grid gap-3">
            {approvals.map(a => {
              const contentItem = content.find(c => c.id === a.contentId);
              const reviewer = demoUsers.find(u => u.id === a.reviewerId);
              return (
                <Card key={a.id} className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contentItem?.title}</p>
                      <p className="text-xs text-muted-foreground">Reviewed by {reviewer?.name}</p>
                      {a.feedback && <p className="text-xs mt-1 text-muted-foreground italic">"{a.feedback}"</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      a.status === 'approved' ? 'bg-success/15 text-success' :
                      a.status === 'pending' ? 'bg-warning/15 text-warning' :
                      'bg-destructive/15 text-destructive'
                    }`}>{a.status}</span>
                  </CardContent>
                </Card>
              );
            })}
            {approvals.length === 0 && <p className="text-sm text-muted-foreground p-4">No approvals yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Track impressions, engagement, clicks, and conversions across all channels once your campaign is live.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
