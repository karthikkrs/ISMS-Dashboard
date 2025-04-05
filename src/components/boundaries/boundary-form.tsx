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
import { createBoundary, updateBoundary } from '@/services/boundary-service'
import { Boundary, BoundaryType } from '@/types'
import { Loader2Icon } from 'lucide-react'

// Define the form schema with zod
const boundaryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Department', 'System', 'Location', 'Other']),
  description: z.string().nullable(),
  included: z.boolean(),
  notes: z.string().nullable()
})

type BoundaryFormValues = z.infer<typeof boundaryFormSchema>

interface BoundaryFormProps {
  projectId: string
  boundary?: Boundary
  isEditing?: boolean
  onSuccess?: () => void
}

export function BoundaryForm({ projectId, boundary, isEditing = false, onSuccess }: BoundaryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with default values or existing boundary data
  const form = useForm<BoundaryFormValues>({
    resolver: zodResolver(boundaryFormSchema),
    defaultValues: {
      name: boundary?.name || '',
      type: boundary?.type || 'Department',
      description: boundary?.description || null,
      included: boundary?.included ?? true,
      notes: boundary?.notes || null
    }
  })

  // Handle form submission
  const onSubmit = async (data: BoundaryFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing && boundary) {
        // Update existing boundary
        await updateBoundary(boundary.id, data)
      } else {
        // Create new boundary
        await createBoundary(projectId, data)
      }
      
      // Refresh the page to update the data
      router.refresh()
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error saving boundary:', err)
      setError('Failed to save boundary. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Boundary' : 'Add Boundary'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update boundary details' 
            : 'Define a new boundary for your ISMS scope'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              placeholder="Enter boundary name"
              {...form.register('name')}
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              {...form.register('type')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Department">Department</option>
              <option value="System">System</option>
              <option value="Location">Location</option>
              <option value="Other">Other</option>
            </select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Enter boundary description"
              rows={3}
              {...form.register('description')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="included"
                {...form.register('included')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="included" className="text-sm font-medium">
                Include in ISMS scope
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Check this if this boundary should be included in your ISMS scope
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Additional notes or justification"
              rows={3}
              {...form.register('notes')}
            />
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
            onClick={() => onSuccess ? onSuccess() : router.back()}
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
              isEditing ? 'Update Boundary' : 'Add Boundary'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
