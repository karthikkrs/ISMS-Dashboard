'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query' // Removed useMutation
import { getStakeholders, deleteStakeholder } from '@/services/stakeholder-service'
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { Stakeholder, ProjectWithStatus } from '@/types' // Import Project type
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
import { Card, CardContent } from '@/components/ui/card'
import { StakeholderForm } from './stakeholder-form'
import { Loader2, Pencil, Trash, Mail } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"

interface StakeholdersTableProps {
  projectId: string
}

export function StakeholdersTable({ projectId }: StakeholdersTableProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [stakeholderToDelete, setStakeholderToDelete] = useState<Stakeholder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Keep isDeleting state
  
  // Fetch stakeholders data
  const { 
    data: stakeholders = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => getStakeholders(projectId)
  })

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  // Handle form close
  const handleFormClose = () => {
    setShowAddForm(false)
    setEditingStakeholder(null)
    refetch()
  }

  // Function to actually perform the deletion and phase unmarking
  const performDelete = async (stakeholder: Stakeholder) => {
    if (!stakeholder) return;
    setIsDeleting(true);
    try {
      // 1. Delete Stakeholder
      await deleteStakeholder(stakeholder.id);

      // 2. Unmark Phase (only if it was previously complete)
      if (project?.stakeholders_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'stakeholders_completed_at');
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      refetch(); // Refetch stakeholder list
      // TODO: Show success toast
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setStakeholderToDelete(null);
    }
  };

  // Initial delete handler: checks phase status and shows confirmation if needed
  const handleDeleteClick = (stakeholder: Stakeholder) => {
    if (project?.stakeholders_completed_at) {
      setStakeholderToDelete(stakeholder);
      setShowDeleteConfirmation(true);
    } else {
      if (confirm('Are you sure you want to delete this stakeholder? This action cannot be undone.')) {
        performDelete(stakeholder);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading stakeholders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-red-500 mb-4">Error loading stakeholders</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stakeholders</h2>
          <p className="text-gray-500">Manage key stakeholders for your ISMS project</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Stakeholder
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingStakeholder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <StakeholderForm
              projectId={projectId}
              stakeholder={editingStakeholder || undefined}
              isEditing={!!editingStakeholder}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Stakeholders Summary */}
      <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Stakeholder Overview</h3>
              <p className="text-gray-500 mt-1">Key participants in your ISMS implementation</p>
            </div>
            <div className="flex items-center bg-white px-6 py-4 rounded-lg shadow-sm border border-blue-100">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">Total Stakeholders</p>
                <p className="text-4xl font-bold text-blue-600">{stakeholders.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Responsibilities</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.map((stakeholder) => (
              <TableRow key={stakeholder.id}>
                <TableCell className="font-medium">{stakeholder.name}</TableCell>
                <TableCell>{stakeholder.role || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {stakeholder.email ? (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{stakeholder.email}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {stakeholder.responsibilities || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingStakeholder(stakeholder)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(stakeholder)} // Use new handler
                      disabled={isDeleting} // Disable if any delete is in progress
                    >
                      {isDeleting && stakeholderToDelete?.id === stakeholder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash size={16} className="text-red-500" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {stakeholders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No stakeholders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {stakeholders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No stakeholders defined</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start by adding key stakeholders to document roles and responsibilities.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Stakeholder
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              The &quot;Stakeholders&quot; phase is marked as complete. Deleting this stakeholder will reset the phase status. Are you sure you want to delete &quot;{stakeholderToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStakeholderToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => stakeholderToDelete && performDelete(stakeholderToDelete)} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
