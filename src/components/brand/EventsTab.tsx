import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Trash2, Save, X, Calendar } from 'lucide-react';
import { useEventsWorkshops, useUpsertEventWorkshop, useDeleteEventWorkshop } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

const EVENT_TYPES = ['workshop', 'assessment', 'program', 'keynote', 'conference', 'webinar'];
const STATUS_OPTIONS = ['upcoming', 'active', 'past', 'cancelled'];

export default function EventsTab() {
  const { data: events, isLoading } = useEventsWorkshops();
  const upsert = useUpsertEventWorkshop();
  const deleteEvent = useDeleteEventWorkshop();
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Events, workshops, and programs — used by AI for promotion and CTA generation.</p>
        <Button size="sm" onClick={() => setEditing({ event_name: '', event_type: 'workshop', description: '', status: 'upcoming', key_outcomes: [], target_audience: '', sort_order: (events?.length || 0) })} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Event
        </Button>
      </div>

      {editing && <EventEditor event={editing} onSave={(e) => {
        upsert.mutate(e, { onSuccess: () => { toast.success('Event saved'); setEditing(null); } });
      }} onCancel={() => setEditing(null)} isSaving={upsert.isPending} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(events || []).map((e: any) => (
          <Card key={e.id} className="shadow-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {e.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{e.event_type}</Badge>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(e)}><Save className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEvent.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <p className="font-display font-semibold text-sm">{e.event_name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
              {e.target_audience && <p className="text-xs text-muted-foreground mt-2">🎯 {e.target_audience}</p>}
              {(e.key_outcomes || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(e.key_outcomes as string[]).slice(0, 2).map((o: string) => <Badge key={o} variant="outline" className="text-[10px]">{o}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(events || []).length === 0 && !editing && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No events or workshops yet.</p>
        </div>
      )}
    </div>
  );
}

function EventEditor({ event, onSave, onCancel, isSaving }: { event: any; onSave: (e: any) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState(event);
  const [newOutcome, setNewOutcome] = useState('');

  const addOutcome = () => {
    if (!newOutcome.trim()) return;
    setForm((f: any) => ({ ...f, key_outcomes: [...(f.key_outcomes || []), newOutcome.trim()] }));
    setNewOutcome('');
  };

  const removeOutcome = (i: number) => {
    setForm((f: any) => ({ ...f, key_outcomes: (f.key_outcomes || []).filter((_: any, idx: number) => idx !== i) }));
  };

  return (
    <Card className="shadow-card border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Event Name</label>
            <Input value={form.event_name || ''} onChange={e => setForm((f: any) => ({ ...f, event_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={form.event_type} onValueChange={v => setForm((f: any) => ({ ...f, event_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea rows={3} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Audience</label>
            <Input value={form.target_audience || ''} onChange={e => setForm((f: any) => ({ ...f, target_audience: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
            <Input value={form.location || ''} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Key Outcomes</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.key_outcomes || []).map((o: string, i: number) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {o}
                <button onClick={() => removeOutcome(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add outcome..." value={newOutcome} onChange={e => setNewOutcome(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOutcome(); } }} />
            <Button variant="outline" size="sm" onClick={addOutcome}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(form)} disabled={isSaving}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}
