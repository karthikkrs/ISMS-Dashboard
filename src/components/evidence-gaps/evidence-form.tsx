'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import query/mutation hooks
import { createEvidence } from '@/services/evidence-service';
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { ProjectWithStatus } from '@/types'; // Import Project type
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
import { Loader2, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Zod schema for form validation
const evidenceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  // Use z.any() for SSR compatibility and refine on client if needed, or handle validation differently
  file: z.any().optional(), 
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

interface EvidenceFormProps {
  projectId: string; // Need projectId to fetch project status
  boundaryControlId: string;
  onEvidenceAdded: () => void;
}

export function EvidenceForm({ projectId, boundaryControlId, onEvidenceAdded }: EvidenceFormProps) {
  const queryClient = useQueryClient(); // For invalidating queries
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<EvidenceFormData | null>(null); // Store form data for confirmation

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId, // Only fetch if projectId is available
    staleTime: Infinity, // Avoid refetching just for status check within the form
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : null);
  };

  // Function to actually perform the evidence creation and phase unmarking
  const performSubmit = async (data: EvidenceFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const fileToUpload = data.file?.[0] || null;

      // 1. Create Evidence
      await createEvidence(boundaryControlId, {
        title: data.title,
        description: data.description,
        file: fileToUpload,
      });

      // 2. Unmark Phase (only if it was previously complete)
      if (project?.evidence_gaps_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'evidence_gaps_completed_at');
        // Invalidate project query to reflect the change in completion status
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] }); // Also invalidate list if needed
      }

      reset();
      setSelectedFileName(null);
      onEvidenceAdded();
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Failed to add evidence:", err);
      setError(err.message || 'Failed to add evidence. Please try again.');
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false); // Close confirmation dialog if open
      setFormData(null); // Clear stored form data
    }
  };

  // Initial submit handler: checks phase status and shows confirmation if needed
  const onSubmit: SubmitHandler<EvidenceFormData> = (data) => {
    // Check if the phase is already complete
    if (project?.evidence_gaps_completed_at) {
      setFormData(data); // Store data
      setShowConfirmation(true); // Show confirmation dialog
    } else {
      performSubmit(data); // Submit directly if phase is not complete
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Add New Evidence</CardTitle>
        <CardDescription>Upload documents or add notes as evidence for this control.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} disabled={isSubmitting} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register('description')} disabled={isSubmitting} />
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">Upload File (Optional)</Label>
            <div className="flex items-center space-x-2">
               <Input 
                 id="file" 
                 type="file" 
                 {...register('file')} 
                 onChange={handleFileChange}
                 disabled={isSubmitting} 
                 className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
               />
            </div>
             {selectedFileName && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFileName}</p>}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Add Evidence
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Confirmation Dialog */}
    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
          <AlertDialogDescription>
            The "Evidence & Gaps" phase is marked as complete. Adding new evidence will reset this status. Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setFormData(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => formData && performSubmit(formData)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Add
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
