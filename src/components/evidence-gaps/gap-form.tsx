'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Removed useMutation
import { createGap, updateGap } from '@/services/gap-service';
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { Gap, GapSeverity, GapStatus, ProjectWithStatus } from '@/types'; // Import Project type
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Zod schema for form validation - Add title
const gapSchema = z.object({
  title: z.string().min(1, 'Title is required'), // Add title validation
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Identified', 'In Review', 'Confirmed', 'Remediated', 'Closed']).optional(),
});

// Infer type from schema
type GapFormData = z.infer<typeof gapSchema>;

interface GapFormProps {
  projectId: string; // Added projectId prop
  boundaryControlId: string;
  existingGap?: Gap | null; // Pass existing gap data for editing
  onGapSaved: () => void; // Callback after saving (add or edit)
  onCancel?: () => void; // Optional callback for cancelling edit
}

// Add projectId to the function signature and props destructuring
export function GapForm({ projectId, boundaryControlId, existingGap, onGapSaved, onCancel }: GapFormProps) { 
  const queryClient = useQueryClient(); // For invalidating queries
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<GapFormData | null>(null); // Store form data for confirmation

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GapFormData>({ // Removed control
    resolver: zodResolver(gapSchema),
    // Add title to default values
    defaultValues: {
      title: existingGap?.title || '', 
      description: existingGap?.description || '',
      severity: existingGap?.severity || 'Medium', // Default severity
      status: existingGap?.status || 'Identified', // Default status
    }
  });

  // Reset form if existingGap changes (e.g., when switching from add to edit)
  useEffect(() => {
    if (existingGap) {
      setValue('title', existingGap.title); // Set title on edit
      setValue('description', existingGap.description);
      setValue('severity', existingGap.severity);
      setValue('status', existingGap.status);
    } else {
       // Reset title as well
       reset({ title: '', description: '', severity: 'Medium', status: 'Identified' }); 
    }
  }, [existingGap, setValue, reset]);

  // Function to actually perform the gap creation/update and phase unmarking
  const performSubmit = async (data: GapFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Removed unused savedGap variable declaration
      if (existingGap) {
        // Update existing gap
        await updateGap(existingGap.id, { // Assign directly if needed elsewhere, otherwise just await
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
        });
      } else {
        // Create new gap
        await createGap(projectId, boundaryControlId, { // Assign directly if needed elsewhere, otherwise just await
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
        });
      }

      // Unmark Phase (only if it was previously complete)
      if (project?.evidence_gaps_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'evidence_gaps_completed_at');
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      reset({ title: '', description: '', severity: 'Medium', status: 'Identified' });
      onGapSaved();
      
      // Show success toast with appropriate message based on whether adding or editing
      toast.success(existingGap ? 'Gap updated successfully' : 'Gap added successfully', {
        description: `${data.title} has been ${existingGap ? 'updated' : 'added'}.`
      });
    } catch (err: unknown) {
      console.error("Failed to save gap:", err);
      const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to save gap. Please try again.';
      setError(errorMessage);
      toast.error('Error saving gap', {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
      setFormData(null);
    }
  };

  // Initial submit handler: checks phase status and shows confirmation if needed
  const onSubmit: SubmitHandler<GapFormData> = (data) => {
    if (project?.evidence_gaps_completed_at) {
      setFormData(data);
      setShowConfirmation(true);
    } else {
      performSubmit(data);
    }
  };

  return (
    <>
    <Card>
       <CardHeader>
        <CardTitle>{existingGap ? 'Edit Gap' : 'Identify New Gap'}</CardTitle>
        <CardDescription>Document the details of the identified gap.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title Input */}
          <div>
            <Label htmlFor="title">Gap Title</Label>
            <Input id="title" {...register('title')} disabled={isSubmitting} placeholder="e.g., Firewall Rule Missing" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Gap Description</Label>
            <Textarea id="description" {...register('description')} disabled={isSubmitting} rows={4} placeholder="Describe the gap found..."/>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Severity */}
          <div>
            <Label htmlFor="severity">Severity</Label>
             <Select
                onValueChange={(value) => setValue('severity', value as GapSeverity)}
                defaultValue={existingGap?.severity || 'Medium'}
                disabled={isSubmitting}
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {(['Critical', 'High', 'Medium', 'Low'] as GapSeverity[]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            {errors.severity && <p className="text-red-500 text-xs mt-1">{errors.severity.message}</p>}
          </div>

           {/* Status (Show only when editing) */}
           {existingGap && (
             <div>
               <Label htmlFor="status">Status</Label>
               <Select
                  onValueChange={(value) => setValue('status', value as GapStatus)}
                  defaultValue={existingGap.status}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Identified', 'In Review', 'Confirmed', 'Remediated', 'Closed'] as GapStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
             </div>
           )}


          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
             {existingGap && onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
             )}
             <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : existingGap ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                 <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {existingGap ? 'Save Changes' : 'Add Gap'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Confirmation Dialog */}
    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              The &quot;Evidence &amp; Gaps&quot; phase is marked as complete. {existingGap ? 'Updating this gap' : 'Adding a new gap'} will reset this status. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setFormData(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => formData && performSubmit(formData)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & {existingGap ? 'Save' : 'Add'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
