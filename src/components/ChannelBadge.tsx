import { ChannelType, CHANNEL_CONFIG } from '@/data/types';

export default function ChannelBadge({ channel, size = 'sm' }: { channel: ChannelType; size?: 'sm' | 'md' }) {
  const config = CHANNEL_CONFIG[channel];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-border bg-card font-medium ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
