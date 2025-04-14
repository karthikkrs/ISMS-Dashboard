'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRiskAssessments } from '@/services/risk-assessment-service';
import { Loader2, AlertCircle } from 'lucide-react';
import { Tables } from '@/types/database.types';

// Base type from database schema
type RiskAssessment = Tables<'risk_assessments'>;

// Extended type with joined data
interface RiskAssessmentWithRelations extends RiskAssessment {
  // Joined tables as returned by the service
  boundaries?: {
    id: string;
    name: string;
    type: string;
  } | null;
  threat_scenarios?: {
    id: string;
    name: string;
  } | null;
  gaps?: {
    id: string;
    title: string;
  } | null;
  controls?: {
    id: string;
    reference: string;
  } | null;
}

interface CrqSummaryTableProps {
  projectId: string;
}

export function CrqSummaryTable({ projectId }: CrqSummaryTableProps) {
  // Use the correct type that matches the service's return value
  const { data: assessments, isLoading, error } = useQuery<RiskAssessmentWithRelations[]>({
    queryKey: ['riskAssessments', projectId],
    queryFn: () => getRiskAssessments(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Loading risk data...</div>;
  }

  if (error) {
    return <div className="text-destructive p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading risk assessments: {(error as Error).message}</div>;
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
