import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, Upload, Globe, Palette, Image as ImageIcon, FileText, Star, Link as LinkIcon } from 'lucide-react';
import { useBrandAssets, useUpsertBrandAsset, useDeleteBrandAsset } from '@/hooks/use-brand-data';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'logo', label: 'Logos', icon: Star },
  { id: 'icon', label: 'Icons', icon: Globe },
  { id: 'color', label: 'Brand Colors', icon: Palette },
  { id: 'font', label: 'Fonts', icon: FileText },
  { id: 'template', label: 'Templates', icon: FileText },
  { id: 'social_template', label: 'Social Templates', icon: LinkIcon },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'illustration', label: 'Illustrations', icon: ImageIcon },
  { id: 'other', label: 'Other', icon: Star },
];

export default function BrandKitTab() {
  const { data: assets, isLoading } = useBrandAssets();
  const upsert = useUpsertBrandAsset();
  const deleteAsset = useDeleteBrandAsset();
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'logo', description: '', usage_guidelines: '', file_url: '', file_type: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('brand-assets').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path);
    setForm(f => ({ ...f, file_url: publicUrl, file_type: file.type, name: f.name || file.name }));
    setUploading(false);
    toast.success('File uploaded');
  };

  const save = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    upsert.mutate(form, { onSuccess: () => { toast.success('Asset saved'); setAdding(false); setForm({ name: '', category: 'logo', description: '', usage_guidelines: '', file_url: '', file_type: '' }); } });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Visual brand elements — logos, colors, fonts, templates, and more.</p>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Asset</Button>
      </div>

      {adding && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Primary Logo" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Usage Guidelines</label>
              <Textarea rows={2} value={form.usage_guidelines} onChange={e => setForm(f => ({ ...f, usage_guidelines: e.target.value }))} placeholder="When and how to use this asset..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">File</label>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
                {form.file_url && <span className="text-xs text-muted-foreground truncate max-w-xs">✓ File uploaded</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={upsert.isPending}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(cat => {
          const catAssets = (assets || []).filter((a: any) => a.category === cat.id);
          if (catAssets.length === 0) return null;
          const Icon = cat.icon;
          return (
            <Card key={cat.id} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" /> {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {catAssets.map((a: any) => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/50 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.name}</p>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                        {a.file_url && a.file_type?.startsWith('image/') && (
                          <img src={a.file_url} alt={a.name} className="mt-2 rounded max-h-20 object-contain" />
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteAsset.mutate(a.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(assets || []).length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No brand assets yet. Click "Add Asset" to get started.</p>
        </div>
      )}
    </div>
  );
}
