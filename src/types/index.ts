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
