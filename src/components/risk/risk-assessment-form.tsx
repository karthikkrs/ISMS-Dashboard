'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog'; // Use Dialog for modal
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, XCircle, AlertTriangle, Check } from 'lucide-react';
// Use Tables helper type from database.types.ts for all DB types
import { Tables, TablesInsert, Json } from '@/types/database.types'; 
import { getBoundaries } from '@/services/boundary-service'; // To select Asset/Boundary
import { ThreatScenarioList } from '@/components/threats/threat-scenario-list'; // To select Threat
import { ThreatScenarioForm } from '@/components/threats/threat-scenario-form'; // To create Threat
// Import actual risk service functions
import { createRiskAssessment, updateRiskAssessment } from '@/services/risk-assessment-service'; 

// --- Define Types ---
// Define Boundary using the Tables helper type
type Boundary = Tables<'boundaries'>; 
type ThreatScenario = Tables<'threat_scenarios'>;
type RiskAssessment = Tables<'risk_assessments'>;
type RiskAssessmentInsert = TablesInsert<'risk_assessments'>;

// --- Zod Schema ---
// Schema for the flexible input fields (example structure)
const likelihoodSchema = z.object({
  type: z.enum(['scale', 'frequency']), // e.g., Qualitative scale or Annual Frequency
  value: z.union([z.enum(['High', 'Medium', 'Low']), z.number()]), // Value depends on type
  unit: z.string().optional(), // e.g., 'year' for frequency
}).nullable().optional();

const magnitudeSchema = z.object({
  type: z.enum(['scale', 'range', 'value']), // e.g., Qualitative, Financial Range, Single Value
  value: z.union([z.enum(['High', 'Medium', 'Low']), z.number()]),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  currency: z.string().optional(), // e.g., 'USD'
}).nullable().optional();

const riskAssessmentSchema = z.object({
  boundary_id: z.string().uuid('Invalid Asset/Boundary selected'),
  threat_scenario_id: z.string().uuid('Threat Scenario is required'),
  likelihood_frequency_input: likelihoodSchema,
  loss_magnitude_input: magnitudeSchema,
  assessment_notes: z.string().nullable().optional(),
  // gap_id and control_id will be passed directly, not part of the form schema itself
});

type RiskAssessmentFormValues = z.infer<typeof riskAssessmentSchema>;

// --- Component Props ---
interface RiskAssessmentFormProps {
  projectId: string;
  gapId?: string; // Optional: Link assessment to a specific gap
  controlId?: string; // Optional: Link assessment to a control (if no gap)
  riskAssessment?: RiskAssessment; // For editing
  isEditing?: boolean;
  onSuccess?: (assessment: RiskAssessment) => void;
  trigger?: React.ReactNode; // Optional trigger element (e.g., the button from GapList)
}


// --- Component ---
export function RiskAssessmentForm({
  projectId,
  gapId,
  controlId,
  riskAssessment,
  isEditing = false,
  onSuccess,
  trigger,
}: RiskAssessmentFormProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewThreatForm, setShowNewThreatForm] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<ThreatScenario | null>(riskAssessment?.threat_scenario_id ? { id: riskAssessment.threat_scenario_id } as ThreatScenario : null); // Pre-select if editing
  const [error, setError] = useState<string | null>(null);

  // Fetch boundaries (assets) for selection - Ensure type matches service return
  const { data: boundaries, isLoading: isLoadingBoundaries } = useQuery<Boundary[], Error>({ 
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId), // This returns Promise<Boundary[]>
    enabled: isOpen, // Only fetch when the dialog is open
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue } = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(riskAssessmentSchema),
    defaultValues: {
      boundary_id: riskAssessment?.boundary_id ?? '',
      threat_scenario_id: riskAssessment?.threat_scenario_id ?? '',
      likelihood_frequency_input: riskAssessment?.likelihood_frequency_input as z.infer<typeof likelihoodSchema> ?? null,
      loss_magnitude_input: riskAssessment?.loss_magnitude_input as z.infer<typeof magnitudeSchema> ?? null,
      assessment_notes: riskAssessment?.assessment_notes ?? null,
    },
  });

   // Update form when selectedThreat changes
   useEffect(() => {
    if (selectedThreat) {
      setValue('threat_scenario_id', selectedThreat.id);
    }
  }, [selectedThreat, setValue]);

  const mutationFn = isEditing && riskAssessment
    ? (data: RiskAssessmentFormValues) => updateRiskAssessment(riskAssessment.id, { ...data, project_id: projectId, gap_id: gapId, control_id: controlId })
    : (data: RiskAssessmentFormValues) => createRiskAssessment({ ...data, project_id: projectId, gap_id: gapId, control_id: controlId });

  const mutation = useMutation({
    mutationFn,
    onSuccess: (savedAssessment) => {
      setError(null);
      reset();
      setSelectedThreat(null);
      setIsOpen(false); // Close dialog on success
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['riskAssessments', projectId] }); 
      queryClient.invalidateQueries({ queryKey: ['gaps', riskAssessment?.gap_id] }); // Invalidate specific gap if linked
      if (onSuccess) {
        onSuccess(savedAssessment);
      }
    },
    onError: (err) => {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} risk assessment:`, err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} assessment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  const onSubmit = (data: RiskAssessmentFormValues) => {
     if (!selectedThreat) {
       setError("Please select or create a Threat Scenario.");
       return;
     }
     // Ensure threat_scenario_id is set from state
     const finalData = { ...data, threat_scenario_id: selectedThreat.id };
     mutation.mutate(finalData);
  };

  const handleThreatSelected = (scenario: ThreatScenario) => {
    setSelectedThreat(scenario);
    setShowNewThreatForm(false); // Hide form if shown
  }

  const handleNewThreatSuccess = (scenario: ThreatScenario) => {
     setSelectedThreat(scenario);
     setShowNewThreatForm(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[800px]"> {/* Wider dialog */}
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Risk Assessment' : 'Assess Risk'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">

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
               ) : showNewThreatForm ? (
                  <ThreatScenarioForm 
                     projectId={projectId} 
                     onSuccess={handleNewThreatSuccess} 
                     onCancel={() => setShowNewThreatForm(false)} 
                  />
               ) : (
                  <>
                     <ThreatScenarioList projectId={projectId} onSelectScenario={handleThreatSelected} />
                     <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewThreatForm(true)}>
                       <Plus className="mr-2 h-4 w-4"/> Create New Scenario
                     </Button>
                  </>
               )}
               {/* Hidden input to satisfy schema validation, value set by state */}
               <input type="hidden" {...register('threat_scenario_id')} />
               {errors.threat_scenario_id && !selectedThreat && <p className="text-xs text-destructive mt-1">{errors.threat_scenario_id.message}</p>}
            </div>


            {/* Likelihood / Frequency Input */}
            <div className="space-y-2">
              <Label>Likelihood / Frequency</Label>
              {/* TODO: Implement flexible input based on likelihoodSchema */}
              <Input placeholder="Input for Likelihood (e.g., High / 3 times/year)" {...register('likelihood_frequency_input')} />
              <p className="text-xs text-muted-foreground">Define how often this threat might occur against this asset.</p>
            </div>

            {/* Loss Magnitude Input */}
            <div className="space-y-2">
              <Label>Loss Magnitude</Label>
              {/* TODO: Implement flexible input based on magnitudeSchema */}
              <Input placeholder="Input for Magnitude (e.g., Medium / $10k-$50k)" {...register('loss_magnitude_input')} />
               <p className="text-xs text-muted-foreground">Estimate the potential impact if the threat occurs.</p>
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
  );
}
