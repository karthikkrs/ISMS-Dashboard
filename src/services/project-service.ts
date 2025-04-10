import { createBrowserClient } from '@supabase/ssr';
import { Project, ProjectWithStatus, ProjectStats, ProjectStatus } from '@/types'; // Import ProjectStatus

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Status Mapping --- (Removed 'Not Started' / 0)
const statusMap: { [key: number]: ProjectStatus } = {
  1: 'In Progress',
  2: 'Completed',
  3: 'On Hold',
};

const reverseStatusMap: { [key in ProjectStatus]: number } = {
  'In Progress': 1,
  'Completed': 2,
  'On Hold': 3,
};

const mapDbStatusToString = (dbStatus: number | null | undefined): ProjectStatus => {
  // Ensure dbStatus is treated as a number, default to 1 ('In Progress') if null/undefined
  const numericStatus = typeof dbStatus === 'number' ? dbStatus : 1; // Default to 1
  return statusMap[numericStatus] || 'In Progress'; // Default to 'In Progress' if invalid number
};

const mapStringStatusToDb = (stringStatus: ProjectStatus): number => {
  // Default to 1 ('In Progress') if invalid string or 'Not Started' is somehow passed
  return reverseStatusMap[stringStatus] ?? 1; 
};
// --- End Status Mapping ---


// Process raw project data from DB into the display format (ProjectWithStatus)
const processProjectData = (project: Project): ProjectWithStatus => {
  const now = new Date();
  const startDate = project.start_date ? new Date(project.start_date) : null;
  const endDate = project.end_date ? new Date(project.end_date) : null;

  let derivedStatus: ProjectStatus;

  // 1. Check for manual 'On Hold' status first
  if (project.status === 3) { // 3 corresponds to 'On Hold'
    derivedStatus = 'On Hold';
  } 
  // 2. Check if all phases are completed
  else if (
    // Removed project.objectives_completed_at &&
    project.boundaries_completed_at &&
    project.stakeholders_completed_at &&
    project.soa_completed_at &&
    project.evidence_gaps_completed_at
  ) {
    derivedStatus = 'Completed';
  }
  // 3. Check if dates are set and valid for 'In Progress'
  else if (startDate && endDate && endDate > startDate && startDate <= now) {
     // Dates are set, end date is after start date, and start date is not in the future
     derivedStatus = 'In Progress';
  }
  // 4. Check if dates are set for 'In Progress' (but respect DB status 1)
  else if (startDate && endDate && endDate > startDate && startDate <= now) {
     derivedStatus = 'In Progress';
  }
  // 5. If DB status is 1 ('In Progress') but dates don't match above, still keep 'In Progress'
  else if (project.status === 1) {
     derivedStatus = 'In Progress';
  }
  // 6. Otherwise, default to 'In Progress'
  else {
    derivedStatus = 'In Progress'; // Default to In Progress
  }

  // Omit the raw integer status and completion_percentage from the final object
  // Note: ProjectWithStatus type in types/index.ts also needs completion_percentage removed
  // Explicitly include all fields expected by ProjectWithStatus, especially completion timestamps
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    start_date: project.start_date,
    end_date: project.end_date,
    user_id: project.user_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    // Include all completion timestamps defined in the Project type
    boundaries_completed_at: project.boundaries_completed_at,
    stakeholders_completed_at: project.stakeholders_completed_at,
    questionnaire_completed_at: project.questionnaire_completed_at, // Add this
    soa_completed_at: project.soa_completed_at,
    soa_completed_at_completed_at: project.soa_completed_at_completed_at, // Keep if exists
    evidence_gaps_completed_at: project.evidence_gaps_completed_at,
    objectives_completed_at: project.objectives_completed_at, // Keep if exists
    // Set the derived status
    status: derivedStatus,
  };
};


// Get all projects for the current user
export const getProjects = async (): Promise<ProjectWithStatus[]> => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  // Process status for each project
  return (projects as Project[]).map(processProjectData);
};

// Get project statistics
export const getProjectStats = async (): Promise<ProjectStats> => {
  // Fetch raw projects to avoid dependency on potentially outdated ProjectWithStatus
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error('Error fetching projects for stats:', error);
    throw error;
  }

  const stats: ProjectStats = {
    total: projects?.length || 0,
    // Removed not_started
    in_progress: 0,
    completed: 0,
    on_hold: 0,
  };

  // Count projects by the processed string status
  projects.forEach(project => {
    // Get the processed status string
    const processedStatus = processProjectData(project).status; 
    switch (processedStatus) { // Use processedStatus
      // Removed 'Not Started' case
      case 'In Progress':
        stats.in_progress++;
        break;
      case 'Completed':
        stats.completed++;
        break;
      case 'On Hold':
        stats.on_hold++;
        break;
    }
  });

  return stats;
};

// Create a new project (accepts optional string status, converts to int for DB)
export const createProject = async (projectCreateData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'> & { status?: ProjectStatus }): Promise<ProjectWithStatus> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Map string status to integer if provided, otherwise default to 1 ('In Progress')
  const dbInsertData: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
    ...projectCreateData,
    user_id: user.id,
    status: projectCreateData.status ? mapStringStatusToDb(projectCreateData.status) : 1, // Default to 1 ('In Progress')
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(dbInsertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  // Return the processed project data with string status
  return processProjectData(data as Project);
};


// Get a single project by ID (accepts optional client for server-side use)
export const getProjectById = async (id: string, client?: any): Promise<ProjectWithStatus | null> => {
  const supabaseClient = client || supabase; // Use passed client or default browser client
  
  const { data, error } = await supabaseClient
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      return null;
    }
    console.error('Error fetching project:', error);
    throw error;
  }

  // Process the raw DB data
  return processProjectData(data as Project);
};

// Update a project (accepts string status, converts to int for DB)
export const updateProject = async (id: string, projectUpdateData: Partial<Omit<Project, 'status'> & { status?: ProjectStatus }>): Promise<ProjectWithStatus> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First check if the project belongs to the current user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id') // Select only necessary fields
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('Error fetching project for update:', fetchError);
    throw new Error('Project not found or you do not have permission to update it');
  }

  // Separate status handling from the rest of the update data
  const { status: stringStatus, ...restUpdateData } = projectUpdateData;
  const dbUpdateData: Partial<Project> = { ...restUpdateData }; // Spread only non-status fields

  // Map string status to integer if it was provided
  if (stringStatus) {
      dbUpdateData.status = mapStringStatusToDb(stringStatus);
  }


  // Now update the project in the database
  const { data, error } = await supabase
    .from('projects')
    .update(dbUpdateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  // Return the processed project data with string status
  return processProjectData(data as Project);
};

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First check if the project belongs to the current user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id') // Select only necessary fields
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error('Error fetching project for deletion:', fetchError);
    throw new Error('Project not found or you do not have permission to delete it');
  }

  // Now delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Function to mark a specific phase as complete
export const markProjectPhaseComplete = async (projectId: string, phase: keyof Pick<Project, 'questionnaire_completed_at' | 'objectives_completed_at' | 'boundaries_completed_at' | 'stakeholders_completed_at' | 'soa_completed_at' | 'soa_completed_at_completed_at' | 'evidence_gaps_completed_at'>): Promise<ProjectWithStatus> => { // Added questionnaire_completed_at
   // Get the current user
   const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check ownership
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error(`Error fetching project ${projectId} for phase update:`, fetchError);
    throw new Error('Project not found or you do not have permission to update it');
  }

  // Prepare update data
  const updateData: Partial<Project> = {
    [phase]: new Date().toISOString(), // Use the phase name directly as the key
  };

  // Step 1: Update the project phase completion timestamp
  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (updateError) {
    console.error(`Error updating phase ${phase} for project ${projectId}:`, updateError);
    throw updateError; // Throw the update error
  }

  // Step 2: If update was successful, fetch the updated project data
  const { data, error: selectError } = await supabase
    .from('projects')
    .select('*') // Select all columns now that update is separate
    .eq('id', projectId)
    .single();
  
  if (selectError) {
    console.error(`Error fetching project ${projectId} after phase update:`, selectError);
    throw selectError; // Throw the select error
  }

  if (!data) {
    throw new Error(`Project ${projectId} not found after phase update.`);
  }

  // Return processed data (original error handling for processing can remain)
  try {
    return processProjectData(data as Project);
  } catch (processingError) {
    console.error(`Error processing project data after phase update for ${projectId}:`, processingError);
    throw processingError; // Corrected variable name
  }

  // This line is now unreachable due to the try/catch, removing it.
};

// Type for valid phase column names
export type ProjectPhaseColumn = keyof Pick<Project, 'questionnaire_completed_at' | /* 'objectives_completed_at' | */ 'boundaries_completed_at' | 'stakeholders_completed_at' | 'soa_completed_at' | 'soa_completed_at_completed_at' | 'evidence_gaps_completed_at'>; // Added questionnaire_completed_at


// Function to UNMARK a specific phase as complete (set timestamp to null)
export const unmarkProjectPhaseComplete = async (projectId: string, phase: ProjectPhaseColumn): Promise<void> => {
   // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check ownership (optional but good practice)
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    console.error(`Error fetching project ${projectId} for phase unmark:`, fetchError);
    throw new Error('Project not found or you do not have permission to update it');
  }

  // Prepare update data to set the phase timestamp to null
  const updateData: Partial<Project> = {
    [phase]: null,
  };

  // Update the project phase completion timestamp
  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (updateError) {
    console.error(`Error unmarking phase ${phase} for project ${projectId}:`, updateError);
    throw updateError; 
  }
  console.log(`Phase ${phase} unmarked for project ${projectId}`);
};
