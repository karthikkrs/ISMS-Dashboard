'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, X } from 'lucide-react'
import { createStakeholder, updateStakeholder } from '@/services/stakeholder-service'
import { Stakeholder } from '@/types'

// Define the form schema with Zod
const stakeholderSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  responsibilities: z.string().optional()
})

type StakeholderFormValues = z.infer<typeof stakeholderSchema>

interface StakeholderFormProps {
  projectId: string
  stakeholder?: Stakeholder
  isEditing?: boolean
  onSuccess: () => void
}

export function StakeholderForm({ 
  projectId, 
  stakeholder, 
  isEditing = false,
  onSuccess 
}: StakeholderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize the form with default values or existing stakeholder data
  const { register, handleSubmit, formState: { errors } } = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: stakeholder?.name || '',
      role: stakeholder?.role || '',
      email: stakeholder?.email || '',
      responsibilities: stakeholder?.responsibilities || ''
    }
  })
  
  // Handle form submission
  const onSubmit = async (data: StakeholderFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (isEditing && stakeholder) {
        // Update existing stakeholder
        await updateStakeholder(stakeholder.id, data)
      } else {
        // Create new stakeholder
        await createStakeholder(projectId, data)
      }
      
      // Call the success callback
      onSuccess()
    } catch (err) {
      console.error('Error saving stakeholder:', err)
      setError('Failed to save stakeholder. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {isEditing ? 'Edit Stakeholder' : 'Add New Stakeholder'}
        </h2>
        <Button variant="ghost" size="icon" onClick={onSuccess}>
          <X size={18} />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            placeholder="Enter stakeholder name"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        
        {/* Role Field */}
        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <Input
            id="role"
            placeholder="Enter stakeholder role"
            {...register('role')}
            className={errors.role ? 'border-red-500' : ''}
          />
          {errors.role && (
            <p className="text-red-500 text-sm">{errors.role.message}</p>
          )}
        </div>
        
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter stakeholder email"
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>
        
        {/* Responsibilities Field */}
        <div className="space-y-2">
          <label htmlFor="responsibilities" className="block text-sm font-medium">
            Responsibilities
          </label>
          <Textarea
            id="responsibilities"
            placeholder="Enter stakeholder responsibilities"
            {...register('responsibilities')}
            className={errors.responsibilities ? 'border-red-500' : ''}
            rows={4}
          />
          {errors.responsibilities && (
            <p className="text-red-500 text-sm">{errors.responsibilities.message}</p>
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
