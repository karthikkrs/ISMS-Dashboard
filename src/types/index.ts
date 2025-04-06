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
  status?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type BoundaryControlWithDetails = BoundaryControl & {
  controls: Control;
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
