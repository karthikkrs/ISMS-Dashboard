import { createBrowserClient } from '@supabase/ssr'
import { Gap, GapSeverity, GapStatus } from '@/types' // Assuming Gap types are defined in src/types/index.ts

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
  boundaryControlId: string,
  data: {
    description: string;
    severity: GapSeverity;
    status?: GapStatus; // Optional, defaults to 'Identified' in DB
  }
): Promise<Gap> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    const gapData = {
      boundary_control_id: boundaryControlId,
      description: data.description,
      severity: data.severity,
      status: data.status || 'Identified', // Use provided status or default
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
    return result as Gap
  } catch (error) {
    console.error('Error in createGap:', error)
    throw error
  }
}

// Update a gap record
export const updateGap = async (
  gapId: string,
  data: Partial<Pick<Gap, 'description' | 'severity' | 'status'>>
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

    // Fetch to check existence (optional: add ownership check if needed)
     const { data: existing, error: fetchError } = await supabase
      .from('gaps')
      .select('id') // Select minimal data
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
  } catch (error) {
    console.error('Error in deleteGap:', error)
    throw error
  }
}
