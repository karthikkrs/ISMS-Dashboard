import { createBrowserClient } from '@supabase/ssr'
import { Boundary, BoundaryType } from '@/types'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get all boundaries for a project
export const getBoundaries = async (projectId: string): Promise<Boundary[]> => {
  try {
    console.log('Fetching boundaries for project:', projectId)
    
    const { data: boundaries, error } = await supabase
      .from('boundaries')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching boundaries:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to fetch boundaries: ${error.message}`)
      }
    }
    
    console.log(`Found ${boundaries?.length || 0} boundaries`)
    return boundaries as Boundary[] || []
  } catch (error) {
    console.error('Error in getBoundaries:', error)
    throw error
  }
}

// Get a single boundary by ID
export const getBoundaryById = async (id: string): Promise<Boundary | null> => {
  try {
    console.log('Fetching boundary with ID:', id)
    
    const { data, error } = await supabase
      .from('boundaries')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        console.log('No boundary found with ID:', id)
        return null
      }
      
      console.error('Error fetching boundary:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to fetch boundary: ${error.message}`)
      }
    }
    
    return data as Boundary
  } catch (error) {
    console.error('Error in getBoundaryById:', error)
    throw error
  }
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
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!authData.user) {
      throw new Error('User not authenticated')
    }
    
    // Clean up the description field to ensure it's properly handled
    const cleanedDescription = boundary.description || null
    const cleanedNotes = boundary.notes || null
    
    // Add the user_id and project_id to the boundary
    const boundaryWithIds = {
      ...boundary,
      description: cleanedDescription,
      notes: cleanedNotes,
      project_id: projectId,
      user_id: authData.user.id
    }
    
    // Log the data being sent to the server
    console.log('Sending boundary data:', JSON.stringify(boundaryWithIds, null, 2))
    
    const { data, error } = await supabase
      .from('boundaries')
      .insert(boundaryWithIds)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating boundary:', JSON.stringify(error, null, 2))
      console.error('Boundary data attempted to save:', JSON.stringify(boundaryWithIds, null, 2))
      
      // Check for specific error types
      if (error.code === '23505') {
        throw new Error('A boundary with this name already exists')
      } else if (error.code === '23503') {
        throw new Error('The project ID is invalid or does not exist')
      } else if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to create boundary: ${error.message}`)
      }
    }
    
    if (!data) {
      throw new Error('No data returned from the server')
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
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!authData.user) {
      throw new Error('User not authenticated')
    }
    
    // First check if the boundary belongs to the current user
    const { data: existingBoundary, error: fetchError } = await supabase
      .from('boundaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary for update:', fetchError)
      throw new Error('Boundary not found or you do not have permission to update it')
    }
    
    // Clean up the description field to ensure it's properly handled
    const updatedBoundary = {
      ...boundary,
      description: boundary.description || null,
      notes: boundary.notes || null
    }
    
    // Log the data being sent to the server
    console.log('Sending updated boundary data:', JSON.stringify(updatedBoundary, null, 2))
    
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
      
      // Check for specific error types
      if (error.code === '23505') {
        throw new Error('A boundary with this name already exists')
      } else if (error.code === '23503') {
        throw new Error('The project ID is invalid or does not exist')
      } else if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to update boundary: ${error.message}`)
      }
    }
    
    if (!data) {
      throw new Error('No data returned from the server')
    }
    
    return data as Boundary
  } catch (error) {
    console.error('Error updating boundary:', error)
    throw error
  }
}

// Delete a boundary
export const deleteBoundary = async (id: string): Promise<void> => {
  try {
    // Get the current user
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Authentication error:', authError)
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!authData.user) {
      throw new Error('User not authenticated')
    }
    
    // First check if the boundary belongs to the current user
    const { data: existingBoundary, error: fetchError } = await supabase
      .from('boundaries')
      .select('*')
      .eq('id', id)
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary for deletion:', fetchError)
      throw new Error('Boundary not found or you do not have permission to delete it')
    }
    
    console.log('Deleting boundary with ID:', id)
    
    // Now delete the boundary
    const { error } = await supabase
      .from('boundaries')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting boundary:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '23503') {
        throw new Error('Cannot delete this boundary as it is referenced by other records')
      } else if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to delete boundary: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('Error deleting boundary:', error)
    throw error
  }
}
