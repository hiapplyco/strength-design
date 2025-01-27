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
      calendar_exports: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          calendar_event_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          calendar_event_id: string
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          calendar_event_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
      pricing_page_events: {
        Row: {
          id: string
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          created_at?: string
        }
        Relationships: []
      }
      session_io: {
        Row: {
          id: string
          created_at: string
          weather_data: Json | null
          weather_prompt: string | null
          selected_exercises: Json | null
          fitness_level: string | null
          prescribed_exercises: string | null
          injuries: string | null
          number_of_days: number | null
          generated_workouts: Json | null
          session_duration_ms: number | null
          success: boolean | null
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          weather_data?: Json | null
          weather_prompt?: string | null
          selected_exercises?: Json | null
          fitness_level?: string | null
          prescribed_exercises?: string | null
          injuries?: string | null
          number_of_days?: number | null
          generated_workouts?: Json | null
          session_duration_ms?: number | null
          success?: boolean | null
          error_message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          weather_data?: Json | null
          weather_prompt?: string | null
          selected_exercises?: Json | null
          fitness_level?: string | null
          prescribed_exercises?: string | null
          injuries?: string | null
          number_of_days?: number | null
          generated_workouts?: Json | null
          session_duration_ms?: number | null
          success?: boolean | null
          error_message?: string | null
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
          }
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
          }
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
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
