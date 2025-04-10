'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectWithStatus, ProjectStatus } from '@/types'
import { updateProject } from '@/services/project-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2Icon } from 'lucide-react'

interface ProjectEditDialogProps {
  project: ProjectWithStatus
  isOpen: boolean
  onClose: () => void
}

// Define the available status options for editing
const editStatusOptions: ProjectStatus[] = ['In Progress', 'Completed', 'On Hold']

export function ProjectEditDialog({ project, isOpen, onClose }: ProjectEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(project.status)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (newStatus: ProjectStatus) => updateProject(project.id, { status: newStatus }),
    onSuccess: () => {
      // Invalidate and refetch projects and stats queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projectStats'] })
      onClose() // Close the dialog on success
    },
    onError: (error) => {
      console.error("Error updating project status:", error)
      // TODO: Add user-facing error handling (e.g., toast notification)
    },
  })

  const handleSave = () => {
    if (selectedStatus !== project.status) {
      mutation.mutate(selectedStatus)
    } else {
      onClose() // Close if status hasn't changed
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project Status</DialogTitle>
          <DialogDescription>
            Update the status for project: <span className="font-semibold">{project.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status-select" className="text-right">
              Status
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: ProjectStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger id="status-select" className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {editStatusOptions.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending || selectedStatus === project.status}>
            {mutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
