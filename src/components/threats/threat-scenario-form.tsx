'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, XCircle } from 'lucide-react';
import { TablesInsert, Tables } from '@/types/database.types'; // Import generated types
// Import the actual service functions
import { createThreatScenario, updateThreatScenario } from '@/services/threat-service'; 

// Define Zod schema based on DB structure (excluding auto-generated fields)
const threatScenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required'),
  description: z.string().nullable().optional(),
  threat_actor_type: z.string().nullable().optional(), // Could be an enum later
  relevant_iso_domains: z.array(z.string()).nullable().optional(), // Array of strings
  // Add new fields - keep as strings in schema, convert manually
  sle: z.string().nullable().optional(),
  aro: z.string().nullable().optional(),
  // Store MITRE techniques as comma-separated string in form
  mitre_techniques_input: z.string().nullable().optional(), 
  gap_id: z.string().uuid().nullable().optional(), // Optional foreign key
}); 

// Type for the form's input fields
type ThreatScenarioFormInput = z.infer<typeof threatScenarioSchema>;

// Type expected by the database mutation (assuming schema update)
// We'll construct this manually in onSubmit
type ThreatScenarioSubmitData = Omit<ThreatScenarioFormInput, 'mitre_techniques_input' | 'sle' | 'aro'> & {
  sle: number | null;
  aro: number | null;
  mitre_techniques: string[] | null;
};

type ThreatScenario = Tables<'threat_scenarios'>;
type ThreatScenarioInsert = TablesInsert<'threat_scenarios'>;

interface ThreatScenarioFormProps {
  projectId: string;
  gapId?: string; // Add gapId prop here
  threatScenario?: ThreatScenario; // For editing
  isEditing?: boolean;
  onSuccess?: (scenario: ThreatScenario) => void; // Callback on success
  onCancel?: () => void;
} 


export function ThreatScenarioForm({
  projectId,
  gapId, // Ensure gapId is destructured
  threatScenario,
  isEditing = false,
  onSuccess,
  onCancel,
}: ThreatScenarioFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // useForm manages the input shape (ThreatScenarioFormInput)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ThreatScenarioFormInput>({ 
    resolver: zodResolver(threatScenarioSchema), // Zod schema still validates the input shape
    defaultValues: {
      name: threatScenario?.name ?? '',
      description: threatScenario?.description ?? null,
      threat_actor_type: threatScenario?.threat_actor_type ?? null,
      // relevant_iso_domains: threatScenario?.relevant_iso_domains ?? null, // Keep commented out for now
      // Add new defaults matching ThreatScenarioFormInput
      // Access existing threatScenario properties carefully, convert numbers to string for form
      sle: (threatScenario as any)?.sle?.toString() ?? null, 
      aro: (threatScenario as any)?.aro?.toString() ?? null,
      mitre_techniques_input: (threatScenario as any)?.mitre_techniques?.join(', ') ?? '', // Use input field name
      gap_id: (threatScenario as any)?.gap_id ?? gapId ?? null, // Use prop if creating, existing if editing
    },
  });

  // The data passed to mutationFn needs to match the expected DB insert/update type (ThreatScenarioSubmitData)
  // We'll construct this manually in onSubmit before calling mutate
  const mutationFn = isEditing && threatScenario
    ? (data: ThreatScenarioSubmitData) => updateThreatScenario(threatScenario.id, { ...data, project_id: projectId } as any) // Use 'as any' until DB types updated
    : (data: ThreatScenarioSubmitData) => createThreatScenario({ ...data, project_id: projectId, gap_id: data.gap_id ?? gapId } as any); // Use 'as any' until DB types updated

  const mutation = useMutation({
    mutationFn,
    onSuccess: (savedScenario) => {
      setError(null);
      // Reset form with default values matching ThreatScenarioFormInput
      reset({ 
        name: '', 
        description: null, 
        threat_actor_type: null, 
        // relevant_iso_domains: null, // Keep commented out
        sle: null, 
        aro: null, 
        mitre_techniques_input: '', 
        gap_id: gapId ?? null // Reset gap_id based on prop if creating
      }); 
      queryClient.invalidateQueries({ queryKey: ['threatScenarios', projectId] }); 
      if (onSuccess) {
        onSuccess(savedScenario);
      }
    },
    onError: (err) => {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} threat scenario:`, err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} threat scenario: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
  });

  // onSubmit receives the validated INPUT data (ThreatScenarioFormInput)
  const onSubmit = (data: ThreatScenarioFormInput) => { 
    // Manually construct the data for submission, converting types
    const sleValue = data.sle && data.sle !== '' ? Number(data.sle) : null;
    const aroValue = data.aro && data.aro !== '' ? Number(data.aro) : null;

    // Basic validation after conversion (Zod schema only validated string format)
    if (sleValue !== null && (isNaN(sleValue) || sleValue <= 0)) {
       setError('SLE must be a positive number.');
       return;
    }
     if (aroValue !== null && (isNaN(aroValue) || aroValue < 0)) {
       setError('ARO cannot be negative.');
       return;
    }
    setError(null); // Clear previous errors if validation passes

    const submitData: ThreatScenarioSubmitData = {
      name: data.name,
      description: data.description,
      threat_actor_type: data.threat_actor_type,
      relevant_iso_domains: data.relevant_iso_domains,
      gap_id: data.gap_id,
      sle: sleValue,
      aro: aroValue,
      mitre_techniques: data.mitre_techniques_input
        ? data.mitre_techniques_input.split(',').map(s => s.trim()).filter(Boolean)
        : null,
    };
    mutation.mutate(submitData);
  };

  return (
    <Card className="w-full max-w-lg mx-auto"> {/* Adjust width as needed */}
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Threat Scenario' : 'Add New Threat Scenario'}</CardTitle>
        <CardDescription>
          Define a potential threat event relevant to your assets.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Scenario Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Ransomware Attack, Insider Data Theft" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register('description')} placeholder="Describe the threat event..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threat_actor_type">Threat Actor Type (Optional)</Label>
            <Input id="threat_actor_type" {...register('threat_actor_type')} placeholder="e.g., External Hacker, Disgruntled Employee" />
            {/* Consider using a Select component if you have predefined types */}
          </div>
          
          {/* TODO: Add input for relevant_iso_domains (e.g., multi-select or tags input) */}
          {/* For now, leaving it out for simplicity */}
          {/* <div className="space-y-2">
            <Label htmlFor="relevant_iso_domains">Relevant ISO Domains (Optional)</Label>
            <Input id="relevant_iso_domains" {...register('relevant_iso_domains')} placeholder="Comma-separated domains" />
          </div> */}

          {/* CRQ Fields - Use type="text" for manual parsing, or keep type="number" and rely on browser */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sle">Single Loss Expectancy (SLE) ($)</Label>
              {/* Using type="number" might still be better UX, but parsing needs care */}
              <Input id="sle" type="number" {...register('sle')} placeholder="e.g., 150000" /> 
              {errors.sle && <p className="text-xs text-destructive mt-1">{errors.sle.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aro">Annualized Rate of Occurrence (ARO)</Label>
              <Input id="aro" type="number" step="0.01" {...register('aro')} placeholder="e.g., 0.2 (1 in 5 years)" />
              {errors.aro && <p className="text-xs text-destructive mt-1">{errors.aro.message}</p>}
            </div>
          </div>

          {/* MITRE Techniques Field */}
          <div className="space-y-2">
            <Label htmlFor="mitre_techniques_input">MITRE ATT&CK Techniques (Optional, comma-separated)</Label>
            <Textarea id="mitre_techniques_input" {...register('mitre_techniques_input')} placeholder="e.g., T1566, T1190, T1059" />
            {/* Consider a more advanced input later */}
            {errors.mitre_techniques_input && <p className="text-xs text-destructive mt-1">{errors.mitre_techniques_input.message}</p>}
          </div>

          {/* Hidden input for gap_id if needed, though it's handled by the schema */}
          {/* <input type="hidden" {...register('gap_id')} /> */}

          {error && (
             <div className="text-sm text-destructive flex items-center gap-2 bg-red-50 p-3 rounded-md border border-red-200">
               <XCircle className="h-4 w-4" />
               {error}
             </div>
           )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Scenario' : 'Add Scenario'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
