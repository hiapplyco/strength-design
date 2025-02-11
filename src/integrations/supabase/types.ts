export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      calendar_exports: {
        Row: {
          calendar_event_id: string
          created_at: string
          id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          calendar_event_id: string
          created_at?: string
          id?: string
          user_id: string
          workout_id: string
        }
        Update: {
          calendar_event_id?: string
          created_at?: string
          id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_exports_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          file_path: string | null
          file_type: string | null
          id: string
          message: string
          response: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          message: string
          response?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          message?: string
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          subscription_type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          subscription_type: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          subscription_type?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title?: string
          url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      generated_workouts: {
        Row: {
          generated_at: string | null
          id: string
          summary: string | null
          tags: string[] | null
          title: string | null
          user_id: string | null
          workout_data: Json
        }
        Insert: {
          generated_at?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
          workout_data: Json
        }
        Update: {
          generated_at?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          user_id?: string | null
          workout_data?: Json
        }
        Relationships: []
      }
      lead_gen: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook: {
        Row: {
          content: string
          created_at: string
          fts: unknown | null
          id: number
          page_number: number
          section: string
          subsection: string
        }
        Insert: {
          content: string
          created_at?: string
          fts?: unknown | null
          id?: number
          page_number: number
          section: string
          subsection: string
        }
        Update: {
          content?: string
          created_at?: string
          fts?: unknown | null
          id?: number
          page_number?: number
          section?: string
          subsection?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_page_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id: string
          metadata?: Json | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          tier: string | null
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_io: {
        Row: {
          created_at: string
          error_message: string | null
          fitness_level: string | null
          generated_workouts: Json | null
          id: string
          injuries: string | null
          number_of_days: number | null
          prescribed_exercises: string | null
          selected_exercises: Json | null
          session_duration_ms: number | null
          success: boolean | null
          weather_data: Json | null
          weather_prompt: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          fitness_level?: string | null
          generated_workouts?: Json | null
          id?: string
          injuries?: string | null
          number_of_days?: number | null
          prescribed_exercises?: string | null
          selected_exercises?: Json | null
          session_duration_ms?: number | null
          success?: boolean | null
          weather_data?: Json | null
          weather_prompt?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          fitness_level?: string | null
          generated_workouts?: Json | null
          id?: string
          injuries?: string | null
          number_of_days?: number | null
          prescribed_exercises?: string | null
          selected_exercises?: Json | null
          session_duration_ms?: number | null
          success?: boolean | null
          weather_data?: Json | null
          weather_prompt?: string | null
        }
        Relationships: []
      }
      shared_content: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          shareable_link: string | null
          updated_at: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          shareable_link?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          shareable_link?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_content_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recordings: {
        Row: {
          audio_url: string
          created_at: string
          id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          id?: string
          user_id: string
          workout_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_recordings_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_dashboard: {
        Row: {
          created_at: string
          friday: string | null
          id: string
          monday: string | null
          saturday: string | null
          sunday: string | null
          thursday: string | null
          tuesday: string | null
          updated_at: string
          user_id: string
          wednesday: string | null
        }
        Insert: {
          created_at?: string
          friday?: string | null
          id?: string
          monday?: string | null
          saturday?: string | null
          sunday?: string | null
          thursday?: string | null
          tuesday?: string | null
          updated_at?: string
          user_id: string
          wednesday?: string | null
        }
        Update: {
          created_at?: string
          friday?: string | null
          id?: string
          monday?: string | null
          saturday?: string | null
          sunday?: string | null
          thursday?: string | null
          tuesday?: string | null
          updated_at?: string
          user_id?: string
          wednesday?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_dashboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_generation_inputs: {
        Row: {
          created_at: string
          fitness_level: string | null
          id: string
          injuries: string | null
          number_of_days: number | null
          prescribed_exercises: string | null
          selected_exercises: Json | null
          user_id: string | null
          weather_data: Json | null
          weather_prompt: string | null
        }
        Insert: {
          created_at?: string
          fitness_level?: string | null
          id?: string
          injuries?: string | null
          number_of_days?: number | null
          prescribed_exercises?: string | null
          selected_exercises?: Json | null
          user_id?: string | null
          weather_data?: Json | null
          weather_prompt?: string | null
        }
        Update: {
          created_at?: string
          fitness_level?: string | null
          id?: string
          injuries?: string | null
          number_of_days?: number | null
          prescribed_exercises?: string | null
          selected_exercises?: Json | null
          user_id?: string | null
          weather_data?: Json | null
          weather_prompt?: string | null
        }
        Relationships: []
      }
      workout_history: {
        Row: {
          created_at: string
          id: string
          newwod: string
          previouswod: string
          prompt: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          newwod: string
          previouswod: string
          prompt: string
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string
          id?: string
          newwod?: string
          previouswod?: string
          prompt?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_history_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day: string
          description: string | null
          id: string
          notes: string | null
          strength: string | null
          updated_at: string
          user_id: string | null
          warmup: string
          workout: string
        }
        Insert: {
          created_at?: string
          day: string
          description?: string | null
          id?: string
          notes?: string | null
          strength?: string | null
          updated_at?: string
          user_id?: string | null
          warmup: string
          workout: string
        }
        Update: {
          created_at?: string
          day?: string
          description?: string | null
          id?: string
          notes?: string | null
          strength?: string | null
          updated_at?: string
          user_id?: string | null
          warmup?: string
          workout?: string
        }
        Relationships: []
      }
      workouts_backup: {
        Row: {
          created_at: string | null
          day: string | null
          id: string | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
          warmup: string | null
          wod: string | null
        }
        Insert: {
          created_at?: string | null
          day?: string | null
          id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
          warmup?: string | null
          wod?: string | null
        }
        Update: {
          created_at?: string | null
          day?: string | null
          id?: string | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
          warmup?: string | null
          wod?: string | null
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
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
