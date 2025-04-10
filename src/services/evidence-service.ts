import { createBrowserClient } from '@supabase/ssr'
import { Evidence } from '@/types' 
import { unmarkProjectPhaseComplete } from './project-service'; // Re-add the import

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STORAGE_BUCKET = 'evidence-files' // Define your storage bucket name

// Get all evidence for a specific boundary control
export const getEvidenceForBoundaryControl = async (boundaryControlId: string): Promise<Evidence[]> => {
  try {
    console.log('Fetching evidence for boundary control:', boundaryControlId)
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('boundary_control_id', boundaryControlId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching evidence:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to fetch evidence: ${error.message}`)
    }
    console.log(`Found ${data?.length || 0} evidence items`)
    return data as Evidence[] || []
  } catch (error) {
    console.error('Error in getEvidenceForBoundaryControl:', error)
    throw error
  }
}

// Create new evidence record (potentially with file upload)
export const createEvidence = async (
  boundaryControlId: string,
  data: {
    title: string;
    description?: string | null;
    file?: File | null; // Optional file to upload
  }
): Promise<Evidence> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // --- Fetch project_id and control_id ---
    // 1. Get boundary_id and control_id from boundary_control_id
    const { data: bcData, error: bcError } = await supabase
      .from('boundary_controls')
      .select('boundary_id, control_id') // Select control_id as well
      .eq('id', boundaryControlId)
      .single()

    if (bcError || !bcData) {
      console.error('Error fetching boundary control:', bcError)
      throw new Error(`Boundary control with ID ${boundaryControlId} not found.`)
    }
    const boundaryId = bcData.boundary_id
    const controlId = bcData.control_id // Store control_id

    // 2. Get project_id from boundary_id
    const { data: boundaryData, error: boundaryError } = await supabase
      .from('boundaries')
      .select('project_id')
      .eq('id', boundaryId)
      .single()

    if (boundaryError || !boundaryData) {
      console.error('Error fetching boundary:', boundaryError)
      throw new Error(`Boundary with ID ${boundaryId} not found.`)
    }
    const projectId = boundaryData.project_id
    // --- End Fetch project_id ---


    let filePath: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null

    // Handle file upload if a file is provided
    if (data.file) {
      fileName = data.file.name
      fileType = data.file.type
      // Use a simpler file path structure: boundaryControlId/timestamp-filename
      filePath = `${boundaryControlId}/${Date.now()}-${fileName}`

      console.log(`Uploading file to (simplified path): ${filePath}`)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, data.file)

      if (uploadError) {
        console.error('Error uploading file:', JSON.stringify(uploadError, null, 2))
        throw new Error(`Failed to upload evidence file: ${uploadError.message}`)
      }
      console.log('File uploaded successfully')
    }

    // Prepare data for the evidence table
    const evidenceData = {
      project_id: projectId, // Include the fetched project_id
      control_id: controlId, // Include the fetched control_id
      boundary_control_id: boundaryControlId,
      title: data.title,
      description: data.description,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType,
      uploaded_by: authData.user.id,
    }

    console.log('Creating evidence record:', JSON.stringify(evidenceData, null, 2))
    const { data: result, error: insertError } = await supabase
      .from('evidence')
      .insert(evidenceData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating evidence record:', JSON.stringify(insertError, null, 2))
      // Attempt to delete the uploaded file if the DB insert fails
      if (filePath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      }
      throw new Error(`Failed to create evidence record: ${insertError.message}`)
    }

    if (!result) throw new Error('No data returned after creating evidence record')

    console.log('Evidence record created successfully:', result.id)

    // Removed unmark call

    return result as Evidence
  } catch (error) {
    console.error('Error in createEvidence:', error)
    throw error
  }
}

// Delete evidence record (potentially with file deletion)
export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // Fetch the evidence record to get file path, project_id and check ownership
    // We need project_id to unmark the phase later
    const { data: evidence, error: fetchError } = await supabase
      .from('evidence')
      .select('id, file_path, uploaded_by, project_id') // Added project_id
      .eq('id', evidenceId)
      .single()

    if (fetchError || !evidence) {
      console.error('Error fetching evidence for deletion:', fetchError)
      throw new Error('Evidence not found or failed to fetch.')
    }

    // Optional: Check if the current user is the one who uploaded it
    // if (evidence.uploaded_by !== authData.user.id) {
    //   throw new Error('Permission denied: You did not upload this evidence.');
    // }

    // Delete the database record first
    console.log('Deleting evidence record:', evidenceId)
    const { error: deleteDbError } = await supabase
      .from('evidence')
      .delete()
      .eq('id', evidenceId)

    if (deleteDbError) {
      console.error('Error deleting evidence record:', JSON.stringify(deleteDbError, null, 2))
      throw new Error(`Failed to delete evidence record: ${deleteDbError.message}`)
    }
    console.log('Evidence record deleted successfully')

    // If there was an associated file, delete it from storage
    if (evidence.file_path) {
      console.log('Deleting associated file from storage:', evidence.file_path)
      const { error: deleteStorageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([evidence.file_path])

      if (deleteStorageError) {
        // Log the error but don't throw, as the DB record is already deleted
        console.error('Error deleting file from storage:', JSON.stringify(deleteStorageError, null, 2))
      } else {
        console.log('Associated file deleted successfully')
      }
    }

    // Unmark the evidence/gaps phase as complete since evidence was deleted
    if (evidence.project_id) {
      try {
        await unmarkProjectPhaseComplete(evidence.project_id, 'evidence_gaps_completed_at');
      } catch (unmarkError) {
        console.error("Failed to unmark evidence/gaps phase after deletion:", unmarkError);
      }
    } else {
       console.warn(`Could not unmark phase for deleted evidence ${evidenceId} as project_id was missing.`);
    }
    // Removed unmark call

  } catch (error) {
    console.error('Error in deleteEvidence:', error)
    throw error
  }
}

// Get a signed URL for downloading an evidence file
export const getEvidenceDownloadUrl = async (filePath: string): Promise<string> => {
  try {
    console.log('Generating download URL for:', filePath)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 60 * 5) // URL valid for 5 minutes

    if (error) {
      console.error('Error creating signed URL:', JSON.stringify(error, null, 2))
      throw new Error(`Failed to get download URL: ${error.message}`)
    }
    console.log('Download URL generated successfully')
    return data.signedUrl
  } catch (error) {
    console.error('Error in getEvidenceDownloadUrl:', error)
    throw error
  }
}

// Update evidence record (Note: File replacement logic might be complex)
export const updateEvidence = async (
  evidenceId: string,
  data: Partial<Pick<Evidence, 'title' | 'description'>>
): Promise<Evidence> => {
   try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) throw new Error('User not authenticated')

    // Fetch to check ownership/existence
    const { data: existing, error: fetchError } = await supabase
      .from('evidence')
      .select('id, uploaded_by')
      .eq('id', evidenceId)
      .single()

    if (fetchError || !existing) throw new Error('Evidence not found or failed to fetch.')
    // Optional ownership check:
    // if (existing.uploaded_by !== authData.user.id) throw new Error('Permission denied.');

    console.log('Updating evidence record:', evidenceId, 'with data:', data)
    const { data: result, error: updateError } = await supabase
      .from('evidence')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', evidenceId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating evidence record:', JSON.stringify(updateError, null, 2))
      throw new Error(`Failed to update evidence record: ${updateError.message}`)
    }
    if (!result) throw new Error('No data returned after updating evidence record')

    console.log('Evidence record updated successfully')

    // Unmark the evidence/gaps phase as complete since evidence was updated
     if (result.project_id) {
      try {
        await unmarkProjectPhaseComplete(result.project_id, 'evidence_gaps_completed_at');
      } catch (unmarkError) {
        console.error("Failed to unmark evidence/gaps phase after update:", unmarkError);
      }
    } else {
       console.warn(`Could not unmark phase for updated evidence ${evidenceId} as project_id was missing.`);
    }
    // Removed unmark call

    return result as Evidence
  } catch (error) {
    console.error('Error in updateEvidence:', error)
    throw error
  }
}
