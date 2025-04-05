import { createBrowserClient } from '@supabase/ssr'
import { Project, ProjectWithStatus, ProjectStats } from '@/types'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Calculate project status based on dates and other factors
const calculateProjectStatus = (project: Project): ProjectWithStatus => {
  const now = new Date()
  const startDate = project.start_date ? new Date(project.start_date) : null
  const endDate = project.end_date ? new Date(project.end_date) : null
  
  let status: ProjectWithStatus['status'] = 'Not Started'
  let completion_percentage = 0
  
  // If the project has no dates, it's considered "Not Started"
  if (!startDate && !endDate) {
    status = 'Not Started'
    completion_percentage = 0
  } 
  // If the project has a start date but no end date
  else if (startDate && !endDate) {
    if (startDate > now) {
      status = 'Not Started'
      completion_percentage = 0
    } else {
      status = 'In Progress'
      completion_percentage = 50 // Default to 50% if no end date
    }
  } 
  // If the project has both start and end dates
  else if (startDate && endDate) {
    if (startDate > now) {
      status = 'Not Started'
      completion_percentage = 0
    } else if (endDate < now) {
      status = 'Completed'
      completion_percentage = 100
    } else {
      status = 'In Progress'
      // Calculate percentage based on time elapsed
      const totalDuration = endDate.getTime() - startDate.getTime()
      const elapsedDuration = now.getTime() - startDate.getTime()
      completion_percentage = Math.round((elapsedDuration / totalDuration) * 100)
    }
  }
  
  return {
    ...project,
    status,
    completion_percentage
  }
}

// Get all projects for the current user
export const getProjects = async (): Promise<ProjectWithStatus[]> => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
  
  // Calculate status for each project
  return (projects as Project[]).map(calculateProjectStatus)
}

// Get project statistics
export const getProjectStats = async (): Promise<ProjectStats> => {
  const projects = await getProjects()
  
  const stats: ProjectStats = {
    total: projects.length,
    not_started: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0
  }
  
  // Count projects by status
  projects.forEach(project => {
    switch (project.status) {
      case 'Not Started':
        stats.not_started++
        break
      case 'In Progress':
        stats.in_progress++
        break
      case 'Completed':
        stats.completed++
        break
      case 'On Hold':
        stats.on_hold++
        break
    }
  })
  
  return stats
}

// Create a new project
export const createProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Project> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Add the user_id to the project
  const projectWithUserId = {
    ...project,
    user_id: user.id
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert(projectWithUserId)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating project:', error)
    throw error
  }
  
  return data as Project
}

// Get a single project by ID
export const getProjectById = async (id: string): Promise<ProjectWithStatus | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      return null
    }
    console.error('Error fetching project:', error)
    throw error
  }
  
  return calculateProjectStatus(data as Project)
}

// Update a project
export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First check if the project belongs to the current user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching project for update:', fetchError)
    throw new Error('Project not found or you do not have permission to update it')
  }
  
  // Now update the project
  const { data, error } = await supabase
    .from('projects')
    .update(project)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating project:', error)
    throw error
  }
  
  return data as Project
}

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First check if the project belongs to the current user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching project for deletion:', fetchError)
    throw new Error('Project not found or you do not have permission to delete it')
  }
  
  // Now delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}
