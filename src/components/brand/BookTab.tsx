import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, Plus, BookOpen, Star, Newspaper, Users } from 'lucide-react';
import { useBookInfo, useUpdateBookInfo } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function BookTab() {
  const { data: book, isLoading } = useBookInfo();
  const update = useUpdateBookInfo();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!book) return (
    <div className="text-center py-12 text-muted-foreground">
      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No book data yet.</p>
    </div>
  );

  const startEditing = () => { setForm({ ...book }); setEditing(true); };
  const save = () => {
    const { id, created_at, updated_at, ...updates } = form;
    update.mutate(updates, { onSuccess: () => { toast.success('Book info saved'); setEditing(false); } });
  };

  const contributors = (book.expert_contributors as any[]) || [];
  const endorsements = (book.endorsements as any[]) || [];
  const press = (book.press_mentions as any[]) || [];
  const seenWith = (book.seen_with_book as any[]) || [];
  const discoveries = (book.key_discoveries as string[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">The Spiral Up book — referenced in AI content for promotion and thought leadership.</p>
        <Button size="sm" variant={editing ? 'default' : 'outline'} onClick={editing ? save : startEditing} disabled={update.isPending} className="gap-1.5">
          <Save className="w-3.5 h-3.5" /> {editing ? 'Save' : 'Edit'}
        </Button>
      </div>

      {/* Hero */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
          {book.cover_image_url && (
            <img src={book.cover_image_url} alt="Book cover" className="w-32 h-auto rounded-lg shadow-md object-contain self-start" />
          )}
          <div className="flex-1 space-y-3">
            {editing ? (
              <>
                <Input value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="Title" className="font-display font-bold text-lg" />
                <Input value={form.subtitle || ''} onChange={e => setForm((f: any) => ({ ...f, subtitle: e.target.value }))} placeholder="Subtitle" />
                <Input value={form.author || ''} onChange={e => setForm((f: any) => ({ ...f, author: e.target.value }))} placeholder="Author" />
                <Textarea rows={4} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Description" />
                <Input value={form.cover_image_url || ''} onChange={e => setForm((f: any) => ({ ...f, cover_image_url: e.target.value }))} placeholder="Cover image URL" />
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-xl">{book.title}</h2>
                {book.subtitle && <p className="text-sm text-muted-foreground italic">{book.subtitle}</p>}
                <p className="text-xs text-muted-foreground">By {book.author}</p>
                <p className="text-sm leading-relaxed">{book.description}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Discoveries */}
      {discoveries.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> What readers discover</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {discoveries.map((d, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm">{d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expert Contributors */}
      {contributors.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Expert Contributors</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contributors.map((c: any, i: number) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-full object-cover" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <Badge variant="outline" className="text-[10px]">{c.principle}</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Endorsements */}
      {endorsements.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> Endorsements</h3>
          <div className="space-y-3">
            {endorsements.map((e: any, i: number) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4">
                  <blockquote className="text-sm italic border-l-2 border-primary/30 pl-3">"{e.quote}"</blockquote>
                  <p className="text-xs text-muted-foreground mt-2">— {e.author}{e.org ? `, ${e.org}` : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Press Mentions */}
      {press.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Newspaper className="w-4 h-4" /> Press & Media</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {press.map((p: any, i: number) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.publication} • {p.year}</p>
                  <p className="text-xs mt-1">{p.description}</p>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">Read more →</a>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Seen with the book */}
      {seenWith.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Seen with the book</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {seenWith.map((s: any, i: number) => (
              <div key={i} className="text-center">
                {s.image_url && <img src={s.image_url} alt={s.name} className="w-full aspect-square rounded-lg object-cover shadow-sm" />}
                <p className="text-xs font-medium mt-1 truncate">{s.name}</p>
                {s.company && <p className="text-[10px] text-muted-foreground truncate">{s.company}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={update.isPending}>Save Changes</Button>
        </div>
      )}
    </div>
  );
}
