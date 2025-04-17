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
      risk_assessments: {
        Row: {
          ale: number | null
          aro: number
          assessment_date: string | null
          assessment_notes: string | null
          assessor_id: string | null
          boundary_id: string
          created_at: string | null
          gap_id: string | null
          id: string
          likelihood_frequency_input: Json | null
          loss_magnitude_input: Json | null
          project_id: string
          severity: string
          sle: number
          sle_direct_operational_costs: number | null
          sle_technical_remediation_costs: number | null
          sle_data_related_costs: number | null
          sle_compliance_legal_costs: number | null
          sle_reputational_management_costs: number | null
          threat_scenario_id: string
          updated_at: string | null
        }
        Insert: {
          ale?: number | null
          aro: number
          assessment_date?: string | null
          assessment_notes?: string | null
          assessor_id?: string | null
          boundary_id: string
          created_at?: string | null
          gap_id?: string | null
          id?: string
          likelihood_frequency_input?: Json | null
          loss_magnitude_input?: Json | null
          project_id: string
          severity: string
          sle: number
          sle_direct_operational_costs?: number | null
          sle_technical_remediation_costs?: number | null
          sle_data_related_costs?: number | null
          sle_compliance_legal_costs?: number | null
          sle_reputational_management_costs?: number | null
          threat_scenario_id: string
          updated_at?: string | null
        }
        Update: {
          ale?: number | null
          aro?: number
          assessment_date?: string | null
          assessment_notes?: string | null
          assessor_id?: string | null
          boundary_id?: string
          created_at?: string | null
          gap_id?: string | null
          id?: string
          likelihood_frequency_input?: Json | null
          loss_magnitude_input?: Json | null
          project_id?: string
          severity?: string
          sle?: number
          sle_direct_operational_costs?: number | null
          sle_technical_remediation_costs?: number | null
          sle_data_related_costs?: number | null
          sle_compliance_legal_costs?: number | null
          sle_reputational_management_costs?: number | null
          threat_scenario_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          gap_id: string | null
          id: string
          mitre_techniques: string[] | null
          name: string
          project_id: string
          threat_actor_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gap_id?: string | null
          id?: string
          mitre_techniques?: string[] | null
          name: string
          project_id: string
          threat_actor_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gap_id?: string | null
          id?: string
          mitre_techniques?: string[] | null
          name?: string
          project_id?: string
          threat_actor_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_scenarios_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "gaps"
            referencedColumns: ["id"]
          },
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
    Enums: {},
  },
} as const
