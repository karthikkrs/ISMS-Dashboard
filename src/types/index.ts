export type Project = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: number; // Add integer status field from DB (0: Not Started, 1: In Progress, 2: Completed, 3: On Hold)
  // Phase completion timestamps
  boundaries_completed_at?: string | null;
  stakeholders_completed_at?: string | null;
  soa_completed_at?: string | null;
  soa_completed_at_completed_at?: string | null; // Add the expected column
  evidence_gaps_completed_at?: string | null;
  objectives_completed_at?: string | null; // Keep for now, might be used elsewhere
  questionnaire_completed_at?: string | null; // Add questionnaire completion timestamp
};

// Keep string status type for display/logic - Removed 'Not Started'
export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold';

// This type now represents the project data *after* processing in the service
// Ensure all relevant fields from Project are included, especially completion timestamps
export type ProjectWithStatus = Omit<Project, 'status' | 'completion_percentage'> & {
  status: ProjectStatus; // Use the derived string status
  // Explicitly include completion timestamps if needed by components using this type
  boundaries_completed_at?: string | null;
  stakeholders_completed_at?: string | null;
  soa_completed_at?: string | null;
  soa_completed_at_completed_at?: string | null;
  evidence_gaps_completed_at?: string | null;
  objectives_completed_at?: string | null;
  questionnaire_completed_at?: string | null;
};


export type ProjectStats = {
  total: number;
  // Removed not_started
  in_progress: number;
  completed: number;
  on_hold: number;
};

// Boundary types for Module 3
export type BoundaryType = 'Department' | 'System' | 'Location' | 'Other';

// Removed manual Boundary type definition - Use Tables<'boundaries'> from database.types.ts instead

// Control types
export type Control = {
  id: string;
  reference: string;
  description: string;
  domain: string; // Added domain field
  created_at: string;
};

// Boundary Control types
// Define compliance statuses as a const array that can be reused
export const complianceStatuses = ['Compliant', 'Partially Compliant', 'Non Compliant', 'Not Assessed'] as const;
export type ComplianceStatus = typeof complianceStatuses[number];

export type BoundaryControl = {
  id: string;
  boundary_id: string;
  control_id: string;
  is_applicable: boolean;
  reason_inclusion?: string | null;
  reason_exclusion?: string | null;
  status?: string | null; // SOA status (e.g., Implemented)
  compliance_status?: ComplianceStatus | null; // Use the centralized ComplianceStatus type
  assessment_date?: string | null;
  assessment_notes?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

import { Tables } from './database.types'; // Import Tables helper

// Type for BoundaryControl joined with Control and Boundary details
export type BoundaryControlWithDetails = BoundaryControl & {
  controls: Control; // Control type already includes domain
  boundaries: Pick<Tables<'boundaries'>, 'id' | 'name'> | null; // Use generated type for Pick
};

// Removed Objective types

// Stakeholder types for Module 5
export type Stakeholder = {
  id: string;
  project_id: string;
  name: string;
  role?: string;
  email?: string;
  responsibilities?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
};

// Evidence types
export type Evidence = {
  id: string;
  project_id: string; // Add project_id
  control_id: string; // Add control_id
  boundary_control_id: string;
  title: string;
  description?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  uploaded_by: string; // user_id
  created_at: string;
  updated_at: string;
};

// Gap types
export type GapSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type GapStatus = 'Identified' | 'In Review' | 'Confirmed' | 'Remediated' | 'Closed';

export type Gap = {
  id: string;
  project_id: string; // Add project_id
  control_id: string; // Add control_id
  boundary_control_id: string;
  title: string; // Add title field
  description: string;
  severity: GapSeverity;
  status: GapStatus;
  identified_by: string; // user_id
  identified_at: string;
  updated_at: string;
};
