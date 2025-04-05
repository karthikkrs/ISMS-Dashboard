'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createProject, updateProject } from '@/services/project-service'
import { Project } from '@/types'
import { CalendarIcon, Loader2Icon } from 'lucide-react'
import { format } from 'date-fns'

// Define the form schema with zod
const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable()
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface ProjectFormProps {
  project?: Project
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
      end_date: project?.end_date || null
    }
  })

  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && project) {
        // Update existing project
        await updateProject(project.id, data)
        router.push(`/dashboard/projects/${project.id}`)
      } else {
        // Create new project
        const newProject = await createProject(data)
        router.push(`/dashboard/projects/${newProject.id}`)
      }
      router.refresh() // Refresh the page to update the data
    } catch (err) {
      console.error('Error saving project:', err)
      setError('Failed to save project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name <span className="text-red-500">*</span>
            </label>
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

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={4}
              {...form.register('description')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start_date" className="text-sm font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Start Date
              </label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                End Date
              </label>
              <Input
                id="end_date"
                type="date"
                {...form.register('end_date')}
              />
            </div>
          </div>

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
  )
}
