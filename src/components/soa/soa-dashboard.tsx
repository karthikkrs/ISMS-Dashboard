'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDrop, useDrag, DndProvider, ConnectDragPreview } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { getProjectById, markProjectPhaseComplete, unmarkProjectPhaseComplete } from '@/services/project-service'; // Added unmarkProjectPhaseComplete
import { getBoundaries } from '@/services/boundary-service';
import { getControls } from '@/services/control-service';
import { 
  getProjectBoundaryControlsWithDetails, 
  createBoundaryControl,
  deleteBoundaryControl // Import delete function
} from '@/services/boundary-control-service';
import { ProjectWithStatus, Boundary, Control, BoundaryControlWithDetails } from '@/types';
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog
import { Loader2, CheckCircle, AlertCircle, GripVertical, Trash2Icon, ArrowRight } from 'lucide-react'; // Import ArrowRight

interface SoaDashboardProps {
  projectId: string;
}

const ItemTypes = {
  CONTROL: 'control',
};

// --- Draggable Control Item ---
interface DraggableControlProps {
  control: Control;
  isAssociated: (controlId: string) => boolean; // Function to check if control is already associated with the *current* drop target
}

function DraggableControl({ control, isAssociated }: DraggableControlProps) {
  const [{ isDragging }, drag, preview] = useDrag(() => ({ // Add preview connector
    type: ItemTypes.CONTROL,
    item: { id: control.id, name: control.reference }, // Pass control ID and reference
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const alreadyAssociated = isAssociated(control.id); // Check association status
  const dragRef = useRef<HTMLDivElement>(null);

  // Hide default browser preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Connect react-dnd's drag ref to our standard ref
  drag(dragRef);

  // Apply the standard ref to the div
  return (
    <div
      ref={dragRef} 
      className={`p-2 mb-2 border rounded cursor-grab ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${alreadyAssociated ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`} // Style if already associated
      title={alreadyAssociated ? `${control.reference} is already applied to this boundary` : control.description}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{control.reference}</span>
        {!alreadyAssociated && <GripVertical className="h-4 w-4 text-gray-400" />}
      </div>
      <p className="text-xs text-gray-600 truncate">{control.description}</p>
    </div>
  );
}

// --- Boundary Drop Target ---
interface BoundaryDropTargetProps {
  boundary: Boundary;
  associatedControls: BoundaryControlWithDetails[];
  onDropControl: (boundaryId: string, controlId: string) => void;
  onRemoveControl: (boundaryControlId: string) => void; // Function to remove a control
}

function BoundaryDropTarget({ boundary, associatedControls, onDropControl, onRemoveControl }: BoundaryDropTargetProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.CONTROL,
    drop: (item: { id: string }) => {
      // Check if the control is already associated before calling onDropControl
      if (!associatedControls.some(bc => bc.control_id === item.id)) {
        onDropControl(boundary.id, item.id);
      }
    },
    canDrop: (item: { id: string }) => {
      // Prevent dropping if the control is already associated with this boundary
      return !associatedControls.some(bc => bc.control_id === item.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;
  const backgroundColor = isActive ? 'bg-blue-100' : 'bg-gray-50';

  // Function to check if a control ID is associated with THIS boundary
  const isControlAssociatedWithThisBoundary = (controlId: string): boolean => {
    return associatedControls.some(bc => bc.control_id === controlId);
  };
  const dropRef = useRef<HTMLDivElement>(null); // Initialize with null

  // Connect react-dnd's drop ref to our standard ref
  drop(dropRef); // react-dnd should handle connecting to the RefObject

  // Apply the standard ref to a wrapping div, as Card might not forward refs
  return (
    <div ref={dropRef}> 
      <Card className={`transition-colors ${backgroundColor}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{boundary.name}</CardTitle>
        <Badge variant="outline" className="w-fit">{boundary.type}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-2">Applied Controls:</p>
        {associatedControls.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Drop controls here</p>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {associatedControls.map((bc) => (
              <li key={bc.id} className="flex justify-between items-center text-xs p-1 bg-white border rounded gap-1"> {/* Added gap */}
                <div className="flex items-center gap-1"> {/* Wrap text and badge */}
                  <span>{bc.controls?.reference || 'Unknown Control'}</span>
                  {bc.controls?.domain && (
                    <Badge variant="outline" className="text-xs px-1 py-0">{bc.controls.domain}</Badge> 
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                  onClick={() => onRemoveControl(bc.id)}
                  title={`Remove ${bc.controls?.reference || 'Control'}`}
                >
                  <Trash2Icon className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      </Card>
    </div>
  );
}

// --- Main SoaDashboard Component ---
export function SoaDashboard({ projectId }: SoaDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'add' | 'remove'; payload: any } | null>(null);

  // 1. Fetch Project Data (for completion status)
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // 2. Fetch Boundaries
  const { data: boundaries = [], isLoading: isLoadingBoundaries, error: boundariesError } = useQuery<Boundary[]>({
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId),
    enabled: !!projectId,
  });

  // 3. Fetch All Controls
  const { data: allControls = [], isLoading: isLoadingControls, error: controlsError } = useQuery<Control[]>({
    queryKey: ['controls'],
    queryFn: getControls,
  });

  // 4. Fetch Existing Boundary-Control relationships for the project
  const { 
    data: projectBoundaryControls = [], 
    isLoading: isLoadingExistingSoa, 
    error: existingSoaError,
    refetch: refetchExistingSoa
  } = useQuery<BoundaryControlWithDetails[]>({
    queryKey: ['projectBoundaryControlsWithDetails', projectId], // Use a distinct key
    queryFn: () => getProjectBoundaryControlsWithDetails(projectId),
    enabled: !!projectId,
  });

  // Group controls by domain
  const controlsByDomain = useMemo(() => {
    return allControls.reduce((acc, control) => {
      const domain = control.domain || 'Uncategorized';
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(control);
      return acc;
    }, {} as Record<string, Control[]>);
  }, [allControls]);

  // Memoize the grouping of boundary controls by boundary ID
  const controlsByBoundaryId = useMemo(() => {
    return projectBoundaryControls.reduce((acc, bc) => {
      const boundaryId = bc.boundary_id;
      if (!acc[boundaryId]) {
        acc[boundaryId] = [];
      }
      acc[boundaryId].push(bc);
      return acc;
    }, {} as Record<string, BoundaryControlWithDetails[]>);
  }, [projectBoundaryControls]);

  // Mutation for adding a boundary control
  const { mutate: addControl, isPending: isAddingControl } = useMutation({
    mutationFn: ({ boundaryId, controlId }: { boundaryId: string; controlId: string }) => 
      createBoundaryControl(boundaryId, controlId, { is_applicable: true }), // Default to applicable
    onSuccess: () => {
      setMutationError(null);
      refetchExistingSoa(); // Refetch the list of associations
    },
    onError: (error) => {
      console.error("Failed to add boundary control:", error);
      setMutationError(error.message || 'Failed to apply control.');
    },
  });

  // Mutation for removing a boundary control
  const { mutate: removeControl, isPending: isRemovingControl } = useMutation({
    mutationFn: (boundaryControlId: string) => deleteBoundaryControl(boundaryControlId),
    onSuccess: () => {
      setMutationError(null);
      refetchExistingSoa(); // Refetch the list of associations
    },
    onError: (error) => {
      console.error("Failed to remove boundary control:", error);
      setMutationError(error.message || 'Failed to remove control.');
    },
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'soa_completed_at'), // Correct column name
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }); // Ensure project query is invalidated
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark SOA complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
    },
  });

  // Function to perform the actual add/remove and phase unmarking
  const performAction = async () => {
    if (!pendingAction) return;

    const { type, payload } = pendingAction;
    const wasPhaseComplete = !!project?.soa_completed_at; // Check only the correct column

    try {
      if (type === 'add') {
        addControl(payload); // payload is { boundaryId, controlId }
      } else if (type === 'remove') {
        removeControl(payload); // payload is boundaryControlId
      }

      // Unmark Phase if it was previously complete
      if (wasPhaseComplete) {
        await unmarkProjectPhaseComplete(projectId, 'soa_completed_at'); // Use correct column name
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    } catch (err) {
       console.error(`Failed to ${type} boundary control:`, err);
       setMutationError((err as Error).message || `Failed to ${type} control.`);
    } finally {
       setShowConfirmation(false);
       setPendingAction(null);
    }
  };

  // Handlers now check status and trigger confirmation if needed
  const handleDropControl = (boundaryId: string, controlId: string) => {
    console.log(`Attempting drop control ${controlId} onto boundary ${boundaryId}`);
    if (project?.soa_completed_at) { // Check only the correct column
      setPendingAction({ type: 'add', payload: { boundaryId, controlId } });
      setShowConfirmation(true);
    } else {
      addControl({ boundaryId, controlId });
    }
  };

  const handleRemoveControl = (boundaryControlId: string) => {
    console.log(`Attempting remove boundary control ${boundaryControlId}`);
     if (project?.soa_completed_at) { // Check only the correct column
      setPendingAction({ type: 'remove', payload: boundaryControlId });
      setShowConfirmation(true);
    } else {
      // Optional: Add a simple browser confirm even if phase not complete
      if (confirm('Are you sure you want to remove this control association?')) {
         removeControl(boundaryControlId);
      }
    }
  };

  const handleMarkComplete = () => {
    const isComplete = !!project?.soa_completed_at; // Check only the correct column

    if (!project || isComplete || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  const isLoading = isLoadingProject || isLoadingBoundaries || isLoadingControls || isLoadingExistingSoa;
  const errors = [projectError, boundariesError, controlsError, existingSoaError].filter(Boolean);
  const isSoaComplete = !!project?.soa_completed_at; // Check only the correct column

  if (isLoading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading SOA Data...</div>;
  }

  if (errors.length > 0) {
    return (
      <div className="text-red-500 p-4">
        <AlertCircle className="mr-2 h-4 w-4 inline"/> Error loading data:
        <ul>
          {errors.map((err, i) => <li key={i}>- {(err as Error).message}</li>)}
        </ul>
      </div>
    );
  }

  // Removed console log

  return (
    // <DndProvider backend={HTML5Backend}> // Removed from here
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Statement of Applicability (SOA)</h2>
          {/* Optional: Add Export Button or other actions */}
        </div>

        {/* Mutation Error Display */}
        {mutationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{mutationError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel (Draggable Items) */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Available Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-4"> {/* Adjust height as needed */}
                {Object.entries(controlsByDomain).map(([domain, controls]) => (
                  <div key={domain} className="mb-4">
                    <h3 className="font-semibold text-md mb-2 sticky top-0 bg-gray-100 p-1 rounded">{domain}</h3>
                    {/* Note: The isAssociated check here is simplified as the real check is in BoundaryDropTarget */}
                    {controls.map((control) => (
                      <DraggableControl 
                        key={control.id} 
                        control={control} 
                        isAssociated={() => false} // Simplified check for display only
                      />
                    ))}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Boundaries Panel (Drop Targets) */}
          <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-lg mb-2">Project Boundaries</h3>
              {boundaries.length === 0 ? (
                 <p className="text-gray-500 italic">No boundaries defined for this project yet.</p>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boundaries.map((boundary) => {
                      // Use the memoized map for associated controls
                      const controlsForThisBoundary = controlsByBoundaryId[boundary.id] || [];
                      return (
                        <BoundaryDropTarget
                          key={boundary.id}
                          boundary={boundary}
                          associatedControls={controlsForThisBoundary} // Use memoized list
                          onDropControl={handleDropControl}
                          onRemoveControl={handleRemoveControl} 
                        />
                      );
                    })}
                 </div>
              )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-6 pt-6 border-t flex justify-end gap-2"> {/* Added gap-2 */}
          {/* Mark Phase Complete Button */}
          <Button
            onClick={handleMarkComplete}
            disabled={isSoaComplete || isMarkingComplete || isAddingControl || isRemovingControl}
            variant={isSoaComplete ? "secondary" : "default"}
          >
            {isMarkingComplete ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            ) : isSoaComplete ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : null}
            {isSoaComplete ? 'SOA Phase Completed' : 'Mark SOA as Complete'}
          </Button>

          {/* Proceed to Next Phase Button */}
          <Button asChild variant="outline">
            <Link href={`/dashboard/projects/${projectId}/evidence-gaps`}>
              Proceed to Evidence/Gaps
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
              <AlertDialogDescription>
                The "SOA" phase is marked as complete. Making changes will reset this status. Do you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingAction(null)} disabled={isAddingControl || isRemovingControl}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performAction} disabled={isAddingControl || isRemovingControl}>
                {(isAddingControl || isRemovingControl) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    // </DndProvider> // Removed from here
  );
}
