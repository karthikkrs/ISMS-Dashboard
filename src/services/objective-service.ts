import { createBrowserClient } from '@supabase/ssr'
import { Objective, ObjectivePriority } from '@/types'

// Create a Supabase client for client components
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get all objectives for a project
export const getObjectives = async (projectId: string): Promise<Objective[]> => {
  const { data: objectives, error } = await supabase
    .from('objectives')
    .select('*')
    .eq('project_id', projectId)
    .order('"order"', { ascending: true })
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching objectives:', error)
    throw error
  }
  
  return objectives as Objective[]
}

// Get a single objective by ID
export const getObjectiveById = async (id: string): Promise<Objective | null> => {
  const { data, error } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      return null
    }
    console.error('Error fetching objective:', error)
    throw error
  }
  
  return data as Objective
}

// Create a new objective
export const createObjective = async (
  projectId: string,
  objective: {
    statement: string
    priority: ObjectivePriority
    order?: number
  }
): Promise<Objective> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Get the current highest order value
  let highestOrder = null;
  
  try {
    const { data, error } = await supabase
      .from('objectives')
      .select('"order"')
      .eq('project_id', projectId)
      .order('"order"', { ascending: false })
      .limit(1)
      .single();
      
    if (!error) {
      highestOrder = data;
    }
  } catch (e) {
    // No objectives found, that's okay
  }
  
  // Calculate the next order value
  const nextOrder = highestOrder?.order ? highestOrder.order + 1 : 1
  
  // Add the user_id, project_id, and order to the objective
  const objectiveWithIds = {
    ...objective,
    project_id: projectId,
    user_id: user.id,
    order: objective.order ?? nextOrder
  }
  
  const { data, error } = await supabase
    .from('objectives')
    .insert(objectiveWithIds)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating objective:', JSON.stringify(error, null, 2))
    console.error('Objective data attempted to save:', JSON.stringify(objectiveWithIds, null, 2))
    throw error
  }
  
  return data as Objective
}

// Update an objective
export const updateObjective = async (
  id: string,
  objective: Partial<Objective>
): Promise<Objective> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First check if the objective belongs to the current user
  const { data: existingObjective, error: fetchError } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching objective for update:', fetchError)
    throw new Error('Objective not found or you do not have permission to update it')
  }
  
  // Now update the objective
  const { data, error } = await supabase
    .from('objectives')
    .update(objective)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating objective:', JSON.stringify(error, null, 2))
    console.error('Objective data attempted to update:', JSON.stringify(objective, null, 2))
    throw error
  }
  
  return data as Objective
}

// Delete an objective
export const deleteObjective = async (id: string): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // First check if the objective belongs to the current user
  const { data: existingObjective, error: fetchError } = await supabase
    .from('objectives')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching objective for deletion:', fetchError)
    throw new Error('Objective not found or you do not have permission to delete it')
  }
  
  // Now delete the objective
  const { error } = await supabase
    .from('objectives')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting objective:', error)
    throw error
  }
}

// Update objective order
export const updateObjectiveOrder = async (
  objectives: { id: string; order: number }[]
): Promise<void> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Create an array of updates
  const updates = objectives.map(({ id, order }) => ({
    id,
    order
  }))
  
  // Update all objectives in a single batch
  const { error } = await supabase
    .from('objectives')
    .upsert(updates, { onConflict: 'id' })
  
  if (error) {
    console.error('Error updating objective order:', error)
    throw error
  }
}
