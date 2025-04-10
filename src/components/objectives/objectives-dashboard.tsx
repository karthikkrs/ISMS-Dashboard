'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { ProjectWithStatus } from '@/types';
import { ObjectivesList } from './objectives-list';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ObjectivesDashboardProps {
  projectId: string;
}

export function ObjectivesDashboard({ projectId }: ObjectivesDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'objectives_completed_at'),
    onSuccess: (updatedProject) => {
      // Invalidate project query to refetch data and update UI
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Invalidate list if needed
      queryClient.invalidateQueries({ queryKey: ['projectStats'] }); // Invalidate stats
      setMutationError(null);
      // Optionally show success toast
    },
    onError: (error) => {
      console.error("Failed to mark objectives complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
      // Optionally show error toast
    },
  });

  const handleMarkComplete = () => {
    if (!project || project.objectives_completed_at || isMarkingComplete) {
      return; // Don't proceed if already complete or already submitting
    }
    setMutationError(null); // Clear previous errors
    markComplete();
  };

  const isObjectivesComplete = !!project?.objectives_completed_at;

  if (isLoadingProject) {
     return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Project Data...</div>;
  }

  if (projectError) {
     return <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline"/> Error loading project data: {projectError.message}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Display Objectives List */}
      <ObjectivesList projectId={projectId} />

      {/* Mutation Error Display */}
      {mutationError && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{mutationError}</AlertDescription>
         </Alert>
       )}

      {/* Mark Phase Complete Button Section */}
      <div className="mt-6 pt-6 border-t flex justify-end">
         <Button 
           onClick={handleMarkComplete} 
           disabled={isObjectivesComplete || isMarkingComplete}
           variant={isObjectivesComplete ? "secondary" : "default"}
         >
           {isMarkingComplete ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
           ) : isObjectivesComplete ? (
             <CheckCircle className="mr-2 h-4 w-4" />
           ) : null}
           {isObjectivesComplete ? 'Objectives Phase Completed' : 'Mark Objectives as Complete'}
         </Button>
      </div>
    </div>
  );
}
