'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateBoundaryControl } from '@/services/boundary-control-service';
import { BoundaryControl } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // For date input
import { Loader2, Save, CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define compliance statuses
const complianceStatuses = ['Compliant', 'Partially Compliant', 'Non Compliant', 'Not Assessed'] as const;
type ComplianceStatus = typeof complianceStatuses[number];

// Zod schema for form validation
const assessmentSchema = z.object({
  compliance_status: z.enum(complianceStatuses).nullable(),
  assessment_date: z.string().optional().nullable(), // Store date as string for input type="date"
  assessment_notes: z.string().optional().nullable(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface ComplianceAssessmentProps {
  boundaryControl: BoundaryControl; // Pass the full boundary control object
  onAssessmentSaved: () => void; // Callback after saving
}

export function ComplianceAssessment({ boundaryControl, onAssessmentSaved }: ComplianceAssessmentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      compliance_status: boundaryControl.compliance_status || 'Not Assessed',
      // Format date for input type="date" (YYYY-MM-DD)
      assessment_date: boundaryControl.assessment_date ? new Date(boundaryControl.assessment_date).toISOString().split('T')[0] : '',
      assessment_notes: boundaryControl.assessment_notes || '',
    }
  });

   // Reset form if boundaryControl changes
  useEffect(() => {
     reset({
      compliance_status: boundaryControl.compliance_status || 'Not Assessed',
      assessment_date: boundaryControl.assessment_date ? new Date(boundaryControl.assessment_date).toISOString().split('T')[0] : '',
      assessment_notes: boundaryControl.assessment_notes || '',
    });
  }, [boundaryControl, reset]);


  const onSubmit: SubmitHandler<AssessmentFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateBoundaryControl(boundaryControl.id, {
        compliance_status: data.compliance_status,
        // Convert date string back to ISO string or null
        assessment_date: data.assessment_date ? new Date(data.assessment_date).toISOString() : null,
        assessment_notes: data.assessment_notes,
      });
      onAssessmentSaved(); // Trigger refetch/update in parent
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Failed to save assessment:", err);
      setError(err.message || 'Failed to save assessment. Please try again.');
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get icon based on status
  const getStatusIcon = (status: ComplianceStatus | null | undefined) => {
    switch (status) {
      case 'Compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Partially Compliant': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Non Compliant': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
       <CardHeader>
        <CardTitle>Compliance Assessment</CardTitle>
        <CardDescription>Set the compliance status and record assessment details for this control.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Compliance Status */}
          <div>
            <Label htmlFor="compliance_status">Compliance Status</Label>
             <Select
                onValueChange={(value) => setValue('compliance_status', value as ComplianceStatus)}
                defaultValue={boundaryControl.compliance_status || 'Not Assessed'}
                disabled={isSubmitting}
              >
                <SelectTrigger id="compliance_status">
                   <div className="flex items-center">
                     {getStatusIcon(control._formValues.compliance_status)}
                     <span className="ml-2"><SelectValue placeholder="Select status" /></span>
                   </div>
                </SelectTrigger>
                <SelectContent>
                  {complianceStatuses.map(s => (
                    <SelectItem key={s} value={s}>
                       <div className="flex items-center">
                         {getStatusIcon(s)} <span className="ml-2">{s}</span>
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            {errors.compliance_status && <p className="text-red-500 text-xs mt-1">{errors.compliance_status.message}</p>}
          </div>

          {/* Assessment Date */}
          <div>
            <Label htmlFor="assessment_date">Assessment Date (Optional)</Label>
            <Input id="assessment_date" type="date" {...register('assessment_date')} disabled={isSubmitting} />
            {errors.assessment_date && <p className="text-red-500 text-xs mt-1">{errors.assessment_date.message}</p>}
          </div>

          {/* Assessment Notes */}
          <div>
            <Label htmlFor="assessment_notes">Assessment Notes (Optional)</Label>
            <Textarea id="assessment_notes" {...register('assessment_notes')} disabled={isSubmitting} rows={4} />
             {errors.assessment_notes && <p className="text-red-500 text-xs mt-1">{errors.assessment_notes.message}</p>}
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <div className="flex justify-end">
             <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Assessment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
