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
      boundaries: {
        Row: {
          asset_value_qualitative: string | null
          asset_value_quantitative: number | null
          created_at: string | null
          description: string | null
          id: string
          included: boolean
          name: string
          notes: string | null
          project_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_value_qualitative?: string | null
          asset_value_quantitative?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          included?: boolean
          name: string
          notes?: string | null
          project_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_value_qualitative?: string | null
          asset_value_quantitative?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          included?: boolean
          name?: string
          notes?: string | null
          project_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boundaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      boundary_controls: {
        Row: {
          assessment_date: string | null
          assessment_notes: string | null
          boundary_id: string
          compliance_status: string | null
          control_id: string
          created_at: string | null
          id: string
          is_applicable: boolean | null
          reason_exclusion: string | null
          reason_inclusion: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_date?: string | null
          assessment_notes?: string | null
          boundary_id: string
          compliance_status?: string | null
          control_id: string
          created_at?: string | null
          id?: string
          is_applicable?: boolean | null
          reason_exclusion?: string | null
          reason_inclusion?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_date?: string | null
          assessment_notes?: string | null
          boundary_id?: string
          compliance_status?: string | null
          control_id?: string
          created_at?: string | null
          id?: string
          is_applicable?: boolean | null
          reason_exclusion?: string | null
          reason_inclusion?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boundary_controls_boundary_id_fkey"
            columns: ["boundary_id"]
            isOneToOne: false
            referencedRelation: "boundaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boundary_controls_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
        ]
      }
      controls: {
        Row: {
          created_at: string | null
          description: string
          domain: string | null
          id: string
          reference: string
        }
        Insert: {
          created_at?: string | null
          description: string
          domain?: string | null
          id?: string
          reference: string
        }
        Update: {
          created_at?: string | null
          description?: string
          domain?: string | null
          id?: string
          reference?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          boundary_control_id: string | null
          control_id: string
          created_at: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          project_id: string
          title: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          boundary_control_id?: string | null
          control_id: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          project_id: string
          title: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          boundary_control_id?: string | null
          control_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_boundary_control_id_fkey"
            columns: ["boundary_control_id"]
            isOneToOne: false
            referencedRelation: "boundary_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gaps: {
        Row: {
          boundary_control_id: string | null
          control_id: string
          description: string
          id: string
          identified_at: string | null
          identified_by: string
          project_id: string
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          boundary_control_id?: string | null
          control_id: string
          description: string
          id?: string
          identified_at?: string | null
          identified_by: string
          project_id: string
          severity: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          boundary_control_id?: string | null
          control_id?: string
          description?: string
          id?: string
          identified_at?: string | null
          identified_by?: string
          project_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gaps_boundary_control_id_fkey"
            columns: ["boundary_control_id"]
            isOneToOne: false
            referencedRelation: "boundary_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaps_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_questionnaire_answers: {
        Row: {
          answer_status: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string | null
          evidence_notes: string | null
          id: string
          project_id: string
          question_id: string
          updated_at: string | null
        }
        Insert: {
          answer_status?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          evidence_notes?: string | null
          id?: string
          project_id: string
          question_id: string
          updated_at?: string | null
        }
        Update: {
          answer_status?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          evidence_notes?: string | null
          id?: string
          project_id?: string
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_questionnaire_answers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_questionnaire_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          boundaries_completed_at: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          evidence_gaps_completed_at: string | null
          id: string
          name: string
          objectives_completed_at: string | null
          questionnaire_completed_at: string | null
          soa_completed_at: string | null
          soa_completed_at_completed_at: string | null
          stakeholders_completed_at: string | null
          start_date: string | null
          status: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boundaries_completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          evidence_gaps_completed_at?: string | null
          id?: string
          name: string
          objectives_completed_at?: string | null
          questionnaire_completed_at?: string | null
          soa_completed_at?: string | null
          soa_completed_at_completed_at?: string | null
          stakeholders_completed_at?: string | null
          start_date?: string | null
          status?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boundaries_completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          evidence_gaps_completed_at?: string | null
          id?: string
          name?: string
          objectives_completed_at?: string | null
          questionnaire_completed_at?: string | null
          soa_completed_at?: string | null
          soa_completed_at_completed_at?: string | null
          stakeholders_completed_at?: string | null
          start_date?: string | null
          status?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questionnaire_questions: {
        Row: {
          created_at: string | null
          guidance: string | null
          id: string
          iso_domain: string
          question_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          guidance?: string | null
          id?: string
          iso_domain: string
          question_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          guidance?: string | null
          id?: string
          iso_domain?: string
          question_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      remediation_plans: {
        Row: {
          action_item: string
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          gap_id: string
          id: string
          priority: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_item: string
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          gap_id: string
          id?: string
          priority: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_item?: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          gap_id?: string
          id?: string
          priority?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remediation_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_plans_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "gaps"
            referencedColumns: ["id"]
          },
        ]
      }
      remediation_updates: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          remediation_plan_id: string
          updated_by: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          remediation_plan_id: string
          updated_by: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          remediation_plan_id?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "remediation_updates_remediation_plan_id_fkey"
            columns: ["remediation_plan_id"]
            isOneToOne: false
            referencedRelation: "remediation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          assessment_date: string | null
          assessment_notes: string | null
          assessor_id: string | null
          boundary_id: string
          calculated_risk_value: number | null
          control_id: string | null
          created_at: string | null
          gap_id: string | null
          id: string
          likelihood_frequency_input: Json | null
          loss_magnitude_input: Json | null
          project_id: string
          threat_scenario_id: string
          updated_at: string | null
        }
        Insert: {
          assessment_date?: string | null
          assessment_notes?: string | null
          assessor_id?: string | null
          boundary_id: string
          calculated_risk_value?: number | null
          control_id?: string | null
          created_at?: string | null
          gap_id?: string | null
          id?: string
          likelihood_frequency_input?: Json | null
          loss_magnitude_input?: Json | null
          project_id: string
          threat_scenario_id: string
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string | null
          assessment_notes?: string | null
          assessor_id?: string | null
          boundary_id?: string
          calculated_risk_value?: number | null
          control_id?: string | null
          created_at?: string | null
          gap_id?: string | null
          id?: string
          likelihood_frequency_input?: Json | null
          loss_magnitude_input?: Json | null
          project_id?: string
          threat_scenario_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_boundary_id_fkey"
            columns: ["boundary_id"]
            isOneToOne: false
            referencedRelation: "boundaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "gaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_threat_scenario_id_fkey"
            columns: ["threat_scenario_id"]
            isOneToOne: false
            referencedRelation: "threat_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_remediation_links: {
        Row: {
          created_at: string | null
          id: string
          remediation_plan_id: string
          risk_assessment_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          remediation_plan_id: string
          risk_assessment_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          remediation_plan_id?: string
          risk_assessment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_remediation_links_remediation_plan_id_fkey"
            columns: ["remediation_plan_id"]
            isOneToOne: false
            referencedRelation: "remediation_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_remediation_links_risk_assessment_id_fkey"
            columns: ["risk_assessment_id"]
            isOneToOne: false
            referencedRelation: "risk_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      soa: {
        Row: {
          control_id: string
          created_at: string | null
          id: string
          is_applicable: boolean | null
          project_id: string
          reason_exclusion: string | null
          reason_inclusion: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          control_id: string
          created_at?: string | null
          id?: string
          is_applicable?: boolean | null
          project_id: string
          reason_exclusion?: string | null
          reason_inclusion?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string | null
          id?: string
          is_applicable?: boolean | null
          project_id?: string
          reason_exclusion?: string | null
          reason_inclusion?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soa_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soa_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sows: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          project_id: string
          responsibilities: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          project_id: string
          responsibilities?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          project_id?: string
          responsibilities?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_scenarios: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          relevant_iso_domains: string[] | null
          threat_actor_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          relevant_iso_domains?: string[] | null
          threat_actor_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          relevant_iso_domains?: string[] | null
          threat_actor_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

// Corrected Helper Types (Removed erroneous newlines)
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
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
  : PublicTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
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
  : PublicTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][PublicEnumNameOrOptions]
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

// Removed the potentially problematic Constants export
// export const Constants = {
//   public: {
//     Enums: {},
//   },
// } as const
