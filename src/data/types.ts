export type ChannelType = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | 'email';

export type CampaignStatus = 'draft' | 'in_review' | 'approved' | 'active' | 'completed' | 'paused';

export type ContentStatus = 'idea' | 'drafting' | 'in_review' | 'approved' | 'scheduled' | 'published';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export type ContentPillar = 'growth_mindset' | 'community' | 'education' | 'behind_the_scenes' | 'product';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'manager' | 'creator' | 'viewer';
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  brief: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  channels: ChannelType[];
  ownerId: string;
  contentPillars: ContentPillar[];
  budget?: number;
  goals: string[];
  progress: number;
}

export interface ContentItem {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  channel: ChannelType;
  status: ContentStatus;
  pillar: ContentPillar;
  publishDate?: string;
  authorId: string;
  hashtags: string[];
  cta?: string;
  type: 'post' | 'story' | 'reel' | 'video' | 'email' | 'carousel';
  assetUrl?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  campaignId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  contentId: string;
  reviewerId: string;
  status: ApprovalStatus;
  feedback?: string;
  createdAt: string;
}

export interface SocialConnection {
  id: string;
  channel: ChannelType;
  accountName: string;
  connected: boolean;
  lastSync?: string;
  followers?: number;
}

export const CHANNEL_CONFIG: Record<ChannelType, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: 'hsl(330 70% 55%)', icon: '📸' },
  facebook: { label: 'Facebook', color: 'hsl(220 70% 50%)', icon: '👤' },
  linkedin: { label: 'LinkedIn', color: 'hsl(210 80% 45%)', icon: '💼' },
  twitter: { label: 'X / Twitter', color: 'hsl(0 0% 15%)', icon: '𝕏' },
  tiktok: { label: 'TikTok', color: 'hsl(0 0% 10%)', icon: '🎵' },
  youtube: { label: 'YouTube', color: 'hsl(0 80% 50%)', icon: '▶️' },
  email: { label: 'Email', color: 'hsl(160 55% 45%)', icon: '✉️' },
};

export const PILLAR_CONFIG: Record<ContentPillar, { label: string; emoji: string }> = {
  growth_mindset: { label: 'Growth Mindset', emoji: '🌱' },
  community: { label: 'Community', emoji: '🤝' },
  education: { label: 'Education', emoji: '📚' },
  behind_the_scenes: { label: 'Behind the Scenes', emoji: '🎬' },
  product: { label: 'Product', emoji: '🚀' },
};

export const STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: string }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_review: { label: 'In Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  paused: { label: 'Paused', variant: 'muted' },
};
