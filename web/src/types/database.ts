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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_archived: boolean | null
          message_count: number | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          message_count?: number | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean | null
          message_count?: number | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string | null
          id: string
          importance: number | null
          memory_key: string
          memory_val: string
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          importance?: number | null
          memory_key: string
          memory_val: string
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          importance?: number | null
          memory_key?: string
          memory_val?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory_vectors: {
        Row: {
          content_chunk: string
          conversation_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          message_id: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          content_chunk: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          message_id?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          content_chunk?: string
          conversation_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          message_id?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_vectors_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_vectors_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_vectors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          coin_cost: number | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          coin_cost?: number | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          coin_cost?: number | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_queue: {
        Row: {
          action_type: string
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          priority: number | null
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          priority?: number | null
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_task_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          payload: Json
          request_type: string
          result: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          payload: Json
          request_type: string
          result?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          payload?: Json
          request_type?: string
          result?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_weekly_summaries: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          message_id: string | null
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          message_id?: string | null
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          message_id?: string | null
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_weekly_summaries_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_weekly_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_secret: boolean
          name: string
          rarity: string | null
          requirement: Json
          slug: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          is_secret?: boolean
          name: string
          rarity?: string | null
          requirement?: Json
          slug?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_secret?: boolean
          name?: string
          rarity?: string | null
          requirement?: Json
          slug?: string | null
        }
        Relationships: []
      }
      body_metrics: {
        Row: {
          bicep_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          measured_at: string | null
          photo_url: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          bicep_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          measured_at?: string | null
          photo_url?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          bicep_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          measured_at?: string | null
          photo_url?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          creator_id: string
          description: string | null
          ends_at: string
          id: string
          participants: string[] | null
          rules: Json
          starts_at: string | null
          status: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          ends_at: string
          id?: string
          participants?: string[] | null
          rules?: Json
          starts_at?: string | null
          status?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          ends_at?: string
          id?: string
          participants?: string[] | null
          rules?: Json
          starts_at?: string | null
          status?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dailies: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          day_id: string | null
          description: string | null
          expires_on: string | null
          id: string
          is_completed: boolean
          plan_id: string | null
          priority: string
          repeat_days: string[] | null
          repeat_type: string
          require_all_subtasks: boolean
          scheduled_time: string | null
          source: string
          subtasks: Json | null
          title: string
          user_id: string
          xp_penalty: number
          xp_reward: number
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          day_id?: string | null
          description?: string | null
          expires_on?: string | null
          id?: string
          is_completed?: boolean
          plan_id?: string | null
          priority: string
          repeat_days?: string[] | null
          repeat_type?: string
          require_all_subtasks?: boolean
          scheduled_time?: string | null
          source?: string
          subtasks?: Json | null
          title: string
          user_id: string
          xp_penalty: number
          xp_reward: number
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          day_id?: string | null
          description?: string | null
          expires_on?: string | null
          id?: string
          is_completed?: boolean
          plan_id?: string | null
          priority?: string
          repeat_days?: string[] | null
          repeat_type?: string
          require_all_subtasks?: boolean
          scheduled_time?: string | null
          source?: string
          subtasks?: Json | null
          title?: string
          user_id?: string
          xp_penalty?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "dailies_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dailies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dailies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          budget_bdt_per_day: number | null
          carbs_target_g: number | null
          created_at: string | null
          daily_calories: number | null
          fat_target_g: number | null
          id: string
          is_active: boolean | null
          meals_per_day: number | null
          protein_target_g: number | null
          user_id: string
          workout_plan_id: string | null
        }
        Insert: {
          budget_bdt_per_day?: number | null
          carbs_target_g?: number | null
          created_at?: string | null
          daily_calories?: number | null
          fat_target_g?: number | null
          id?: string
          is_active?: boolean | null
          meals_per_day?: number | null
          protein_target_g?: number | null
          user_id: string
          workout_plan_id?: string | null
        }
        Update: {
          budget_bdt_per_day?: number | null
          carbs_target_g?: number | null
          created_at?: string | null
          daily_calories?: number | null
          fat_target_g?: number | null
          id?: string
          is_active?: boolean | null
          meals_per_day?: number | null
          protein_target_g?: number | null
          user_id?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dungeons: {
        Row: {
          badge_reward_slug: string | null
          coin_reward: number
          created_at: string | null
          description: string | null
          duration_hours: number
          id: string
          is_template: boolean
          min_hp: number
          min_level: number
          objectives: Json
          tier: string
          title: string
          xp_reward: number
        }
        Insert: {
          badge_reward_slug?: string | null
          coin_reward?: number
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          is_template?: boolean
          min_hp?: number
          min_level?: number
          objectives?: Json
          tier: string
          title: string
          xp_reward?: number
        }
        Update: {
          badge_reward_slug?: string | null
          coin_reward?: number
          created_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          is_template?: boolean
          min_hp?: number
          min_level?: number
          objectives?: Json
          tier?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          muscle_group: string
          name: string
          technique_note: string | null
          user_id: string | null
          video_source: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          muscle_group: string
          name: string
          technique_note?: string | null
          user_id?: string | null
          video_source?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string
          name?: string
          technique_note?: string | null
          user_id?: string | null
          video_source?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fat_g: number | null
          food_name: string
          id: string
          logged_at: string | null
          meal_type: string
          protein_g: number | null
          quantity: string | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          food_name: string
          id?: string
          logged_at?: string | null
          meal_type: string
          protein_g?: number | null
          quantity?: string | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          food_name?: string
          id?: string
          logged_at?: string | null
          meal_type?: string
          protein_g?: number | null
          quantity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          current_streak: number
          description: string | null
          difficulty: string
          end_date: string | null
          hp_penalty: number
          id: string
          is_active: boolean | null
          is_completed_this_cycle: boolean
          is_indefinite: boolean
          is_negative: boolean
          is_positive: boolean
          longest_streak: number
          plan_id: string | null
          reset_type: string
          source: string
          title: string
          updated_at: string | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_streak?: number
          description?: string | null
          difficulty?: string
          end_date?: string | null
          hp_penalty?: number
          id?: string
          is_active?: boolean | null
          is_completed_this_cycle?: boolean
          is_indefinite?: boolean
          is_negative?: boolean
          is_positive?: boolean
          longest_streak?: number
          plan_id?: string | null
          reset_type?: string
          source?: string
          title: string
          updated_at?: string | null
          user_id: string
          xp_reward?: number
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_streak?: number
          description?: string | null
          difficulty?: string
          end_date?: string | null
          hp_penalty?: number
          id?: string
          is_active?: boolean | null
          is_completed_this_cycle?: boolean
          is_indefinite?: boolean
          is_negative?: boolean
          is_positive?: boolean
          longest_streak?: number
          plan_id?: string | null
          reset_type?: string
          source?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_template_foods: {
        Row: {
          approx_cost_bdt: number | null
          calories: number | null
          carbs_g: number | null
          fat_g: number | null
          food_name: string
          id: string
          meal_template_id: string
          protein_g: number | null
          quantity: string | null
        }
        Insert: {
          approx_cost_bdt?: number | null
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          food_name: string
          id?: string
          meal_template_id: string
          protein_g?: number | null
          quantity?: string | null
        }
        Update: {
          approx_cost_bdt?: number | null
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          food_name?: string
          id?: string
          meal_template_id?: string
          protein_g?: number | null
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_template_foods_meal_template_id_fkey"
            columns: ["meal_template_id"]
            isOneToOne: false
            referencedRelation: "meal_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          diet_plan_id: string
          id: string
          meal_type: string | null
          notes: string | null
          suggested_time: string | null
          total_calories: number | null
        }
        Insert: {
          diet_plan_id: string
          id?: string
          meal_type?: string | null
          notes?: string | null
          suggested_time?: string | null
          total_calories?: number | null
        }
        Update: {
          diet_plan_id?: string
          id?: string
          meal_type?: string | null
          notes?: string | null
          suggested_time?: string | null
          total_calories?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_templates_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_tests: {
        Row: {
          created_at: string | null
          id: string
          is_ad_hoc: boolean | null
          milestone_id: string | null
          passing_score_pct: number | null
          questions: Json
          roadmap_id: string
          study_day_id: string | null
          title: string
          xp_on_fail: number | null
          xp_on_pass: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_ad_hoc?: boolean | null
          milestone_id?: string | null
          passing_score_pct?: number | null
          questions: Json
          roadmap_id: string
          study_day_id?: string | null
          title: string
          xp_on_fail?: number | null
          xp_on_pass?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_ad_hoc?: boolean | null
          milestone_id?: string | null
          passing_score_pct?: number | null
          questions?: Json
          roadmap_id?: string
          study_day_id?: string | null
          title?: string
          xp_on_fail?: number | null
          xp_on_pass?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_tests_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "skill_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_tests_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "skill_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_tests_study_day_id_fkey"
            columns: ["study_day_id"]
            isOneToOne: false
            referencedRelation: "skill_study_days"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          evening_review: boolean | null
          id: string
          morning_checkin: boolean | null
          push_enabled: boolean | null
          push_subscription: Json | null
          quest_reminders: boolean | null
          social_notifications: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          evening_review?: boolean | null
          id?: string
          morning_checkin?: boolean | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          quest_reminders?: boolean | null
          social_notifications?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          evening_review?: boolean | null
          id?: string
          morning_checkin?: boolean | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          quest_reminders?: boolean | null
          social_notifications?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          carbs_g: number | null
          created_at: string | null
          daily_calories: number | null
          diet_type: string | null
          fat_g: number | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean | null
          meal_count: number | null
          protein_g: number | null
          restrictions: string[] | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string | null
          daily_calories?: number | null
          diet_type?: string | null
          fat_g?: number | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          meal_count?: number | null
          protein_g?: number | null
          restrictions?: string[] | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string | null
          daily_calories?: number | null
          diet_type?: string | null
          fat_g?: number | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          meal_count?: number | null
          protein_g?: number | null
          restrictions?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_logs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          items: Json | null
          logged_at: string | null
          occasion: string | null
          photo_url: string | null
          rating: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          items?: Json | null
          logged_at?: string | null
          occasion?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          items?: Json | null
          logged_at?: string | null
          occasion?: string | null
          photo_url?: string | null
          rating?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_adjustments: {
        Row: {
          id: string
          plan_id: string
          reason: string | null
          resolved_at: string | null
          status: string | null
          suggested_at: string | null
          suggestion: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          plan_id: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          suggested_at?: string | null
          suggestion?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
          suggested_at?: string | null
          suggestion?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_adjustments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          break_minutes: number | null
          completed_at: string | null
          duration_minutes: number | null
          id: string
          skill_id: string | null
          started_at: string | null
          status: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          skill_id?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          skill_id?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "todos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pomodoro_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          coin_reward: number | null
          created_at: string | null
          description: string | null
          difficulty: string
          expires_at: string | null
          hp_penalty: number
          icon: string | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean
          order_priority: number
          pillar: string | null
          requirements: Json
          title: string
          type: string
          xp_reward: number
        }
        Insert: {
          coin_reward?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          expires_at?: string | null
          hp_penalty?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean
          order_priority?: number
          pillar?: string | null
          requirements?: Json
          title: string
          type: string
          xp_reward?: number
        }
        Update: {
          coin_reward?: number | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          expires_at?: string | null
          hp_penalty?: number
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean
          order_priority?: number
          pillar?: string | null
          requirements?: Json
          title?: string
          type?: string
          xp_reward?: number
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          channel: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          quality_score: number | null
          resource_type: string | null
          skill_category: string
          source: string | null
          title: string
          topic_name: string
          url: string
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          quality_score?: number | null
          resource_type?: string | null
          skill_category: string
          source?: string | null
          title: string
          topic_name: string
          url: string
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          quality_score?: number | null
          resource_type?: string | null
          skill_category?: string
          source?: string | null
          title?: string
          topic_name?: string
          url?: string
        }
        Relationships: []
      }
      roadmap_adaptations: {
        Row: {
          id: string
          reason: string | null
          resolved_at: string | null
          roadmap_id: string
          status: string | null
          suggested_at: string | null
          suggestion: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          reason?: string | null
          resolved_at?: string | null
          roadmap_id: string
          status?: string | null
          suggested_at?: string | null
          suggestion?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          reason?: string | null
          resolved_at?: string | null
          roadmap_id?: string
          status?: string | null
          suggested_at?: string | null
          suggestion?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_adaptations_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "skill_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_adaptations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_milestones: {
        Row: {
          completed_at: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          is_completed: boolean | null
          order_index: number | null
          phase_id: string | null
          roadmap_id: string
          test_id: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          phase_id?: string | null
          roadmap_id: string
          test_id?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_completed?: boolean | null
          order_index?: number | null
          phase_id?: string | null
          roadmap_id?: string
          test_id?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "skill_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_milestones_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "skill_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_milestones_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "milestone_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_phases: {
        Row: {
          completed_at: string | null
          estimated_weeks: number | null
          id: string
          is_completed: boolean | null
          phase_name: string
          phase_number: number
          roadmap_id: string
          xp_bonus: number | null
        }
        Insert: {
          completed_at?: string | null
          estimated_weeks?: number | null
          id?: string
          is_completed?: boolean | null
          phase_name: string
          phase_number: number
          roadmap_id: string
          xp_bonus?: number | null
        }
        Update: {
          completed_at?: string | null
          estimated_weeks?: number | null
          id?: string
          is_completed?: boolean | null
          phase_name?: string
          phase_number?: number
          roadmap_id?: string
          xp_bonus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_phases_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "skill_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_roadmaps: {
        Row: {
          aicoin_cost: number | null
          created_at: string | null
          daily_study_minutes: number | null
          deactivated_at: string | null
          difficulty: string | null
          end_date: string | null
          goal: string | null
          id: string
          includes_tests: boolean | null
          is_ai_generated: boolean | null
          plan_type: string
          scheduled_time: string | null
          shift_on_miss: boolean | null
          skill_id: string
          start_date: string | null
          status: string | null
          title: string
          user_id: string
          weekly_study_days: string[] | null
        }
        Insert: {
          aicoin_cost?: number | null
          created_at?: string | null
          daily_study_minutes?: number | null
          deactivated_at?: string | null
          difficulty?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          includes_tests?: boolean | null
          is_ai_generated?: boolean | null
          plan_type: string
          scheduled_time?: string | null
          shift_on_miss?: boolean | null
          skill_id: string
          start_date?: string | null
          status?: string | null
          title: string
          user_id: string
          weekly_study_days?: string[] | null
        }
        Update: {
          aicoin_cost?: number | null
          created_at?: string | null
          daily_study_minutes?: number | null
          deactivated_at?: string | null
          difficulty?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          includes_tests?: boolean | null
          is_ai_generated?: boolean | null
          plan_type?: string
          scheduled_time?: string | null
          shift_on_miss?: boolean | null
          skill_id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          user_id?: string
          weekly_study_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_roadmaps_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_roadmaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          has_notes: boolean | null
          id: string
          mood: number | null
          notes: string | null
          session_bonus_xp: number | null
          session_date: string
          skill_id: string
          status: string | null
          study_day_id: string | null
          topics_completed: number | null
          topics_total: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          has_notes?: boolean | null
          id?: string
          mood?: number | null
          notes?: string | null
          session_bonus_xp?: number | null
          session_date?: string
          skill_id: string
          status?: string | null
          study_day_id?: string | null
          topics_completed?: number | null
          topics_total?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          has_notes?: boolean | null
          id?: string
          mood?: number | null
          notes?: string | null
          session_bonus_xp?: number | null
          session_date?: string
          skill_id?: string
          status?: string | null
          study_day_id?: string | null
          topics_completed?: number | null
          topics_total?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_sessions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_sessions_study_day_id_fkey"
            columns: ["study_day_id"]
            isOneToOne: false
            referencedRelation: "skill_study_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_study_days: {
        Row: {
          daily_id: string | null
          day_label: string | null
          day_number: number
          estimated_minutes: number | null
          has_test: boolean | null
          id: string
          is_completed: boolean | null
          is_missed: boolean | null
          roadmap_id: string
          scheduled_date: string | null
          scheduled_time: string | null
          xp_reward: number | null
        }
        Insert: {
          daily_id?: string | null
          day_label?: string | null
          day_number: number
          estimated_minutes?: number | null
          has_test?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_missed?: boolean | null
          roadmap_id: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          xp_reward?: number | null
        }
        Update: {
          daily_id?: string | null
          day_label?: string | null
          day_number?: number
          estimated_minutes?: number | null
          has_test?: boolean | null
          id?: string
          is_completed?: boolean | null
          is_missed?: boolean | null
          roadmap_id?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_study_days_daily_id_fkey"
            columns: ["daily_id"]
            isOneToOne: false
            referencedRelation: "dailies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_study_days_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "skill_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_topics: {
        Row: {
          completed_at: string | null
          estimated_minutes: number | null
          id: string
          is_completed: boolean | null
          milestone_id: string | null
          order_index: number | null
          study_day_id: string | null
          title: string
          type: string | null
          xp_reward: number | null
        }
        Insert: {
          completed_at?: string | null
          estimated_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          milestone_id?: string | null
          order_index?: number | null
          study_day_id?: string | null
          title: string
          type?: string | null
          xp_reward?: number | null
        }
        Update: {
          completed_at?: string | null
          estimated_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          milestone_id?: string | null
          order_index?: number | null
          study_day_id?: string | null
          title?: string
          type?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_topics_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "skill_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_topics_study_day_id_fkey"
            columns: ["study_day_id"]
            isOneToOne: false
            referencedRelation: "skill_study_days"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_mastered: boolean | null
          is_primary: boolean | null
          name: string
          streak: number | null
          streak_last_date: string | null
          total_hours: number | null
          total_points: number | null
          tracking_mode: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mastered?: boolean | null
          is_primary?: boolean | null
          name: string
          streak?: number | null
          streak_last_date?: string | null
          total_hours?: number | null
          total_points?: number | null
          tracking_mode?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mastered?: boolean | null
          is_primary?: boolean | null
          name?: string
          streak?: number | null
          streak_last_date?: string | null
          total_hours?: number | null
          total_points?: number | null
          tracking_mode?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_profiles: {
        Row: {
          body_type: string | null
          budget_range: string | null
          color_preferences: string[] | null
          created_at: string | null
          id: string
          preferred_brands: string[] | null
          style_preferences: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_type?: string | null
          budget_range?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          id?: string
          preferred_brands?: string[] | null
          style_preferences?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_type?: string | null
          budget_range?: string | null
          color_preferences?: string[] | null
          created_at?: string | null
          id?: string
          preferred_brands?: string[] | null
          style_preferences?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_recommendations: {
        Row: {
          created_at: string | null
          id: string
          is_ai_generated: boolean | null
          items: Json
          occasion: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          items?: Json
          occasion?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          items?: Json
          occasion?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          provider: string | null
          provider_subscription_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          attempted_at: string | null
          feedback: Json | null
          id: string
          passed: boolean | null
          score_pct: number | null
          test_id: string
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          feedback?: Json | null
          id?: string
          passed?: boolean | null
          score_pct?: number | null
          test_id: string
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          feedback?: Json | null
          id?: string
          passed?: boolean | null
          score_pct?: number | null
          test_id?: string
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "milestone_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          priority: string
          require_all_subtasks: boolean
          scheduled_time: string | null
          source: string
          subtasks: Json | null
          title: string
          user_id: string
          xp_penalty: number
          xp_reward: number
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority: string
          require_all_subtasks?: boolean
          scheduled_time?: string | null
          source?: string
          subtasks?: Json | null
          title: string
          user_id: string
          xp_penalty?: number
          xp_reward: number
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority?: string
          require_all_subtasks?: boolean
          scheduled_time?: string | null
          source?: string
          subtasks?: Json | null
          title?: string
          user_id?: string
          xp_penalty?: number
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_resources: {
        Row: {
          channel: string | null
          duration_minutes: number | null
          id: string
          is_primary: boolean | null
          source: string | null
          title: string
          topic_id: string
          type: string | null
          url: string | null
          video_query: string | null
        }
        Insert: {
          channel?: string | null
          duration_minutes?: number | null
          id?: string
          is_primary?: boolean | null
          source?: string | null
          title: string
          topic_id: string
          type?: string | null
          url?: string | null
          video_query?: string | null
        }
        Update: {
          channel?: string | null
          duration_minutes?: number | null
          id?: string
          is_primary?: boolean | null
          source?: string | null
          title?: string
          topic_id?: string
          type?: string | null
          url?: string | null
          video_query?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "skill_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dungeons: {
        Row: {
          completed_at: string | null
          created_at: string | null
          dungeon_id: string
          expires_at: string
          id: string
          progress: Json
          spawned_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          dungeon_id: string
          expires_at: string
          id?: string
          progress?: Json
          spawned_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          dungeon_id?: string
          expires_at?: string
          id?: string
          progress?: Json
          spawned_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_dungeons_dungeon_id_fkey"
            columns: ["dungeon_id"]
            isOneToOne: false
            referencedRelation: "dungeons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dungeons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string | null
          goal_text: string
          id: string
          is_active: boolean | null
          pillar: string
          progress: number | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_text: string
          id?: string
          is_active?: boolean | null
          pillar: string
          progress?: number | null
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_text?: string
          id?: string
          is_active?: boolean | null
          pillar?: string
          progress?: number | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          ai_background_model: string
          ai_chat_model: string
          ai_coins: number | null
          ai_custom_persona: string | null
          ai_persona_name: string | null
          ai_persona_style: string | null
          attr_agi: number
          attr_cha: number
          attr_int: number
          attr_str: number
          attr_vit: number
          avatar_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          gender: string | null
          hp: number
          hp_state: string
          id: string
          is_pro: boolean | null
          is_public: boolean | null
          level: number | null
          max_hp: number
          onboarding_done: boolean | null
          rank: string
          rpg_avatar_key: string | null
          rpg_class: string[] | null
          stat_points: number
          streak_best: number | null
          streak_fitness: number
          streak_freeze_count: number | null
          streak_habits: number
          streak_last_date: string | null
          streak_overall: number | null
          streak_skills: number
          streak_tasks: number
          theme: string | null
          timezone: string | null
          total_xp: number | null
          updated_at: string | null
          username: string
          weekly_summary_day: string | null
          weekly_summary_time: string | null
          xp: number | null
          xp_to_next_level: number | null
        }
        Insert: {
          age?: number | null
          ai_background_model?: string
          ai_chat_model?: string
          ai_coins?: number | null
          ai_custom_persona?: string | null
          ai_persona_name?: string | null
          ai_persona_style?: string | null
          attr_agi?: number
          attr_cha?: number
          attr_int?: number
          attr_str?: number
          attr_vit?: number
          avatar_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          hp?: number
          hp_state?: string
          id: string
          is_pro?: boolean | null
          is_public?: boolean | null
          level?: number | null
          max_hp?: number
          onboarding_done?: boolean | null
          rank?: string
          rpg_avatar_key?: string | null
          rpg_class?: string[] | null
          stat_points?: number
          streak_best?: number | null
          streak_fitness?: number
          streak_freeze_count?: number | null
          streak_habits?: number
          streak_last_date?: string | null
          streak_overall?: number | null
          streak_skills?: number
          streak_tasks?: number
          theme?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          username: string
          weekly_summary_day?: string | null
          weekly_summary_time?: string | null
          xp?: number | null
          xp_to_next_level?: number | null
        }
        Update: {
          age?: number | null
          ai_background_model?: string
          ai_chat_model?: string
          ai_coins?: number | null
          ai_custom_persona?: string | null
          ai_persona_name?: string | null
          ai_persona_style?: string | null
          attr_agi?: number
          attr_cha?: number
          attr_int?: number
          attr_str?: number
          attr_vit?: number
          avatar_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          hp?: number
          hp_state?: string
          id?: string
          is_pro?: boolean | null
          is_public?: boolean | null
          level?: number | null
          max_hp?: number
          onboarding_done?: boolean | null
          rank?: string
          rpg_avatar_key?: string | null
          rpg_class?: string[] | null
          stat_points?: number
          streak_best?: number | null
          streak_fitness?: number
          streak_freeze_count?: number | null
          streak_habits?: number
          streak_last_date?: string | null
          streak_overall?: number | null
          streak_skills?: number
          streak_tasks?: number
          theme?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          username?: string
          weekly_summary_day?: string | null
          weekly_summary_time?: string | null
          xp?: number | null
          xp_to_next_level?: number | null
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          current_value: number
          expires_at: string | null
          id: string
          progress: Json | null
          quest_id: string
          status: string | null
          target_value: number
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          current_value?: number
          expires_at?: string | null
          id?: string
          progress?: Json | null
          quest_id: string
          status?: string | null
          target_value?: number
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          current_value?: number
          expires_at?: string | null
          id?: string
          progress?: Json | null
          quest_id?: string
          status?: string | null
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_ml: number
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_day_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          technique_note: string | null
          weight_note: string | null
          workout_day_id: string
          xp_full_exercise: number | null
          xp_per_set: number | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          technique_note?: string | null
          weight_note?: string | null
          workout_day_id: string
          xp_full_exercise?: number | null
          xp_per_set?: number | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          technique_note?: string | null
          weight_note?: string | null
          workout_day_id?: string
          xp_full_exercise?: number | null
          xp_per_set?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_day_exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          created_at: string | null
          daily_id: string | null
          day_label: string | null
          day_number: number
          id: string
          muscle_groups: string[] | null
          name: string
          plan_id: string
          repeat_day: string | null
          rest_day: boolean | null
          scheduled_date: string | null
          scheduled_time: string | null
        }
        Insert: {
          created_at?: string | null
          daily_id?: string | null
          day_label?: string | null
          day_number: number
          id?: string
          muscle_groups?: string[] | null
          name: string
          plan_id: string
          repeat_day?: string | null
          rest_day?: boolean | null
          scheduled_date?: string | null
          scheduled_time?: string | null
        }
        Update: {
          created_at?: string | null
          daily_id?: string | null
          day_label?: string | null
          day_number?: number
          id?: string
          muscle_groups?: string[] | null
          name?: string
          plan_id?: string
          repeat_day?: string | null
          rest_day?: boolean | null
          scheduled_date?: string | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_daily_id_fkey"
            columns: ["daily_id"]
            isOneToOne: false
            referencedRelation: "dailies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_log_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          sets_completed: Json
          workout_log_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          sets_completed?: Json
          workout_log_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          sets_completed?: Json
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_log_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_log_exercises_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          completed_at: string | null
          duration_minutes: number | null
          id: string
          mood: string | null
          notes: string | null
          plan_id: string | null
          user_id: string
          workout_day_id: string | null
          xp_earned: number | null
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          plan_id?: string | null
          user_id: string
          workout_day_id?: string | null
          xp_earned?: number | null
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          plan_id?: string | null
          user_id?: string
          workout_day_id?: string | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string | null
          days_per_week: number | null
          deactivated_at: string | null
          description: string | null
          difficulty: string | null
          end_date: string | null
          goal: string | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean | null
          name: string
          plan_type: string | null
          session_duration_min: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_per_week?: number | null
          deactivated_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          name: string
          plan_type?: string | null
          session_duration_min?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_per_week?: number | null
          deactivated_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean | null
          name?: string
          plan_type?: string | null
          session_duration_min?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          logged_date: string
          notes: string | null
          plan_id: string
          session_bonus_xp: number | null
          sets_done: Json | null
          status: string | null
          total_xp_earned: number | null
          user_id: string
          workout_day_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_date?: string
          notes?: string | null
          plan_id: string
          session_bonus_xp?: number | null
          sets_done?: Json | null
          status?: string | null
          total_xp_earned?: number | null
          user_id: string
          workout_day_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_date?: string
          notes?: string | null
          plan_id?: string
          session_bonus_xp?: number | null
          sets_done?: Json | null
          status?: string | null
          total_xp_earned?: number | null
          user_id?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_logs_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_memory_vectors: {
        Args: {
          match_count?: number
          match_threshold?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content_chunk: string
          created_at: string
          id: string
          role: string
          similarity: number
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

