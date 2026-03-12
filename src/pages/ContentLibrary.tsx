import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContentStatusBadge } from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import { demoContent, demoCampaigns, demoUsers } from '@/data/demo';
import { PILLAR_CONFIG, ContentStatus, ChannelType, ContentPillar } from '@/data/types';
import { Search, Filter } from 'lucide-react';

export default function ContentLibrary() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return demoContent.filter(item => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.body.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (channelFilter !== 'all' && item.channel !== channelFilter) return false;
      if (pillarFilter !== 'all' && item.pillar !== pillarFilter) return false;
      return true;
    });
  }, [search, statusFilter, channelFilter, pillarFilter]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Content Library</h1>
        <p className="text-muted-foreground mt-1">{demoContent.length} content pieces across all campaigns.</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="drafting">Drafting</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">X / Twitter</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pillarFilter} onValueChange={setPillarFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Pillar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {Object.entries(PILLAR_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.emoji} {val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground mb-2">{filtered.length} results</div>
      <div className="grid gap-3">
        {filtered.map(item => {
          const campaign = demoCampaigns.find(c => c.id === item.campaignId);
          const author = demoUsers.find(u => u.id === item.authorId);
          const expanded = expandedId === item.id;

          return (
            <Card key={item.id} className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{PILLAR_CONFIG[item.pillar].emoji}</span>
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{campaign?.name} • {author?.name} • {item.type}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ChannelBadge channel={item.channel} />
                    <ContentStatusBadge status={item.status} />
                    {item.publishDate && <span className="text-xs text-muted-foreground">{item.publishDate}</span>}
                  </div>
                </div>
                {expanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                    <p className="text-sm whitespace-pre-line">{item.body}</p>
                    {item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.hashtags.map(h => (
                          <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{h}</span>
                        ))}
                      </div>
                    )}
                    {item.cta && (
                      <div className="text-xs"><span className="font-medium text-muted-foreground">CTA:</span> <span className="text-foreground">{item.cta}</span></div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
