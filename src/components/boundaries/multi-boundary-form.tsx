'use client'

import { useState, useEffect } from 'react' // Added useEffect
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import query/mutation hooks
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createBoundary, updateBoundary } from '@/services/boundary-service'
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { BoundaryType, ProjectWithStatus } from '@/types' // Remove Boundary import
import { Tables } from '@/types/database.types'; // Import Tables helper
import { Loader2, Plus, Trash2, X, Building2, Server, Globe, FileQuestion, Info, CheckCircle, XCircle } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Define the schema for a single boundary
const boundarySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Department', 'System', 'Location', 'Other']),
  description: z.string().nullable().optional(),
  included: z.boolean(),
  notes: z.string().nullable().optional(),
  // Add asset value fields
  asset_value_qualitative: z.enum(['High', 'Medium', 'Low']).nullable().optional(),
  asset_value_quantitative: z.number().nullable().optional(),
})

// Define the schema for the form with multiple boundaries
const multiBoundaryFormSchema = z.object({
  boundaries: z.array(boundarySchema).min(1, 'At least one boundary is required')
})

type BoundaryInput = z.infer<typeof boundarySchema>
type MultiBoundaryFormValues = z.infer<typeof multiBoundaryFormSchema>
type Boundary = Tables<'boundaries'>; // Define Boundary using Tables helper

interface MultiBoundaryFormProps {
  projectId: string
  boundary?: Boundary // Use the locally defined Boundary type
  isEditing?: boolean
  onSuccess?: () => void
}

export function MultiBoundaryForm({ projectId, boundary, isEditing = false, onSuccess }: MultiBoundaryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<MultiBoundaryFormValues | null>(null);

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  // Initialize form with default values or existing boundary data
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<MultiBoundaryFormValues>({ // Added reset
    resolver: zodResolver(multiBoundaryFormSchema),
    defaultValues: {
      boundaries: isEditing && boundary 
        ? [
            {
              name: boundary.name,
              type: boundary.type as BoundaryType, // Assert type here
              description: boundary.description,
              included: boundary.included,
              notes: boundary.notes,
              // Add asset value defaults for editing, asserting type for qualitative
              asset_value_qualitative: boundary.asset_value_qualitative as ('High' | 'Medium' | 'Low' | null | undefined), 
              asset_value_quantitative: boundary.asset_value_quantitative,
            }
          ]
        : [
            {
              name: '',
              type: 'Department',
              description: null,
              included: true,
              notes: null,
              // Add asset value defaults for new
              asset_value_qualitative: null,
              asset_value_quantitative: null,
            }
          ]
    }
  })

  // Use field array to manage multiple boundaries
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'boundaries'
  })

  // Function to actually perform the boundary creation/update and phase unmarking
  const performSubmit = async (data: MultiBoundaryFormValues) => {
     setIsSubmitting(true)
     setError(null)
     try {
       const wasPhaseComplete = !!project?.boundaries_completed_at; // Check status before modification

       if (isEditing && boundary) {
         await updateBoundary(boundary.id, data.boundaries[0])
       } else {
         for (const boundaryData of data.boundaries) {
           await createBoundary(projectId, boundaryData)
         }
       }

       // Unmark Phase if it was previously complete
       if (wasPhaseComplete) {
         await unmarkProjectPhaseComplete(projectId, 'boundaries_completed_at');
         queryClient.invalidateQueries({ queryKey: ['project', projectId] });
         queryClient.invalidateQueries({ queryKey: ['projects'] });
       }
       
       // Reset form only if creating new boundaries
       if (!isEditing) {
          reset({ boundaries: [{ name: '', type: 'Department', description: null, included: true, notes: null }] });
       }

       router.refresh() // Consider using queryClient.invalidateQueries instead if possible
       if (onSuccess) {
         onSuccess()
       }
     } catch (err) {
       console.error('Error saving boundaries:', err)
       setError(`Failed to save boundaries: ${err instanceof Error ? err.message : 'Unknown error'}`)
     } finally {
       setIsSubmitting(false)
       setShowConfirmation(false);
       setFormData(null);
     }
  }

  // Initial submit handler: checks phase status and shows confirmation if needed
  const onSubmit = (data: MultiBoundaryFormValues) => {
    if (project?.boundaries_completed_at) {
      setFormData(data);
      setShowConfirmation(true);
    } else {
      performSubmit(data);
    }
  }

  // Add a new empty boundary
  const addBoundary = () => {
    append({
      name: '',
      type: 'Department',
      description: null,
      included: true,
      notes: null,
      // Add asset value defaults for appending
      asset_value_qualitative: null,
      asset_value_quantitative: null,
    })
  }

  // Get type icon based on boundary type
  const getTypeIcon = (type: BoundaryType) => {
    switch (type) {
      case 'Department':
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'System':
        return <Server className="h-4 w-4 text-purple-500" />;
      case 'Location':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'Other':
        return <FileQuestion className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full shadow-lg border-t-4 border-t-primary">
      <CardHeader className="bg-muted/30">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {isEditing ? (
                <>
                  <Info className="h-5 w-5 text-blue-500" />
                  Edit Boundary
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-green-500" />
                  Add Multiple Boundaries
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEditing 
                ? 'Update boundary details' 
                : 'Define multiple boundaries for your ISMS scope at once'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onSuccess} className="rounded-full hover:bg-gray-200">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 p-6">
          {!isEditing && (
            <div className="bg-muted/50 p-4 rounded-md mb-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Add multiple boundaries at once to define your ISMS scope. Each boundary represents a distinct area that may be included or excluded from your security management system.
                </p>
              </div>
            </div>
          )}
          
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Asset Value (Qual)</TableHead> {/* New Header */}
                  <TableHead>Asset Value (Quant)</TableHead> {/* New Header */}
                  <TableHead>In Scope</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <Input
                        placeholder="Enter name"
                        {...register(`boundaries.${index}.name`)}
                        className={`transition-all ${errors.boundaries?.[index]?.name ? 'border-destructive focus-visible:ring-destructive/30' : 'focus-visible:ring-blue-200'}`}
                      />
                      {errors.boundaries?.[index]?.name && (
                        <p className="text-xs text-destructive mt-1 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          {errors.boundaries?.[index]?.name?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Select
                          defaultValue={field.type}
                          onValueChange={(value) => {
                            const event = {
                              target: { value }
                            } as React.ChangeEvent<HTMLSelectElement>;
                            register(`boundaries.${index}.type`).onChange(event);
                          }}
                        >
                          <SelectTrigger className="pl-10">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              {getTypeIcon(field.type as BoundaryType)}
                            </div>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Department">Department</SelectItem>
                            <SelectItem value="System">System</SelectItem>
                            <SelectItem value="Location">Location</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <input
                          type="hidden"
                          {...register(`boundaries.${index}.type`)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                         <Textarea
                           placeholder="Description (optional)"
                           {...register(`boundaries.${index}.description`)}
                           rows={3} // Add default rows
                           className="min-h-[80px] focus-visible:ring-blue-200 transition-all" // Remove resize-none
                         />
                    </TableCell>
                    {/* Asset Value Qualitative */}
                    <TableCell>
                       <Select
                         defaultValue={field.asset_value_qualitative ?? undefined}
                         onValueChange={(value) => {
                           const event = { target: { value: value === 'null' ? null : value } } as any; // Handle null
                           register(`boundaries.${index}.asset_value_qualitative`).onChange(event);
                         }}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select Value" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="High">High</SelectItem>
                           <SelectItem value="Medium">Medium</SelectItem>
                           <SelectItem value="Low">Low</SelectItem>
                           <SelectItem value="null">N/A</SelectItem> {/* Option for null */}
                         </SelectContent>
                       </Select>
                       <input type="hidden" {...register(`boundaries.${index}.asset_value_qualitative`)} />
                    </TableCell>
                     {/* Asset Value Quantitative */}
                    <TableCell>
                       <Input
                         type="number"
                         placeholder="e.g., 10000"
                         {...register(`boundaries.${index}.asset_value_quantitative`, { valueAsNumber: true })} // Ensure value is treated as number
                         className={`transition-all ${errors.boundaries?.[index]?.asset_value_quantitative ? 'border-destructive focus-visible:ring-destructive/30' : 'focus-visible:ring-blue-200'}`}
                       />
                       {errors.boundaries?.[index]?.asset_value_quantitative && (
                         <p className="text-xs text-destructive mt-1 flex items-center">
                           <XCircle className="h-3 w-3 mr-1" />
                           {errors.boundaries?.[index]?.asset_value_quantitative?.message}
                         </p>
                       )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`included-${index}`}
                          defaultChecked={field.included}
                          {...register(`boundaries.${index}.included`)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Label htmlFor={`included-${index}`}>
                          {field.included ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Yes
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <XCircle className="h-4 w-4 mr-1" />
                              No
                            </span>
                          )}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className={`rounded-full ${fields.length === 1 ? 'opacity-30' : 'hover:bg-red-50 hover:text-red-600'}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBoundary}
              className="flex items-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Boundary
            </Button>
          )}

          {error && (
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-muted/30 px-6 py-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess ? onSuccess() : router.back()}
            disabled={isSubmitting}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating Boundaries...'}
              </>
            ) : (
              isEditing ? 'Update Boundary' : 'Add Boundaries'
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              The "Boundaries" phase is marked as complete. {isEditing ? 'Updating this boundary' : 'Adding new boundaries'} will reset this status. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFormData(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => formData && performSubmit(formData)} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & {isEditing ? 'Update' : 'Add'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
