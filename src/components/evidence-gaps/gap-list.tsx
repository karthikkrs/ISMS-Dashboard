'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGapsForBoundaryControl, deleteGap } from '@/services/gap-service';
import { Gap } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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
  boundaryControlId: string;
  onEditGap: (gap: Gap) => void; // Callback to open edit form
  // TODO: Add prop for triggering refetch if needed after add/delete/edit
}

export function GapList({ boundaryControlId, onEditGap }: GapListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: gapList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['gaps', boundaryControlId],
    queryFn: () => getGapsForBoundaryControl(boundaryControlId),
    enabled: !!boundaryControlId,
  });

 const handleDelete = async (gapId: string) => {
     if (!confirm('Are you sure you want to delete this gap? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(gapId);
    try {
      await deleteGap(gapId);
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
                    onClick={() => handleDelete(gap.id)}
                    disabled={isDeleting === gap.id}
                    className="text-red-600 hover:text-red-800"
                  >
                    {isDeleting === gap.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
