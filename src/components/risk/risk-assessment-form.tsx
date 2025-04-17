'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { toast } from 'sonner'; // Import toast for notifications
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'; // Use Dialog for modal
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, XCircle, Info } from 'lucide-react';
// Use Tables helper type from database.types.ts for all DB types
import { Tables } from '@/types/database.types'; // Removed TablesInsert which was unused
import { getBoundaries } from '@/services/boundary-service'; // To select Asset/Boundary
import { ThreatScenarioList } from '@/components/threats/threat-scenario-list'; // To select Threat
import { ThreatScenarioDialog } from '@/components/threats/threat-scenario-dialog'; // To create Threat in separate dialog
// Import actual risk service functions
import { createRiskAssessment, updateRiskAssessment } from '@/services/risk-assessment-service'; 

// The ARO Frequency Helper Component
function AroFrequencyHelper({ aroValue }: { aroValue: string | null }) {
  if (!aroValue || aroValue === '') {
    return null;
  }

  const numValue = parseFloat(aroValue);
  
  if (isNaN(numValue) || numValue < 0) {
    return null;
  }

  let frequencyText: string;
  
  if (numValue === 0) {
    frequencyText = "Not expected to occur";
  } else if (numValue < 1) {
    // Less than once per year (calculate years)
    const years = Math.round((1 / numValue) * 100) / 100; // Round to 2 decimals
    frequencyText = `Once every ${years} years`;
  } else if (numValue === 1) {
    frequencyText = "Once per year";
  } else {
    frequencyText = `${numValue} times per year`;
  }

  return (
    <div className="text-xs text-primary mt-1 flex items-center">
      <Info className="h-3 w-3 mr-1" />
      <span>{frequencyText}</span>
    </div>
  );
}

// --- Define Types ---
// Define Boundary using the Tables helper type
type Boundary = Tables<'boundaries'>; 
type ThreatScenario = Tables<'threat_scenarios'>;
type RiskAssessment = Tables<'risk_assessments'>;
// Removed unused RiskAssessmentInsert type

// --- Zod Schema ---
const riskAssessmentSchema = z.object({
  boundary_id: z.string().uuid('Invalid Asset/Boundary selected'),
  threat_scenario_id: z.string().uuid('Threat Scenario is required'),
  sle: z.string().min(1, 'SLE is required'), // SLE as string for form input, now required
  aro: z.string().min(1, 'ARO is required'), // ARO as string for form input, now required
  assessment_notes: z.string().nullable().optional(),
  severity: z.string().min(1, 'Severity level is required'), // Severity (high, medium, low), now required
  // SLE breakdown categories
  sle_direct_operational_costs: z.string().optional(),
  sle_technical_remediation_costs: z.string().optional(),
  sle_data_related_costs: z.string().optional(),
  sle_compliance_legal_costs: z.string().optional(),
  sle_reputational_management_costs: z.string().optional(),
  // gap_id will be passed directly, not part of the form schema itself
});

type RiskAssessmentFormValues = z.infer<typeof riskAssessmentSchema>;

// --- Component Props ---
interface RiskAssessmentFormProps {
  projectId: string;
  gapId?: string; // Optional: Link assessment to a specific gap
  riskAssessment?: RiskAssessment; // For editing
  isEditing?: boolean;
  onSuccess?: (assessment: RiskAssessment) => void;
  trigger?: React.ReactNode; // Optional trigger element (e.g., the button from GapList)
}


// --- Component ---
export function RiskAssessmentForm({
  projectId,
  gapId,
  riskAssessment,
  isEditing = false,
  onSuccess,
  trigger,
}: RiskAssessmentFormProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showThreatDialog, setShowThreatDialog] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatScenario | null>(riskAssessment?.threat_scenario_id ? { id: riskAssessment.threat_scenario_id } as ThreatScenario : null); // Pre-select if editing
  const [error, setError] = useState<string | null>(null);

  // Fetch boundaries (assets) for selection - Ensure type matches service return
  const { data: boundaries, isLoading: isLoadingBoundaries } = useQuery<Boundary[], Error>({ 
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId), // This returns Promise<Boundary[]>
    enabled: isOpen, // Only fetch when the dialog is open
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      boundary_id: riskAssessment?.boundary_id ?? '',
      threat_scenario_id: riskAssessment?.threat_scenario_id ?? '',
      sle: riskAssessment?.sle?.toString() ?? null,
      aro: riskAssessment?.aro?.toString() ?? null,
      assessment_notes: riskAssessment?.assessment_notes ?? null,
      severity: riskAssessment?.severity ?? null,
      // SLE breakdown categories with default values
      sle_direct_operational_costs: riskAssessment?.sle_direct_operational_costs?.toString() ?? '',
      sle_technical_remediation_costs: riskAssessment?.sle_technical_remediation_costs?.toString() ?? '',
      sle_data_related_costs: riskAssessment?.sle_data_related_costs?.toString() ?? '',
      sle_compliance_legal_costs: riskAssessment?.sle_compliance_legal_costs?.toString() ?? '',
      sle_reputational_management_costs: riskAssessment?.sle_reputational_management_costs?.toString() ?? '',
    },
  });

   // Update form when selectedThreat changes
   useEffect(() => {
    if (selectedThreat) {
      setValue('threat_scenario_id', selectedThreat.id);
    }
  }, [selectedThreat, setValue]);

  const mutationFn = isEditing && riskAssessment
    ? (data: RiskAssessmentFormValues) => {
        // Convert string values to numbers for submission
        const sleValue = data.sle && data.sle !== '' ? Number(data.sle) : null;
        const aroValue = data.aro && data.aro !== '' ? Number(data.aro) : null;
        
        // Convert SLE breakdown values to numbers
        const sleDirect = data.sle_direct_operational_costs && data.sle_direct_operational_costs !== '' 
          ? Number(data.sle_direct_operational_costs) : null;
        const sleTechnical = data.sle_technical_remediation_costs && data.sle_technical_remediation_costs !== '' 
          ? Number(data.sle_technical_remediation_costs) : null;
        const sleData = data.sle_data_related_costs && data.sle_data_related_costs !== '' 
          ? Number(data.sle_data_related_costs) : null;
        const sleCompliance = data.sle_compliance_legal_costs && data.sle_compliance_legal_costs !== '' 
          ? Number(data.sle_compliance_legal_costs) : null;
        const sleReputational = data.sle_reputational_management_costs && data.sle_reputational_management_costs !== '' 
          ? Number(data.sle_reputational_management_costs) : null;
        
        return updateRiskAssessment(riskAssessment.id, { 
          project_id: projectId, 
          gap_id: gapId,
          boundary_id: data.boundary_id,
          threat_scenario_id: data.threat_scenario_id,
          sle: sleValue,
          aro: aroValue,
          assessment_notes: data.assessment_notes,
          severity: data.severity,
          // Include SLE breakdown fields
          sle_direct_operational_costs: sleDirect,
          sle_technical_remediation_costs: sleTechnical,
          sle_data_related_costs: sleData,
          sle_compliance_legal_costs: sleCompliance,
          sle_reputational_management_costs: sleReputational
        });
      }
    : (data: RiskAssessmentFormValues) => {
        // Convert string values to numbers for submission
        const sleValue = data.sle && data.sle !== '' ? Number(data.sle) : null;
        const aroValue = data.aro && data.aro !== '' ? Number(data.aro) : null;
        
        // Convert SLE breakdown values to numbers
        const sleDirect = data.sle_direct_operational_costs && data.sle_direct_operational_costs !== '' 
          ? Number(data.sle_direct_operational_costs) : null;
        const sleTechnical = data.sle_technical_remediation_costs && data.sle_technical_remediation_costs !== '' 
          ? Number(data.sle_technical_remediation_costs) : null;
        const sleData = data.sle_data_related_costs && data.sle_data_related_costs !== '' 
          ? Number(data.sle_data_related_costs) : null;
        const sleCompliance = data.sle_compliance_legal_costs && data.sle_compliance_legal_costs !== '' 
          ? Number(data.sle_compliance_legal_costs) : null;
        const sleReputational = data.sle_reputational_management_costs && data.sle_reputational_management_costs !== '' 
          ? Number(data.sle_reputational_management_costs) : null;
        
        return createRiskAssessment({
          project_id: projectId, 
          gap_id: gapId,
          boundary_id: data.boundary_id,
          threat_scenario_id: data.threat_scenario_id,
          sle: sleValue,
          aro: aroValue,
          assessment_notes: data.assessment_notes,
          severity: data.severity,
          // Include SLE breakdown fields
          sle_direct_operational_costs: sleDirect,
          sle_technical_remediation_costs: sleTechnical,
          sle_data_related_costs: sleData,
          sle_compliance_legal_costs: sleCompliance,
          sle_reputational_management_costs: sleReputational
        });
      };

  const mutation = useMutation({
    mutationFn,
    onSuccess: (savedAssessment) => {
      setError(null);
      reset();
      setSelectedThreat(null);
      setIsOpen(false); // Close dialog on success
      
      // Show success toast notification
      toast.success(
        isEditing 
          ? 'Risk assessment updated successfully' 
          : 'Risk assessment created successfully'
      );
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', projectId] });
      queryClient.invalidateQueries({ queryKey: ['riskRegister', projectId] }); // Refresh risk register table
      queryClient.invalidateQueries({ queryKey: ['gaps', riskAssessment?.gap_id] }); // Invalidate specific gap if linked
      
      // Optionally trigger window location reload to ensure all components refresh
      // window.location.reload();
      
      if (onSuccess) {
        onSuccess(savedAssessment);
      }
    },
    onError: (err) => {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} risk assessment:`, err);
      const errorMessage = `Failed to ${isEditing ? 'update' : 'create'} assessment: ${err instanceof Error ? err.message : 'Unknown error'}`;
      
      // Show error toast notification
      toast.error(errorMessage);
      
      setError(errorMessage);
    },
  });

  const onSubmit = (data: RiskAssessmentFormValues) => {
     if (!selectedThreat) {
       setError("Please select or create a Threat Scenario.");
       return;
     }
     
     // Basic validation after conversion
     const sleValue = data.sle && data.sle !== '' ? Number(data.sle) : null;
     const aroValue = data.aro && data.aro !== '' ? Number(data.aro) : null;

     if (sleValue !== null && (isNaN(sleValue) || sleValue <= 0)) {
       setError('SLE must be a positive number.');
       return;
     }
     
     if (aroValue !== null && (isNaN(aroValue) || aroValue < 0)) {
       setError('ARO cannot be negative.');
       return;
     }
     
     // Validate that SLE breakdown sum matches the SLE total
     const breakdownSum = [
       data.sle_direct_operational_costs, 
       data.sle_technical_remediation_costs,
       data.sle_data_related_costs,
       data.sle_compliance_legal_costs,
       data.sle_reputational_management_costs
     ]
       .filter(val => val && val !== '')
       .reduce((sum, val) => sum + Number(val), 0);
     
     // Only validate if both the total SLE and at least one breakdown value is provided
     if (sleValue !== null && breakdownSum > 0 && Math.abs(sleValue - breakdownSum) > 0.01) {
       setError(`SLE breakdown total (${breakdownSum.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}) must equal the SLE value (${sleValue.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}).`);
       return;
     }
     
     // Ensure threat_scenario_id is set from state
     const finalData = { ...data, threat_scenario_id: selectedThreat.id };
     mutation.mutate(finalData);
  };

  const handleThreatSelected = (scenario: ThreatScenario) => {
    setSelectedThreat(scenario);
    setShowThreatDialog(false); // Hide dialog if shown
  }

  const handleNewThreatSuccess = (scenario: ThreatScenario) => {
     setSelectedThreat(scenario);
     setShowThreatDialog(false);
  }

  return (
    <>
      <ThreatScenarioDialog
        projectId={projectId}
        gapId={gapId}
        isOpen={showThreatDialog}
        onOpenChange={setShowThreatDialog}
        onSuccess={handleNewThreatSuccess}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]"> {/* Adjusted max height */}
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Risk Assessment' : 'Assess Risk'}</DialogTitle>
            <DialogDescription>
              Evaluate risks by selecting an asset, threat scenario, and providing impact details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] overflow-y-auto pr-4"> {/* Force scrolling with fixed height */}
              <div className="grid gap-6 py-4 px-1">

              {/* Asset (Boundary) Selection */}
              <div className="space-y-2">
                <Label htmlFor="boundary_id">Asset / Boundary</Label>
                <Controller
                  name="boundary_id"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingBoundaries || isSubmitting}>
                      <SelectTrigger id="boundary_id">
                        <SelectValue placeholder={isLoadingBoundaries ? "Loading boundaries..." : "Select Asset/Boundary"} />
                      </SelectTrigger>
                      <SelectContent>
                        {boundaries?.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name} ({b.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.boundary_id && <p className="text-xs text-destructive mt-1">{errors.boundary_id.message}</p>}
              </div>

              {/* Threat Scenario Selection/Creation */}
              <div className="space-y-4 rounded-md border p-4">
                {selectedThreat ? (
                    <div className="flex justify-between items-center">
                      <div>
                          <Label>Selected Threat Scenario</Label>
                          <p className="text-sm font-medium">{selectedThreat.name}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedThreat(null); setValue('threat_scenario_id', ''); }}>Change</Button>
                    </div>
                ) : (
                    <>
                      <ThreatScenarioList projectId={projectId} onSelectScenario={handleThreatSelected} />
                      <Button type="button" variant="secondary" size="sm" onClick={() => setShowThreatDialog(true)}>
                        <Plus className="mr-2 h-4 w-4"/> Create New Scenario
                      </Button>
                    </>
                )}
                {/* Hidden input to satisfy schema validation, value set by state */}
                <input type="hidden" {...register('threat_scenario_id')} />
                {errors.threat_scenario_id && !selectedThreat && <p className="text-xs text-destructive mt-1">{errors.threat_scenario_id.message}</p>}
              </div>


              {/* Severity Field (new) */}
              <div className="space-y-2">
                <Label htmlFor="severity">Risk Severity</Label>
                <Controller
                  name="severity"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <SelectTrigger id="severity">
                        <SelectValue placeholder="Select Severity Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.severity && <p className="text-xs text-destructive mt-1">{errors.severity.message}</p>}
                <p className="text-xs text-muted-foreground">Evaluate the overall risk severity.</p>
              </div>

              {/* SLE and ARO Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sle">Single Loss Expectancy (SLE) ($)</Label>
                  <Controller
                    name="sle"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="sle" 
                        type="number" 
                        min="0" 
                        placeholder="e.g., 150000" 
                        {...field}
                        value={field.value ?? ''}
                      />
                    )}
                  />
                  {errors.sle && <p className="text-xs text-destructive mt-1">{errors.sle.message}</p>}
                  <p className="text-xs text-muted-foreground">Estimate the total monetary impact if the threat occurs once.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="aro">Annualized Rate of Occurrence (ARO)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex text-xs text-muted-foreground hover:text-foreground cursor-help">
                          <span className="underline decoration-dotted">What is ARO?</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>ARO represents how frequently an event occurs annually.</p>
                        <ul className="mt-1 text-xs">
                          <li>0.2 means once every 5 years</li>
                          <li>1.0 means annually</li>
                          <li>2.0 means twice per year</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Use Controller for ARO field to enable value watching */}
                  <Controller
                    name="aro"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <Input 
                          id="aro" 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="e.g., 0.2 (1 in 5 years)"
                          {...field}
                          value={field.value ?? ''}
                        />
                        <AroFrequencyHelper aroValue={field.value} />
                      </div>
                    )}
                  />
                  
                  {errors.aro && <p className="text-xs text-destructive mt-1">{errors.aro.message}</p>}
                </div>
              </div>

              {/* ALE Calculation Display */}
              <Controller
                name="sle"
                control={control}
                render={({ field: { value: sleValue } }) => (
                  <Controller
                    name="aro"
                    control={control}
                    render={({ field: { value: aroValue } }) => {
                      // Calculate ALE if both values are available
                      const sle = sleValue && sleValue !== '' ? parseFloat(sleValue) : null;
                      const aro = aroValue && aroValue !== '' ? parseFloat(aroValue) : null;
                      
                      if (sle !== null && aro !== null && !isNaN(sle) && !isNaN(aro)) {
                        const ale = sle * aro;
                        const formattedAle = new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD', 
                          maximumFractionDigits: 0 
                        }).format(ale);
                        
                        return (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Annualized Loss Expectancy (ALE):</span>
                              <span className="text-lg font-bold">{formattedAle}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculated from SLE × ARO = {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(sle)} × {aro.toFixed(2)}
                            </p>
                          </div>
                        );
                      }
                      
                      return null;
                    }}
                  />
                )}
              />

              {/* SLE Breakdown Fields */}
              <div className="space-y-4 rounded-md border p-4 mt-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>SLE Breakdown</Label>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        // Watch all SLE breakdown fields and the total SLE
                        const watchSleTotal = watch('sle') ? Number(watch('sle')) : 0;
                        const breakdownValues = [
                          watch('sle_direct_operational_costs'),
                          watch('sle_technical_remediation_costs'),
                          watch('sle_data_related_costs'),
                          watch('sle_compliance_legal_costs'),
                          watch('sle_reputational_management_costs')
                        ];
                        
                        const breakdownSum = breakdownValues
                          .filter(val => val && val !== '')
                          .reduce((sum, val) => sum + Number(val), 0);
                        
                        const isValid = Math.abs(watchSleTotal - breakdownSum) < 0.01;
                        
                        if (watchSleTotal && breakdownSum > 0) {
                          return (
                            <span className={isValid ? "text-green-600" : "text-red-600"}>
                              Total: ${breakdownSum.toFixed(2)} {isValid ? '✓' : '≠ SLE'}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Direct Operational Costs */}
                    <div className="space-y-2">
                      <Label htmlFor="sle_direct_operational_costs">Direct Operational Costs ($)</Label>
                      <Controller
                        name="sle_direct_operational_costs"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="sle_direct_operational_costs" 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 4100" 
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Business downtime, system restoration, emergency response</p>
                    </div>
                    
                    {/* Technical Remediation */}
                    <div className="space-y-2">
                      <Label htmlFor="sle_technical_remediation_costs">Technical Remediation ($)</Label>
                      <Controller
                        name="sle_technical_remediation_costs"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="sle_technical_remediation_costs" 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 2800" 
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Malware removal, security patching, infrastructure hardening</p>
                    </div>
                    
                    {/* Data-Related Costs */}
                    <div className="space-y-2">
                      <Label htmlFor="sle_data_related_costs">Data-Related Costs ($)</Label>
                      <Controller
                        name="sle_data_related_costs"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="sle_data_related_costs" 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 1600" 
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Data reconstruction, backup restoration, integrity verification</p>
                    </div>
                    
                    {/* Compliance and Legal */}
                    <div className="space-y-2">
                      <Label htmlFor="sle_compliance_legal_costs">Compliance and Legal ($)</Label>
                      <Controller
                        name="sle_compliance_legal_costs"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="sle_compliance_legal_costs" 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 900" 
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Incident documentation, regulatory reporting, legal consultation</p>
                    </div>
                    
                    {/* Reputational Management */}
                    <div className="space-y-2">
                      <Label htmlFor="sle_reputational_management_costs">Reputational Management ($)</Label>
                      <Controller
                        name="sle_reputational_management_costs"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            id="sle_reputational_management_costs" 
                            type="number" 
                            min="0" 
                            placeholder="e.g., 600" 
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                      <p className="text-xs text-muted-foreground">Customer communications, PR management</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Notes */}
              <div className="space-y-2">
                <Label htmlFor="assessment_notes">Assessment Notes (Optional)</Label>
                <Textarea id="assessment_notes" {...register('assessment_notes')} placeholder="Justification, assumptions, details..." />
              </div>

              {error && (
                <div className="text-sm text-destructive flex items-center gap-2 bg-red-50 p-3 rounded-md border border-red-200">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Assessment' : 'Save Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
