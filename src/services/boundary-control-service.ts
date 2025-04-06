import { createBrowserClient } from '@supabase/ssr'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type BoundaryControl = {
  id: string
  boundary_id: string
  control_id: string
  is_applicable: boolean
  reason_inclusion?: string | null
  reason_exclusion?: string | null
  status?: string | null
  user_id: string
  created_at: string
  updated_at: string
}

// Get all boundary controls for a boundary
export const getBoundaryControls = async (boundaryId: string): Promise<BoundaryControl[]> => {
  try {
    console.log('Fetching boundary controls for boundary:', boundaryId)
    
    const { data: boundaryControls, error } = await supabase
      .from('boundary_controls')
      .select('*')
      .eq('boundary_id', boundaryId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching boundary controls:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to fetch boundary controls: ${error.message}`)
      }
    }
    
    console.log(`Found ${boundaryControls?.length || 0} boundary controls`)
    return boundaryControls as BoundaryControl[] || []
  } catch (error) {
    console.error('Error in getBoundaryControls:', error)
    throw error
  }
}

// Get all boundary controls for a project
export const getProjectBoundaryControls = async (projectId: string): Promise<BoundaryControl[]> => {
  try {
    console.log('Fetching boundary controls for project:', projectId)
    
    // First get all boundaries for the project
    const { data: boundaries, error: boundariesError } = await supabase
      .from('boundaries')
      .select('id')
      .eq('project_id', projectId)
    
    if (boundariesError) {
      console.error('Error fetching boundaries:', JSON.stringify(boundariesError, null, 2))
      throw new Error(`Failed to fetch boundaries: ${boundariesError.message}`)
    }
    
    if (!boundaries || boundaries.length === 0) {
      return []
    }
    
    // Get all boundary controls for these boundaries
    const boundaryIds = boundaries.map(b => b.id)
    const { data: boundaryControls, error } = await supabase
      .from('boundary_controls')
      .select('*')
      .in('boundary_id', boundaryIds)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching boundary controls:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch boundary controls: ${error.message}`)
    }
    
    console.log(`Found ${boundaryControls?.length || 0} boundary controls for project`)
    return boundaryControls as BoundaryControl[] || []
  } catch (error) {
    console.error('Error in getProjectBoundaryControls:', error)
    throw error
  }
}

// Create a new boundary control
export const createBoundaryControl = async (
  boundaryId: string,
  controlId: string,
  data: {
    is_applicable?: boolean
    reason_inclusion?: string | null
    reason_exclusion?: string | null
    status?: string | null
  }
): Promise<BoundaryControl> => {
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
    
    // Add the user_id, boundary_id, and control_id to the data
    const boundaryControlData = {
      ...data,
      boundary_id: boundaryId,
      control_id: controlId,
      user_id: authData.user.id,
      is_applicable: data.is_applicable !== undefined ? data.is_applicable : true
    }
    
    // Log the data being sent to the server
    console.log('Sending boundary control data:', JSON.stringify(boundaryControlData, null, 2))
    
    const { data: result, error } = await supabase
      .from('boundary_controls')
      .insert(boundaryControlData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating boundary control:', JSON.stringify(error, null, 2))
      
      // Check for specific error types
      if (error.code === '23505') {
        throw new Error('This control is already associated with this boundary')
      } else if (error.code === '23503') {
        throw new Error('The boundary or control ID is invalid or does not exist')
      } else if (error.code === '42P01') {
        throw new Error('Database table not found. Please contact support.')
      } else if (error.code === '42501') {
        throw new Error('Permission denied. You may not have the right access level.')
      } else {
        throw new Error(`Failed to create boundary control: ${error.message}`)
      }
    }
    
    if (!result) {
      throw new Error('No data returned from the server')
    }
    
    return result as BoundaryControl
  } catch (error) {
    console.error('Error creating boundary control:', error)
    throw error
  }
}

// Update a boundary control
export const updateBoundaryControl = async (
  id: string,
  data: Partial<BoundaryControl>
): Promise<BoundaryControl> => {
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
    
    // First check if the boundary control belongs to the current user
    const { data: existingBoundaryControl, error: fetchError } = await supabase
      .from('boundary_controls')
      .select('*')
      .eq('id', id)
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary control for update:', fetchError)
      throw new Error('Boundary control not found or you do not have permission to update it')
    }
    
    // Remove id, user_id, boundary_id, and control_id from the data to prevent changing them
    const { id: _, user_id: __, boundary_id: ___, control_id: ____, ...updateData } = data
    
    // Log the data being sent to the server
    console.log('Sending updated boundary control data:', JSON.stringify(updateData, null, 2))
    
    // Now update the boundary control
    const { data: result, error } = await supabase
      .from('boundary_controls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating boundary control:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to update boundary control: ${error.message}`)
    }
    
    if (!result) {
      throw new Error('No data returned from the server')
    }
    
    return result as BoundaryControl
  } catch (error) {
    console.error('Error updating boundary control:', error)
    throw error
  }
}

// Delete a boundary control
export const deleteBoundaryControl = async (id: string): Promise<void> => {
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
    
    // First check if the boundary control belongs to the current user
    const { data: existingBoundaryControl, error: fetchError } = await supabase
      .from('boundary_controls')
      .select('*')
      .eq('id', id)
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary control for deletion:', fetchError)
      throw new Error('Boundary control not found or you do not have permission to delete it')
    }
    
    console.log('Deleting boundary control with ID:', id)
    
    // Now delete the boundary control
    const { error } = await supabase
      .from('boundary_controls')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting boundary control:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to delete boundary control: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting boundary control:', error)
    throw error
  }
}

// Get all controls for a project that are not associated with a specific boundary
export const getUnassociatedControls = async (projectId: string, boundaryId: string): Promise<any[]> => {
  try {
    console.log('Fetching unassociated controls for boundary:', boundaryId)
    
    // Get all controls that are already associated with this boundary
    const { data: associatedControls, error: associatedError } = await supabase
      .from('boundary_controls')
      .select('control_id')
      .eq('boundary_id', boundaryId)
    
    if (associatedError) {
      console.error('Error fetching associated controls:', JSON.stringify(associatedError, null, 2))
      throw new Error(`Failed to fetch associated controls: ${associatedError.message}`)
    }
    
    // Get all controls
    const { data: allControls, error: controlsError } = await supabase
      .from('controls')
      .select('*')
      .order('reference', { ascending: true })
    
    if (controlsError) {
      console.error('Error fetching controls:', JSON.stringify(controlsError, null, 2))
      throw new Error(`Failed to fetch controls: ${controlsError.message}`)
    }
    
    // Filter out controls that are already associated with this boundary
    const associatedControlIds = associatedControls?.map(c => c.control_id) || []
    const unassociatedControls = allControls?.filter(c => !associatedControlIds.includes(c.id)) || []
    
    console.log(`Found ${unassociatedControls.length} unassociated controls`)
    return unassociatedControls
  } catch (error) {
    console.error('Error in getUnassociatedControls:', error)
    throw error
  }
}

// Get all controls for a boundary with full control details
export const getBoundaryControlsWithDetails = async (boundaryId: string): Promise<any[]> => {
  try {
    console.log('Fetching boundary controls with details for boundary:', boundaryId)
    
    const { data, error } = await supabase
      .from('boundary_controls')
      .select(`
        *,
        controls:control_id (*)
      `)
      .eq('boundary_id', boundaryId)
    
    if (error) {
      console.error('Error fetching boundary controls with details:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch boundary controls with details: ${error.message}`)
    }
    
    console.log(`Found ${data?.length || 0} boundary controls with details`)
    return data || []
  } catch (error) {
    console.error('Error in getBoundaryControlsWithDetails:', error)
    throw error
  }
}
