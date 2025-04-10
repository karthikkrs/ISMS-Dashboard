'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import mutation hooks
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service'; // Import project services
import { getProjectBoundaryControlsWithDetails } from '@/services/boundary-control-service'; 
import { BoundaryControlWithDetails, Gap, ProjectWithStatus } from '@/types'; // Import ProjectWithStatus
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Remove Select imports
import Link from 'next/link'; // Import Link
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, EyeIcon, EditIcon, PlusCircleIcon, FileSearchIcon, CheckSquareIcon, CheckCircle, ArrowRight } from 'lucide-react'; // Add CheckCircle, ArrowRight
import { EvidenceList } from './evidence-list';
import { EvidenceForm } from './evidence-form';
import { GapList } from './gap-list';
import { GapForm } from './gap-form';
import { ComplianceAssessment } from './compliance-assessment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import { Badge } from "@/components/ui/badge"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert

interface EvidenceGapsDashboardProps {
  projectId: string;
}

export function EvidenceGapsDashboard({ projectId }: EvidenceGapsDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null); // State for phase completion error

  // State for managing dialogs
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [showGapDialog, setShowGapDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  
  const [currentBoundaryControlId, setCurrentBoundaryControlId] = useState<string | null>(null); // For Evidence & Gaps
  const [editingGap, setEditingGap] = useState<Gap | null>(null); // For editing a specific gap
  const [assessingControl, setAssessingControl] = useState<BoundaryControlWithDetails | null>(null); // For compliance assessment

  // Fetch the project data to check completion status
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Fetch boundary controls with details for the project
  const { data: boundaryControls = [], isLoading: isLoadingControls, error: controlsError, refetch: refetchControls } = useQuery<BoundaryControlWithDetails[]>({
    queryKey: ['projectBoundaryControlsWithDetails', projectId], // Distinct query key
    queryFn: () => getProjectBoundaryControlsWithDetails(projectId),
    enabled: !!projectId,
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'evidence_gaps_completed_at'),
    onSuccess: (updatedProject) => {
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

  // No need to group for the table view initially, can sort directly if needed
  const sortedBoundaryControls = useMemo(() => {
    return [...boundaryControls].sort((a, b) => {
      const boundaryCompare = (a.boundaries?.name || '').localeCompare(b.boundaries?.name || '');
      if (boundaryCompare !== 0) return boundaryCompare;
      return (a.controls?.reference || '').localeCompare(b.controls?.reference || '');
    });
  }, [boundaryControls]);


  const handleRefetchControls = () => {
    refetchControls();
    // TODO: Add logic to refetch data within dialogs if necessary
  };

  // --- Dialog Handlers (Example for Evidence) ---
  const openEvidenceDialog = (boundaryControlId: string) => {
    setCurrentBoundaryControlId(boundaryControlId);
    setShowEvidenceDialog(true);
  };

  const handleEvidenceAdded = () => {
    setShowEvidenceDialog(false);
    handleRefetchControls(); // Refetch controls list which might contain evidence counts/status
  }; 
  
  // --- Dialog Handlers for Gaps ---
  const openGapDialog = (boundaryControlId: string, gapToEdit: Gap | null = null) => {
    setCurrentBoundaryControlId(boundaryControlId);
    setEditingGap(gapToEdit); 
    setShowGapDialog(true);
  };

  const handleGapSaved = () => {
    setShowGapDialog(false);
    setEditingGap(null);
    handleRefetchControls(); // Refetch controls list which might contain gap counts/status
  };

  // --- Dialog Handlers for Compliance ---
   const openComplianceDialog = (control: BoundaryControlWithDetails) => {
    setAssessingControl(control);
    setShowComplianceDialog(true);
  };

   const handleAssessmentSaved = () => {
    setShowComplianceDialog(false);
    setAssessingControl(null);
    handleRefetchControls(); // Refetch controls list to update compliance status badge
    queryClient.invalidateQueries({ queryKey: ['project', projectId] }); // Also refetch project for overall status if needed
  };

  // --- Phase Completion Handler ---
  const handleMarkComplete = () => {
    if (!project || project.evidence_gaps_completed_at || isMarkingComplete) {
      return;
    }
    setMutationError(null);
    markComplete();
  };

  const isPhaseComplete = !!project?.evidence_gaps_completed_at;


  if (isLoadingProject || isLoadingControls) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Data...</div>;
  }

  if (projectError || controlsError) {
    return <div className="text-red-500 p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading data: {projectError?.message || controlsError?.message}</div>;
  }

  // Helper to get badge variant based on compliance status - Map to existing variants
  const getComplianceBadgeVariant = (status: BoundaryControlWithDetails['compliance_status']): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (status) {
      case 'Compliant': return 'default'; 
      case 'Partially Compliant': return 'secondary'; 
      case 'Non Compliant': return 'destructive';
      default: return 'secondary'; 
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Evidence & Gap Analysis</h2>
        <p className="text-muted-foreground">
          Manage evidence, identify gaps, and assess compliance for applicable project controls.
        </p>
      </div>

      {/* Display Table of Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Applicable Controls</CardTitle>
          <CardDescription>View and manage evidence, gaps, and compliance for each control within its boundaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boundary</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBoundaryControls.length > 0 ? (
                sortedBoundaryControls.map((bc) => (
                  <TableRow key={bc.id}>
                    <TableCell className="font-medium">{bc.boundaries?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{bc.controls?.domain || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{bc.controls?.reference}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{bc.controls?.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getComplianceBadgeVariant(bc.compliance_status)}>
                        {bc.compliance_status || 'Not Assessed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEvidenceDialog(bc.id)} title="Manage Evidence">
                        <FileSearchIcon className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="sm" onClick={() => openGapDialog(bc.id)} title="Manage Gaps">
                         <AlertCircle className="h-4 w-4" /> 
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => openComplianceDialog(bc)} title="Assess Compliance">
                         <CheckSquareIcon className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No applicable controls found for this project's boundaries. Add boundaries and controls in the respective sections.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for Evidence Management */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="sm:max-w-[800px]"> 
          <DialogHeader>
            <DialogTitle>Manage Evidence for Control</DialogTitle>
          </DialogHeader>
          {currentBoundaryControlId && (
            <div className="space-y-4 py-4">
              <EvidenceForm
                projectId={projectId} // Add projectId
                boundaryControlId={currentBoundaryControlId}
                onEvidenceAdded={handleEvidenceAdded}
              />
              <Card>
                <CardHeader><CardTitle>Uploaded Evidence</CardTitle></CardHeader>
                <CardContent>
                  <EvidenceList projectId={projectId} boundaryControlId={currentBoundaryControlId} /> {/* Add projectId */}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Gap Management */}
      <Dialog open={showGapDialog} onOpenChange={setShowGapDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingGap ? 'Edit Gap' : 'Manage Gaps'}</DialogTitle>
          </DialogHeader>
          {currentBoundaryControlId && (
             <div className="space-y-4 py-4">
                <GapForm
                   projectId={projectId} 
                   boundaryControlId={currentBoundaryControlId}
                   existingGap={editingGap} 
                   onGapSaved={handleGapSaved}
                   onCancel={() => setShowGapDialog(false)} 
                 />
                <Card>
                  <CardHeader><CardTitle>Identified Gaps</CardTitle></CardHeader>
                 <CardContent>
                   <GapList
                     projectId={projectId} // Add projectId
                     boundaryControlId={currentBoundaryControlId}
                     onEditGap={(gap) => openGapDialog(currentBoundaryControlId, gap)}
                   />
                 </CardContent>
               </Card>
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Compliance Assessment */}
      <Dialog open={showComplianceDialog} onOpenChange={setShowComplianceDialog}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Assess Compliance</DialogTitle>
           </DialogHeader>
           {assessingControl && (
             <ComplianceAssessment
                boundaryControl={assessingControl}
                onAssessmentSaved={handleAssessmentSaved} 
              />
           )}
         </DialogContent>
       </Dialog>

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
            <Link href={`/dashboard/projects/${projectId}/reports`}> {/* Assuming reports page exists */}
              Proceed to Reports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
       </div>

    </div>
  );
}
