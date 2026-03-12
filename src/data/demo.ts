import { User, Campaign, ContentItem, SocialConnection, Approval, Asset } from './types';

export const demoUsers: User[] = [
  { id: 'u1', name: 'Ava Chen', email: 'ava@spiralup.io', avatar: 'AC', role: 'admin' },
  { id: 'u2', name: 'Marcus Rivera', email: 'marcus@spiralup.io', avatar: 'MR', role: 'manager' },
  { id: 'u3', name: 'Jess Okafor', email: 'jess@spiralup.io', avatar: 'JO', role: 'creator' },
  { id: 'u4', name: 'Kai Tanaka', email: 'kai@spiralup.io', avatar: 'KT', role: 'creator' },
];

export const demoCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Spring Growth Challenge',
    description: 'A 30-day growth challenge encouraging our community to set and crush personal goals.',
    brief: 'Launch a multi-channel campaign promoting the Spring Growth Challenge. Focus on engagement, UGC, and daily prompts. Target: 25% increase in community engagement and 5K new email signups.',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    channels: ['instagram', 'tiktok', 'email', 'linkedin'],
    ownerId: 'u1',
    contentPillars: ['growth_mindset', 'community'],
    budget: 12000,
    goals: ['25% engagement increase', '5K email signups', '500 UGC posts'],
    progress: 62,
  },
  {
    id: 'c2',
    name: 'Spiral Up Podcast Launch',
    description: 'Launching the Spiral Up podcast with weekly episodes featuring founders and creators.',
    brief: 'Create buzz around the new Spiral Up podcast. Tease guests, share audiograms, drive subscriptions across Apple, Spotify, and YouTube. Goal: 10K downloads in first month.',
    status: 'in_review',
    startDate: '2026-04-01',
    endDate: '2026-05-15',
    channels: ['youtube', 'instagram', 'twitter', 'linkedin'],
    ownerId: 'u2',
    contentPillars: ['education', 'behind_the_scenes'],
    budget: 8000,
    goals: ['10K downloads month 1', '1K YouTube subscribers', 'Top 100 in category'],
    progress: 28,
  },
  {
    id: 'c3',
    name: 'Summer Brand Refresh',
    description: 'Refreshed visual identity and messaging rollout across all channels.',
    brief: 'Roll out updated brand assets, color palette, and messaging. Coordinate across all channels for a unified launch moment. Include influencer partnerships and a giveaway.',
    status: 'draft',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
    channels: ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'email'],
    ownerId: 'u1',
    contentPillars: ['product', 'community', 'behind_the_scenes'],
    budget: 20000,
    goals: ['50K impressions launch week', 'Brand awareness +30%', '2K new followers'],
    progress: 5,
  },
];

export const demoContent: ContentItem[] = [
  // Spring Growth Challenge
  { id: 'p1', campaignId: 'c1', title: 'Day 1: Set Your Intention', body: "🌱 The journey of a thousand miles starts with one step. What's your growth goal this spring? Drop it below 👇 #SpiralUpChallenge #GrowthMindset", channel: 'instagram', status: 'published', pillar: 'growth_mindset', publishDate: '2026-03-01', authorId: 'u3', hashtags: ['#SpiralUpChallenge', '#GrowthMindset', '#SpringGrowth'], cta: 'Share your goal in the comments', type: 'post' },
  { id: 'p2', campaignId: 'c1', title: 'Growth Challenge Kickoff Reel', body: "Hook: 'I asked 100 people what holds them back from growing...' — 30s reel showing street interviews with inspirational overlay", channel: 'tiktok', status: 'published', pillar: 'growth_mindset', publishDate: '2026-03-01', authorId: 'u4', hashtags: ['#SpiralUp', '#GrowthChallenge'], cta: 'Join free at link in bio', type: 'reel' },
  { id: 'p3', campaignId: 'c1', title: 'Welcome Email: Spring Challenge', body: "Subject: Your 30-day growth journey starts NOW 🚀\n\nHey {first_name},\n\nWe're kicking off something special — the Spiral Up Spring Growth Challenge. 30 days, daily prompts, a community cheering you on.\n\nHere's what to expect...", channel: 'email', status: 'published', pillar: 'growth_mindset', publishDate: '2026-03-01', authorId: 'u3', hashtags: [], cta: 'Start Day 1 →', type: 'email' },
  { id: 'p4', campaignId: 'c1', title: 'Week 1 Recap Carousel', body: "Slide 1: Week 1 ✅ Here's what our community achieved\nSlide 2: 2,400 goals set\nSlide 3: Top 3 most popular goals\nSlide 4: Keep going — Week 2 starts now!", channel: 'instagram', status: 'scheduled', pillar: 'community', publishDate: '2026-03-08', authorId: 'u3', hashtags: ['#SpiralUpChallenge', '#WeekOne'], cta: 'Save this for motivation', type: 'carousel' },
  { id: 'p5', campaignId: 'c1', title: 'Mindset Monday: Reframe Failure', body: "Failure isn't the opposite of success — it's part of it. This week's mindset shift: reframe every setback as data. 📊\n\nWhat's one 'failure' that actually taught you something huge?", channel: 'linkedin', status: 'approved', pillar: 'growth_mindset', publishDate: '2026-03-10', authorId: 'u1', hashtags: ['#MindsetMonday', '#SpiralUp'], cta: 'Share in the comments', type: 'post' },
  { id: 'p6', campaignId: 'c1', title: '"3 Morning Habits" Short', body: "Hook: 'The 3 morning habits that changed everything for me' — Show routine with upbeat music, text overlay tips", channel: 'tiktok', status: 'drafting', pillar: 'education', publishDate: '2026-03-12', authorId: 'u4', hashtags: ['#MorningRoutine', '#SpiralUp'], cta: 'Follow for daily growth tips', type: 'reel' },
  { id: 'p7', campaignId: 'c1', title: 'Mid-Challenge Check-in Email', body: "Subject: Halfway there! Here's your progress 📈\n\nYou're 15 days in. Let's look at what you've accomplished and gear up for the home stretch.", channel: 'email', status: 'idea', pillar: 'community', publishDate: '2026-03-15', authorId: 'u3', hashtags: [], cta: 'View my progress →', type: 'email' },
  // Podcast Launch
  { id: 'p8', campaignId: 'c2', title: 'Podcast Announcement Post', body: "📢 BIG NEWS: The Spiral Up Podcast is coming April 1st! Real conversations with founders, creators, and game-changers about what it really takes to grow.\n\nFirst guest? You'll want to see this 👀", channel: 'instagram', status: 'approved', pillar: 'behind_the_scenes', publishDate: '2026-03-25', authorId: 'u2', hashtags: ['#SpiralUpPodcast', '#ComingSoon'], cta: 'Turn on notifications', type: 'post' },
  { id: 'p9', campaignId: 'c2', title: 'Guest Teaser: Episode 1', body: "Hook: 'She built a $10M company from her bedroom...' — Quick teaser clip of guest interview with dramatic cuts", channel: 'tiktok', status: 'drafting', pillar: 'education', publishDate: '2026-03-28', authorId: 'u4', hashtags: ['#SpiralUpPodcast', '#FounderStories'], cta: 'Subscribe now — link in bio', type: 'reel' },
  { id: 'p10', campaignId: 'c2', title: 'LinkedIn Thought Leadership', body: "I started Spiral Up because I was tired of surface-level growth advice.\n\nOur new podcast goes deeper. Real stories. Real struggles. Real growth.\n\nEpisode 1 drops April 1. Here's what we're doing differently...", channel: 'linkedin', status: 'in_review', pillar: 'behind_the_scenes', publishDate: '2026-03-26', authorId: 'u1', hashtags: ['#SpiralUpPodcast', '#Leadership'], cta: 'Follow for updates', type: 'post' },
  { id: 'p11', campaignId: 'c2', title: 'YouTube Trailer', body: "60-second trailer: montage of guest clips, behind-the-scenes studio setup, Spiral Up branding moments. End with release date and subscribe CTA.", channel: 'youtube', status: 'drafting', pillar: 'behind_the_scenes', publishDate: '2026-03-30', authorId: 'u4', hashtags: ['#SpiralUpPodcast'], cta: 'Subscribe & hit the bell 🔔', type: 'video' },
  { id: 'p12', campaignId: 'c2', title: 'Podcast Launch Email', body: "Subject: 🎙️ We made something for you\n\nThe Spiral Up Podcast is LIVE. Listen to Episode 1 now on Spotify, Apple, or YouTube.\n\nThis week: [Guest Name] on building resilience in your first year of business.", channel: 'email', status: 'idea', pillar: 'education', publishDate: '2026-04-01', authorId: 'u3', hashtags: [], cta: 'Listen now →', type: 'email' },
  { id: 'p13', campaignId: 'c2', title: 'Audiogram Quote Card', body: "\"The moment I stopped comparing my chapter 1 to someone else's chapter 20, everything changed.\" — [Guest], Ep 1\n\n🎧 Full episode out now", channel: 'twitter', status: 'idea', pillar: 'growth_mindset', publishDate: '2026-04-02', authorId: 'u2', hashtags: ['#SpiralUpPodcast', '#FounderQuotes'], cta: 'Listen on Spotify', type: 'post' },
  // Summer Brand Refresh
  { id: 'p14', campaignId: 'c3', title: 'Brand Refresh Teaser', body: "Something new is coming to Spiral Up this summer ☀️ A fresh look. A bolder voice. Same mission: helping you grow.\n\nStay tuned...", channel: 'instagram', status: 'idea', pillar: 'product', publishDate: '2026-05-28', authorId: 'u3', hashtags: ['#SpiralUp', '#NewEra'], cta: "Guess what's changing 👇", type: 'post' },
  { id: 'p15', campaignId: 'c3', title: 'Design Process BTS Reel', body: "Hook: 'We're redesigning everything and here's why' — time-lapse of design process, mood board reveals, color palette swatches", channel: 'tiktok', status: 'idea', pillar: 'behind_the_scenes', publishDate: '2026-06-01', authorId: 'u4', hashtags: ['#BrandRefresh', '#DesignProcess'], cta: 'Which version do you prefer?', type: 'reel' },
  { id: 'p16', campaignId: 'c3', title: 'Rebrand Announcement', body: "Today we're unveiling the new Spiral Up. 🌀\n\nNew colors. New energy. Same commitment to your growth.\n\nSwipe to see the evolution →", channel: 'instagram', status: 'idea', pillar: 'product', publishDate: '2026-06-05', authorId: 'u1', hashtags: ['#SpiralUp', '#Rebrand', '#NewLook'], cta: 'Tell us what you think!', type: 'carousel' },
  { id: 'p17', campaignId: 'c3', title: 'Giveaway: New Merch Drop', body: "🎁 GIVEAWAY: We're celebrating our new look with a merch drop!\n\nTo enter:\n1. Follow @spiralup\n2. Like this post\n3. Tag 2 friends who need to spiral up\n\nWinner announced June 15!", channel: 'facebook', status: 'idea', pillar: 'community', publishDate: '2026-06-05', authorId: 'u3', hashtags: ['#SpiralUpGiveaway', '#Merch'], cta: 'Enter now', type: 'post' },
  { id: 'p18', campaignId: 'c3', title: 'Brand Story Video', body: "Full story of Spiral Up: where we started, where we're going. 3-minute cinematic piece with founder narration.", channel: 'youtube', status: 'idea', pillar: 'behind_the_scenes', publishDate: '2026-06-10', authorId: 'u4', hashtags: ['#SpiralUp', '#OurStory'], cta: 'Subscribe for the journey', type: 'video' },
  { id: 'p19', campaignId: 'c3', title: 'Influencer Collab Announce', body: "We partnered with 10 creators who embody the Spiral Up mindset. Meet them this summer.\n\nFirst up: @creator — watch their takeover story today!", channel: 'twitter', status: 'idea', pillar: 'community', publishDate: '2026-06-12', authorId: 'u2', hashtags: ['#SpiralUpCreators', '#Collab'], cta: 'Check out the takeover', type: 'post' },
  { id: 'p20', campaignId: 'c3', title: 'Summer Refresh Email', body: "Subject: We hit refresh ☀️ \n\nNew look. New energy. Same growth-obsessed team.\n\nHere's what's changed and what's coming next this summer at Spiral Up.", channel: 'email', status: 'idea', pillar: 'product', publishDate: '2026-06-01', authorId: 'u3', hashtags: [], cta: 'Explore the new Spiral Up →', type: 'email' },
];

export const demoConnections: SocialConnection[] = [
  { id: 'sc1', channel: 'instagram', accountName: '@spiralup.co', connected: true, lastSync: '2026-03-12T10:30:00Z', followers: 24500 },
  { id: 'sc2', channel: 'tiktok', accountName: '@spiralup', connected: true, lastSync: '2026-03-12T10:30:00Z', followers: 18200 },
  { id: 'sc3', channel: 'linkedin', accountName: 'Spiral Up', connected: true, lastSync: '2026-03-11T08:00:00Z', followers: 8900 },
  { id: 'sc4', channel: 'twitter', accountName: '@spiralup_', connected: false },
  { id: 'sc5', channel: 'youtube', accountName: 'Spiral Up', connected: false },
  { id: 'sc6', channel: 'facebook', accountName: 'Spiral Up', connected: true, lastSync: '2026-03-10T14:00:00Z', followers: 12300 },
];

export const demoApprovals: Approval[] = [
  { id: 'a1', contentId: 'p5', reviewerId: 'u2', status: 'approved', feedback: 'Great framing. Approved!', createdAt: '2026-03-09T12:00:00Z' },
  { id: 'a2', contentId: 'p10', reviewerId: 'u1', status: 'pending', createdAt: '2026-03-11T09:00:00Z' },
  { id: 'a3', contentId: 'p8', reviewerId: 'u1', status: 'approved', feedback: 'Love the teaser angle.', createdAt: '2026-03-10T16:00:00Z' },
];

export const ctaTemplates = [
  'Join free at link in bio',
  'Share your goal in the comments',
  'Save this for later',
  'Tag someone who needs this',
  'Subscribe & hit the bell 🔔',
  'Listen now →',
  'Explore the new Spiral Up →',
  'Start your free trial',
  'DM us "GROW" to get started',
  'Follow for daily growth tips',
];

export const hashtagSuggestions = [
  '#SpiralUp', '#GrowthMindset', '#PersonalGrowth', '#Motivation',
  '#Entrepreneurship', '#CreatorEconomy', '#StartupLife', '#MindsetShift',
  '#LevelUp', '#GrowthChallenge', '#MorningRoutine', '#FounderStories',
  '#SelfImprovement', '#BrandBuilding', '#ContentCreator',
];
