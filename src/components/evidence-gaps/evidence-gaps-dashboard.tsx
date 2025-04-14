'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { getBoundaryControlsWithDetails } from '@/services/boundary-control-service';
import { getBoundaries } from '@/services/boundary-service';
import { BoundaryControlWithDetails, ProjectWithStatus } from '@/types';
import { Tables } from '@/types/database.types';
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { BoundarySidebar } from './boundary-sidebar';
import { BoundaryControlList } from './boundary-control-list';
import { ControlDetailPanel } from './control-detail-panel';

interface EvidenceGapsDashboardProps {
  projectId: string;
}

export function EvidenceGapsDashboard({ projectId }: EvidenceGapsDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);
  const [selectedBoundaryControlId, setSelectedBoundaryControlId] = useState<string | null>(null);

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Fetch all boundaries for the project
  const { data: boundaries = [], isLoading: isLoadingBoundaries, error: boundariesError } = useQuery<Tables<'boundaries'>[]>({
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId),
    enabled: !!projectId,
  });

  // Fetch boundary controls with details for the selected boundary
  const { data: boundaryControls = [], isLoading: isLoadingBoundaryControls, error: boundaryControlsError, refetch: refetchBoundaryControls } = useQuery<BoundaryControlWithDetails[]>({
    queryKey: ['boundaryControlsWithDetails', selectedBoundaryId],
    queryFn: () => selectedBoundaryId ? getBoundaryControlsWithDetails(selectedBoundaryId) : Promise.resolve([]),
    enabled: !!selectedBoundaryId,
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'evidence_gaps_completed_at'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark Evidence/Gaps complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
    },
  });

  // Find the selected boundary control
  const selectedBoundaryControl = useMemo(() => {
    if (!selectedBoundaryControlId) return null;
    return boundaryControls.find(bc => bc.id === selectedBoundaryControlId) || null;
  }, [selectedBoundaryControlId, boundaryControls]);

  // Handler for boundary selection in the sidebar
  const handleSelectBoundary = (boundaryId: string) => {
    setSelectedBoundaryId(boundaryId);
    setSelectedBoundaryControlId(null); // Reset control selection when boundary changes
  };

  // Handler for boundary control selection
  const handleSelectBoundaryControl = (boundaryControlId: string) => {
    setSelectedBoundaryControlId(boundaryControlId);
  };

  // Handler for marking the phase complete
  const handleMarkComplete = () => {
    if (!project || project.evidence_gaps_completed_at || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  const isPhaseComplete = !!project?.evidence_gaps_completed_at;
  const isLoading = isLoadingProject || isLoadingBoundaries || (selectedBoundaryId && isLoadingBoundaryControls);
  const error = projectError || boundariesError || boundaryControlsError;

  if (isLoading && !selectedBoundaryId) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Data...</div>;
  }

  if (error && !boundaryControlsError) {  // Ignore boundary control errors when no boundary is selected
    return <div className="text-red-500 p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading data: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Evidence & Gap Analysis</h2>
        <p className="text-muted-foreground">
          Manage evidence, identify gaps, and assess compliance for controls within each boundary.
        </p>
      </div>

      {/* Three-Pane Layout */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
        {/* Left Pane (Boundary Sidebar) */}
        <div className="md:col-span-2 h-full">
          <BoundarySidebar
            boundaries={boundaries}
            selectedBoundaryId={selectedBoundaryId}
            onSelectBoundary={handleSelectBoundary}
          />
        </div>

        {/* Middle Pane (Boundary Controls List) */}
        <div className="md:col-span-2 h-full">
          {selectedBoundaryId ? (
            isLoadingBoundaryControls ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <BoundaryControlList
                boundaryControls={boundaryControls}
                selectedBoundaryControlId={selectedBoundaryControlId}
                onSelectBoundaryControl={handleSelectBoundaryControl}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-center p-6 text-muted-foreground border rounded-lg">
              <p>Select a boundary from the left panel to view its controls</p>
            </div>
          )}
        </div>

        {/* Right Pane (Control Details) */}
        <div className="md:col-span-3 h-full">
          <ControlDetailPanel
            boundaryControl={selectedBoundaryControl}
            projectId={projectId}
            onRefetch={refetchBoundaryControls}
          />
        </div>
      </div>

      {/* Mutation Error Display */}
      {mutationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons Section */}
      <div className="mt-6 pt-6 border-t flex justify-end gap-2">
        {/* Mark Phase Complete Button */}
        <Button
          onClick={handleMarkComplete}
          disabled={isPhaseComplete || isMarkingComplete}
          variant={isPhaseComplete ? "secondary" : "default"}
        >
          {isMarkingComplete ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
          ) : isPhaseComplete ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : null}
          {isPhaseComplete ? 'Evidence/Gaps Phase Completed' : 'Mark Evidence/Gaps as Complete'}
        </Button>

        {/* Proceed to Next Phase Button */}
        <Button asChild variant="outline">
          <Link href={`/dashboard/projects/${projectId}/reports`}>
            Proceed to Reports
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
