import { createBrowserClient } from '@supabase/ssr'
import { Evidence } from '@/types' // Assuming Evidence type is defined in src/types/index.ts

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

    let filePath: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null

    // Handle file upload if a file is provided
    if (data.file) {
      fileName = data.file.name
      fileType = data.file.type
      // Construct a unique file path, e.g., using user ID, boundary control ID, and timestamp
      filePath = `${authData.user.id}/${boundaryControlId}/${Date.now()}-${fileName}`

      console.log(`Uploading file to: ${filePath}`)
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

    // Fetch the evidence record to get file path and check ownership
    const { data: evidence, error: fetchError } = await supabase
      .from('evidence')
      .select('id, file_path, uploaded_by')
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
    return result as Evidence
  } catch (error) {
    console.error('Error in updateEvidence:', error)
    throw error
  }
}
