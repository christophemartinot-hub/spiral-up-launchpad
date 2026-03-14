export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          content: string
          content_pillar: string | null
          created_at: string
          editorial_item_id: string | null
          excerpt: string
          external_id: string | null
          hero_image_url: string | null
          id: string
          linkedin_version: string | null
          meta_description: string | null
          newsletter_version: string | null
          published_at: string | null
          seo_keywords: Json | null
          slug: string
          social_snippets: Json | null
          status: string
          tags: Json | null
          title: string
          updated_at: string
          visual_concept: string | null
          visual_rationale: string | null
          visual_type: string | null
        }
        Insert: {
          author?: string
          content?: string
          content_pillar?: string | null
          created_at?: string
          editorial_item_id?: string | null
          excerpt?: string
          external_id?: string | null
          hero_image_url?: string | null
          id?: string
          linkedin_version?: string | null
          meta_description?: string | null
          newsletter_version?: string | null
          published_at?: string | null
          seo_keywords?: Json | null
          slug?: string
          social_snippets?: Json | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          visual_concept?: string | null
          visual_rationale?: string | null
          visual_type?: string | null
        }
        Update: {
          author?: string
          content?: string
          content_pillar?: string | null
          created_at?: string
          editorial_item_id?: string | null
          excerpt?: string
          external_id?: string | null
          hero_image_url?: string | null
          id?: string
          linkedin_version?: string | null
          meta_description?: string | null
          newsletter_version?: string | null
          published_at?: string | null
          seo_keywords?: Json | null
          slug?: string
          social_snippets?: Json | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          visual_concept?: string | null
          visual_rationale?: string | null
          visual_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_editorial_item_id_fkey"
            columns: ["editorial_item_id"]
            isOneToOne: false
            referencedRelation: "editorial_items"
            referencedColumns: ["id"]
          },
        ]
      }
      book_chapters: {
        Row: {
          chapter_number: number
          chapter_title: string
          content: string
          created_at: string
          id: string
          key_concepts: Json | null
          quotes: Json | null
          related_principles: Json | null
          sort_order: number
          updated_at: string
          word_count: number | null
        }
        Insert: {
          chapter_number?: number
          chapter_title?: string
          content?: string
          created_at?: string
          id?: string
          key_concepts?: Json | null
          quotes?: Json | null
          related_principles?: Json | null
          sort_order?: number
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          chapter_number?: number
          chapter_title?: string
          content?: string
          created_at?: string
          id?: string
          key_concepts?: Json | null
          quotes?: Json | null
          related_principles?: Json | null
          sort_order?: number
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      book_info: {
        Row: {
          author: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          endorsements: Json | null
          expert_contributors: Json | null
          id: string
          key_discoveries: Json | null
          press_mentions: Json | null
          purchase_links: Json | null
          seen_with_book: Json | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          endorsements?: Json | null
          expert_contributors?: Json | null
          id?: string
          key_discoveries?: Json | null
          press_mentions?: Json | null
          purchase_links?: Json | null
          seen_with_book?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          endorsements?: Json | null
          expert_contributors?: Json | null
          id?: string
          key_discoveries?: Json | null
          press_mentions?: Json | null
          purchase_links?: Json | null
          seen_with_book?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          asset_status: string
          category: string
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string
          usage_guidelines: string | null
        }
        Insert: {
          asset_status?: string
          category?: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
          usage_guidelines?: string | null
        }
        Update: {
          asset_status?: string
          category?: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
          usage_guidelines?: string | null
        }
        Relationships: []
      }
      brand_content_pillars: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          example_posts: Json | null
          id: string
          keywords: Json | null
          sort_order: number
          target_audience: string | null
          title: string
          typical_topics: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          example_posts?: Json | null
          id?: string
          keywords?: Json | null
          sort_order?: number
          target_audience?: string | null
          title?: string
          typical_topics?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          example_posts?: Json | null
          id?: string
          keywords?: Json | null
          sort_order?: number
          target_audience?: string | null
          title?: string
          typical_topics?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      brand_core: {
        Row: {
          brand_name: string
          company: string | null
          created_at: string
          founder: string | null
          id: string
          key_beliefs: Json | null
          long_description: string | null
          mission: string | null
          short_description: string | null
          tagline: string | null
          updated_at: string
          vision: string | null
          website: string | null
        }
        Insert: {
          brand_name?: string
          company?: string | null
          created_at?: string
          founder?: string | null
          id?: string
          key_beliefs?: Json | null
          long_description?: string | null
          mission?: string | null
          short_description?: string | null
          tagline?: string | null
          updated_at?: string
          vision?: string | null
          website?: string | null
        }
        Update: {
          brand_name?: string
          company?: string | null
          created_at?: string
          founder?: string | null
          id?: string
          key_beliefs?: Json | null
          long_description?: string | null
          mission?: string | null
          short_description?: string | null
          tagline?: string | null
          updated_at?: string
          vision?: string | null
          website?: string | null
        }
        Relationships: []
      }
      comment_inbox: {
        Row: {
          author_avatar_url: string | null
          author_handle: string | null
          author_name: string
          channel: string
          comment_date: string
          comment_text: string
          comment_type: string
          created_at: string
          editorial_item_id: string | null
          external_comment_id: string | null
          id: string
          is_sensitive: boolean
          metadata: Json | null
          parent_comment_id: string | null
          post_reference: string | null
          post_title: string | null
          priority: string
          requires_human_review: boolean
          requires_reply: boolean
          risk_flags: Json | null
          sentiment: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name?: string
          channel?: string
          comment_date?: string
          comment_text?: string
          comment_type?: string
          created_at?: string
          editorial_item_id?: string | null
          external_comment_id?: string | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json | null
          parent_comment_id?: string | null
          post_reference?: string | null
          post_title?: string | null
          priority?: string
          requires_human_review?: boolean
          requires_reply?: boolean
          risk_flags?: Json | null
          sentiment?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name?: string
          channel?: string
          comment_date?: string
          comment_text?: string
          comment_type?: string
          created_at?: string
          editorial_item_id?: string | null
          external_comment_id?: string | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json | null
          parent_comment_id?: string | null
          post_reference?: string | null
          post_title?: string | null
          priority?: string
          requires_human_review?: boolean
          requires_reply?: boolean
          risk_flags?: Json | null
          sentiment?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_inbox_editorial_item_id_fkey"
            columns: ["editorial_item_id"]
            isOneToOne: false
            referencedRelation: "editorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_inbox_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comment_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_replies: {
        Row: {
          approved_text: string | null
          comment_id: string
          created_at: string
          engagement_result: Json | null
          external_reply_id: string | null
          id: string
          reply_text: string
          reply_type: string
          sent_at: string | null
          status: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          approved_text?: string | null
          comment_id: string
          created_at?: string
          engagement_result?: Json | null
          external_reply_id?: string | null
          id?: string
          reply_text?: string
          reply_type?: string
          sent_at?: string | null
          status?: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          approved_text?: string | null
          comment_id?: string
          created_at?: string
          engagement_result?: Json | null
          external_reply_id?: string | null
          id?: string
          reply_text?: string
          reply_type?: string
          sent_at?: string | null
          status?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comment_inbox"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reply_feedback: {
        Row: {
          action_type: string
          comment_id: string
          created_at: string
          final_text: string | null
          id: string
          length_preference: string | null
          original_text: string | null
          reason: string | null
          reply_id: string | null
          text_was_edited: boolean | null
          tone_preference: string | null
        }
        Insert: {
          action_type?: string
          comment_id: string
          created_at?: string
          final_text?: string | null
          id?: string
          length_preference?: string | null
          original_text?: string | null
          reason?: string | null
          reply_id?: string | null
          text_was_edited?: boolean | null
          tone_preference?: string | null
        }
        Update: {
          action_type?: string
          comment_id?: string
          created_at?: string
          final_text?: string | null
          id?: string
          length_preference?: string | null
          original_text?: string | null
          reason?: string | null
          reply_id?: string | null
          text_was_edited?: boolean | null
          tone_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_reply_feedback_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comment_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reply_feedback_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "comment_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          asset_used: string | null
          audience_segment: string | null
          blog_clickthroughs: number | null
          channel: string
          click_rate: number | null
          clicks: number | null
          comments: number | null
          content_format: string
          content_pillar: string | null
          conversions: number | null
          created_at: string
          cta: string | null
          editorial_item_id: string | null
          engagement: number | null
          engagement_rate: number | null
          event_signups: number | null
          follower_growth: number | null
          id: string
          impressions: number | null
          meaningful_comments: number | null
          newsletter_signups: number | null
          notes: string | null
          opens: number | null
          profile_visits: number | null
          publish_date: string | null
          reach: number | null
          saves: number | null
          shares: number | null
          topic: string | null
          unsubscribe_rate: number | null
          updated_at: string
          visual_type: string | null
        }
        Insert: {
          asset_used?: string | null
          audience_segment?: string | null
          blog_clickthroughs?: number | null
          channel?: string
          click_rate?: number | null
          clicks?: number | null
          comments?: number | null
          content_format?: string
          content_pillar?: string | null
          conversions?: number | null
          created_at?: string
          cta?: string | null
          editorial_item_id?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          event_signups?: number | null
          follower_growth?: number | null
          id?: string
          impressions?: number | null
          meaningful_comments?: number | null
          newsletter_signups?: number | null
          notes?: string | null
          opens?: number | null
          profile_visits?: number | null
          publish_date?: string | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          topic?: string | null
          unsubscribe_rate?: number | null
          updated_at?: string
          visual_type?: string | null
        }
        Update: {
          asset_used?: string | null
          audience_segment?: string | null
          blog_clickthroughs?: number | null
          channel?: string
          click_rate?: number | null
          clicks?: number | null
          comments?: number | null
          content_format?: string
          content_pillar?: string | null
          conversions?: number | null
          created_at?: string
          cta?: string | null
          editorial_item_id?: string | null
          engagement?: number | null
          engagement_rate?: number | null
          event_signups?: number | null
          follower_growth?: number | null
          id?: string
          impressions?: number | null
          meaningful_comments?: number | null
          newsletter_signups?: number | null
          notes?: string | null
          opens?: number | null
          profile_visits?: number | null
          publish_date?: string | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          topic?: string | null
          unsubscribe_rate?: number | null
          updated_at?: string
          visual_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_editorial_item_id_fkey"
            columns: ["editorial_item_id"]
            isOneToOne: false
            referencedRelation: "editorial_items"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_feedback: {
        Row: {
          action_type: string
          channel: string | null
          content_changed: boolean | null
          content_format: string | null
          created_at: string
          cta_changed: boolean | null
          editorial_item_id: string
          final_content: string | null
          final_content_pillar: string | null
          final_cta: string | null
          final_title: string | null
          final_visual_type: string | null
          id: string
          original_content: string | null
          original_content_pillar: string | null
          original_cta: string | null
          original_title: string | null
          original_topic: string | null
          original_visual_type: string | null
          pillar_changed: boolean | null
          plan_id: string | null
          rejection_reason: string | null
          title_changed: boolean | null
          tone_adjusted: boolean | null
          visual_changed: boolean | null
        }
        Insert: {
          action_type?: string
          channel?: string | null
          content_changed?: boolean | null
          content_format?: string | null
          created_at?: string
          cta_changed?: boolean | null
          editorial_item_id: string
          final_content?: string | null
          final_content_pillar?: string | null
          final_cta?: string | null
          final_title?: string | null
          final_visual_type?: string | null
          id?: string
          original_content?: string | null
          original_content_pillar?: string | null
          original_cta?: string | null
          original_title?: string | null
          original_topic?: string | null
          original_visual_type?: string | null
          pillar_changed?: boolean | null
          plan_id?: string | null
          rejection_reason?: string | null
          title_changed?: boolean | null
          tone_adjusted?: boolean | null
          visual_changed?: boolean | null
        }
        Update: {
          action_type?: string
          channel?: string | null
          content_changed?: boolean | null
          content_format?: string | null
          created_at?: string
          cta_changed?: boolean | null
          editorial_item_id?: string
          final_content?: string | null
          final_content_pillar?: string | null
          final_cta?: string | null
          final_title?: string | null
          final_visual_type?: string | null
          id?: string
          original_content?: string | null
          original_content_pillar?: string | null
          original_cta?: string | null
          original_title?: string | null
          original_topic?: string | null
          original_visual_type?: string | null
          pillar_changed?: boolean | null
          plan_id?: string | null
          rejection_reason?: string | null
          title_changed?: boolean | null
          tone_adjusted?: boolean | null
          visual_changed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_feedback_editorial_item_id_fkey"
            columns: ["editorial_item_id"]
            isOneToOne: false
            referencedRelation: "editorial_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_feedback_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "editorial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_items: {
        Row: {
          audience_challenge: string
          backup_visual_concept: string | null
          backup_visual_type: string | null
          brand_alignment: string | null
          carousel_idea: string | null
          channel: string
          content_format: string
          content_pillar: string | null
          created_at: string
          cta: string | null
          cta_placement: string | null
          draft_content: string | null
          expected_audience_action: string
          format_ratio: string | null
          id: string
          image_direction: string | null
          insight_delivered: string
          key_message: string | null
          objective: string | null
          outcome_score: number
          plan_id: string
          post_angle: string | null
          practical_takeaway: string
          publish_date: string
          recommended_assets: Json | null
          rejection_reason: string | null
          related_offer: string | null
          sort_order: number
          status: string
          suggested_cta: string | null
          suggestion_rationale: string | null
          updated_at: string
          visual_concept: string | null
          visual_headline: string | null
          visual_layout: string | null
          visual_notes: string | null
          visual_rationale: string | null
          visual_status: string
          visual_subheadline: string | null
          visual_type: string
          working_title: string
        }
        Insert: {
          audience_challenge?: string
          backup_visual_concept?: string | null
          backup_visual_type?: string | null
          brand_alignment?: string | null
          carousel_idea?: string | null
          channel?: string
          content_format?: string
          content_pillar?: string | null
          created_at?: string
          cta?: string | null
          cta_placement?: string | null
          draft_content?: string | null
          expected_audience_action?: string
          format_ratio?: string | null
          id?: string
          image_direction?: string | null
          insight_delivered?: string
          key_message?: string | null
          objective?: string | null
          outcome_score?: number
          plan_id: string
          post_angle?: string | null
          practical_takeaway?: string
          publish_date: string
          recommended_assets?: Json | null
          rejection_reason?: string | null
          related_offer?: string | null
          sort_order?: number
          status?: string
          suggested_cta?: string | null
          suggestion_rationale?: string | null
          updated_at?: string
          visual_concept?: string | null
          visual_headline?: string | null
          visual_layout?: string | null
          visual_notes?: string | null
          visual_rationale?: string | null
          visual_status?: string
          visual_subheadline?: string | null
          visual_type?: string
          working_title?: string
        }
        Update: {
          audience_challenge?: string
          backup_visual_concept?: string | null
          backup_visual_type?: string | null
          brand_alignment?: string | null
          carousel_idea?: string | null
          channel?: string
          content_format?: string
          content_pillar?: string | null
          created_at?: string
          cta?: string | null
          cta_placement?: string | null
          draft_content?: string | null
          expected_audience_action?: string
          format_ratio?: string | null
          id?: string
          image_direction?: string | null
          insight_delivered?: string
          key_message?: string | null
          objective?: string | null
          outcome_score?: number
          plan_id?: string
          post_angle?: string | null
          practical_takeaway?: string
          publish_date?: string
          recommended_assets?: Json | null
          rejection_reason?: string | null
          related_offer?: string | null
          sort_order?: number
          status?: string
          suggested_cta?: string | null
          suggestion_rationale?: string | null
          updated_at?: string
          visual_concept?: string | null
          visual_headline?: string | null
          visual_layout?: string | null
          visual_notes?: string | null
          visual_rationale?: string | null
          visual_status?: string
          visual_subheadline?: string | null
          visual_type?: string
          working_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "editorial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_plans: {
        Row: {
          cadence: string
          created_at: string
          cycle_end: string
          cycle_start: string
          generated_at: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          cycle_end: string
          cycle_start: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          blog_summary: string | null
          click_rate: number | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          editorial_item_id: string | null
          header_image_url: string | null
          id: string
          intro_text: string | null
          open_rate: number | null
          plain_text_fallback: string | null
          preview_text: string | null
          recipient_count: number | null
          recipient_segment: string | null
          scheduled_send_date: string | null
          sent_at: string | null
          status: string
          subject_line: string
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          unsubscribe_rate: number | null
          updated_at: string
          visual_recommendation: string | null
        }
        Insert: {
          blog_summary?: string | null
          click_rate?: number | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          editorial_item_id?: string | null
          header_image_url?: string | null
          id?: string
          intro_text?: string | null
          open_rate?: number | null
          plain_text_fallback?: string | null
          preview_text?: string | null
          recipient_count?: number | null
          recipient_segment?: string | null
          scheduled_send_date?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string
          visual_recommendation?: string | null
        }
        Update: {
          blog_summary?: string | null
          click_rate?: number | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          editorial_item_id?: string | null
          header_image_url?: string | null
          id?: string
          intro_text?: string | null
          open_rate?: number | null
          plain_text_fallback?: string | null
          preview_text?: string | null
          recipient_count?: number | null
          recipient_segment?: string | null
          scheduled_send_date?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string
          visual_recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_editorial_item_id_fkey"
            columns: ["editorial_item_id"]
            isOneToOne: false
            referencedRelation: "editorial_items"
            referencedColumns: ["id"]
          },
        ]
      }
      events_workshops: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          end_date: string | null
          event_name: string
          event_type: string
          id: string
          image_url: string | null
          key_outcomes: Json | null
          location: string | null
          sort_order: number
          status: string
          target_audience: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          event_name?: string
          event_type?: string
          id?: string
          image_url?: string | null
          key_outcomes?: Json | null
          location?: string | null
          sort_order?: number
          status?: string
          target_audience?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          end_date?: string | null
          event_name?: string
          event_type?: string
          id?: string
          image_url?: string | null
          key_outcomes?: Json | null
          location?: string | null
          sort_order?: number
          status?: string
          target_audience?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      example_content: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          id: string
          related_pillar: string | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          related_pillar?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          related_pillar?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "example_content_related_pillar_fkey"
            columns: ["related_pillar"]
            isOneToOne: false
            referencedRelation: "brand_content_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profile: {
        Row: {
          certifications: Json | null
          created_at: string
          expertise_areas: Json | null
          id: string
          long_bio: string | null
          past_companies: Json | null
          personal_tone_guidelines: string | null
          short_bio: string | null
          speaking_topics: Json | null
          updated_at: string
        }
        Insert: {
          certifications?: Json | null
          created_at?: string
          expertise_areas?: Json | null
          id?: string
          long_bio?: string | null
          past_companies?: Json | null
          personal_tone_guidelines?: string | null
          short_bio?: string | null
          speaking_topics?: Json | null
          updated_at?: string
        }
        Update: {
          certifications?: Json | null
          created_at?: string
          expertise_areas?: Json | null
          id?: string
          long_bio?: string | null
          past_companies?: Json | null
          personal_tone_guidelines?: string | null
          short_bio?: string | null
          speaking_topics?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_memory: {
        Row: {
          action_outcome: string | null
          channel: string | null
          content_format: string | null
          content_pillar: string | null
          created_at: string
          cta: string | null
          cycle_id: string | null
          id: string
          memory_type: string
          metadata: Json | null
          notes: string | null
          performance_score: number | null
          topic: string
          visual_type: string | null
        }
        Insert: {
          action_outcome?: string | null
          channel?: string | null
          content_format?: string | null
          content_pillar?: string | null
          created_at?: string
          cta?: string | null
          cycle_id?: string | null
          id?: string
          memory_type?: string
          metadata?: Json | null
          notes?: string | null
          performance_score?: number | null
          topic?: string
          visual_type?: string | null
        }
        Update: {
          action_outcome?: string | null
          channel?: string | null
          content_format?: string | null
          content_pillar?: string | null
          created_at?: string
          cta?: string | null
          cycle_id?: string | null
          id?: string
          memory_type?: string
          metadata?: Json | null
          notes?: string | null
          performance_score?: number | null
          topic?: string
          visual_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_memory_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "editorial_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string
          cta_examples: Json | null
          description: string | null
          icon: string | null
          id: string
          key_outcomes: Json | null
          offer_name: string
          sort_order: number
          target_clients: string | null
          updated_at: string
          use_cases: Json | null
        }
        Insert: {
          created_at?: string
          cta_examples?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          key_outcomes?: Json | null
          offer_name?: string
          sort_order?: number
          target_clients?: string | null
          updated_at?: string
          use_cases?: Json | null
        }
        Update: {
          created_at?: string
          cta_examples?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          key_outcomes?: Json | null
          offer_name?: string
          sort_order?: number
          target_clients?: string | null
          updated_at?: string
          use_cases?: Json | null
        }
        Relationships: []
      }
      performance_config: {
        Row: {
          blog_success_signals: Json
          conversion_weight: number
          created_at: string
          deprioritized_types: Json
          email_success_signals: Json
          engagement_weight: number
          favored_patterns: Json
          id: string
          primary_metrics: Json
          repetition_limit: number
          social_success_signals: Json
          strategic_weight: number
          updated_at: string
        }
        Insert: {
          blog_success_signals?: Json
          conversion_weight?: number
          created_at?: string
          deprioritized_types?: Json
          email_success_signals?: Json
          engagement_weight?: number
          favored_patterns?: Json
          id?: string
          primary_metrics?: Json
          repetition_limit?: number
          social_success_signals?: Json
          strategic_weight?: number
          updated_at?: string
        }
        Update: {
          blog_success_signals?: Json
          conversion_weight?: number
          created_at?: string
          deprioritized_types?: Json
          email_success_signals?: Json
          engagement_weight?: number
          favored_patterns?: Json
          id?: string
          primary_metrics?: Json
          repetition_limit?: number
          social_success_signals?: Json
          strategic_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      planning_config: {
        Row: {
          auto_publish: boolean
          cadence: string
          campaign_focus: string | null
          channels: Json
          created_at: string
          cta_preferences: Json | null
          exclusion_rules: Json | null
          id: string
          intelligence_mode: string
          posts_per_cycle: number
          preferred_formats: Json | null
          priority_topics: Json | null
          strategic_balance: Json | null
          target_audience: string | null
          topic_cooldown_cycles: number
          updated_at: string
        }
        Insert: {
          auto_publish?: boolean
          cadence?: string
          campaign_focus?: string | null
          channels?: Json
          created_at?: string
          cta_preferences?: Json | null
          exclusion_rules?: Json | null
          id?: string
          intelligence_mode?: string
          posts_per_cycle?: number
          preferred_formats?: Json | null
          priority_topics?: Json | null
          strategic_balance?: Json | null
          target_audience?: string | null
          topic_cooldown_cycles?: number
          updated_at?: string
        }
        Update: {
          auto_publish?: boolean
          cadence?: string
          campaign_focus?: string | null
          channels?: Json
          created_at?: string
          cta_preferences?: Json | null
          exclusion_rules?: Json | null
          id?: string
          intelligence_mode?: string
          posts_per_cycle?: number
          preferred_formats?: Json | null
          priority_topics?: Json | null
          strategic_balance?: Json | null
          target_audience?: string | null
          topic_cooldown_cycles?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string | null
          account_name: string
          channel: string
          connected: boolean
          created_at: string
          followers: number | null
          id: string
          last_sync: string | null
          profile_url: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          account_name?: string
          channel: string
          connected?: boolean
          created_at?: string
          followers?: number | null
          id?: string
          last_sync?: string | null
          profile_url?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          account_name?: string
          channel?: string
          connected?: boolean
          created_at?: string
          followers?: number | null
          id?: string
          last_sync?: string | null
          profile_url?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      spiral_principles: {
        Row: {
          created_at: string
          id: string
          key_questions: Json | null
          letter: string
          long_explanation: string | null
          practical_examples: Json | null
          principle_name: string
          quotes: Json | null
          short_description: string | null
          sort_order: number
          updated_at: string
          visual_icon: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_questions?: Json | null
          letter: string
          long_explanation?: string | null
          practical_examples?: Json | null
          principle_name?: string
          quotes?: Json | null
          short_description?: string | null
          sort_order?: number
          updated_at?: string
          visual_icon?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_questions?: Json | null
          letter?: string
          long_explanation?: string | null
          practical_examples?: Json | null
          principle_name?: string
          quotes?: Json | null
          short_description?: string | null
          sort_order?: number
          updated_at?: string
          visual_icon?: string | null
        }
        Relationships: []
      }
      strategic_cycles: {
        Row: {
          created_at: string
          cycle_end: string
          cycle_start: string
          generated_at: string | null
          id: string
          notes: string | null
          recommended_focus: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_end: string
          cycle_start: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          recommended_focus?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          generated_at?: string | null
          id?: string
          notes?: string | null
          recommended_focus?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategic_ideas: {
        Row: {
          audience_value_score: number
          brand_relevance_score: number
          business_relevance: string | null
          content_potential: string | null
          converted_item_id: string | null
          converted_to: string | null
          created_at: string
          cycle_id: string
          description: string
          diversity_score: number
          follower_growth_potential: string | null
          growth_potential_score: number
          id: string
          idea_type: string
          intended_outcome: string | null
          offer_relevance_score: number
          outcome_potential_score: number
          overall_rank: number
          performance_learning_score: number
          pinned: boolean
          rejection_reason: string | null
          related_offer: string | null
          related_pillar: string | null
          sort_order: number
          status: string
          tension_statement: string | null
          title: string
          updated_at: string
          who_affected: string | null
          why_fits_spiral_up: string | null
          why_matters_now: string | null
          why_now: string | null
          why_relevant_to_audience: string | null
          why_supports_growth: string | null
        }
        Insert: {
          audience_value_score?: number
          brand_relevance_score?: number
          business_relevance?: string | null
          content_potential?: string | null
          converted_item_id?: string | null
          converted_to?: string | null
          created_at?: string
          cycle_id: string
          description?: string
          diversity_score?: number
          follower_growth_potential?: string | null
          growth_potential_score?: number
          id?: string
          idea_type?: string
          intended_outcome?: string | null
          offer_relevance_score?: number
          outcome_potential_score?: number
          overall_rank?: number
          performance_learning_score?: number
          pinned?: boolean
          rejection_reason?: string | null
          related_offer?: string | null
          related_pillar?: string | null
          sort_order?: number
          status?: string
          tension_statement?: string | null
          title?: string
          updated_at?: string
          who_affected?: string | null
          why_fits_spiral_up?: string | null
          why_matters_now?: string | null
          why_now?: string | null
          why_relevant_to_audience?: string | null
          why_supports_growth?: string | null
        }
        Update: {
          audience_value_score?: number
          brand_relevance_score?: number
          business_relevance?: string | null
          content_potential?: string | null
          converted_item_id?: string | null
          converted_to?: string | null
          created_at?: string
          cycle_id?: string
          description?: string
          diversity_score?: number
          follower_growth_potential?: string | null
          growth_potential_score?: number
          id?: string
          idea_type?: string
          intended_outcome?: string | null
          offer_relevance_score?: number
          outcome_potential_score?: number
          overall_rank?: number
          performance_learning_score?: number
          pinned?: boolean
          rejection_reason?: string | null
          related_offer?: string | null
          related_pillar?: string | null
          sort_order?: number
          status?: string
          tension_statement?: string | null
          title?: string
          updated_at?: string
          who_affected?: string | null
          why_fits_spiral_up?: string | null
          why_matters_now?: string | null
          why_now?: string | null
          why_relevant_to_audience?: string | null
          why_supports_growth?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_ideas_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "strategic_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          name: string | null
          segment: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          segment?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          segment?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visual_config: {
        Row: {
          created_at: string
          cta_placement_pref: string
          exclusion_rules: Json
          formats_by_channel: Json
          id: string
          illustration_preference: string
          preferred_styles: Json
          simplicity_level: string
          text_density: string
          updated_at: string
          use_book_visuals: boolean
          use_event_visuals: boolean
        }
        Insert: {
          created_at?: string
          cta_placement_pref?: string
          exclusion_rules?: Json
          formats_by_channel?: Json
          id?: string
          illustration_preference?: string
          preferred_styles?: Json
          simplicity_level?: string
          text_density?: string
          updated_at?: string
          use_book_visuals?: boolean
          use_event_visuals?: boolean
        }
        Update: {
          created_at?: string
          cta_placement_pref?: string
          exclusion_rules?: Json
          formats_by_channel?: Json
          id?: string
          illustration_preference?: string
          preferred_styles?: Json
          simplicity_level?: string
          text_density?: string
          updated_at?: string
          use_book_visuals?: boolean
          use_event_visuals?: boolean
        }
        Relationships: []
      }
      voice_rules: {
        Row: {
          created_at: string
          id: string
          sentence_style_examples: Json | null
          tone_description: string | null
          typical_expressions: Json | null
          updated_at: string
          words_to_avoid: Json | null
          words_to_prefer: Json | null
          writing_style_rules: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          sentence_style_examples?: Json | null
          tone_description?: string | null
          typical_expressions?: Json | null
          updated_at?: string
          words_to_avoid?: Json | null
          words_to_prefer?: Json | null
          writing_style_rules?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          sentence_style_examples?: Json | null
          tone_description?: string | null
          typical_expressions?: Json | null
          updated_at?: string
          words_to_avoid?: Json | null
          words_to_prefer?: Json | null
          writing_style_rules?: Json | null
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          created_at: string
          id: string
          key_topics: Json | null
          last_scraped_at: string | null
          linked_pillars: Json | null
          page_text: string | null
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_topics?: Json | null
          last_scraped_at?: string | null
          linked_pillars?: Json | null
          page_text?: string | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_topics?: Json | null
          last_scraped_at?: string | null
          linked_pillars?: Json | null
          page_text?: string | null
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
    },
  },
} as const
