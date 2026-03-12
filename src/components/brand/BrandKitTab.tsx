import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Globe, Palette, Image, Link, FileText, Star } from 'lucide-react';

type BrandItem = { id: string; label: string; value: string; category: string };

const CATEGORIES = [
  { id: 'website', label: 'Websites & Links', icon: Globe },
  { id: 'visual', label: 'Visual Identity', icon: Palette },
  { id: 'media', label: 'Media & Assets', icon: Image },
  { id: 'social', label: 'Social Profiles', icon: Link },
  { id: 'document', label: 'Documents & Files', icon: FileText },
  { id: 'other', label: 'Other Brand Items', icon: Star },
];

const DEFAULT_ITEMS: BrandItem[] = [
  { id: '1', label: 'Main Website', value: 'https://spiralingup.works', category: 'website' },
  { id: '2', label: 'Blog', value: 'https://spiralingup.works/blog', category: 'website' },
  { id: '3', label: 'LinkedIn', value: 'https://linkedin.com/in/christophemartinot', category: 'social' },
];

export default function BrandKitTab() {
  const [items, setItems] = useState<BrandItem[]>(DEFAULT_ITEMS);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', value: '', category: 'website' });

  const addItem = () => {
    if (!newItem.label.trim() || !newItem.value.trim()) return;
    setItems(prev => [...prev, { ...newItem, id: crypto.randomUUID() }]);
    setNewItem({ label: '', value: '', category: 'website' });
    setAdding(false);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your brand assets, links, icons, and identity elements — all fed into AI generation.
        </p>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Label (e.g. Logo SVG)"
                  value={newItem.label}
                  onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))}
                />
                <Input
                  placeholder="Value / URL"
                  value={newItem.value}
                  onChange={e => setNewItem(p => ({ ...p, value: e.target.value }))}
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newItem.category}
                  onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button size="sm" onClick={addItem}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(cat => {
          const catItems = items.filter(i => i.category === cat.id);
          if (catItems.length === 0) return null;
          const Icon = cat.icon;
          return (
            <Card key={cat.id} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No brand items yet. Click "Add Item" to get started.</p>
        </div>
      )}

      <Card className="shadow-card border-dashed">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground font-medium mb-2">Available Categories</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              return (
                <Badge key={c.id} variant="outline" className="gap-1.5 text-xs">
                  <Icon className="w-3 h-3" /> {c.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
