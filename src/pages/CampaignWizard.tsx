import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChannelType, CHANNEL_CONFIG, PILLAR_CONFIG, ContentPillar } from '@/data/types';
import { demoUsers, ctaTemplates, hashtagSuggestions } from '@/data/demo';
import { ChevronRight, ChevronLeft, Check, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const steps = ['Campaign Details', 'Channels & Pillars', 'Content & Assets', 'Review & Launch'];

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ownerId, setOwnerId] = useState('u1');
  const [budget, setBudget] = useState('');
  const [goals, setGoals] = useState('');

  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);

  const [samplePost, setSamplePost] = useState('');
  const [selectedCta, setSelectedCta] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);

  const toggleChannel = (ch: ChannelType) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };
  const togglePillar = (p: ContentPillar) => {
    setPillars(prev => prev.includes(p) ? prev.filter(c => c !== p) : [...prev, p]);
  };
  const toggleHashtag = (h: string) => {
    setSelectedHashtags(prev => prev.includes(h) ? prev.filter(c => c !== h) : [...prev, h]);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return channels.length > 0;
    return true;
  };

  const handleLaunch = () => {
    toast.success('Campaign created successfully!', { description: `"${name}" is ready to go.` });
    navigate('/');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold">Create Campaign</h1>
        <p className="text-muted-foreground mt-1">Set up a new multi-channel campaign in minutes.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'gradient-brand text-primary-foreground' :
              i === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-xs font-medium hidden md:block">{s}</span>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-5">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input placeholder="e.g. Summer Growth Sprint" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Brief overview of the campaign..." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Campaign Brief</Label>
                <Textarea placeholder="Detailed brief with objectives, target audience, key messages..." value={brief} onChange={e => setBrief(e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {demoUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget ($)</Label>
                  <Input type="number" placeholder="10000" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Goals (comma-separated)</Label>
                <Input placeholder="e.g. 10K signups, 50% engagement, 100 leads" value={goals} onChange={e => setGoals(e.target.value)} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-display">Select Channels *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.entries(CHANNEL_CONFIG) as [ChannelType, typeof CHANNEL_CONFIG[ChannelType]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => toggleChannel(key)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        channels.includes(key) ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="text-xl">{cfg.icon}</span>
                      <span className="text-sm font-medium">{cfg.label}</span>
                      {channels.includes(key) && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-display">Content Pillars</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(PILLAR_CONFIG) as [ContentPillar, typeof PILLAR_CONFIG[ContentPillar]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => togglePillar(key)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        pillars.includes(key) ? 'border-secondary bg-secondary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="text-xl">{cfg.emoji}</span>
                      <span className="text-sm font-medium">{cfg.label}</span>
                      {pillars.includes(key) && <Check className="w-4 h-4 text-secondary ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-base font-display">Draft a Sample Post</Label>
                <Textarea placeholder="Write your first post or caption here..." value={samplePost} onChange={e => setSamplePost(e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>CTA Template</Label>
                <div className="flex flex-wrap gap-2">
                  {ctaTemplates.map(cta => (
                    <button key={cta} onClick={() => setSelectedCta(cta)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedCta === cta ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                      }`}>
                      {cta}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Suggested Hashtags</Label>
                <div className="flex flex-wrap gap-2">
                  {hashtagSuggestions.map(h => (
                    <button key={h} onClick={() => toggleHashtag(h)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedHashtags.includes(h) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-medium">Asset Upload</span>
                </div>
                <p className="text-xs text-muted-foreground">Drag and drop images, videos, or documents here — or click to browse. (Demo placeholder)</p>
                <div className="mt-3 border-2 border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
                  Drop files here or click to upload
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg">Campaign Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{name || '—'}</span></div>
                <div><span className="text-muted-foreground">Owner:</span> <span className="font-medium">{demoUsers.find(u => u.id === ownerId)?.name}</span></div>
                <div><span className="text-muted-foreground">Dates:</span> <span className="font-medium">{startDate || '—'} → {endDate || '—'}</span></div>
                <div><span className="text-muted-foreground">Budget:</span> <span className="font-medium">{budget ? `$${budget}` : '—'}</span></div>
              </div>
              {description && <p className="text-sm">{description}</p>}
              {channels.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(ch => (
                      <span key={ch} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{CHANNEL_CONFIG[ch].icon} {CHANNEL_CONFIG[ch].label}</span>
                    ))}
                  </div>
                </div>
              )}
              {pillars.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Content Pillars</p>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map(p => (
                      <span key={p} className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">{PILLAR_CONFIG[p].emoji} {PILLAR_CONFIG[p].label}</span>
                    ))}
                  </div>
                </div>
              )}
              {goals && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Goals</p>
                  <p className="text-sm">{goals}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gradient-brand text-primary-foreground hover:opacity-90">
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90">
            <Sparkles className="w-4 h-4 mr-1" /> Launch Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
