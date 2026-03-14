UPDATE editorial_items 
SET publish_date = (publish_date::date + interval '7 days')::date, 
    updated_at = now() 
WHERE publish_date >= '2026-03-09' AND publish_date <= '2026-03-15';