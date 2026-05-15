import { useState } from 'react';
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal } from 'lucide-react';

interface LinkedInPreviewProps {
  authorName?: string;
  authorTitle?: string;
  authorAvatarUrl?: string;
  content: string;
  imageUrl?: string;
}

const TRUNCATE_AT = 210;

export default function LinkedInPreview({
  authorName = 'Christophe Martinot',
  authorTitle = 'Founder · Spiral Up | Helping leaders build adaptive organizations',
  authorAvatarUrl,
  content,
  imageUrl,
}: LinkedInPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const text = (content || '').trim();
  const isLong = text.length > TRUNCATE_AT;
  const visible = expanded || !isLong ? text : text.slice(0, TRUNCATE_AT) + '…';

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-[#1b1f23] shadow-sm max-w-xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-start gap-2 p-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
          {authorAvatarUrl ? (
            <img src={authorAvatarUrl} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            authorName.split(' ').map(n => n[0]).slice(0, 2).join('')
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#000000e6] dark:text-white leading-tight truncate">
            {authorName}
          </p>
          <p className="text-xs text-[#00000099] dark:text-white/60 leading-tight truncate">
            {authorTitle}
          </p>
          <p className="text-xs text-[#00000099] dark:text-white/60 leading-tight flex items-center gap-1 mt-0.5">
            Now • <Globe className="w-3 h-3" />
          </p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-[#00000099] dark:text-white/60 flex-shrink-0" />
      </div>

      {/* Body text */}
      <div className="px-3 pb-2">
        <p className="text-sm text-[#000000e6] dark:text-white whitespace-pre-wrap leading-snug">
          {visible}
          {isLong && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[#00000099] dark:text-white/60 hover:text-[#0a66c2] ml-1"
            >
              …see more
            </button>
          )}
        </p>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="bg-[#f3f2ef] dark:bg-black/20">
          <img
            src={imageUrl}
            alt=""
            className="w-full max-h-[520px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Reactions stub */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs text-[#00000099] dark:text-white/60 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-[#0a66c2] flex items-center justify-center text-white text-[8px]">👍</span>
            <span className="w-4 h-4 rounded-full bg-[#df704d] flex items-center justify-center text-white text-[8px]">❤️</span>
            <span className="w-4 h-4 rounded-full bg-[#6dae4f] flex items-center justify-center text-white text-[8px]">💡</span>
          </span>
          <span>—</span>
        </div>
        <span>— comments</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 px-1 py-1">
        {[
          { icon: ThumbsUp, label: 'Like' },
          { icon: MessageSquare, label: 'Comment' },
          { icon: Repeat2, label: 'Repost' },
          { icon: Send, label: 'Send' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold text-[#00000099] dark:text-white/60 hover:bg-[#0000000d] dark:hover:bg-white/5"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
