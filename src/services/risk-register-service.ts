import { createClient } from '@/utils/supabase/client';
import { Tables } from '@/types/database.types';

// Define the type for the risk register overview data
export type RiskRegisterItem = {
  threat_scenario_id: string;
  threat_name: string;
  threat_description: string | null;
  project_id: string;
  threat_actor_type: string | null;
  sle: number | null;
  aro: number | null;
  ale: number | null;
  aro_frequency_text: string | null;
  gap_count: number;
  risk_assessment_count: number;
  highest_risk_value: number | null;
};

// Define the types for threat scenarios, gaps, and risk assessments
type ThreatScenario = Tables<'threat_scenarios'>;
type Gap = Tables<'gaps'>;
type RiskAssessment = Tables<'risk_assessments'>;

// Define the type for expanded threat details (gaps and risk assessments)
export type ThreatScenarioGaps = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
};

export type ThreatScenarioRiskAssessment = {
  id: string;
  boundary_id: string;
  boundary_name?: string;
  assessment_date: string | null;
  assessor_id: string | null;
  severity: string | null;
};

export type ThreatScenarioEvidence = {
  id: string;
  title: string;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  file_type: string | null;
  boundary_control_id: string | null;
  control_id: string;
};

// Type for the full risk register item with details
export type RiskRegisterItemWithDetails = RiskRegisterItem & {
  gaps: ThreatScenarioGaps[];
  riskAssessments: ThreatScenarioRiskAssessment[];
  evidence: ThreatScenarioEvidence[];
  evidence_count: number;
};

// Type for the new editable table row
export type EditableRiskAssessmentItem = Tables<'risk_assessments'> & {
  threat_scenarios: Pick<Tables<'threat_scenarios'>, 'id' | 'name' | 'description' | 'threat_actor_type'> | null;
  // We might join boundaries later if needed for display
  // boundaries?: Pick<Tables<'boundaries'>, 'name'> | null;
  
  // Ensure these fields are nullable as they might not exist for all risk assessments
  sle_direct_operational_costs: number | null;
  sle_technical_remediation_costs: number | null;
  sle_data_related_costs: number | null;
  sle_compliance_legal_costs: number | null;
  sle_reputational_management_costs: number | null;
};


const supabase = createClient();

/**
 * Generate ARO frequency text based on ARO value
 * @param aro ARO value
 * @returns Human-readable frequency text
 */
function getAroFrequencyText(aro: number | null): string | null {
  if (aro === null) return null;
  
  if (aro === 0) return 'Not expected to occur';
  if (aro < 1) return `Once every ${Math.round((1 / aro) * 100) / 100} years`;
  if (aro === 1) return 'Once per year';
  return `${aro} times per year`;
}

/**
 * Calculate ALE based on SLE and ARO
 * @param sle Single Loss Expectancy
 * @param aro Annualized Rate of Occurrence
 * @returns Annualized Loss Expectancy
 */
function calculateAle(sle: number | null, aro: number | null): number | null {
  if (sle === null || aro === null) return null;
  return sle * aro;
}

/**
 * Fetch the risk register data for a project
 * @param projectId The ID of the project
 * @returns Promise<RiskRegisterItem[]>
 */
export async function getRiskRegisterForProject(projectId: string): Promise<RiskRegisterItem[]> {
  if (!projectId) {
    throw new Error('Project ID is required to fetch risk register');
  }

  // Fetch all threat scenarios for the project
  const { data: threatScenarios, error: threatError } = await supabase
    .from('threat_scenarios')
    .select('*')
    .eq('project_id', projectId);

  if (threatError) {
    console.error(`Error fetching threat scenarios for project ${projectId}:`, threatError);
    throw new Error('Failed to fetch threat scenarios');
  }

  // Fetch risk assessments related to these threats
  const { data: riskAssessments, error: assessmentError } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('project_id', projectId);

  if (assessmentError) {
    console.error(`Error fetching risk assessments for project ${projectId}:`, assessmentError);
    throw new Error('Failed to fetch risk assessments');
  }

  // Fetch gaps for the project
  const { data: gaps, error: gapsError } = await supabase
    .from('gaps')
    .select('*')
    .eq('project_id', projectId);

  if (gapsError) {
    console.error(`Error fetching gaps for project ${projectId}:`, gapsError);
    throw new Error('Failed to fetch gaps');
  }

  // Map threat scenarios to risk register items
  const riskRegister = threatScenarios.map((threat: ThreatScenario) => {
    // Count related risk assessments
    const threatAssessments = riskAssessments.filter(
      (assessment: RiskAssessment) => assessment.threat_scenario_id === threat.id
    );
    const assessmentCount = threatAssessments.length;
    
  // Find highest risk based on severity
  let highestRiskValue = null;
  if (threatAssessments.length > 0) {
    // Check if any high severity risks exist
    if (threatAssessments.some(a => a.severity === 'high')) {
      highestRiskValue = 8; // High risk value
    } 
    // If no high but medium exists
    else if (threatAssessments.some(a => a.severity === 'medium')) {
      highestRiskValue = 5; // Medium risk value
    }
    // If only low exists
    else if (threatAssessments.some(a => a.severity === 'low')) {
      highestRiskValue = 2; // Low risk value
    }
  }
    
    // Count related gaps (in the threat scenarios table, gaps can be linked via the gap_id field)
    // Also consider gaps that might be linked to this threat scenario through a different relationship
    const relatedGaps = gaps.filter(
      (gap: Gap) => threat.gap_id === gap.id
    );
    const gapCount = relatedGaps.length;
    
    // Find the highest SLE and ARO from risk assessments for this threat
    const highestSle = threatAssessments.length > 0
      ? Math.max(...threatAssessments.map(a => a.sle || 0))
      : null;
    
    const highestAro = threatAssessments.length > 0
      ? Math.max(...threatAssessments.map(a => a.aro || 0))
      : null;
    
    // Calculate ALE and frequency text from assessment data
    const ale = calculateAle(highestSle, highestAro);
    const aroFrequencyText = getAroFrequencyText(highestAro);
    
    return {
      threat_scenario_id: threat.id,
      threat_name: threat.name,
      threat_description: threat.description,
      project_id: threat.project_id,
      threat_actor_type: threat.threat_actor_type,
      sle: highestSle,
      aro: highestAro,
      ale,
      aro_frequency_text: aroFrequencyText,
      gap_count: gapCount,
      risk_assessment_count: assessmentCount,
      highest_risk_value: highestRiskValue,
    };
  });

  return riskRegister;
}

/**
 * Fetch gaps associated with a threat scenario
 * @param threatScenarioId The ID of the threat scenario
 * @returns Promise<ThreatScenarioGaps[]>
 */
export async function getGapsForThreatScenario(threatScenarioId: string): Promise<ThreatScenarioGaps[]> {
  if (!threatScenarioId) {
    throw new Error('Threat scenario ID is required to fetch gaps');
  }

  // First, get the threat scenario to find its gap_id
  const { data: threatScenario, error: threatError } = await supabase
    .from('threat_scenarios')
    .select('gap_id')
    .eq('id', threatScenarioId)
    .single();

  if (threatError) {
    console.error(`Error fetching threat scenario ${threatScenarioId}:`, threatError);
    throw new Error('Failed to fetch threat scenario');
  }

  if (!threatScenario?.gap_id) {
    return []; // No gap linked to this threat scenario
  }

  // Then get the gap details
  const { data: gap, error: gapError } = await supabase
    .from('gaps')
    .select('id, title, description, severity, status')
    .eq('id', threatScenario.gap_id)
    .single();

  if (gapError) {
    console.error(`Error fetching gap for threat scenario ${threatScenarioId}:`, gapError);
    throw new Error('Failed to fetch gap');
  }

  return gap ? [gap] : [];
}

/**
 * Fetch risk assessments associated with a threat scenario
 * @param threatScenarioId The ID of the threat scenario
 * @returns Promise<ThreatScenarioRiskAssessment[]>
 */
export async function getRiskAssessmentsForThreatScenario(threatScenarioId: string): Promise<ThreatScenarioRiskAssessment[]> {
  if (!threatScenarioId) {
    throw new Error('Threat scenario ID is required to fetch risk assessments');
  }

  // Join with boundaries to get boundary names
  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      id, 
      boundary_id, 
      assessment_date, 
      assessor_id,
      severity,
      boundaries(name)
    `)
    .eq('threat_scenario_id', threatScenarioId);

  if (error) {
    console.error(`Error fetching risk assessments for threat scenario ${threatScenarioId}:`, error);
    throw new Error('Failed to fetch risk assessments');
  }

  // Transform the joined data to include the boundary name
  return (data || []).map(item => ({
    id: item.id,
    boundary_id: item.boundary_id,
    boundary_name: item.boundaries?.name || 'Unknown',
    assessment_date: item.assessment_date,
    assessor_id: item.assessor_id,
    severity: item.severity,
  }));
}

/**
 * Fetch all data needed for the risk register in one call
 * @param projectId The ID of the project
 * @returns Promise with risk register items and their associated gaps and risk assessments
 */
export async function getFullRiskRegisterData(projectId: string): Promise<RiskRegisterItemWithDetails[]> {
  // Get the basic risk register items
  const riskRegister = await getRiskRegisterForProject(projectId);
  
  const threatScenarioIds = riskRegister.map(item => item.threat_scenario_id);
  
  // Get all threat scenarios to access their gap_id
  const { data: threatScenarios, error: threatError } = await supabase
    .from('threat_scenarios')
    .select('id, gap_id')
    .in('id', threatScenarioIds);
    
  if (threatError) {
    console.error('Error fetching threat scenarios:', threatError);
    throw new Error('Failed to fetch threat scenarios data');
  }
  
  // Get all related gap_ids
  const gapIds = threatScenarios
    .filter(threat => threat.gap_id)
    .map(threat => threat.gap_id as string);
  
  // Get gaps for those gap_ids
  const { data: allGaps, error: gapsError } = await supabase
    .from('gaps')
    .select('id, title, description, severity, status, boundary_control_id, control_id')
    .in('id', gapIds);
    
  if (gapsError) {
    console.error('Error fetching all gaps:', gapsError);
    throw new Error('Failed to fetch gaps data');
  }
  
  // Get risk assessments for all threat scenarios
  const { data: allRiskAssessments, error: assessmentsError } = await supabase
    .from('risk_assessments')
    .select(`
      id, 
      boundary_id, 
      assessment_date, 
      assessor_id,
      severity,
      boundaries(name),
      threat_scenario_id
    `)
    .in('threat_scenario_id', threatScenarioIds);
    
  if (assessmentsError) {
    console.error('Error fetching all risk assessments:', assessmentsError);
    throw new Error('Failed to fetch risk assessments data');
  }
  
  // Get evidence for the project
  
  // Get evidence for the project and related boundary_controls
  const { data: allEvidence, error: evidenceError } = await supabase
    .from('evidence')
    .select('id, title, description, file_name, file_path, file_type, boundary_control_id, control_id')
    .eq('project_id', projectId);
  
  if (evidenceError) {
    console.error('Error fetching evidence:', evidenceError);
    throw new Error('Failed to fetch evidence data');
  }
  
  // Transform and group the data
  const riskRegisterWithDetails = riskRegister.map(item => {
    // Find the corresponding threat scenario to get its gap_id
    const threatScenario = threatScenarios.find(
      threat => threat.id === item.threat_scenario_id
    );
    
    // Find the corresponding gap
    const gap = threatScenario?.gap_id 
      ? allGaps?.find(g => g.id === threatScenario.gap_id)
      : null;
    
    // Create the gaps array
    const scenarioGaps = gap 
      ? [{
          id: gap.id,
          title: gap.title,
          description: gap.description,
          severity: gap.severity,
          status: gap.status
        }]
      : [];
      
    // Get the risk assessments for this threat
    const scenarioAssessments = (allRiskAssessments || [])
      .filter(assessment => assessment.threat_scenario_id === item.threat_scenario_id)
      .map(assessment => ({
        id: assessment.id,
        boundary_id: assessment.boundary_id,
        boundary_name: assessment.boundaries?.name || 'Unknown',
        assessment_date: assessment.assessment_date,
        assessor_id: assessment.assessor_id,
        severity: assessment.severity,
      }));
      
    // Get the evidence related to this gap (via boundary_control_id)
    let scenarioEvidence: ThreatScenarioEvidence[] = [];
    if (gap?.boundary_control_id) {
      scenarioEvidence = (allEvidence || [])
        .filter(evidence => evidence.boundary_control_id === gap.boundary_control_id)
        .map(evidence => ({
          id: evidence.id,
          title: evidence.title,
          description: evidence.description,
          file_name: evidence.file_name,
          file_path: evidence.file_path,
          file_type: evidence.file_type,
          boundary_control_id: evidence.boundary_control_id,
          control_id: evidence.control_id
        }));
    }
    
    // Also get evidence related to the control_id if no boundary_control specific evidence was found
    if (scenarioEvidence.length === 0 && gap?.control_id) {
      // Filter evidence by control_id when there's no direct boundary_control match
      scenarioEvidence = (allEvidence || [])
        .filter(evidence => 
          !evidence.boundary_control_id && // Only include evidence not already linked to a boundary_control
          evidence.control_id === gap.control_id
        )
        .map(evidence => ({
          id: evidence.id,
          title: evidence.title,
          description: evidence.description,
          file_name: evidence.file_name,
          file_path: evidence.file_path,
          file_type: evidence.file_type,
          boundary_control_id: evidence.boundary_control_id,
          control_id: evidence.control_id
        }));
    }
      
    return {
      ...item,
      gaps: scenarioGaps,
      riskAssessments: scenarioAssessments,
      evidence: scenarioEvidence,
      evidence_count: scenarioEvidence.length
    };
  });
  
  return riskRegisterWithDetails;
}

/**
 * Fetch individual risk assessments joined with their threat scenarios for editing.
 * @param projectId The ID of the project
 * @returns Promise<EditableRiskAssessmentItem[]>
 */
export async function getEditableRiskAssessments(projectId: string): Promise<EditableRiskAssessmentItem[]> {
  if (!projectId) {
    throw new Error('Project ID is required to fetch editable risk assessments');
  }

  const { data, error } = await supabase
    .from('risk_assessments')
    .select(`
      *,
      threat_scenarios ( id, name, description, threat_actor_type )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false }); // Optional: Order by creation date or threat name

  if (error) {
    console.error(`Error fetching editable risk assessments for project ${projectId}:`, error);
    throw new Error('Failed to fetch editable risk assessments');
  }

  // Type assertion might be needed depending on Supabase client version,
  // but typically the select statement shapes the data correctly.
  return (data as EditableRiskAssessmentItem[]) || [];
}
