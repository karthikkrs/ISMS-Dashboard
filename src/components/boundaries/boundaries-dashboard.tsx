'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { getBoundaries } from '@/services/boundary-service'; // Use correct function name
import { ProjectWithStatus } from '@/types'; // Keep ProjectWithStatus
import { Tables } from '@/types/database.types'; // Import Tables helper
import { BoundariesTable } from './boundaries-table'; 
import { MultiBoundaryForm } from './multi-boundary-form'; 
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, PlusCircle, ArrowRight } from 'lucide-react'; // Import ArrowRight
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BoundariesDashboardProps {
  projectId: string;
}

export function BoundariesDashboard({ projectId }: BoundariesDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false); // State for add/edit dialog

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Fetch boundaries for the table
  const { data: boundaries = [], isLoading: isLoadingBoundaries, error: boundariesError } = useQuery<Tables<'boundaries'>[]>({ // Use Tables<'boundaries'>
     queryKey: ['boundaries', projectId], // Query key for boundaries
     queryFn: () => getBoundaries(projectId), // Use correct function name
     enabled: !!projectId, // Only run if projectId is available
  });


  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'boundaries_completed_at'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark boundaries complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
    },
  });

  const handleMarkComplete = () => {
    if (!project || project.boundaries_completed_at || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  const handleBoundariesSaved = () => {
     setShowAddDialog(false);
     // Invalidate boundaries query if needed, or rely on project query invalidation
     queryClient.invalidateQueries({ queryKey: ['boundaries', projectId] }); // Assuming a query key like this exists for BoundariesTable
  };

  const isBoundariesComplete = !!project?.boundaries_completed_at;

  if (isLoadingProject) {
     return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Project Data...</div>;
  }

  if (projectError) {
     return <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline"/> Error loading project data: {projectError.message}</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-semibold">Boundaries</h2>
         <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
           <DialogTrigger asChild>
             <Button>
               <PlusCircle className="mr-2 h-4 w-4" /> Add/Edit Boundaries
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[800px]"> {/* Adjust width as needed */}
             <DialogHeader>
               <DialogTitle>Manage Project Boundaries</DialogTitle>
             </DialogHeader>
              {/* Assuming MultiBoundaryForm handles both add and edit */}
              <MultiBoundaryForm 
                projectId={projectId} 
                onSuccess={handleBoundariesSaved} // Keep onSuccess
                // Remove onCancel prop
              />
            </DialogContent>
          </Dialog>
        </div>

       {/* Display Boundaries Table - Pass fetched data */}
       {isLoadingBoundaries ? (
          <div className="flex justify-center items-center p-10"><Loader2 className="h-6 w-6 animate-spin" /> Loading Boundaries...</div>
       ) : boundariesError ? (
          <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline"/> Error loading boundaries: {boundariesError.message}</div>
       ) : (
          <BoundariesTable projectId={projectId} boundaries={boundaries} /> // Pass both projectId and boundaries data
       )}

       {/* Mutation Error Display */}
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
           disabled={isBoundariesComplete || isMarkingComplete}
           variant={isBoundariesComplete ? "secondary" : "default"}
         >
           {isMarkingComplete ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
           ) : isBoundariesComplete ? (
             <CheckCircle className="mr-2 h-4 w-4" />
           ) : null}
           {isBoundariesComplete ? 'Boundaries Phase Completed' : 'Mark Boundaries as Complete'}
         </Button>

         {/* Proceed to Next Phase Button */}
         <Button asChild variant="outline">
           <Link href={`/dashboard/projects/${projectId}/stakeholders`}>
             Proceed to Stakeholders
             <ArrowRight className="ml-2 h-4 w-4" />
           </Link>
         </Button>
      </div>
    </div>
  );
}
