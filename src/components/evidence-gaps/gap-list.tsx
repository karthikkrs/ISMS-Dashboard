'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import mutation hooks
import { getGapsForBoundaryControl, deleteGap } from '@/services/gap-service';
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { Gap, ProjectWithStatus } from '@/types'; // Import Project type
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// Import icons and forms
import { Loader2, Trash2, Edit, AlertCircle, ShieldAlert, Target } from 'lucide-react'; 
import { format } from 'date-fns';
import { RiskAssessmentForm } from '@/components/risk/risk-assessment-form';
import { ThreatScenarioForm } from '@/components/threats/threat-scenario-form'; 
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // If needed for form buttons inside dialog
  DialogClose, // If needed for cancel button inside dialog
} from "@/components/ui/dialog";

// Helper function to determine badge variant based on severity/status
const getSeverityVariant = (severity: string): "destructive" | "secondary" | "default" | "outline" | null | undefined => {
  switch (severity) {
    case 'Critical': return 'destructive';
    case 'High': return 'destructive'; // Or another color like orange if available
    case 'Medium': return 'secondary'; // Or yellow
    case 'Low': return 'default'; // Or green/blue
    default: return 'outline';
  }
};

const getStatusVariant = (status: string): "destructive" | "secondary" | "default" | "outline" | null | undefined => {
   switch (status) {
    case 'Identified': return 'secondary';
    case 'In Review': return 'default';
    case 'Confirmed': return 'default';
    case 'Remediated': return 'outline'; // Or a success variant
    case 'Closed': return 'outline';
    default: return 'outline';
  }
}

interface GapListProps {
  projectId: string; // Need projectId to fetch project status
  boundaryControlId: string;
  onEditGap: (gap: Gap) => void;
}

export function GapList({ projectId, boundaryControlId, onEditGap }: GapListProps) {
  const queryClient = useQueryClient(); // For invalidating queries
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [gapToDelete, setGapToDelete] = useState<Gap | null>(null); 
  // State to manage which threat scenario dialog is open
  const [openThreatDialogGapId, setOpenThreatDialogGapId] = useState<string | null>(null); 

  const { data: gapList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['gaps', boundaryControlId],
    queryFn: () => getGapsForBoundaryControl(boundaryControlId),
    enabled: !!boundaryControlId,
  });

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  // Function to actually perform the deletion and phase unmarking
  const performDelete = async (gap: Gap) => {
    if (!gap) return;
    setIsDeleting(gap.id);
    try {
      // 1. Delete Gap
      await deleteGap(gap.id);

      // 2. Unmark Phase (only if it was previously complete)
      if (project?.evidence_gaps_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'evidence_gaps_completed_at');
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      refetch(); // Refetch the gap list
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Deletion failed:", err);
      // TODO: Show error toast
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirmation(false); // Close confirmation dialog
      setGapToDelete(null); // Clear stored gap
    }
  };

  // Initial delete handler: checks phase status and shows confirmation if needed
  const handleDeleteClick = (gap: Gap) => {
    if (project?.evidence_gaps_completed_at) {
      setGapToDelete(gap);
      setShowDeleteConfirmation(true);
    } else {
      if (confirm('Are you sure you want to delete this gap? This action cannot be undone.')) {
        performDelete(gap);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
     return <div className="text-red-500 p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading gaps: {error.message}</div>;
  }

  if (gapList.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No gaps identified for this control yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Identified At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gapList.map((gap) => (
            <TableRow key={gap.id}>
              <TableCell className="font-medium">{gap.description}</TableCell>
              <TableCell>
                <Badge variant={getSeverityVariant(gap.severity)}>{gap.severity}</Badge>
              </TableCell>
               <TableCell>
                 <Badge variant={getStatusVariant(gap.status)}>{gap.status}</Badge>
              </TableCell>
              <TableCell>{format(new Date(gap.identified_at), 'PPp')}</TableCell>
              <TableCell className="space-x-1">
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditGap(gap)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(gap)} // Use new handler
                    disabled={isDeleting === gap.id}
                    className="text-red-600 hover:text-red-800" // Keep only one className
                  >
                    {isDeleting === gap.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                  {/* Risk Assessment Form Trigger */}
                  <RiskAssessmentForm
                     projectId={projectId}
                     gapId={gap.id}
                     // Pass the button as the trigger
                     trigger={ 
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-orange-600 hover:text-orange-800"
                         title="Assess Risk" 
                       >
                         <ShieldAlert className="h-4 w-4" />
                       </Button>
                     }
                     onSuccess={() => {
                       // Optionally refetch risk assessments or related data
                       queryClient.invalidateQueries({ queryKey: ['riskAssessments', projectId] });
                      }}
                   />
                   {/* Threat Scenario Dialog Trigger */}
                   <Dialog open={openThreatDialogGapId === gap.id} onOpenChange={(isOpen) => setOpenThreatDialogGapId(isOpen ? gap.id : null)}>
                     <DialogTrigger asChild>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-purple-600 hover:text-purple-800"
                         title="Create Threat Scenario"
                       >
                         <Target className="h-4 w-4" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[600px]"> {/* Adjust width */}
                       {/* DialogHeader might be redundant if form has its own */}
                       {/* <DialogHeader>
                         <DialogTitle>Create Threat Scenario for Gap</DialogTitle>
                       </DialogHeader> */}
                       <ThreatScenarioForm
                         projectId={projectId}
                         gapId={gap.id} // Pass gapId
                         onSuccess={() => {
                           queryClient.invalidateQueries({ queryKey: ['threatScenarios', projectId] }); 
                           setOpenThreatDialogGapId(null); // Close dialog on success
                         }}
                         onCancel={() => setOpenThreatDialogGapId(null)} // Close dialog on cancel
                       />
                       {/* Footer might be redundant if form has its own */}
                       {/* <DialogFooter> 
                         <DialogClose asChild>
                           <Button type="button" variant="secondary">Cancel</Button>
                         </DialogClose>
                       </DialogFooter> */}
                     </DialogContent>
                   </Dialog>
               </TableCell>
             </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              The "Evidence & Gaps" phase is marked as complete. Deleting this gap will reset this status. Are you sure you want to delete "{gapToDelete?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGapToDelete(null)} disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => gapToDelete && performDelete(gapToDelete)} disabled={!!isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
