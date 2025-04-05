import { createBrowserClient } from '@supabase/ssr'
import { Boundary, BoundaryType } from '@/types'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get all boundaries for a project
export const getBoundaries = async (projectId: string): Promise<Boundary[]> => {
  const { data: boundaries, error } = await supabase
    .from('boundaries')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching boundaries:', error)
    throw error
  }
  
  return boundaries as Boundary[]
}

// Get a single boundary by ID
export const getBoundaryById = async (id: string): Promise<Boundary | null> => {
  const { data, error } = await supabase
    .from('boundaries')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      return null
    }
    console.error('Error fetching boundary:', error)
    throw error
  }
  
  return data as Boundary
}

// Create a new boundary
export const createBoundary = async (
  projectId: string,
  boundary: {
    name: string
    type: BoundaryType
    description?: string | null
    included: boolean
    notes?: string | null
  }
): Promise<Boundary> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Clean up the description field to ensure it's properly handled
    const cleanedDescription = boundary.description || null
    
    // Add the user_id and project_id to the boundary
    const boundaryWithIds = {
      ...boundary,
      description: cleanedDescription,
      project_id: projectId,
      user_id: user.id
    }
    
    const { data, error } = await supabase
      .from('boundaries')
      .insert(boundaryWithIds)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating boundary:', JSON.stringify(error, null, 2))
      console.error('Boundary data attempted to save:', JSON.stringify(boundaryWithIds, null, 2))
      throw error
    }
    
    return data as Boundary
  } catch (error) {
    console.error('Error creating boundary:', error)
    throw error
  }
}

// Update a boundary
export const updateBoundary = async (
  id: string,
  boundary: Partial<Boundary>
): Promise<Boundary> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // First check if the boundary belongs to the current user
    const { data: existingBoundary, error: fetchError } = await supabase
      .from('boundaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary for update:', fetchError)
      throw new Error('Boundary not found or you do not have permission to update it')
    }
    
    // Clean up the description field to ensure it's properly handled
    const updatedBoundary = {
      ...boundary,
      description: boundary.description || null
    }
    
    // Now update the boundary
    const { data, error } = await supabase
      .from('boundaries')
      .update(updatedBoundary)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating boundary:', JSON.stringify(error, null, 2))
      console.error('Boundary data attempted to update:', JSON.stringify(updatedBoundary, null, 2))
      throw error
    }
    
    return data as Boundary
  } catch (error) {
    console.error('Error updating boundary:', error)
    throw error
  }
}

// Delete a boundary
export const deleteBoundary = async (id: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First check if the boundary belongs to the current user
  const { data: existingBoundary, error: fetchError } = await supabase
    .from('boundaries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching boundary for deletion:', fetchError)
    throw new Error('Boundary not found or you do not have permission to delete it')
  }
  
  // Now delete the boundary
  const { error } = await supabase
    .from('boundaries')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting boundary:', error)
    throw error
  }
}
