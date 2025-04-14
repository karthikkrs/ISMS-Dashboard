'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { ProjectWithStatus } from '@/types';
import { StakeholdersTable } from './stakeholders-table'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface StakeholdersDashboardProps {
  projectId: string;
}

export function StakeholdersDashboard({ projectId }: StakeholdersDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'stakeholders_completed_at'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark stakeholders complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
    },
  });

  const handleMarkComplete = () => {
    if (!project || project.stakeholders_completed_at || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  const isStakeholdersComplete = !!project?.stakeholders_completed_at;

  if (isLoadingProject) {
     return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Project Data...</div>;
  }

  if (projectError) {
     return <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline"/> Error loading project data: {projectError.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Display Stakeholders Table - Pass only projectId */}
      {/* The table component fetches its own data and handles edit/delete */}
      <StakeholdersTable projectId={projectId} /> 
      
      {/* Mutation Error Display (for marking phase complete) */}
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
           disabled={isStakeholdersComplete || isMarkingComplete}
           variant={isStakeholdersComplete ? "secondary" : "default"}
         >
           {isMarkingComplete ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
           ) : isStakeholdersComplete ? (
             <CheckCircle className="mr-2 h-4 w-4" />
           ) : null}
           {isStakeholdersComplete ? 'Stakeholders Phase Completed' : 'Mark Stakeholders as Complete'}
         </Button>

         {/* Proceed to Next Phase Button */}
         <Button asChild variant="outline">
           <Link href={`/dashboard/projects/${projectId}/soa`}>
             Proceed to SOA
             <ArrowRight className="ml-2 h-4 w-4" />
           </Link>
         </Button>
      </div>
    </div>
  );
}
