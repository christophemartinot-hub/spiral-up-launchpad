// Spiral Up Brand Intelligence Layer
// This data powers the AI content generation with brand-aligned outputs

export const brandProfile = {
  name: 'Spiral Up',
  founder: 'Christophe Martinot',
  website: 'https://spiralingup.works',
  blogUrl: 'https://spiralingup.works/blog',
  tagline: 'Helping organizations and leaders navigate change through systemic thinking',

  positioning: {
    core: 'Spiral Up enables leaders and organizations to transform sustainably through systemic change, business agility, and human-centered approaches.',
    differentiator: 'Combines deep systemic thinking with pragmatic consulting — no buzzwords, no empty inspiration, just actionable transformation.',
    audience: [
      'C-suite executives navigating transformation',
      'Agile leaders and transformation coaches',
      'HR and organizational development professionals',
      'Innovation and strategy teams',
      'Conference organizers seeking thought leaders',
    ],
  },

  toneOfVoice: {
    attributes: ['Human', 'Direct', 'Pragmatic', 'Strategic', 'Energizing', 'Professional'],
    doThis: [
      'Speak with clarity and conviction',
      'Use concrete examples and real stories',
      'Challenge assumptions thoughtfully',
      'Make complex ideas accessible',
      'Inspire action through pragmatism',
      'Show vulnerability and authenticity',
    ],
    avoidThis: [
      'Generic AI marketing language',
      'Startup clichés and hype',
      'Empty inspiration without substance',
      'Overpromising results',
      'Corporate jargon and buzzword soup',
      'Passive or hedging language',
    ],
    writingStyle: 'Clear, structured, thought-provoking. Short paragraphs. Bold opening statements. Questions that make the reader think. Stories before frameworks. Data to support intuition.',
  },

  framework: {
    name: 'The SPIRAL Framework',
    description: 'A systemic approach to organizational transformation that addresses change at multiple levels.',
    pillars: [
      { letter: 'S', name: 'Synergize', description: 'How people connect, collaborate, and build trust' },
      { letter: 'P', name: 'Provide', description: 'How value is delivered to customers and stakeholders' },
      { letter: 'I', name: 'Inspect', description: 'How reality is checked through feedback and reflection' },
      { letter: 'R', name: 'Respond', description: 'How teams adapt to change and new information' },
      { letter: 'A', name: 'Act & Accept', description: 'How decisions are made and risks are owned' },
      { letter: 'L', name: 'Learn', description: 'How improvement becomes continuous and shared' },
    ],
  },

  contentPillars: [
    {
      id: 'systemic_change',
      name: 'Systemic Change',
      emoji: '🔄',
      description: 'How organizations transform at a fundamental level',
      topics: ['Systems thinking', 'Organizational design', 'Change management', 'Complexity'],
    },
    {
      id: 'business_agility',
      name: 'Business Agility',
      emoji: '⚡',
      description: 'Moving beyond agile practices to enterprise adaptability',
      topics: ['Enterprise agility', 'Adaptive strategy', 'Value delivery', 'Lean thinking'],
    },
    {
      id: 'customer_centricity',
      name: 'Customer Centricity',
      emoji: '🎯',
      description: 'Putting customer value at the center of everything',
      topics: ['Customer discovery', 'Value streams', 'Design thinking', 'Outcome-driven development'],
    },
    {
      id: 'leadership_evolution',
      name: 'Leadership Evolution',
      emoji: '🌱',
      description: 'Growing leaders who can navigate complexity',
      topics: ['Servant leadership', 'Coaching mindset', 'Psychological safety', 'Adaptive leadership'],
    },
    {
      id: 'healthy_systems',
      name: 'Healthy Systems & Teams',
      emoji: '💪',
      description: 'Building resilient, empowered, and sustainable teams',
      topics: ['Team dynamics', 'Organizational health', 'Empowerment', 'Sustainable pace'],
    },
    {
      id: 'thought_leadership',
      name: 'Thought Leadership',
      emoji: '💡',
      description: 'Original thinking on transformation and the future of work',
      topics: ['Future of work', 'Conference insights', 'Book concepts', 'Emerging patterns'],
    },
  ],

  offers: [
    { name: 'Keynote Speaking', description: 'Conference talks on transformation, agility, and systemic change', icon: '🎤' },
    { name: 'Transformation Consulting', description: 'Hands-on engagement helping organizations evolve their operating models', icon: '🧭' },
    { name: 'Leadership Workshops', description: 'Intensive sessions for leadership teams on agility and systems thinking', icon: '🏋️' },
    { name: 'Coaching & Advisory', description: 'One-on-one or team coaching for transformation leaders', icon: '🤝' },
    { name: 'The Spiral Up Book', description: 'A practical guide to sustainable organizational transformation', icon: '📖' },
  ],

  proofPoints: [
    'Author of the Spiral Up methodology and book',
    'International keynote speaker on business agility',
    'Decades of experience in organizational transformation',
    'Worked with enterprises across multiple industries',
    'Recognized thought leader in systemic change',
    'Created the SPIRAL framework used by transformation teams',
  ],

  callsToAction: [
    'Book a discovery call',
    'Download the SPIRAL framework guide',
    'Subscribe to the newsletter',
    'Read the latest on the blog',
    'Invite Christophe to speak',
    'Explore transformation workshops',
    'Get the Spiral Up book',
    'Join the community',
  ],

  strategicThemes: [
    'Transformation is not a project — it\'s a way of being',
    'Start with the system, not the symptom',
    'Agility is a means, not an end',
    'Leaders must go first',
    'Sustainable change beats fast change',
    'Complexity requires curiosity, not control',
    'Customer value is the ultimate compass',
    'Healthy systems produce healthy outcomes',
  ],

  campaignAreas: [
    'Thought leadership on transformation',
    'Business agility insights',
    'Systemic change methodologies',
    'Customer centricity practices',
    'Leadership evolution stories',
    'Resilience and adaptability',
    'Healthy systems and empowered teams',
    'Book promotion and SPIRAL framework',
    'Keynote speaking engagements',
    'Consulting services',
    'Workshops and transformation programs',
  ],
};

export const contentTypes = [
  { id: 'blog_post', label: 'Blog Post', description: 'Long-form for SpiralingUp.works/blog', icon: '📝', channel: 'blog' },
  { id: 'linkedin_post', label: 'LinkedIn Post', description: 'Thought leadership and insights', icon: '💼', channel: 'linkedin' },
  { id: 'newsletter', label: 'Newsletter', description: 'Subscriber engagement and value delivery', icon: '📧', channel: 'email' },
  { id: 'landing_page', label: 'Landing Page Copy', description: 'Service pages and lead magnets', icon: '🌐', channel: 'web' },
  { id: 'event_promo', label: 'Event Promotion', description: 'Conference and workshop promotion', icon: '🎤', channel: 'multi' },
  { id: 'lead_magnet', label: 'Lead Magnet', description: 'Downloadable resources and guides', icon: '🧲', channel: 'web' },
  { id: 'email_sequence', label: 'Email Sequence', description: 'Nurture and onboarding flows', icon: '📬', channel: 'email' },
  { id: 'campaign_copy', label: 'Campaign Copy', description: 'Multi-channel campaign messaging', icon: '📣', channel: 'multi' },
] as const;

export type ContentTypeId = typeof contentTypes[number]['id'];
