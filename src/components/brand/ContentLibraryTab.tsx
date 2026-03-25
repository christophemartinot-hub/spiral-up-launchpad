import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useContentLibrary() {
  return useQuery({
    queryKey: ['brand-content-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_content_library')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function ContentLibraryTab() {
  const { data: entries, isLoading } = useContentLibrary();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Imported blog posts the AI studies to match your writing style and tone.
      </p>

      <div className="space-y-4">
        {(entries || []).map((entry: any) => {
          const isExpanded = expanded === entry.id;
          return (
            <Card key={entry.id} className="shadow-card overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4 p-4">
                  {entry.image_url && (
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="w-24 h-24 md:w-32 md:h-24 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {entry.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.category && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {entry.category}
                        </Badge>
                      )}
                      {entry.read_time && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {entry.read_time}
                        </span>
                      )}
                      {(entry.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Writing Style Notes expandable */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <BookOpen className="w-3 h-3" />
                    Writing Style Notes
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {isExpanded && entry.writing_style_notes && (
                  <div className="px-4 py-3 border-t bg-muted/10 text-xs text-muted-foreground whitespace-pre-wrap">
                    {entry.writing_style_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(entries || []).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No content library entries yet.</p>
        </div>
      )}
    </div>
  );
}
