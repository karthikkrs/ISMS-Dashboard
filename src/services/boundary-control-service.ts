import { BoundaryControl, BoundaryControlWithDetails, Control } from '@/types'
import { createClient } from '@/utils/supabase/client'

// Create a properly typed Supabase client for client components
const supabase = createClient()

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

// Get all boundary controls for a project with full control details
export const getProjectBoundaryControlsWithDetails = async (projectId: string): Promise<BoundaryControlWithDetails[]> => {
  try {
    console.log('Fetching boundary controls with details for project:', projectId);

    // 1. Get all boundary IDs for the project
    const { data: boundaries, error: boundariesError } = await supabase
      .from('boundaries')
      .select('id')
      .eq('project_id', projectId);

    if (boundariesError) {
      console.error('Error fetching boundaries for project:', JSON.stringify(boundariesError, null, 2));
      throw new Error(`Failed to fetch boundaries: ${boundariesError.message}`);
    }

    if (!boundaries || boundaries.length === 0) {
      console.log('No boundaries found for project:', projectId);
      return []; // No boundaries means no boundary controls
    }

    const boundaryIds = boundaries.map(b => b.id);
    console.log('Found boundary IDs:', boundaryIds);

    // 2. Fetch boundary controls associated with these boundaries, joining with controls and boundaries tables
    const { data, error } = await supabase
      .from('boundary_controls')
      .select(`
        *,
        controls:control_id (id, reference, description, domain, created_at), 
        boundaries:boundary_id (id, name) 
      `)
      .in('boundary_id', boundaryIds); // Filter by the project's boundary IDs

    if (error) {
      console.error('Error fetching project boundary controls with details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to fetch project boundary controls with details: ${error.message}`);
    }

    console.log(`Found ${data?.length || 0} boundary controls with details for project ${projectId}`);
    return data as BoundaryControlWithDetails[] || [];
  } catch (error) {
    console.error('Error in getProjectBoundaryControlsWithDetails:', error);
    throw error;
  }
};

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
    // Check if the control is already associated with the boundary
    const { data: existing, error: checkError } = await supabase
      .from('boundary_controls')
      .select('id')
      .eq('boundary_id', boundaryId)
      .eq('control_id', controlId)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    if (checkError) {
      console.error('Error checking for existing boundary control:', JSON.stringify(checkError, null, 2));
      throw new Error(`Failed to check for existing boundary control: ${checkError.message}`);
    }

    if (existing) {
      console.warn(`Boundary control already exists for boundary ${boundaryId} and control ${controlId}. ID: ${existing.id}`);
      // Throw the specific error that the UI might expect or handle
      throw new Error('This control is already associated with this boundary');
    }

    // Get the current user with extra debugging
    console.log('Getting current user for createBoundaryControl');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', JSON.stringify(authError, null, 2));
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    if (!authData.user) {
      console.error('No user data returned from auth.getUser()');
      // Don't throw an error immediately, try to proceed with the insert
      console.warn('Proceeding with insert without authenticated user (this might fail)');
    } else {
      console.log('User authenticated:', authData.user.id);
    }
    
    // Add the user_id, boundary_id, and control_id to the data
    const boundaryControlData = {
      ...data,
      boundary_id: boundaryId,
      control_id: controlId,
      // Try to use the user ID if available, otherwise use a placeholder
      user_id: authData.user?.id || 'unknown-user',
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
    
    // Removed unmark call
    
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
    
    // First verify if the boundary control belongs to the current user (only select the id)
    const { error: fetchError } = await supabase
      .from('boundary_controls')
      .select('id')
      .eq('id', id)
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching boundary control for update:', fetchError)
      throw new Error('Boundary control not found or you do not have permission to update it')
    }
    
    // Instead of destructuring and creating unused variables, filter out the fields we don't want to update
    const updateData = { ...data };
    // Delete the fields we don't want to update
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.boundary_id;
    delete updateData.control_id;
    
    // Log the data being sent to the server
    console.log('Sending updated boundary control data:', JSON.stringify(updateData, null, 2))
    
    // Now update the boundary control
    console.log('Updating boundary control:', id, 'with data:', JSON.stringify(updateData, null, 2));
    const { data: result, error } = await supabase
      .from('boundary_controls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    console.log('Update result:', result ? 'Success' : 'No result', error ? `Error: ${error.message}` : 'No error');
    
    if (error) {
      console.error('Error updating boundary control:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to update boundary control: ${error.message}`)
    }
    
    if (!result) {
      throw new Error('No data returned from the server')
    }
    
    // Removed unmark call
    
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
    
    // First verify if the boundary control belongs to the current user (only select the id)
    const { error: fetchError } = await supabase
      .from('boundary_controls')
      .select('id')
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
    // Removed unmark call

  } catch (error) {
    console.error('Error deleting boundary control:', error)
    throw error
  }
}

// Get all controls for a project that are not associated with a specific boundary
export const getUnassociatedControls = async (projectId: string, boundaryId: string): Promise<Control[]> => {
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
    return unassociatedControls as Control[]
  } catch (error) {
    console.error('Error in getUnassociatedControls:', error)
    throw error
  }
}

// Get all controls for a boundary with full control details
export const getBoundaryControlsWithDetails = async (boundaryId: string): Promise<BoundaryControlWithDetails[]> => {
  try {
    console.log('Fetching boundary controls with details for boundary:', boundaryId)
    
    const { data, error } = await supabase
      .from('boundary_controls')
      .select(`
        *,
        controls:control_id (id, reference, description, domain, created_at),
        boundaries:boundary_id (id, name, type)
      `)
      .eq('boundary_id', boundaryId)
    
    if (error) {
      console.error('Error fetching boundary controls with details:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch boundary controls with details: ${error.message}`)
    }
    
    console.log(`Found ${data?.length || 0} boundary controls with details`)
    return data as BoundaryControlWithDetails[] || []
  } catch (error) {
    console.error('Error in getBoundaryControlsWithDetails:', error)
    throw error
  }
}
