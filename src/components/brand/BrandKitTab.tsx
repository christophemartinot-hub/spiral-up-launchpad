import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, Upload, Globe, Palette, Image as ImageIcon, FileText, Star, Link as LinkIcon, ShieldCheck, ShieldAlert } from 'lucide-react';
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

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: '✅' },
  { value: 'draft', label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: '📝' },
  { value: 'placeholder', label: 'Placeholder', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: '🔲' },
  { value: 'archived', label: 'Archived', color: 'bg-muted text-muted-foreground', icon: '📦' },
];

function getStatusConfig(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

export default function BrandKitTab() {
  const { data: assets, isLoading } = useBrandAssets();
  const upsert = useUpsertBrandAsset();
  const deleteAsset = useDeleteBrandAsset();
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'logo', description: '', usage_guidelines: '', file_url: '', file_type: '', asset_status: 'approved' });
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
    upsert.mutate(form, { onSuccess: () => { toast.success('Asset saved'); setAdding(false); setForm({ name: '', category: 'logo', description: '', usage_guidelines: '', file_url: '', file_type: '', asset_status: 'approved' }); } });
  };

  const handleStatusChange = (assetId: string, newStatus: string) => {
    upsert.mutate({ id: assetId, asset_status: newStatus } as any, {
      onSuccess: () => toast.success(`Asset status updated to ${newStatus}`),
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const approvedCount = (assets || []).filter((a: any) => (a as any).asset_status === 'approved').length;
  const totalCount = (assets || []).length;

  return (
    <div className="space-y-6">
      {/* Governance header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Visual brand elements — logos, colors, fonts, templates, and more.</p>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-muted-foreground">
              <strong className="text-foreground">{approvedCount}</strong> of {totalCount} assets approved for AI use
            </span>
          </div>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Asset</Button>
      </div>

      {/* Governance info banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Brand Asset Governance:</strong> Only assets marked <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] mx-0.5 px-1.5 py-0">Approved</Badge> will be used by the AI engine.
          Draft, Placeholder, and Archived assets are excluded from all AI-generated content, visuals, and recommendations.
        </div>
      </div>

      {adding && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.asset_status} onChange={e => setForm(f => ({ ...f, asset_status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
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
                {catAssets.map((a: any) => {
                  const statusConf = getStatusConfig((a as any).asset_status || 'approved');
                  return (
                    <div key={a.id} className={`p-3 rounded-lg group ${(a as any).asset_status === 'archived' ? 'bg-muted/30 opacity-60' : 'bg-muted/50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{a.name}</p>
                            <select
                              value={(a as any).asset_status || 'approved'}
                              onChange={e => handleStatusChange(a.id, e.target.value)}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${statusConf.color}`}
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                              ))}
                            </select>
                          </div>
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
                  );
                })}
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
