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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          monthly_cost: number
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_cost?: number
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_cost?: number
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      churn_alerts_log: {
        Row: {
          id: string
          sent_at: string
          service_name: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          service_name: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          service_name?: string
          user_id?: string
        }
        Relationships: []
      }
      cues: {
        Row: {
          created_at: string
          deep_link: string | null
          id: string
          media_type: string
          overview: string | null
          poster_path: string | null
          release_year: string | null
          service_provider: string
          status: string
          title: string
          tmdb_id: number
          user_id: string
          vote_average: number | null
        }
        Insert: {
          created_at?: string
          deep_link?: string | null
          id?: string
          media_type: string
          overview?: string | null
          poster_path?: string | null
          release_year?: string | null
          service_provider: string
          status?: string
          title: string
          tmdb_id: number
          user_id: string
          vote_average?: number | null
        }
        Update: {
          created_at?: string
          deep_link?: string | null
          id?: string
          media_type?: string
          overview?: string | null
          poster_path?: string | null
          release_year?: string | null
          service_provider?: string
          status?: string
          title?: string
          tmdb_id?: number
          user_id?: string
          vote_average?: number | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_level: string
          avatar_url: string | null
          churn_alerts_enabled: boolean
          created_at: string
          email: string | null
          email_enabled: boolean
          id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          alert_level?: string
          avatar_url?: string | null
          churn_alerts_enabled?: boolean
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          alert_level?: string
          avatar_url?: string | null
          churn_alerts_enabled?: boolean
          created_at?: string
          email?: string | null
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      service_swaps: {
        Row: {
          created_at: string
          id: string
          monthly_savings: number
          new_service: string
          old_service: string
          show_poster_path: string | null
          show_title: string
          show_tmdb_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_savings?: number
          new_service: string
          old_service: string
          show_poster_path?: string | null
          show_title: string
          show_tmdb_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_savings?: number
          new_service?: string
          old_service?: string
          show_poster_path?: string | null
          show_title?: string
          show_tmdb_id?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_friends_cues: {
        Args: { _user_id: string }
        Returns: {
          deep_link: string
          friend_username: string
          media_type: string
          overview: string
          poster_path: string
          release_year: string
          service_provider: string
          title: string
          tmdb_id: number
          vote_average: number
        }[]
      }
      get_shared_cues: {
        Args: { _friend_id: string; _user_id: string }
        Returns: {
          deep_link: string
          media_type: string
          overview: string
          poster_path: string
          release_year: string
          service_provider: string
          title: string
          tmdb_id: number
          vote_average: number
        }[]
      }
      get_users_public_data: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          email: string
          user_id: string
          username: string
        }[]
      }
      search_users: {
        Args: { _current_user_id: string; _query: string }
        Returns: {
          avatar_url: string
          email: string
          user_id: string
          username: string
        }[]
      }
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
