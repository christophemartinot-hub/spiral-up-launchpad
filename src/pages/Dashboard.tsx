import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, Users, FileText, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CampaignStatusBadge, ContentStatusBadge } from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import { demoCampaigns, demoContent, demoUsers, demoConnections } from '@/data/demo';

const stats = [
  { label: 'Active Campaigns', value: '3', icon: TrendingUp, change: '+1 this week' },
  { label: 'Content Pieces', value: '20', icon: FileText, change: '6 published' },
  { label: 'Pending Approvals', value: '2', icon: Clock, change: 'Needs review' },
  { label: 'Connected Channels', value: '4', icon: CheckCircle2, change: 'of 6 total' },
];

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const upcomingContent = demoContent
    .filter(c => c.status === 'scheduled' || c.status === 'approved')
    .slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Ava. Here's your overview.</p>
        </div>
        <Link to="/campaigns/new">
          <Button className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
            <PlusCircle className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeIn}>
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-primary font-medium mt-1">{s.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Campaigns */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Campaigns</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {demoCampaigns.map((c) => {
            const owner = demoUsers.find(u => u.id === c.ownerId);
            return (
              <Link key={c.id} to={`/campaigns/${c.id}`}>
                <Card className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-display">{c.name}</CardTitle>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <CampaignStatusBadge status={c.status} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.channels.map(ch => <ChannelBadge key={ch} channel={ch} />)}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{c.progress}%</span>
                      </div>
                      <Progress value={c.progress} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{c.startDate} → {c.endDate}</span>
                      {owner && <span className="font-medium">{owner.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upcoming Content */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Upcoming Content</h2>
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingContent.map((item) => {
                const campaign = demoCampaigns.find(c => c.id === item.campaignId);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{campaign?.name}</p>
                    </div>
                    <ChannelBadge channel={item.channel} />
                    <ContentStatusBadge status={item.status} />
                    <span className="text-xs text-muted-foreground hidden sm:block">{item.publishDate}</span>
                  </div>
                );
              })}
              {upcomingContent.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No upcoming content</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
