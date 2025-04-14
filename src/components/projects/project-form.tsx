'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form' // Import Controller
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // Import Select components
import { Label } from '@/components/ui/label' // Import Label
import { createProject, updateProject } from '@/services/project-service'
import { ProjectWithStatus } from '@/types' // Removed Project, ProjectStatus imports since they're not used
import { CalendarIcon, Loader2Icon } from 'lucide-react'
// Removed unused format import

// Define the allowed status values based on the type - use 'as const' for z.enum
// Removed 'Not Started'
const projectStatuses = ['In Progress', 'Completed', 'On Hold'] as const; 
// Ensure ProjectStatus type matches these values (it should from types/index.ts)

// Define the form schema with zod, including the status field
const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  status: z.enum(projectStatuses) // Use z.enum for the status string
});

// Use the schema to infer the form values type
type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  // Use ProjectWithStatus for editing as it contains the processed string status
  project?: ProjectWithStatus 
  isEditing?: boolean
}

export function ProjectForm({ project, isEditing = false }: ProjectFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with default values or existing project data
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || null,
      start_date: project?.start_date || null,
      end_date: project?.end_date || null,
      status: project?.status || 'In Progress' // Default to 'In Progress' for new projects
    }
  });

  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && project) {
        // Update existing project - service function expects string status
        await updateProject(project.id, data); 
        router.push(`/dashboard/projects/${project.id}`);
      } else {
        // Create new project - service function expects ProjectFormValues
        // Make sure name is not undefined (required by createProject)
        const newProject = await createProject({
          name: data.name, // This is required and non-optional
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status
        });
        router.push(`/dashboard/projects/${newProject.id}`);
      }
      router.refresh(); // Refresh the page to update the data
    } catch (err: unknown) { // Use unknown type for better type safety
      console.error('Error saving project:', err);
      // Check if the error has a message property before accessing it
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your ISMS project details' 
            : 'Fill in the details to create a new ISMS project'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter project name"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={4}
              {...form.register('description')}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Start Date
              </Label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                End Date
              </Label>
              <Input
                id="end_date"
                type="date"
                {...form.register('end_date')}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-2">
             <Label htmlFor="status">Status</Label>
             <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && (
                <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
              )}
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Project' : 'Create Project'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
