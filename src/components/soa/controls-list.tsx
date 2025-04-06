'use client'

import { useState, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Control } from '@/services/control-service' // Control type now includes domain
import { createBoundaryControl } from '@/services/boundary-control-service'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge' // Import Badge
import { Loader2, Plus, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define the item type for drag and drop
const ITEM_TYPE = 'control'

interface ControlItemProps {
  control: Control
  boundaryId: string
  onControlAssigned: () => void
}

// Draggable control item component
const ControlItem = ({ control, boundaryId, onControlAssigned }: ControlItemProps) => {
  const [isAssigning, setIsAssigning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const ref = useRef(null)
  
  // Set up drag source
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { controlId: control.id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ boundaryId: string }>()
      if (item && dropResult) {
        handleAssignControl(control.id, dropResult.boundaryId)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))
  
  // Apply the drag ref to our element via callback ref
  const dragProps = {
    ref: (node: any) => {
      ref.current = node
      dragRef(node)
    }
  }
  
  // Handle assigning a control to a boundary
  const handleAssignControl = async (controlId: string, targetBoundaryId: string) => {
    try {
      setIsAssigning(true)
      await createBoundaryControl(targetBoundaryId || boundaryId, controlId, {
        is_applicable: true,
      })
      onControlAssigned()
    } catch (error) {
      console.error('Error assigning control:', error)
    } finally {
      setIsAssigning(false)
    }
  }
  
  return (
    <Card 
      {...dragProps}
      className={`mb-2 cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"> {/* Added mb-1 */}
              <span className="font-medium text-sm">{control.reference}</span>
              {/* Display Domain Badge */}
              {control.domain && (
                <Badge variant="secondary" className="text-xs">{control.domain}</Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View control details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-gray-600 mt-1">{control.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 flex-shrink-0"
            onClick={() => handleAssignControl(control.id, boundaryId)}
            disabled={isAssigning}
          >
            {isAssigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Assign
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ControlsListProps {
  controls: Control[]
  boundaryId: string
  onControlAssigned: () => void
}

export function ControlsList({ controls, boundaryId, onControlAssigned }: ControlsListProps) {
  if (controls.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-gray-500">No controls available</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {controls.map((control) => (
        <ControlItem
          key={control.id}
          control={control}
          boundaryId={boundaryId}
          onControlAssigned={onControlAssigned}
        />
      ))}
    </div>
  )
}
