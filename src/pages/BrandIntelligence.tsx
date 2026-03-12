import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { brandProfile } from '@/data/brand';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandKitTab from '@/components/brand/BrandKitTab';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function BrandIntelligence() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Brand Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          The knowledge layer that powers all Spiral Up content generation.
        </p>
      </motion.div>

      <Tabs defaultValue="positioning" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
          <TabsTrigger value="framework">SPIRAL Framework</TabsTrigger>
          <TabsTrigger value="pillars">Content Pillars</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="brand-kit">Brand Kit</TabsTrigger>
        </TabsList>

        <TabsContent value="positioning" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display text-base">Core Positioning</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{brandProfile.positioning.core}</p>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Differentiator</p>
                  <p className="text-sm">{brandProfile.positioning.differentiator}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display text-base">Target Audiences</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandProfile.positioning.audience.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-base">Proof Points</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {brandProfile.proofPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted/50">
                    <span className="text-primary font-bold">✓</span>
                    {p}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display text-base">Tone Attributes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {brandProfile.toneOfVoice.attributes.map(a => (
                    <Badge key={a} className="bg-primary/10 text-primary border-0">{a}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium mb-2">Writing Style</p>
                <p className="text-sm leading-relaxed">{brandProfile.toneOfVoice.writingStyle}</p>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="shadow-card border-l-4 border-l-success">
                <CardHeader><CardTitle className="font-display text-base text-success">✅ Do This</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {brandProfile.toneOfVoice.doThis.map((d, i) => (
                      <li key={i} className="text-sm">{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-destructive">
                <CardHeader><CardTitle className="font-display text-base text-destructive">🚫 Avoid This</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {brandProfile.toneOfVoice.avoidThis.map((d, i) => (
                      <li key={i} className="text-sm">{d}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="framework" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">{brandProfile.framework.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{brandProfile.framework.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {brandProfile.framework.pillars.map((p) => (
                  <div key={p.letter} className="p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground font-display font-bold text-lg mb-3">
                      {p.letter}
                    </div>
                    <p className="font-display font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pillars" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandProfile.contentPillars.map((p) => (
              <Card key={p.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <div className="text-2xl mb-2">{p.emoji}</div>
                  <p className="font-display font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.topics.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandProfile.offers.map((o) => (
              <Card key={o.name} className="shadow-card">
                <CardContent className="p-5">
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <p className="font-display font-semibold text-sm">{o.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-base">Preferred Calls to Action</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {brandProfile.callsToAction.map(cta => (
                  <Badge key={cta} variant="outline" className="text-xs">{cta}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-base">Strategic Themes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {brandProfile.strategicThemes.map((t, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border text-sm font-medium italic">
                    "{t}"
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-base">Campaign Areas</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {brandProfile.campaignAreas.map(a => (
                  <Badge key={a} className="bg-secondary/10 text-secondary border-0">{a}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
