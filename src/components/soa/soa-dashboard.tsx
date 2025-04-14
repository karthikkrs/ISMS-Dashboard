'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete, unmarkProjectPhaseComplete } from '@/services/project-service';
import { getBoundaries } from '@/services/boundary-service';
import { getControls } from '@/services/control-service';
import { getProjectBoundaryControlsWithDetails } from '@/services/boundary-control-service';
import { ProjectWithStatus, Control, BoundaryControlWithDetails } from '@/types';
import { Tables } from '@/types/database.types';

// Use the type from database.types
type Boundary = Tables<'boundaries'>;
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { ControlsList } from './ControlsList';
import { BoundaryControlsPanel } from './BoundaryControlsPanel';
import { ControlDragLayer } from './ControlDragLayer';

interface SoaDashboardProps {
  projectId: string;
}

export function SoaDashboard({ projectId }: SoaDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'add'; payload: { boundaryId: string; controlId: string } }
    | { type: 'remove'; payload: string }
    | { type: 'update'; payload: { id: string; data: Record<string, unknown> } }
    | null
  >(null);

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
    data: boundaryControls = [], 
    isLoading: isLoadingBoundaryControls, 
    error: boundaryControlsError,
    refetch: refetchBoundaryControls
  } = useQuery<BoundaryControlWithDetails[]>({
    queryKey: ['projectBoundaryControlsWithDetails', projectId],
    queryFn: () => getProjectBoundaryControlsWithDetails(projectId),
    enabled: !!projectId,
  });

  // Set the selected boundary ID to the first boundary if not set and boundaries are loaded
  React.useEffect(() => {
    if (boundaries.length > 0 && !selectedBoundaryId) {
      setSelectedBoundaryId(boundaries[0].id);
    }
  }, [boundaries, selectedBoundaryId]);

  // This is a placeholder for potential future use - removed to avoid lint warning
  // const selectedBoundaryControls = useMemo(() => {
  //   if (!selectedBoundaryId) return [];
  //   return boundaryControls.filter(bc => bc.boundary_id === selectedBoundaryId);
  // }, [boundaryControls, selectedBoundaryId]);

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'soa_completed_at'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark SOA complete:", error);
      setMutationError((error as Error).message || 'Failed to mark phase as complete.');
    },
  });

  // Function to perform the actual boundary control actions and phase unmarking
  const performAction = async () => {
    if (!pendingAction) return;

    const { type } = pendingAction;
    const wasPhaseComplete = !!project?.soa_completed_at;

    try {
      // Perform the requested action
      // (actual implementation would depend on the action type)

      // Unmark Phase if it was previously complete
      if (wasPhaseComplete) {
        await unmarkProjectPhaseComplete(projectId, 'soa_completed_at');
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
      
      // Refetch boundary controls to update the UI
      refetchBoundaryControls();
    } catch (err) {
      console.error(`Failed to ${type} boundary control:`, err);
      setMutationError((err as Error).message || `Failed to ${type} control.`);
    } finally {
      setShowConfirmation(false);
      setPendingAction(null);
    }
  };

  const handleMarkComplete = () => {
    const isComplete = !!project?.soa_completed_at;

    if (!project || isComplete || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  // Handle refetching boundary controls after an update
  const handleBoundaryControlsUpdate = async () => {
    console.log('Refetching boundary controls after update');
    try {
      // Using refetchBoundaryControls() from react-query
      const result = await refetchBoundaryControls();
      console.log('Refetch result:', result);
      
      // Force invalidate the query to ensure the data is fresh
      queryClient.invalidateQueries({ 
        queryKey: ['projectBoundaryControlsWithDetails', projectId] 
      });
      
      console.log('Query invalidated to ensure fresh data');
    } catch (error) {
      console.error('Error refetching boundary controls:', error);
    }
  };

  const isLoading = isLoadingProject || isLoadingBoundaries || isLoadingControls || isLoadingBoundaryControls;
  const errors = [projectError, boundariesError, controlsError, boundaryControlsError].filter(Boolean);
  const isSoaComplete = !!project?.soa_completed_at;

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

  // Special message if no boundaries defined
  if (boundaries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Statement of Applicability (SOA)</h2>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Boundaries Defined</AlertTitle>
          <AlertDescription>
            You need to define at least one boundary before you can create a Statement of Applicability.
          </AlertDescription>
        </Alert>
        
        <Button asChild variant="default">
          <Link href={`/dashboard/projects/${projectId}/boundaries`}>
            Go to Boundaries Setup
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Statement of Applicability (SOA)</h2>
      </div>

      {/* Mutation Error Display */}
      {mutationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}
      
      <p className="text-gray-500">
        Manage which controls are applicable to each boundary in your project.
        Drag controls from the left panel to the boundary panel to mark them as applicable.
      </p>

      {/* Drag Layer for custom drag preview */}
      <ControlDragLayer />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Controls List */}
        <div className="lg:col-span-1">
          <ControlsList 
            controls={allControls}
            boundaryControls={boundaryControls}
            selectedBoundaryId={selectedBoundaryId}
          />
        </div>

        {/* Right Panel: Tabbed Boundary Controls Panels */}
        <div className="lg:col-span-2">
          <Tabs 
            defaultValue={boundaries[0]?.id} 
            value={selectedBoundaryId || undefined}
            onValueChange={setSelectedBoundaryId}
            className="w-full"
          >
            <TabsList className="w-full">
              {boundaries.map(boundary => (
                <TabsTrigger 
                  key={boundary.id} 
                  value={boundary.id}
                  className="flex-1"
                >
                  {boundary.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {boundaries.map(boundary => (
              <TabsContent key={boundary.id} value={boundary.id} className="pt-4">
                <BoundaryControlsPanel
                  projectId={projectId}
                  boundaryId={boundary.id}
                  boundaryName={boundary.name}
                  boundaryDescription={boundary.description}
                  boundaryControls={boundaryControls.filter(bc => bc.boundary_id === boundary.id)}
                  onUpdate={handleBoundaryControlsUpdate}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-6 pt-6 border-t flex justify-end gap-2">
        {/* Mark Phase Complete Button */}
        <Button
          onClick={handleMarkComplete}
          disabled={isSoaComplete || isMarkingComplete}
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
              The &quot;SOA&quot; phase is marked as complete. Making changes will reset this status. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performAction}>
              Confirm & Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
