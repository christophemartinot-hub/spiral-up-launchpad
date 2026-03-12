import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandCoreTab from '@/components/brand/BrandCoreTab';
import FounderProfileTab from '@/components/brand/FounderProfileTab';
import SpiralFrameworkTab from '@/components/brand/SpiralFrameworkTab';
import VoiceRulesTab from '@/components/brand/VoiceRulesTab';
import ContentPillarsTab from '@/components/brand/ContentPillarsTab';
import BrandKitTab from '@/components/brand/BrandKitTab';
import WebsiteKBTab from '@/components/brand/WebsiteKBTab';
import OffersTab from '@/components/brand/OffersTab';
import ExampleContentTab from '@/components/brand/ExampleContentTab';
import BookTab from '@/components/brand/BookTab';
import EventsTab from '@/components/brand/EventsTab';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function BrandIntelligence() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Brand Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          The knowledge layer that powers all Spiral Up AI content generation.
        </p>
      </motion.div>

      <Tabs defaultValue="core" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="core">Brand Core</TabsTrigger>
          <TabsTrigger value="founder">Founder</TabsTrigger>
          <TabsTrigger value="spiral">SPIRAL</TabsTrigger>
          <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
          <TabsTrigger value="pillars">Content Pillars</TabsTrigger>
          <TabsTrigger value="book">📖 Book</TabsTrigger>
          <TabsTrigger value="events">📅 Events</TabsTrigger>
          <TabsTrigger value="brand-kit">Brand Kit</TabsTrigger>
          <TabsTrigger value="website">Website KB</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="core"><BrandCoreTab /></TabsContent>
        <TabsContent value="founder"><FounderProfileTab /></TabsContent>
        <TabsContent value="spiral"><SpiralFrameworkTab /></TabsContent>
        <TabsContent value="voice"><VoiceRulesTab /></TabsContent>
        <TabsContent value="pillars"><ContentPillarsTab /></TabsContent>
        <TabsContent value="book"><BookTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
        <TabsContent value="brand-kit"><BrandKitTab /></TabsContent>
        <TabsContent value="website"><WebsiteKBTab /></TabsContent>
        <TabsContent value="offers"><OffersTab /></TabsContent>
        <TabsContent value="examples"><ExampleContentTab /></TabsContent>
      </Tabs>
    </div>
  );
}
