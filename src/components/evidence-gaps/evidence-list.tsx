'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import mutation hooks
import { getEvidenceForBoundaryControl, getEvidenceDownloadUrl, deleteEvidence } from '@/services/evidence-service';
import { getProjectById, unmarkProjectPhaseComplete } from '@/services/project-service'; // Import project service functions
import { Evidence, ProjectWithStatus } from '@/types'; // Import Project type
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Trash2, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns'; // For date formatting

interface EvidenceListProps {
  projectId: string; // Need projectId to fetch project status
  boundaryControlId: string;
}

export function EvidenceList({ projectId, boundaryControlId }: EvidenceListProps) {
  const queryClient = useQueryClient(); // For invalidating queries
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [evidenceToDelete, setEvidenceToDelete] = useState<Evidence | null>(null); // Store evidence to delete

  const { data: evidenceList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['evidence', boundaryControlId],
    queryFn: () => getEvidenceForBoundaryControl(boundaryControlId),
    enabled: !!boundaryControlId,
  });

  // Fetch project data to check completion status
  const { data: project } = useQuery<ProjectWithStatus | null>({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: Infinity,
  });

  const handleDownload = async (evidence: Evidence) => {
    if (!evidence.file_path) return;
    setIsDownloading(evidence.id);
    try {
      const url = await getEvidenceDownloadUrl(evidence.file_path);
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank'; // Open in new tab might be safer
      link.download = evidence.file_name || 'download'; // Use original filename or default
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      // TODO: Show error toast to user
    } finally {
      setIsDownloading(null);
    }
  };

  // Function to actually perform the deletion and phase unmarking
  const performDelete = async (evidence: Evidence) => {
    if (!evidence) return;
    setIsDeleting(evidence.id);
    try {
      // 1. Delete Evidence
      await deleteEvidence(evidence.id);

      // 2. Unmark Phase (only if it was previously complete)
      if (project?.evidence_gaps_completed_at) {
        await unmarkProjectPhaseComplete(projectId, 'evidence_gaps_completed_at');
        // Invalidate project query to reflect the change in completion status
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      refetch(); // Refetch the evidence list
      // TODO: Show success toast
    } catch (err: any) {
      console.error("Deletion failed:", err);
      // TODO: Show error toast
    } finally {
      setIsDeleting(null);
      setShowDeleteConfirmation(false); // Close confirmation dialog
      setEvidenceToDelete(null); // Clear stored evidence
    }
  };

  // Initial delete handler: checks phase status and shows confirmation if needed
  const handleDeleteClick = (evidence: Evidence) => {
    // Check if the phase is already complete
    if (project?.evidence_gaps_completed_at) {
      setEvidenceToDelete(evidence); // Store evidence object
      setShowDeleteConfirmation(true); // Show confirmation dialog
    } else {
      // Use standard browser confirm if phase not complete (or replace with AlertDialog too if preferred)
      if (confirm('Are you sure you want to delete this evidence? This action cannot be undone.')) {
        performDelete(evidence); 
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading evidence: {error.message}</div>;
  }

  if (evidenceList.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No evidence uploaded for this control yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidenceList.map((evidence) => (
            <TableRow key={evidence.id}>
              <TableCell className="font-medium">{evidence.title}</TableCell>
              <TableCell>{evidence.description || '-'}</TableCell>
              <TableCell>
                {evidence.file_name ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleDownload(evidence)}
                    disabled={isDownloading === evidence.id}
                    className="p-0 h-auto"
                  >
                    {isDownloading === evidence.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    {evidence.file_name}
                  </Button>
                ) : (
                  <span className="text-muted-foreground">No file</span>
                )}
              </TableCell>
              <TableCell>{format(new Date(evidence.created_at), 'PPp')}</TableCell>
               <TableCell>
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(evidence)} // Use new handler
                    disabled={isDeleting === evidence.id}
                    className="text-red-600 hover:text-red-800"
                  >
                    {isDeleting === evidence.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
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
              The "Evidence & Gaps" phase is marked as complete. Deleting evidence will reset this status. Are you sure you want to delete "{evidenceToDelete?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEvidenceToDelete(null)} disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => evidenceToDelete && performDelete(evidenceToDelete)} disabled={!!isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
