'use client'

import { useState, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { Control } from '@/services/control-service'
import { BoundaryControlWithDetails } from '@/types'
import { createBoundaryControl, deleteBoundaryControl, updateBoundaryControl } from '@/services/boundary-control-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Trash2, Edit, Save, X, PlusCircle, CircleSlash, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Define the item type for drag and drop
const ITEM_TYPE = 'control'

interface BoundaryControlItemProps {
  boundaryControl: BoundaryControlWithDetails
  onUpdate: () => void
  isApplicableView: boolean
}

const BoundaryControlItem = ({ boundaryControl, onUpdate, isApplicableView }: BoundaryControlItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reasonInclusion, setReasonInclusion] = useState(boundaryControl.reason_inclusion || '')
  
  // Handle removing a control from the boundary
  const handleRemoveControl = async () => {
    try {
      setIsRemoving(true)
      await deleteBoundaryControl(boundaryControl.id)
      onUpdate()
    } catch (error) {
      console.error('Error removing control from boundary:', error)
    } finally {
      setIsRemoving(false)
    }
  }
  
  // Handle saving changes to the boundary control
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      await updateBoundaryControl(boundaryControl.id, {
        reason_inclusion: reasonInclusion || null
      })
      onUpdate()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating boundary control:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle marking a control as not applicable / applicable
  const handleToggleApplicability = async () => {
    try {
      setIsRemoving(true)
      await updateBoundaryControl(boundaryControl.id, {
        is_applicable: !boundaryControl.is_applicable
      })
      onUpdate()
    } catch (error) {
      console.error(`Error toggling control applicability:`, error)
    } finally {
      setIsRemoving(false)
    }
  }
  
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{boundaryControl.controls?.reference}</span>
              {boundaryControl.controls?.domain && (
                <Badge variant="secondary" className="text-xs">{boundaryControl.controls.domain}</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 hover:line-clamp-none" title={boundaryControl.controls?.description}>
              {boundaryControl.controls?.description}
            </p>
            
            {isEditing ? (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason-inclusion">Reason for Inclusion</Label>
                  <Textarea
                    id="reason-inclusion"
                    placeholder="Why is this control applicable to this boundary?"
                    value={reasonInclusion}
                    onChange={(e) => setReasonInclusion(e.target.value)}
                    className="max-w-full"
                  />
                </div>
                
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
              <>
                {boundaryControl.reason_inclusion && (
                  <p className="text-xs text-gray-600 mt-2 break-words">
                    <span className="font-medium">Reason for inclusion:</span> {boundaryControl.reason_inclusion}
                  </p>
                )}
              </>
            )}
          </div>
          
          {!isEditing && (
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit justification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleApplicability}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isApplicableView ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isApplicableView ? "Mark as Not Applicable" : "Mark as Applicable"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
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
                      Are you sure you want to remove this control from the boundary entirely?
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BoundaryControlsPanelProps {
  projectId: string
  boundaryId: string
  boundaryName: string
  boundaryDescription?: string | null
  boundaryControls: BoundaryControlWithDetails[]
  onUpdate: () => void
}

export function BoundaryControlsPanel({ 
  // projectId not used in this component but kept in props for consistency
  boundaryId, 
  boundaryName,
  boundaryDescription,
  boundaryControls,
  onUpdate 
}: BoundaryControlsPanelProps) {
  const [showApplicable, setShowApplicable] = useState(true)
  const ref = useRef<HTMLDivElement | null>(null)
  
  // Set up drop target
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { control: Control }) => {
      handleAddControl(item.control)
      return { target: boundaryId }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))
  
  // Apply the drop ref to our element via callback ref
  const dropProps = {
    ref: (node: HTMLDivElement | null) => {
      ref.current = node
      dropRef(node)
    }
  }
  
  // Handle adding a control to the boundary
  const handleAddControl = async (control: Control) => {
    try {
      console.log('Adding control to boundary:', control.id, 'to boundary:', boundaryId)
      const result = await createBoundaryControl(boundaryId, control.id, { is_applicable: true })
      console.log('Successfully added control, result:', result)
      onUpdate()
      console.log('Called onUpdate after adding control')
    } catch (error) {
      console.error('Error adding control to boundary:', error)
      alert(`Error adding control: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  // Filter controls based on the toggle state
  const filteredControls = boundaryControls.filter(bc => 
    showApplicable ? bc.is_applicable : !bc.is_applicable
  )
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold">{boundaryName}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {showApplicable ? "Applicable" : "Not Applicable"}
            </span>
            <Switch 
              checked={showApplicable}
              onCheckedChange={setShowApplicable}
              aria-label="Toggle applicable controls"
            />
          </div>
        </div>
        {boundaryDescription && (
          <p className="text-sm text-gray-500">{boundaryDescription}</p>
        )}
      </div>
      
      <div 
        {...(showApplicable ? dropProps : {})}
        className={`min-h-[200px] p-3 rounded-md border-2 border-dashed transition-colors ${
          isOver && showApplicable ? 'border-green-500 bg-green-50' : 
          !showApplicable ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
        }`}
      >
        <h4 className="text-md font-medium mb-3">
          {showApplicable ? "Applicable Controls" : "Not Applicable Controls"}
        </h4>
        
        {filteredControls.length === 0 ? (
          <div className="h-[150px] flex flex-col items-center justify-center text-center p-4">
            {showApplicable ? (
              <>
                <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No applicable controls</p>
                <p className="text-sm text-gray-400 mt-1">Drag controls here to mark as applicable</p>
              </>
            ) : (
              <>
                <CircleSlash className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No non-applicable controls</p>
                <p className="text-sm text-gray-400 mt-1">Controls marked as not applicable will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredControls.map((boundaryControl) => (
              <BoundaryControlItem
                key={boundaryControl.id}
                boundaryControl={boundaryControl}
                onUpdate={onUpdate}
                isApplicableView={showApplicable}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
