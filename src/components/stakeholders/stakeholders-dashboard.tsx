'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { getStakeholders } from '@/services/stakeholder-service'; // Use correct function name
import { ProjectWithStatus, Stakeholder } from '@/types'; // Import Stakeholder type
import { StakeholdersTable } from './stakeholders-table'; 
import { StakeholderForm } from './stakeholder-form'; 
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react'; // Import ArrowRight
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StakeholdersDashboardProps {
  projectId: string;
}

export function StakeholdersDashboard({ projectId }: StakeholdersDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false); // State for add/edit dialog
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null); // State for editing

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Remove stakeholder fetching from dashboard - table handles it
  // const { data: stakeholders = [], isLoading: isLoadingStakeholders, error: stakeholdersError, refetch: refetchStakeholders } = useQuery<Stakeholder[]>({
  //    queryKey: ['stakeholders', projectId], 
  //    queryFn: () => getStakeholders(projectId), // Use correct function name
  //    enabled: !!projectId, 
  // });


  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'stakeholders_completed_at'),
    onSuccess: (updatedProject) => {
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

   const handleStakeholderSaved = () => {
      setShowAddDialog(false);
      setEditingStakeholder(null); 
      // Invalidate query for the table to refetch
      queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] }); 
   };
   
   // This function might now be handled internally by the table, but keep for now if needed
   const openEditDialog = (stakeholder: Stakeholder) => { 
    setEditingStakeholder(stakeholder);
    setShowAddDialog(true);
  };
  
  const openAddDialog = () => {
    setEditingStakeholder(null); // Ensure we are adding, not editing
    setShowAddDialog(true);
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
      {/* Remove loading/error state here as table handles it */}
      
      {/* Mutation Error Display (for marking phase complete) */}
      {mutationError && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{mutationError}</AlertDescription>
         </Alert>
       )}

      {/* Action Buttons Section */}
      <div className="mt-6 pt-6 border-t flex justify-end gap-2"> {/* Added gap-2 */}
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
