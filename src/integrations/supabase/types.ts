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
      athlete_benchmark_results: {
        Row: {
          athlete_id: string
          benchmark_id: string
          created_at: string
          id: string
          notes: string | null
          recorded_on: string
          scaling: Database["public"]["Enums"]["scaling_level"]
          time_seconds: number | null
          total_load_kg: number | null
          total_reps: number | null
        }
        Insert: {
          athlete_id: string
          benchmark_id: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_on?: string
          scaling?: Database["public"]["Enums"]["scaling_level"]
          time_seconds?: number | null
          total_load_kg?: number | null
          total_reps?: number | null
        }
        Update: {
          athlete_id?: string
          benchmark_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          recorded_on?: string
          scaling?: Database["public"]["Enums"]["scaling_level"]
          time_seconds?: number | null
          total_load_kg?: number | null
          total_reps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_benchmark_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_benchmark_results_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmark_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_gymnastics_records: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          max_unbroken_reps: number
          movement_id: string
          notes: string | null
          recorded_on: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          max_unbroken_reps: number
          movement_id: string
          notes?: string | null
          recorded_on?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          max_unbroken_reps?: number
          movement_id?: string
          notes?: string | null
          recorded_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_gymnastics_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_gymnastics_records_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_lift_records: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          load_kg: number
          movement_id: string
          notes: string | null
          recorded_on: string
          rep_count: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          load_kg: number
          movement_id: string
          notes?: string | null
          recorded_on?: string
          rep_count?: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          load_kg?: number
          movement_id?: string
          notes?: string | null
          recorded_on?: string
          rep_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_lift_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_lift_records_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_mono_paces: {
        Row: {
          athlete_id: string
          created_at: string
          distance_m: number
          id: string
          modality: Database["public"]["Enums"]["mono_modality"]
          notes: string | null
          recorded_on: string
          time_seconds: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          distance_m: number
          id?: string
          modality: Database["public"]["Enums"]["mono_modality"]
          notes?: string | null
          recorded_on?: string
          time_seconds: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          distance_m?: number
          id?: string
          modality?: Database["public"]["Enums"]["mono_modality"]
          notes?: string | null
          recorded_on?: string
          time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_mono_paces_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_session_results: {
        Row: {
          athlete_id: string
          created_at: string
          fatigue_point_seconds: number | null
          id: string
          notes: string | null
          perceived_limiter: string | null
          recorded_on: string
          rpe: number
          scaling: Database["public"]["Enums"]["scaling_level"]
          session_id: string
          time_seconds: number | null
          total_reps: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          fatigue_point_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_limiter?: string | null
          recorded_on?: string
          rpe: number
          scaling?: Database["public"]["Enums"]["scaling_level"]
          session_id: string
          time_seconds?: number | null
          total_reps?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          fatigue_point_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_limiter?: string | null
          recorded_on?: string
          rpe?: number
          scaling?: Database["public"]["Enums"]["scaling_level"]
          session_id?: string
          time_seconds?: number | null
          total_reps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_session_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_strategies: {
        Row: {
          advice: string | null
          anaerobic_threshold_bpm: number | null
          athlete_id: string
          chosen_protocol: string
          created_at: string
          fatigue_point_seconds: number | null
          id: string
          redline_bpm: number | null
          session_id: string
          splits: Json
        }
        Insert: {
          advice?: string | null
          anaerobic_threshold_bpm?: number | null
          athlete_id: string
          chosen_protocol?: string
          created_at?: string
          fatigue_point_seconds?: number | null
          id?: string
          redline_bpm?: number | null
          session_id: string
          splits?: Json
        }
        Update: {
          advice?: string | null
          anaerobic_threshold_bpm?: number | null
          athlete_id?: string
          chosen_protocol?: string
          created_at?: string
          fatigue_point_seconds?: number | null
          id?: string
          redline_bpm?: number | null
          session_id?: string
          splits?: Json
        }
        Relationships: [
          {
            foreignKeyName: "athlete_strategies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_workouts: {
        Row: {
          category: Database["public"]["Enums"]["benchmark_category"]
          created_at: string
          description: string
          id: string
          name: string
          open_code: string | null
          scoring: Database["public"]["Enums"]["scoring_type"]
          slug: string
          time_cap_seconds: number | null
          year: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["benchmark_category"]
          created_at?: string
          description: string
          id?: string
          name: string
          open_code?: string | null
          scoring: Database["public"]["Enums"]["scoring_type"]
          slug: string
          time_cap_seconds?: number | null
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["benchmark_category"]
          created_at?: string
          description?: string
          id?: string
          name?: string
          open_code?: string | null
          scoring?: Database["public"]["Enums"]["scoring_type"]
          slug?: string
          time_cap_seconds?: number | null
          year?: number | null
        }
        Relationships: []
      }
      boxes: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          head_coach_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          head_coach_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          head_coach_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_alerts: {
        Row: {
          alert_type: string
          athlete_id: string
          created_at: string
          id: string
          message: string
          resolved: boolean
          session_id: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          athlete_id: string
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
          session_id?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          athlete_id?: string
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
          session_id?: string | null
          severity?: string
        }
        Relationships: []
      }
      fatigue_profiles: {
        Row: {
          athlete_id: string
          correction_factor: number
          created_at: string
          data_points_used: number
          estimated_max_hr: number
          id: string
          last_calibrated_at: string
          mental_resilience_score: number
          recovery_factor: number
          redline_pct: number
          updated_at: string
        }
        Insert: {
          athlete_id: string
          correction_factor?: number
          created_at?: string
          data_points_used?: number
          estimated_max_hr: number
          id?: string
          last_calibrated_at?: string
          mental_resilience_score?: number
          recovery_factor?: number
          redline_pct?: number
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          correction_factor?: number
          created_at?: string
          data_points_used?: number
          estimated_max_hr?: number
          id?: string
          last_calibrated_at?: string
          mental_resilience_score?: number
          recovery_factor?: number
          redline_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fatigue_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          category: Database["public"]["Enums"]["movement_category"]
          created_at: string
          description: string | null
          id: string
          is_max_unbroken: boolean
          is_one_rep_max: boolean
          name: string
          rx_load_female_kg: number | null
          rx_load_male_kg: number | null
          slug: string
        }
        Insert: {
          category: Database["public"]["Enums"]["movement_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_max_unbroken?: boolean
          is_one_rep_max?: boolean
          name: string
          rx_load_female_kg?: number | null
          rx_load_male_kg?: number | null
          slug: string
        }
        Update: {
          category?: Database["public"]["Enums"]["movement_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_max_unbroken?: boolean
          is_one_rep_max?: boolean
          name?: string
          rx_load_female_kg?: number | null
          rx_load_male_kg?: number | null
          slug?: string
        }
        Relationships: []
      }
      open_percentile_data: {
        Row: {
          age_max: number
          age_min: number
          gender: Database["public"]["Enums"]["gender"]
          id: string
          open_code: string
          percentile: number
          scaling: Database["public"]["Enums"]["scaling_level"]
          score_is_time: boolean
          score_value: number
        }
        Insert: {
          age_max: number
          age_min: number
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          open_code: string
          percentile: number
          scaling?: Database["public"]["Enums"]["scaling_level"]
          score_is_time?: boolean
          score_value: number
        }
        Update: {
          age_max?: number
          age_min?: number
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          open_code?: string
          percentile?: number
          scaling?: Database["public"]["Enums"]["scaling_level"]
          score_is_time?: boolean
          score_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          box_id: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          experience: Database["public"]["Enums"]["experience_level"] | null
          gender: Database["public"]["Enums"]["gender"] | null
          goals: string[] | null
          height_cm: number | null
          id: string
          onboarded: boolean
          subjective_wellness: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          gender?: Database["public"]["Enums"]["gender"] | null
          goals?: string[] | null
          height_cm?: number | null
          id: string
          onboarded?: boolean
          subjective_wellness?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          box_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          experience?: Database["public"]["Enums"]["experience_level"] | null
          gender?: Database["public"]["Enums"]["gender"] | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          onboarded?: boolean
          subjective_wellness?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          box_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          box_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_readings: {
        Row: {
          athlete_id: string
          created_at: string
          hrv_ms: number | null
          id: string
          reading_date: string
          recovery_pct: number | null
          resting_hr_bpm: number | null
          sleep_hours: number | null
          sleep_score: number | null
          source: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          hrv_ms?: number | null
          id?: string
          reading_date?: string
          recovery_pct?: number | null
          resting_hr_bpm?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          source?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          hrv_ms?: number | null
          id?: string
          reading_date?: string
          recovery_pct?: number | null
          resting_hr_bpm?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_readings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          benchmark_id: string | null
          box_id: string | null
          class_size: number | null
          coaching_goals_text: string | null
          created_at: string
          created_by: string
          description: string
          dominant_stimulus: string | null
          energy_glycolytic: number
          energy_oxidative: number
          energy_phosphagen: number
          expected_time_seconds: number | null
          id: string
          intended_stimulus_max: number | null
          intended_stimulus_min: number | null
          primary_limiter: string | null
          scheduled_for: string
          stimulus_description: string | null
          time_cap_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          benchmark_id?: string | null
          box_id?: string | null
          class_size?: number | null
          coaching_goals_text?: string | null
          created_at?: string
          created_by: string
          description: string
          dominant_stimulus?: string | null
          energy_glycolytic?: number
          energy_oxidative?: number
          energy_phosphagen?: number
          expected_time_seconds?: number | null
          id?: string
          intended_stimulus_max?: number | null
          intended_stimulus_min?: number | null
          primary_limiter?: string | null
          scheduled_for?: string
          stimulus_description?: string | null
          time_cap_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          benchmark_id?: string | null
          box_id?: string | null
          class_size?: number | null
          coaching_goals_text?: string | null
          created_at?: string
          created_by?: string
          description?: string
          dominant_stimulus?: string | null
          energy_glycolytic?: number
          energy_oxidative?: number
          energy_phosphagen?: number
          expected_time_seconds?: number | null
          id?: string
          intended_stimulus_max?: number | null
          intended_stimulus_min?: number | null
          primary_limiter?: string | null
          scheduled_for?: string
          stimulus_description?: string | null
          time_cap_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmark_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
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
      is_coach_of_box: {
        Args: { _box_id: string; _user_id: string }
        Returns: boolean
      }
      user_box_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "coach" | "athlete"
      benchmark_category:
        | "girls"
        | "heroes"
        | "open"
        | "quarterfinals"
        | "semifinals"
        | "games"
      experience_level: "beginner" | "intermediate" | "advanced" | "elite"
      gender: "male" | "female" | "other"
      mono_modality:
        | "row"
        | "run"
        | "ski"
        | "bike_erg"
        | "assault_bike"
        | "echo_bike"
      movement_category:
        | "olympic_lift"
        | "power_lift"
        | "gymnastics"
        | "monostructural"
        | "accessory"
      scaling_level: "rx" | "scaled" | "foundations"
      scoring_type: "for_time" | "amrap" | "for_load" | "for_reps" | "emom"
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
      app_role: ["admin", "coach", "athlete"],
      benchmark_category: [
        "girls",
        "heroes",
        "open",
        "quarterfinals",
        "semifinals",
        "games",
      ],
      experience_level: ["beginner", "intermediate", "advanced", "elite"],
      gender: ["male", "female", "other"],
      mono_modality: [
        "row",
        "run",
        "ski",
        "bike_erg",
        "assault_bike",
        "echo_bike",
      ],
      movement_category: [
        "olympic_lift",
        "power_lift",
        "gymnastics",
        "monostructural",
        "accessory",
      ],
      scaling_level: ["rx", "scaled", "foundations"],
      scoring_type: ["for_time", "amrap", "for_load", "for_reps", "emom"],
    },
  },
} as const
