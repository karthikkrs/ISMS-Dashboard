'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/types/database.types';
import { getRiskAssessments } from '@/services/risk-assessment-service'; // Import the service
import { Loader2, AlertCircle, TableIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Import table components later when needed
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define type for RiskAssessment (potentially with joined data)
// Using 'any' for now as the service returns joined data not fully typed yet
type RiskAssessmentWithDetails = any; // TODO: Define this type properly later

interface CrqSummaryTableProps {
  projectId: string;
}

export function CrqSummaryTable({ projectId }: CrqSummaryTableProps) {

  const { data: assessments, isLoading, error } = useQuery<RiskAssessmentWithDetails[]>({
    queryKey: ['riskAssessments', projectId], // Use a specific query key
    queryFn: () => getRiskAssessments(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Loading risk data...</div>;
  }

  if (error) {
    return <div className="text-destructive p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading risk assessments: {error.message}</div>;
  }

  if (!assessments || assessments.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No risk assessments found for this project yet.</p>;
  }

  // TODO: Implement table rendering and risk calculation display
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Displaying {assessments.length} risk assessments. Table and calculations coming soon.
      </p>
      {/* Placeholder for the actual table */}
       <pre className="bg-muted p-4 rounded text-xs overflow-auto">
         {JSON.stringify(assessments, null, 2)}
       </pre>
    </div>
  );
}
