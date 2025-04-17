'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RiskRegisterTable } from '@/components/risk/risk-register-table';
import { Loader2, ArrowLeft, TableIcon, LayersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
// Import both data fetching functions and the new type
import { getFullRiskRegisterData, getEditableRiskAssessments, EditableRiskAssessmentItem } from '@/services/risk-register-service';
import { Badge } from '@/components/ui/badge';

export default function RiskRegisterPage() {
  const params = useParams();
  const projectId = params.id as string;
  // We pass the setState function directly to onValueChange
  const [, setActiveTab] = useState("visual-view"); // Keep track of active tab if needed

  // Query for the aggregated data for the read-only table view
  const { data: aggregatedRiskRegister, isLoading: isLoadingAggregated, error: errorAggregated } = useQuery({
    queryKey: ['riskRegisterAggregated', projectId], // Use a distinct key
    queryFn: () => getFullRiskRegisterData(projectId),
    enabled: !!projectId,
  });

  // Query for the detailed, editable data
  const { data: editableRiskAssessments, isLoading: isLoadingEditable, error: errorEditable } = useQuery<EditableRiskAssessmentItem[], Error>({
    queryKey: ['editableRiskAssessments', projectId], // Distinct key for editable data
    queryFn: () => getEditableRiskAssessments(projectId),
    enabled: !!projectId, // Only run if projectId is available
  });


  if (!projectId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading project...</p>
      </div>
    );
  }

  // Function to render risk level badge
  const renderRiskLevel = (riskValue: number | null) => {
    if (riskValue === null) return <Badge variant="outline">Unassessed</Badge>;
    if (riskValue >= 7) return <Badge variant="destructive">High</Badge>;
    if (riskValue >= 4) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="success">Low</Badge>;
  };

  // Function to format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${projectId}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Risk Register</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Additional buttons can go here */}
        </div>
      </div>
      
      <p className="text-muted-foreground">
        The risk register provides a consolidated view of all threat scenarios, 
        their quantified risks, associated gaps, and risk assessments.
      </p>

      <Tabs defaultValue="visual-view" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="visual-view" className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4" />
            Visual View
          </TabsTrigger>
          <TabsTrigger value="table-view" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Table View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual-view" className="mt-6">
          {/* TODO: Pass editableRiskAssessments to RiskRegisterTable once it's refactored */}
          {isLoadingEditable ? (
             <div className="flex justify-center items-center p-8">
               <Loader2 className="h-8 w-8 animate-spin mr-2" />
               <p>Loading editable data...</p>
             </div>
          ) : errorEditable ? (
             <div className="flex items-center p-4 text-red-500">
               <p>Error loading editable data: {errorEditable.message}</p>
             </div>
          ) : (
            <RiskRegisterTable projectId={projectId} initialData={editableRiskAssessments} />
            // Pass initialData to the table component
          )}
        </TabsContent>
        
        <TabsContent value="table-view" className="mt-6">
          {/* This tab now shows the read-only aggregated view */}
          {isLoadingAggregated ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>Loading aggregated risk register...</p>
            </div>
          ) : errorAggregated ? (
            <div className="flex items-center p-4 text-red-500">
              <p>Error loading aggregated risk register: {errorAggregated.message}</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Threat Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>SLE</TableHead>
                    <TableHead>ARO</TableHead>
                    <TableHead>ALE</TableHead>
                    <TableHead>Gaps</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!aggregatedRiskRegister || aggregatedRiskRegister.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No aggregated threat scenarios found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    aggregatedRiskRegister.map((item) => (
                      <TableRow key={item.threat_scenario_id}>
                        <TableCell className="font-medium">{item.threat_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.threat_description || 'No description'}</TableCell>
                        <TableCell>{formatCurrency(item.sle)}</TableCell>
                        <TableCell>{item.aro ?? 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(item.ale)}</TableCell>
                        <TableCell className="text-center">{item.gap_count}</TableCell>
                        <TableCell className="text-center">{item.evidence_count}</TableCell>
                        <TableCell>{renderRiskLevel(item.highest_risk_value)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
