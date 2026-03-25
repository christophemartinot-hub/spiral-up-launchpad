

# Plan: Create `publish-to-make` Edge Function + DB Trigger + Manual Button

## Overview

A new edge function bridges editorial items to Make.com when their status changes to `scheduled`. A database trigger auto-fires it, and a manual "Send to Make" button acts as fallback.

## Steps

### 1. Create Edge Function `supabase/functions/publish-to-make/index.ts`
- Standard CORS + Deno.serve pattern (matching existing functions like `publish-social`)
- Accepts `{ item_id }`, fetches the editorial item, reads `MAKE_WEBHOOK_URL` from env
- Posts payload (id, channel, title, content, image, dates, pillar, cta, status) to Make webhook
- Logs dispatch to `audit_log`
- Returns success/error response

### 2. Add config entry in `supabase/config.toml`
```
[functions.publish-to-make]
verify_jwt = false
```

### 3. Add `MAKE_WEBHOOK_URL` secret
- Use the secrets tool to prompt user to add their Make webhook URL

### 4. Database migration: trigger on `editorial_items`
- Create function `notify_make_on_schedule()` using `net.http_post` (pg_net extension)
- Fires `AFTER UPDATE` when status changes to `'scheduled'`
- Calls the edge function with `{ item_id: NEW.id }`

### 5. Add "Send to Make" button in `EditorialItemCard.tsx`
- Add a new `handleSendToMake` async function similar to `handlePublishSocial`
- Uses `supabase.functions.invoke('publish-to-make', { body: { item_id: item.id } })`
- Button visible only when `item.status === 'scheduled'`, placed next to existing "Publish to Social" button
- Uses `Send` icon (already imported), shows loading state

### Technical Details

**Edge function payload to Make:**
```json
{
  "item_id": "...",
  "channel": "linkedin",
  "working_title": "...",
  "draft_content": "...",
  "image_url": "...",
  "publish_date": "2026-03-28",
  "publish_time": "09:00",
  "content_pillar": "...",
  "cta": "...",
  "status": "scheduled"
}
```

**Files created/modified:**
- `supabase/functions/publish-to-make/index.ts` (new)
- `supabase/config.toml` (add function block)
- `src/components/editorial/EditorialItemCard.tsx` (add button + handler)
- Database migration (trigger + function)

**No changes to:** existing edge functions, tables, RLS policies, auth, or design system.

