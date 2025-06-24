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
      ai_insights: {
        Row: {
          action_required: boolean | null
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          insight_type: string
          is_read: boolean | null
          metadata: Json | null
          related_journal_entry_id: string | null
          related_workout_session_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_required?: boolean | null
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          metadata?: Json | null
          related_journal_entry_id?: string | null
          related_workout_session_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_required?: boolean | null
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          metadata?: Json | null
          related_journal_entry_id?: string | null
          related_workout_session_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_related_journal_entry_id_fkey"
            columns: ["related_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_related_workout_session_id_fkey"
            columns: ["related_workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analyses: {
        Row: {
          analysis_text: string | null
          created_at: string
          feedback: string[] | null
          id: string
          raw_response: Json | null
          score: number | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          analysis_text?: string | null
          created_at?: string
          feedback?: string[] | null
          id?: string
          raw_response?: Json | null
          score?: number | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          analysis_text?: string | null
          created_at?: string
          feedback?: string[] | null
          id?: string
          raw_response?: Json | null
          score?: number | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
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
          share_link: string | null
          title: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          share_link?: string | null
          title?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          share_link?: string | null
          title?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          equipment: string | null
          force: string | null
          id: string
          instructions: string[] | null
          level: string | null
          mechanic: string | null
          name: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          equipment?: string | null
          force?: string | null
          id?: string
          instructions?: string[] | null
          level?: string | null
          mechanic?: string | null
          name: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          equipment?: string | null
          force?: string | null
          id?: string
          instructions?: string[] | null
          level?: string | null
          mechanic?: string | null
          name?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          brand: string | null
          calories_per_serving: number
          carbs_per_serving: number
          created_at: string
          fat_per_serving: number
          fiber_per_serving: number | null
          id: string
          name: string
          protein_per_serving: number
          serving_size: string
          serving_unit: string
          sodium_per_serving: number | null
          sugar_per_serving: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          calories_per_serving: number
          carbs_per_serving?: number
          created_at?: string
          fat_per_serving?: number
          fiber_per_serving?: number | null
          id?: string
          name: string
          protein_per_serving?: number
          serving_size: string
          serving_unit: string
          sodium_per_serving?: number | null
          sugar_per_serving?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          calories_per_serving?: number
          carbs_per_serving?: number
          created_at?: string
          fat_per_serving?: number
          fiber_per_serving?: number | null
          id?: string
          name?: string
          protein_per_serving?: number
          serving_size?: string
          serving_unit?: string
          sodium_per_serving?: number | null
          sugar_per_serving?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      generated_workouts: {
        Row: {
          difficulty_level: number | null
          equipment_needed: string[] | null
          estimated_duration_minutes: number | null
          generated_at: string | null
          id: string
          is_favorite: boolean
          scheduled_date: string | null
          summary: string | null
          tags: string[] | null
          target_muscle_groups: string[] | null
          title: string | null
          user_id: string | null
          workout_data: Json
        }
        Insert: {
          difficulty_level?: number | null
          equipment_needed?: string[] | null
          estimated_duration_minutes?: number | null
          generated_at?: string | null
          id?: string
          is_favorite?: boolean
          scheduled_date?: string | null
          summary?: string | null
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          title?: string | null
          user_id?: string | null
          workout_data: Json
        }
        Update: {
          difficulty_level?: number | null
          equipment_needed?: string[] | null
          estimated_duration_minutes?: number | null
          generated_at?: string | null
          id?: string
          is_favorite?: boolean
          scheduled_date?: string | null
          summary?: string | null
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          title?: string | null
          user_id?: string | null
          workout_data?: Json
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string | null
          created_at: string
          date: string
          energy_level: number | null
          id: string
          mood_rating: number | null
          sleep_quality: number | null
          stress_level: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          date: string
          energy_level?: number | null
          id?: string
          mood_rating?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          date?: string
          energy_level?: number | null
          id?: string
          mood_rating?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
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
      meal_entries: {
        Row: {
          amount: number
          created_at: string
          food_item_id: string
          id: string
          meal_group: string
          nutrition_log_id: string
          serving_multiplier: number
        }
        Insert: {
          amount?: number
          created_at?: string
          food_item_id: string
          id?: string
          meal_group?: string
          nutrition_log_id: string
          serving_multiplier?: number
        }
        Update: {
          amount?: number
          created_at?: string
          food_item_id?: string
          id?: string
          meal_group?: string
          nutrition_log_id?: string
          serving_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_entries_nutrition_log_id_fkey"
            columns: ["nutrition_log_id"]
            isOneToOne: false
            referencedRelation: "nutrition_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_analyses: {
        Row: {
          analysis: string
          created_at: string
          id: string
          metadata: Json | null
          question: string
          user_id: string
          video_name: string
        }
        Insert: {
          analysis: string
          created_at?: string
          id?: string
          metadata?: Json | null
          question: string
          user_id: string
          video_name: string
        }
        Update: {
          analysis?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          question?: string
          user_id?: string
          video_name?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
          water_consumed_ml: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
          water_consumed_ml?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
          water_consumed_ml?: number
        }
        Relationships: []
      }
      nutrition_targets: {
        Row: {
          carbs_ratio: number | null
          created_at: string
          daily_calories: number
          daily_carbs: number
          daily_fat: number
          daily_protein: number
          daily_water_ml: number
          fat_ratio: number | null
          id: string
          macro_method: string
          protein_ratio: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_ratio?: number | null
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          daily_water_ml?: number
          fat_ratio?: number | null
          id?: string
          macro_method?: string
          protein_ratio?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_ratio?: number | null
          created_at?: string
          daily_calories?: number
          daily_carbs?: number
          daily_fat?: number
          daily_protein?: number
          daily_water_ml?: number
          fat_ratio?: number | null
          id?: string
          macro_method?: string
          protein_ratio?: number | null
          updated_at?: string
          user_id?: string
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
      player_dashboards: {
        Row: {
          created_at: string
          dashboard_json: Json
          id: string
          player_name: string
          sport: string | null
          team_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dashboard_json: Json
          id?: string
          player_name: string
          sport?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dashboard_json?: Json
          id?: string
          player_name?: string
          sport?: string | null
          team_name?: string | null
          updated_at?: string
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
          free_workouts_used: number
          id: string
          tier: string | null
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_workouts_used?: number
          id: string
          tier?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_workouts_used?: number
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
      videos: {
        Row: {
          created_at: string
          description: string | null
          exercise_type: string | null
          failure_reason: string | null
          id: string
          status: string
          storage_path: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exercise_type?: string | null
          failure_reason?: string | null
          id?: string
          status?: string
          storage_path: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exercise_type?: string | null
          failure_reason?: string | null
          id?: string
          status?: string
          storage_path?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
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
      workout_metrics: {
        Row: {
          created_at: string
          difficulty_rating: number | null
          exercise_name: string
          form_rating: number | null
          id: string
          notes: string | null
          reps_completed: number | null
          rest_time_seconds: number | null
          sets_completed: number | null
          weight_used: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          difficulty_rating?: number | null
          exercise_name: string
          form_rating?: number | null
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rest_time_seconds?: number | null
          sets_completed?: number | null
          weight_used?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string
          difficulty_rating?: number | null
          exercise_name?: string
          form_rating?: number | null
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rest_time_seconds?: number | null
          sets_completed?: number | null
          weight_used?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_metrics_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          actual_duration_minutes: number | null
          completed_date: string | null
          created_at: string
          generated_workout_id: string | null
          id: string
          journal_entry_id: string | null
          modifications_made: string | null
          notes: string | null
          perceived_exertion: number | null
          satisfaction_rating: number | null
          scheduled_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          completed_date?: string | null
          created_at?: string
          generated_workout_id?: string | null
          id?: string
          journal_entry_id?: string | null
          modifications_made?: string | null
          notes?: string | null
          perceived_exertion?: number | null
          satisfaction_rating?: number | null
          scheduled_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          completed_date?: string | null
          created_at?: string
          generated_workout_id?: string | null
          id?: string
          journal_entry_id?: string | null
          modifications_made?: string | null
          notes?: string | null
          perceived_exertion?: number | null
          satisfaction_rating?: number | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_generated_workout_id_fkey"
            columns: ["generated_workout_id"]
            isOneToOne: false
            referencedRelation: "generated_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
    },
  },
} as const
