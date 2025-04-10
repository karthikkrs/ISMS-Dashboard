import { createBrowserClient } from '@supabase/ssr'
import { Gap, GapSeverity, GapStatus } from '@/types'
import { unmarkProjectPhaseComplete } from './project-service'; // Re-add the import

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get all gaps for a specific boundary control
export const getGapsForBoundaryControl = async (boundaryControlId: string): Promise<Gap[]> => {
  try {
    console.log('Fetching gaps for boundary control:', boundaryControlId)
    const { data, error } = await supabase
      .from('gaps')
      .select('*')
      .eq('boundary_control_id', boundaryControlId)
      .order('identified_at', { ascending: false })

    if (error) {
      console.error('Error fetching gaps:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch gaps: ${error.message}`)
    }
    console.log(`Found ${data?.length || 0} gaps`)
    return data as Gap[] || []
  } catch (error) {
    console.error('Error in getGapsForBoundaryControl:', error)
    throw error
  }
}

// Create a new gap record
export const createGap = async (
  projectId: string, 
  boundaryControlId: string,
  data: {
    title: string; // Add title to input data
    description: string;
    severity: GapSeverity;
    status?: GapStatus; // Optional, defaults to 'Identified' in DB
  }
): Promise<Gap> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // Fetch control_id from boundary_control record to satisfy the NOT NULL constraint on gaps.control_id
    // This assumes control_id is still needed. If not, the constraint should be removed.
    const { data: bcData, error: bcError } = await supabase
      .from('boundary_controls')
      .select('control_id')
      .eq('id', boundaryControlId)
      .single();

    if (bcError || !bcData) {
       console.error('Error fetching boundary_control details:', bcError);
       throw new Error('Could not find associated control for the gap.');
    }


    const gapData = {
      project_id: projectId, 
      boundary_control_id: boundaryControlId,
      control_id: bcData.control_id, 
      title: data.title, // Include title
      description: data.description,
      severity: data.severity,
      status: data.status || 'Identified', 
      identified_by: authData.user.id,
    }

    console.log('Creating gap record:', JSON.stringify(gapData, null, 2))
    const { data: result, error: insertError } = await supabase
      .from('gaps')
      .insert(gapData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating gap record:', JSON.stringify(insertError, null, 2))
      throw new Error(`Failed to create gap record: ${insertError.message}`)
    }
    if (!result) throw new Error('No data returned after creating gap record')

    console.log('Gap record created successfully:', result.id)

    // Removed unmark call

    return result as Gap
  } catch (error) {
    console.error('Error in createGap:', error)
    throw error
  }
}

// Update a gap record (also allow updating title)
export const updateGap = async (
  gapId: string,
  data: Partial<Pick<Gap, 'title' | 'description' | 'severity' | 'status'>> // Add title here
): Promise<Gap> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // Fetch to check existence (optional: add ownership check if needed)
    const { data: existing, error: fetchError } = await supabase
      .from('gaps')
      .select('id') // Select minimal data
      .eq('id', gapId)
      .single()

    if (fetchError || !existing) throw new Error('Gap not found or failed to fetch.')

    console.log('Updating gap record:', gapId, 'with data:', data)
    const { data: result, error: updateError } = await supabase
      .from('gaps')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', gapId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating gap record:', JSON.stringify(updateError, null, 2))
      throw new Error(`Failed to update gap record: ${updateError.message}`)
    }
    if (!result) throw new Error('No data returned after updating gap record')

    console.log('Gap record updated successfully')

    // Unmark the evidence/gaps phase as complete since a gap was updated
    if (result.project_id) { // Assuming Gap type includes project_id (needs verification/update in types/index.ts if not)
       try {
         await unmarkProjectPhaseComplete(result.project_id, 'evidence_gaps_completed_at');
       } catch (unmarkError) {
         console.error("Failed to unmark evidence/gaps phase after gap update:", unmarkError);
       }
    } else {
        console.warn(`Could not unmark phase for updated gap ${gapId} as project_id was missing.`);
        // Attempt to fetch project_id based on boundary_control_id if needed
    }
    // Removed unmark call


    return result as Gap
  } catch (error) {
    console.error('Error in updateGap:', error)
    throw error
  }
}

// Delete a gap record
export const deleteGap = async (gapId: string): Promise<void> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // Fetch to check existence and get project_id for unmarking
     const { data: existing, error: fetchError } = await supabase
      .from('gaps')
      .select('id, project_id') // Fetch project_id
      .eq('id', gapId)
      .single()

    if (fetchError || !existing) throw new Error('Gap not found or failed to fetch.')

    console.log('Deleting gap record:', gapId)
    const { error: deleteError } = await supabase
      .from('gaps')
      .delete()
      .eq('id', gapId)

    if (deleteError) {
      console.error('Error deleting gap record:', JSON.stringify(deleteError, null, 2))
      throw new Error(`Failed to delete gap record: ${deleteError.message}`)
    }
    console.log('Gap record deleted successfully')

    // Unmark the evidence/gaps phase as complete since a gap was deleted
    if (existing.project_id) {
       try {
         await unmarkProjectPhaseComplete(existing.project_id, 'evidence_gaps_completed_at');
       } catch (unmarkError) {
         console.error("Failed to unmark evidence/gaps phase after gap deletion:", unmarkError);
       }
    } else {
       console.warn(`Could not unmark phase for deleted gap ${gapId} as project_id was missing.`);
    }
    // Removed unmark call

  } catch (error) {
    console.error('Error in deleteGap:', error)
    throw error
  }
}
