'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createGap, updateGap } from '@/services/gap-service';
import { Gap, GapSeverity, GapStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Zod schema for form validation
const gapSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  status: z.enum(['Identified', 'In Review', 'Confirmed', 'Remediated', 'Closed']).optional(),
});

type GapFormData = z.infer<typeof gapSchema>;

interface GapFormProps {
  boundaryControlId: string;
  existingGap?: Gap | null; // Pass existing gap data for editing
  onGapSaved: () => void; // Callback after saving (add or edit)
  onCancel?: () => void; // Optional callback for cancelling edit
}

export function GapForm({ boundaryControlId, existingGap, onGapSaved, onCancel }: GapFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<GapFormData>({
    resolver: zodResolver(gapSchema),
    defaultValues: {
      description: existingGap?.description || '',
      severity: existingGap?.severity || 'Medium', // Default severity
      status: existingGap?.status || 'Identified', // Default status
    }
  });

  // Reset form if existingGap changes (e.g., when switching from add to edit)
  useEffect(() => {
    if (existingGap) {
      setValue('description', existingGap.description);
      setValue('severity', existingGap.severity);
      setValue('status', existingGap.status);
    } else {
       reset({ description: '', severity: 'Medium', status: 'Identified' }); // Reset to defaults for adding
    }
  }, [existingGap, setValue, reset]);


  const onSubmit: SubmitHandler<GapFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (existingGap) {
        // Update existing gap
        await updateGap(existingGap.id, {
          description: data.description,
          severity: data.severity,
          status: data.status,
        });
      } else {
        // Create new gap
        await createGap(boundaryControlId, {
          description: data.description,
          severity: data.severity,
          status: data.status,
        });
      }
      reset({ description: '', severity: 'Medium', status: 'Identified' }); // Reset after successful save
      onGapSaved(); // Trigger refetch/update in parent
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Failed to save gap:", err);
      setError(err.message || 'Failed to save gap. Please try again.');
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
       <CardHeader>
        <CardTitle>{existingGap ? 'Edit Gap' : 'Identify New Gap'}</CardTitle>
        <CardDescription>Document the details of the identified gap.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Description */}
          <div>
            <Label htmlFor="description">Gap Description</Label>
            <Textarea id="description" {...register('description')} disabled={isSubmitting} rows={4} />
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
  );
}
