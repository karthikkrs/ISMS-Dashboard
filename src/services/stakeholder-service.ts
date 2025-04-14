import { createBrowserClient } from '@supabase/ssr'
import { Stakeholder } from '@/types'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get all stakeholders for a project
export const getStakeholders = async (projectId: string): Promise<Stakeholder[]> => {
  const { data: stakeholders, error } = await supabase
    .from('stakeholders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching stakeholders:', error)
    throw error
  }
  
  return stakeholders as Stakeholder[]
}

// Get a single stakeholder by ID
export const getStakeholderById = async (id: string): Promise<Stakeholder | null> => {
  const { data, error } = await supabase
    .from('stakeholders')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      return null
    }
    console.error('Error fetching stakeholder:', error)
    throw error
  }
  
  return data as Stakeholder
}

// Create a new stakeholder
export const createStakeholder = async (
  projectId: string,
  stakeholder: {
    name: string
    role?: string
    email?: string
    responsibilities?: string
  }
): Promise<Stakeholder> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Add the user_id and project_id to the stakeholder
  const stakeholderWithIds = {
    ...stakeholder,
    project_id: projectId,
    user_id: user.id
  }
  
  const { data, error } = await supabase
    .from('stakeholders')
    .insert(stakeholderWithIds)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating stakeholder:', error)
    throw error
  }
  
  return data as Stakeholder
}

// Update a stakeholder
export const updateStakeholder = async (
  id: string,
  stakeholder: Partial<Stakeholder>
): Promise<Stakeholder> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First verify if the stakeholder belongs to the current user
  const { error: fetchError } = await supabase
    .from('stakeholders')
    .select('id') // Select only the ID to verify existence and ownership
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching stakeholder for update:', fetchError)
    throw new Error('Stakeholder not found or you do not have permission to update it')
  }
  
  // Now update the stakeholder
  const { data, error } = await supabase
    .from('stakeholders')
    .update(stakeholder)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating stakeholder:', error)
    throw error
  }
  
  return data as Stakeholder
}

// Delete a stakeholder
export const deleteStakeholder = async (id: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First verify if the stakeholder belongs to the current user
  const { error: fetchError } = await supabase
    .from('stakeholders')
    .select('id') // Select only the ID to verify existence and ownership
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching stakeholder for deletion:', fetchError)
    throw new Error('Stakeholder not found or you do not have permission to delete it')
  }
  
  // Now delete the stakeholder
  const { error } = await supabase
    .from('stakeholders')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting stakeholder:', error)
    throw error
  }
}
