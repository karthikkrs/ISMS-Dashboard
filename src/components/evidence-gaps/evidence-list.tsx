'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvidenceForBoundaryControl, getEvidenceDownloadUrl, deleteEvidence } from '@/services/evidence-service';
import { Evidence } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Trash2, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns'; // For date formatting

interface EvidenceListProps {
  boundaryControlId: string;
  // TODO: Add prop for triggering refetch if needed after add/delete
}

export function EvidenceList({ boundaryControlId }: EvidenceListProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Track which file is downloading
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which evidence is deleting

  const { data: evidenceList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['evidence', boundaryControlId],
    queryFn: () => getEvidenceForBoundaryControl(boundaryControlId),
    enabled: !!boundaryControlId, // Only run query if boundaryControlId is provided
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

  const handleDelete = async (evidenceId: string) => {
     if (!confirm('Are you sure you want to delete this evidence? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(evidenceId);
    try {
      await deleteEvidence(evidenceId);
      refetch(); // Refetch the list after deletion
      // TODO: Show success toast
    } catch (err) {
      console.error("Deletion failed:", err);
      // TODO: Show error toast to user
    } finally {
      setIsDeleting(null);
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
                    onClick={() => handleDelete(evidence.id)}
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
    </div>
  );
}
