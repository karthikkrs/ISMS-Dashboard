import { createClient } from '@/utils/supabase/client'; // Use client-side client
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

type ThreatScenario = Tables<'threat_scenarios'>;
type ThreatScenarioInsert = TablesInsert<'threat_scenarios'>;
type ThreatScenarioUpdate = TablesUpdate<'threat_scenarios'>;

const supabase = createClient();

/**
 * Fetches all threat scenarios for a specific project.
 * @param projectId The ID of the project.
 * @returns Promise<ThreatScenario[]>
 */
// Rename function for clarity
export async function getThreatScenariosForProject(projectId: string): Promise<ThreatScenario[]> { 
  if (!projectId) {
    throw new Error('Project ID is required to fetch threat scenarios.');
  }

  const { data, error } = await supabase
    .from('threat_scenarios')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true }); // Order alphabetically by name

  if (error) {
    console.error(`Error fetching threat scenarios for project ${projectId}:`, error);
    throw new Error('Failed to fetch threat scenarios.');
  }
  return data || [];
}

/**
 * Creates a new threat scenario for a project.
 * @param data The threat scenario data to insert.
 * @returns Promise<ThreatScenario>
 */
export async function createThreatScenario(data: ThreatScenarioInsert): Promise<ThreatScenario> {
  if (!data.project_id) {
    throw new Error('Project ID is required to create a threat scenario.');
  }
   if (!data.name) {
    throw new Error('Threat scenario name is required.');
  }

  const { data: newScenario, error } = await supabase
    .from('threat_scenarios')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating threat scenario:', error);
    throw new Error('Failed to create threat scenario.');
  }
   if (!newScenario) {
     throw new Error('Failed to create threat scenario, no data returned.');
   }
  return newScenario;
}

/**
 * Updates an existing threat scenario.
 * @param id The ID of the threat scenario to update.
 * @param data The data to update.
 * @returns Promise<ThreatScenario>
 */
export async function updateThreatScenario(id: string, data: ThreatScenarioUpdate): Promise<ThreatScenario> {
  if (!id) {
    throw new Error('Threat scenario ID is required for update.');
  }

  const { data: updatedScenario, error } = await supabase
    .from('threat_scenarios')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating threat scenario ${id}:`, error);
    throw new Error('Failed to update threat scenario.');
  }
   if (!updatedScenario) {
     throw new Error('Failed to update threat scenario, no data returned.');
   }
  return updatedScenario;
}

/**
 * Deletes a threat scenario.
 * @param id The ID of the threat scenario to delete.
 * @returns Promise<void>
 */
export async function deleteThreatScenario(id: string): Promise<void> {
  if (!id) {
    throw new Error('Threat scenario ID is required for deletion.');
  }

  const { error } = await supabase
    .from('threat_scenarios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting threat scenario ${id}:`, error);
    throw new Error('Failed to delete threat scenario.');
  }
}
