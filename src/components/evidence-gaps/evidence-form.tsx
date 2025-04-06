'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createEvidence } from '@/services/evidence-service';
import { Button } from '@/components/ui/button';
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
  boundaryControlId: string;
  onEvidenceAdded: () => void; // Callback to refetch list after adding
}

export function EvidenceForm({ boundaryControlId, onEvidenceAdded }: EvidenceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file ? file.name : null);
  };

  const onSubmit: SubmitHandler<EvidenceFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const fileToUpload = data.file?.[0] || null; // Get the first file from FileList

      await createEvidence(boundaryControlId, {
        title: data.title,
        description: data.description,
        file: fileToUpload,
      });
      reset(); // Reset form fields
      setSelectedFileName(null); // Clear selected file name
      onEvidenceAdded(); // Trigger refetch in parent
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Failed to add evidence:", err);
      setError(err.message || 'Failed to add evidence. Please try again.');
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}
