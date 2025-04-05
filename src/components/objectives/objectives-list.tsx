'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getObjectives, deleteObjective, updateObjectiveOrder } from '@/services/objective-service'
import { Objective, ObjectivePriority } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ObjectiveForm } from './objective-form'
import { Loader2Icon, PencilIcon, TrashIcon, GripVerticalIcon } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd'

interface ObjectivesListProps {
  projectId: string
}

export function ObjectivesList({ projectId }: ObjectivesListProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Fetch objectives data
  const { 
    data: objectives = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['objectives', projectId],
    queryFn: () => getObjectives(projectId)
  })

  // Handle form close
  const handleFormClose = () => {
    setShowAddForm(false)
    setEditingObjective(null)
    refetch()
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this objective?')) {
      try {
        await deleteObjective(id)
        refetch()
      } catch (error) {
        console.error('Error deleting objective:', error)
      }
    }
  }

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false)
    
    // If dropped outside the list or no movement
    if (!result.destination || result.destination.index === result.source.index) {
      return
    }
    
    // Reorder the objectives
    const reorderedObjectives = Array.from(objectives)
    const [movedObjective] = reorderedObjectives.splice(result.source.index, 1)
    reorderedObjectives.splice(result.destination.index, 0, movedObjective)
    
    // Update the order property
    const updatedObjectives = reorderedObjectives.map((obj, index) => ({
      ...obj,
      order: index + 1
    }))
    
    // Update the UI only (frontend reordering)
    queryClient.setQueryData(['objectives', projectId], updatedObjectives)
    
    // Note: We're not updating the database due to RLS constraints
    // The visual order will be maintained in the current session
    // If you refresh the page, the original order will be restored
    
    // Uncomment this if you want to attempt database updates in the future
    /*
    try {
      await updateObjectiveOrder(
        updatedObjectives.map(obj => ({ id: obj.id, order: obj.order || 0 }))
      )
    } catch (error) {
      console.error('Error updating objective order:', error)
      // Revert to original data on error
      refetch()
    }
    */
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading objectives...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-red-500 mb-4">Error loading objectives</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Security Objectives</h2>
          <p className="text-gray-500">Define and prioritize your security objectives</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Objective
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingObjective) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <ObjectiveForm
              projectId={projectId}
              objective={editingObjective || undefined}
              isEditing={!!editingObjective}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Objectives Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">Total Objectives</p>
              <p className="text-3xl font-bold">{objectives.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">High Priority</p>
              <p className="text-3xl font-bold text-red-600">
                {objectives.filter(o => o.priority === 'High').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">Medium/Low Priority</p>
              <p className="text-3xl font-bold text-amber-600">
                {objectives.filter(o => o.priority === 'Medium' || o.priority === 'Low').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objectives List */}
      <DragDropContext 
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="objectives-list">
          {(provided: DroppableProvided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {objectives.map((objective, index) => (
                <Draggable 
                  key={objective.id} 
                  draggableId={objective.id} 
                  index={index}
                >
                  {(provided: DraggableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border rounded-lg p-4 bg-white shadow-sm ${
                        isDragging ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          {...provided.dragHandleProps}
                          className="mt-1 text-gray-400 cursor-grab"
                        >
                          <GripVerticalIcon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                getPriorityBadgeColor(objective.priority)
                              }`}
                            >
                              {objective.priority}
                            </span>
                          </div>
                          <p className="text-gray-800">{objective.statement}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingObjective(objective)}
                          >
                            <PencilIcon size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(objective.id)}
                          >
                            <TrashIcon size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {objectives.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No objectives defined</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start by adding security objectives to define what your ISMS aims to achieve.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Objective
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get badge color based on priority
function getPriorityBadgeColor(priority: ObjectivePriority): string {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800'
    case 'Medium':
      return 'bg-amber-100 text-amber-800'
    case 'Low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
