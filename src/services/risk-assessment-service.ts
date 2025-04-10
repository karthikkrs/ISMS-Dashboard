import { createClient } from '@/utils/supabase/client'; // Use client-side client
import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/database.types';

type RiskAssessment = Tables<'risk_assessments'>;
type RiskAssessmentInsert = TablesInsert<'risk_assessments'>;
type RiskAssessmentUpdate = TablesUpdate<'risk_assessments'>;

const supabase = createClient();

/**
 * Fetches all risk assessments for a specific project.
 * @param projectId The ID of the project.
 * @returns Promise<RiskAssessment[]>
 */
export async function getRiskAssessments(projectId: string): Promise<RiskAssessment[]> {
  if (!projectId) {
    throw new Error('Project ID is required to fetch risk assessments.');
  }

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      boundaries (id, name, type),
      threat_scenarios (id, name),
      gaps (id, title),
      controls (id, reference)
    `) // Join related data for context
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching risk assessments for project ${projectId}:`, error);
    throw new Error('Failed to fetch risk assessments.');
  }
  // TODO: Properly type the joined data if needed, Supabase types might not cover joins automatically
  return (data as any[]) || []; 
}

/**
 * Fetches risk assessments linked to a specific gap.
 * @param gapId The ID of the gap.
 * @returns Promise<RiskAssessment[]>
 */
export async function getRiskAssessmentsForGap(gapId: string): Promise<RiskAssessment[]> {
   if (!gapId) {
    throw new Error('Gap ID is required.');
  }
   const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      boundaries (id, name, type),
      threat_scenarios (id, name)
    `)
    .eq('gap_id', gapId);

   if (error) {
    console.error(`Error fetching risk assessments for gap ${gapId}:`, error);
    throw new Error('Failed to fetch risk assessments for gap.');
  }
  return (data as any[]) || [];
}


/**
 * Creates a new risk assessment.
 * @param data The risk assessment data to insert.
 * @returns Promise<RiskAssessment>
 */
export async function createRiskAssessment(data: RiskAssessmentInsert): Promise<RiskAssessment> {
  if (!data.project_id || !data.boundary_id || !data.threat_scenario_id) {
    throw new Error('Project ID, Boundary ID (Asset), and Threat Scenario ID are required.');
  }

  // Add assessor_id if not provided (assuming current user)
  const { data: { user } } = await supabase.auth.getUser();
  const dataToInsert = {
     ...data,
     assessor_id: data.assessor_id || user?.id,
     assessment_date: data.assessment_date || new Date().toISOString(),
     // TODO: Add calculation logic here or call a separate function before insert
     // calculated_risk_value: calculateRisk(data.likelihood_frequency_input, data.loss_magnitude_input),
  };


  const { data: newAssessment, error } = await supabase
    .from('risk_assessments')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating risk assessment:', error);
    throw new Error('Failed to create risk assessment.');
  }
   if (!newAssessment) {
     throw new Error('Failed to create risk assessment, no data returned.');
   }
  return newAssessment;
}

/**
 * Updates an existing risk assessment.
 * @param id The ID of the risk assessment to update.
 * @param data The data to update.
 * @returns Promise<RiskAssessment>
 */
export async function updateRiskAssessment(id: string, data: RiskAssessmentUpdate): Promise<RiskAssessment> {
  if (!id) {
    throw new Error('Risk assessment ID is required for update.');
  }

   const dataToUpdate = {
     ...data,
     updated_at: new Date().toISOString(), // Ensure updated_at is set
     // TODO: Add re-calculation logic here or call a separate function
     // calculated_risk_value: calculateRisk(data.likelihood_frequency_input, data.loss_magnitude_input),
   };

  const { data: updatedAssessment, error } = await supabase
    .from('risk_assessments')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating risk assessment ${id}:`, error);
    throw new Error('Failed to update risk assessment.');
  }
   if (!updatedAssessment) {
     throw new Error('Failed to update risk assessment, no data returned.');
   }
  return updatedAssessment;
}

/**
 * Deletes a risk assessment.
 * @param id The ID of the risk assessment to delete.
 * @returns Promise<void>
 */
export async function deleteRiskAssessment(id: string): Promise<void> {
  if (!id) {
    throw new Error('Risk assessment ID is required for deletion.');
  }

  // Also delete related links first to avoid FK constraints
  const { error: linkError } = await supabase
    .from('risk_remediation_links')
    .delete()
    .eq('risk_assessment_id', id);

  if (linkError) {
     console.error(`Error deleting links for risk assessment ${id}:`, linkError);
     // Decide if you want to throw or just log and continue
     // throw new Error('Failed to delete associated remediation links.'); 
  }


  const { error } = await supabase
    .from('risk_assessments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting risk assessment ${id}:`, error);
    throw new Error('Failed to delete risk assessment.');
  }
}


// --- TODO: Implement Risk Calculation Logic ---
// This is a placeholder and needs a proper implementation based on the chosen CRQ model (e.g., simple matrix, FAIR-lite, etc.)
function calculateRisk(likelihood: Json | null | undefined, magnitude: Json | null | undefined): number | null {
   // Example: Simple qualitative mapping (needs refinement)
   const likelihoodMap: Record<string, number> = { 'Low': 1, 'Medium': 5, 'High': 10 };
   const magnitudeMap: Record<string, number> = { 'Low': 1000, 'Medium': 10000, 'High': 100000 };

   try {
      const likeInput = likelihood as { type: string, value: any } | null;
      const magInput = magnitude as { type: string, value: any } | null;

      if (likeInput?.type === 'scale' && magInput?.type === 'scale') {
         const likeValue = likelihoodMap[likeInput.value] || 0;
         const magValue = magnitudeMap[magInput.value] || 0;
         return likeValue * magValue; // Very basic risk score
      }
      // Add logic for other types (frequency, range, value)
   } catch (e) {
      console.error("Error during risk calculation input parsing:", e);
   }

   return null; // Return null if calculation is not possible
}
