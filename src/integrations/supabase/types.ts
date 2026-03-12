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
      brand_assets: {
        Row: {
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
