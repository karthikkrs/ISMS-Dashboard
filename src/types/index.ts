export type Project = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

export type ProjectWithStatus = Project & {
  status: ProjectStatus;
  completion_percentage: number;
};

export type ProjectStats = {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  on_hold: number;
};

// Boundary types for Module 3
export type BoundaryType = 'Department' | 'System' | 'Location' | 'Other';

export type Boundary = {
  id: string;
  project_id: string;
  name: string;
  type: BoundaryType;
  description: string | null;
  included: boolean;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// Control types
export type Control = {
  id: string;
  reference: string;
  description: string;
  domain: string; // Added domain field
  created_at: string;
};

// Boundary Control types
export type BoundaryControl = {
  id: string;
  boundary_id: string;
  control_id: string;
  is_applicable: boolean;
  reason_inclusion?: string | null;
  reason_exclusion?: string | null;
  status?: string | null; // SOA status (e.g., Implemented)
  compliance_status?: 'Compliant' | 'Partially Compliant' | 'Non Compliant' | 'Not Assessed' | null; // New compliance status
  assessment_date?: string | null; // New assessment date
  assessment_notes?: string | null; // New assessment notes
  user_id: string;
  created_at: string;
  updated_at: string;
};

// Type for BoundaryControl joined with Control and Boundary details
export type BoundaryControlWithDetails = BoundaryControl & {
  controls: Control; // Control type already includes domain
  boundaries: Pick<Boundary, 'id' | 'name'> | null; // Add joined boundary name
};

// Objective types for Module 4
export type ObjectivePriority = 'High' | 'Medium' | 'Low';

export type Objective = {
  id: string;
  project_id: string;
  statement: string;
  priority: ObjectivePriority;
  order?: number;
  user_id: string;
  created_at: string;
  updated_at?: string;
};

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
  boundary_control_id: string;
  description: string;
  severity: GapSeverity;
  status: GapStatus;
  identified_by: string; // user_id
  identified_at: string;
  updated_at: string;
};
