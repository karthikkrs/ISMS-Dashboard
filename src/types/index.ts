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
