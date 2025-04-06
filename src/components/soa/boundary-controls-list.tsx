'use client'

import { useState, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { deleteBoundaryControl, updateBoundaryControl } from '@/services/boundary-control-service'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Trash2, Edit, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Define the item type for drag and drop
const ITEM_TYPE = 'control'

interface BoundaryControlItemProps {
  boundaryControl: any
  onControlRemoved: () => void
}

// Boundary control item component
const BoundaryControlItem = ({ boundaryControl, onControlRemoved }: BoundaryControlItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isApplicable, setIsApplicable] = useState(boundaryControl.is_applicable)
  const [reasonInclusion, setReasonInclusion] = useState(boundaryControl.reason_inclusion || '')
  const [reasonExclusion, setReasonExclusion] = useState(boundaryControl.reason_exclusion || '')
  
  // Handle removing a control from a boundary
  const handleRemoveControl = async () => {
    try {
      setIsRemoving(true)
      await deleteBoundaryControl(boundaryControl.id)
      onControlRemoved()
    } catch (error) {
      console.error('Error removing control:', error)
    } finally {
      setIsRemoving(false)
    }
  }
  
  // Handle saving changes to a boundary control
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      await updateBoundaryControl(boundaryControl.id, {
        is_applicable: isApplicable,
        reason_inclusion: reasonInclusion || null,
        reason_exclusion: reasonExclusion || null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating control:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {boundaryControl.controls?.reference || 'Unknown'}
              </span>
              <span className="text-sm text-gray-600">
                {boundaryControl.controls?.description || 'No description'}
              </span>
            </div>
            
            {isEditing ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-applicable"
                    checked={isApplicable}
                    onCheckedChange={setIsApplicable}
                  />
                  <Label htmlFor="is-applicable">
                    {isApplicable ? 'Applicable' : 'Not Applicable'}
                  </Label>
                </div>
                
                {isApplicable ? (
                  <div className="space-y-2">
                    <Label htmlFor="reason-inclusion">Reason for Inclusion</Label>
                    <Textarea
                      id="reason-inclusion"
                      placeholder="Why is this control applicable?"
                      value={reasonInclusion}
                      onChange={(e) => setReasonInclusion(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="reason-exclusion">Reason for Exclusion</Label>
                    <Textarea
                      id="reason-exclusion"
                      placeholder="Why is this control not applicable?"
                      value={reasonExclusion}
                      onChange={(e) => setReasonExclusion(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    boundaryControl.is_applicable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {boundaryControl.is_applicable ? 'Applicable' : 'Not Applicable'}
                  </span>
                </div>
                
                {boundaryControl.is_applicable && boundaryControl.reason_inclusion && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Reason for inclusion:</span> {boundaryControl.reason_inclusion}
                  </p>
                )}
                
                {!boundaryControl.is_applicable && boundaryControl.reason_exclusion && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">Reason for exclusion:</span> {boundaryControl.reason_exclusion}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Control</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to remove this control from the boundary?
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleRemoveControl}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Remove'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BoundaryControlsListProps {
  boundaryControls: any[]
  onControlRemoved: () => void
}

export function BoundaryControlsList({ boundaryControls, onControlRemoved }: BoundaryControlsListProps) {
  const ref = useRef(null)
  
  // Set up drop target
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: () => ({ boundaryId: 'current-boundary' }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))
  
  // Apply the drop ref to our element via callback ref
  const dropProps = {
    ref: (node: any) => {
      ref.current = node
      dropRef(node)
    }
  }
  
  if (boundaryControls.length === 0) {
    return (
      <div 
        {...dropProps}
        className={`text-center py-8 border rounded-md ${
          isOver ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
        }`}
      >
        <p className="text-gray-500">No controls assigned to this boundary</p>
        <p className="text-sm text-gray-400 mt-2">Drag and drop controls here</p>
      </div>
    )
  }
  
  return (
    <div {...dropProps} className={`space-y-2 p-2 rounded-md ${isOver ? 'bg-blue-50' : ''}`}>
      {boundaryControls.map((boundaryControl) => (
        <BoundaryControlItem
          key={boundaryControl.id}
          boundaryControl={boundaryControl}
          onControlRemoved={onControlRemoved}
        />
      ))}
    </div>
  )
}
