import { Badge } from '@/components/ui/badge';
import { CampaignStatus, ContentStatus } from '@/data/types';

const campaignStatusStyles: Record<CampaignStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_review: 'bg-warning/15 text-warning border-warning/30',
  approved: 'bg-info/15 text-info border-info/30',
  active: 'bg-success/15 text-success border-success/30',
  completed: 'bg-foreground/10 text-foreground',
  paused: 'bg-muted text-muted-foreground',
};

const contentStatusStyles: Record<ContentStatus, string> = {
  idea: 'bg-muted text-muted-foreground',
  drafting: 'bg-warning/15 text-warning border-warning/30',
  in_review: 'bg-info/15 text-info border-info/30',
  approved: 'bg-success/15 text-success border-success/30',
  scheduled: 'bg-secondary/15 text-secondary border-secondary/30',
  published: 'bg-primary/15 text-primary border-primary/30',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft', in_review: 'In Review', approved: 'Approved',
  active: 'Active', completed: 'Completed', paused: 'Paused',
  idea: 'Idea', drafting: 'Drafting', scheduled: 'Scheduled', published: 'Published',
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant="outline" className={`text-xs font-medium ${campaignStatusStyles[status]}`}>{statusLabels[status]}</Badge>;
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant="outline" className={`text-xs font-medium ${contentStatusStyles[status]}`}>{statusLabels[status]}</Badge>;
}
