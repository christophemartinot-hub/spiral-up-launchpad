import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { brandProfile, contentTypes } from '@/data/brand';
import { streamContent } from '@/lib/ai';
import { Sparkles, Copy, Download, RefreshCw, Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ContentStudio() {
  const [contentType, setContentType] = useState('blog_post');
  const [pillar, setPillar] = useState('');
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    const selectedType = contentTypes.find(t => t.id === contentType);
    const selectedPillar = brandProfile.contentPillars.find(p => p.id === pillar);

    const userMessage = `Generate a ${selectedType?.label || contentType} about "${topic}" aligned with the "${selectedPillar?.name || 'general'}" content pillar.${additionalContext ? ` Additional context: ${additionalContext}` : ''}

Requirements:
${contentType === 'blog_post' ? `- Create a full blog post for SpiralingUp.works/blog
- Include: SEO title (under 60 chars), meta description (under 160 chars), excerpt, the full article with H2/H3 headers, compelling intro, 3-5 key sections, and conclusion with CTA
- Suggest internal linking opportunities
- Format in clean markdown` : ''}
${contentType === 'linkedin_post' ? `- Create a LinkedIn post (1300 chars max)
- Start with a bold hook
- Short paragraphs (1-2 sentences)
- Clear CTA at end
- Suggest 3-5 hashtags` : ''}
${contentType === 'newsletter' ? `- Include: subject line, preview text, greeting, main content, and CTA
- Personal and conversational tone
- Include a "One question for you" section` : ''}
${contentType === 'event_promo' ? `- Include: headline, description, key takeaways, speaker bio snippet, registration CTA` : ''}
${contentType === 'landing_page' ? `- Include: headline, subheadline, 3-4 value props, social proof placeholder, primary CTA` : ''}
${contentType === 'lead_magnet' ? `- Include: title, description, what's inside, who it's for, download CTA` : ''}
${contentType === 'email_sequence' ? `- Create 3-5 email nurture sequence with subject lines and body for each` : ''}
${contentType === 'campaign_copy' ? `- Include: campaign theme, LinkedIn post, newsletter excerpt, blog intro, email subject line` : ''}

Stay unmistakably Spiral Up in voice.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: userMessage }],
      onDelta: (delta) => {
        content += delta;
        setGeneratedContent(content);
      },
      onDone: () => setIsGenerating(false),
      onError: (error) => {
        toast.error(error);
        setIsGenerating(false);
      },
    });
  }, [contentType, pillar, topic, additionalContext]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Content Studio</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered content generation, fully aligned with Spiral Up's voice and strategy.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Generate Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <span>{t.icon}</span> {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {contentTypes.find(t => t.id === contentType)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Content Pillar</Label>
                <Select value={pillar} onValueChange={setPillar}>
                  <SelectTrigger><SelectValue placeholder="Select a pillar..." /></SelectTrigger>
                  <SelectContent>
                    {brandProfile.contentPillars.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span>{p.emoji}</span> {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic *</Label>
                <Input
                  placeholder="e.g. Why most transformations fail in the first 6 months"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Context</Label>
                <Textarea
                  placeholder="Add any specific angle, data points, or references you want included..."
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Prompts */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-base">Quick Prompts</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'Why "agile transformation" is an oxymoron',
                  'The hidden cost of organizational debt',
                  '5 signs your transformation is performative',
                  'From hierarchy to network: a practical playbook',
                  'What leaders get wrong about resilience',
                ].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setTopic(prompt)}
                    className="w-full text-left text-xs p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
                  >
                    <ArrowRight className="w-3 h-3 inline mr-1.5 text-primary" />
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-3">
          <Card className="shadow-card h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Output</CardTitle>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed bg-transparent p-0 border-0">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-display font-semibold">Ready to create</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Select a content type, choose a pillar, enter your topic, and let the Spiral Up AI engine generate brand-aligned content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
