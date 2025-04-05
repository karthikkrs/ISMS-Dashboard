'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2Icon, XIcon } from 'lucide-react'
import { createObjective, updateObjective } from '@/services/objective-service'
import { Objective, ObjectivePriority } from '@/types'

// Define the form schema with Zod
const objectiveSchema = z.object({
  statement: z.string().min(5, 'Statement must be at least 5 characters'),
  priority: z.enum(['High', 'Medium', 'Low'] as const)
})

type ObjectiveFormValues = z.infer<typeof objectiveSchema>

interface ObjectiveFormProps {
  projectId: string
  objective?: Objective
  isEditing?: boolean
  onSuccess: () => void
}

export function ObjectiveForm({ 
  projectId, 
  objective, 
  isEditing = false,
  onSuccess 
}: ObjectiveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize the form with default values or existing objective data
  const { register, handleSubmit, formState: { errors } } = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      statement: objective?.statement || '',
      priority: objective?.priority || 'Medium'
    }
  })
  
  // Handle form submission
  const onSubmit = async (data: ObjectiveFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (isEditing && objective) {
        // Update existing objective
        await updateObjective(objective.id, data)
      } else {
        // Create new objective
        await createObjective(projectId, data)
      }
      
      // Call the success callback
      onSuccess()
    } catch (err) {
      console.error('Error saving objective:', err)
      setError('Failed to save objective. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {isEditing ? 'Edit Objective' : 'Add New Objective'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onSuccess}>
          <XIcon size={18} />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Statement Field */}
        <div className="space-y-2">
          <label htmlFor="statement" className="block text-sm font-medium">
            Objective Statement
          </label>
          <Textarea
            id="statement"
            placeholder="Enter the security objective statement"
            {...register('statement')}
            className={errors.statement ? 'border-red-500' : ''}
          />
          {errors.statement && (
            <p className="text-red-500 text-sm">{errors.statement.message}</p>
          )}
        </div>
        
        {/* Priority Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Priority</label>
          <div className="flex space-x-4">
            {(['High', 'Medium', 'Low'] as const).map((priority) => (
              <label key={priority} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={priority}
                  {...register('priority')}
                  defaultChecked={objective?.priority === priority}
                  className="h-4 w-4 text-primary"
                />
                <span className={`text-sm ${getPriorityTextColor(priority)}`}>
                  {priority}
                </span>
              </label>
            ))}
          </div>
          {errors.priority && (
            <p className="text-red-500 text-sm">{errors.priority.message}</p>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Helper function to get text color based on priority
function getPriorityTextColor(priority: ObjectivePriority): string {
  switch (priority) {
    case 'High':
      return 'text-red-600 font-medium'
    case 'Medium':
      return 'text-amber-600 font-medium'
    case 'Low':
      return 'text-green-600 font-medium'
    default:
      return 'text-gray-600'
  }
}
