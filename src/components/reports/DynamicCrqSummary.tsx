'use client'; // This component fetches data client-side

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getThreatScenariosForProject } from '@/services/threat-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Info } from 'lucide-react';

// Create a completely new type rather than extending to avoid conflicts
interface ThreatScenarioWithRisk {
  id: string;
  name: string;
  description: string | null;
  project_id: string;
  gap_id: string | null;
  threat_actor_type: string | null;
  relevant_iso_domains: string[] | null;
  created_at: string;
  updated_at: string;
  // CRQ fields
  sle: number | null;
  aro: number | null;
  mitre_techniques: string[] | null;
  ale?: number | null; // For calculated annualized loss expectancy
}

interface DynamicCrqSummaryProps {
  projectId: string;
}

// Helper to format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Helper to determine badge variant based on calculated ALE
const getAleBadgeVariant = (ale: number | null): "destructive" | "default" | "secondary" | "outline" | null | undefined => {
  if (ale === null) return "outline";
  if (ale >= 50000) return "destructive"; // High risk
  if (ale >= 30000) return "default";     // Medium risk
  return "secondary";                     // Low risk
};

export function DynamicCrqSummary({ projectId }: DynamicCrqSummaryProps) {
  const { data: scenarios = [], isLoading, error } = useQuery<ThreatScenarioWithRisk[]>({
    queryKey: ['threatScenarios', projectId],
    queryFn: () => getThreatScenariosForProject(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Cyber Risk Quantification (CRQ) Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8 border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading CRQ Data</CardTitle>
        </CardHeader>
        <CardContent className="text-destructive flex items-center gap-2">
           <AlertCircle className="h-4 w-4" /> {error instanceof Error ? error.message : 'Unknown error'}
        </CardContent>
      </Card>
    );
  }

  if (scenarios.length === 0) {
     return (
       <Card className="mt-8">
         <CardHeader>
           <CardTitle>Cyber Risk Quantification (CRQ) Summary</CardTitle>
         </CardHeader>
         <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-4 rounded-md">
                <Info className="h-5 w-5 flex-shrink-0"/>
                <p className="text-sm">No threat scenarios with SLE and ARO defined for this project yet. Create threat scenarios linked to gaps to populate this report.</p>
            </div>
         </CardContent>
       </Card>
     );
  }

  // Calculate ALE for scenarios that have both SLE and ARO
  const scenariosWithAle = scenarios.map(scenario => {
    const sle = scenario.sle;
    const aro = scenario.aro;
    const ale = (sle !== null && aro !== null)
      ? sle * aro
      : null;
    return { ...scenario, ale };
  }).filter(s => s.sle !== null && s.aro !== null);

   if (scenariosWithAle.length === 0) {
     return (
       <Card className="mt-8">
         <CardHeader>
           <CardTitle>Cyber Risk Quantification (CRQ) Summary</CardTitle>
         </CardHeader>
         <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-4 rounded-md">
                <Info className="h-5 w-5 flex-shrink-0"/>
                <p className="text-sm">No threat scenarios with both SLE and ARO defined yet. Update existing scenarios linked to gaps to populate this report.</p>
            </div>
         </CardContent>
       </Card>
     );
  }


  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Cyber Risk Quantification (CRQ) Summary</CardTitle>
        <CardDescription>Annualized Loss Expectancy based on defined threat scenarios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scenario Name</TableHead>
              <TableHead className="text-right">SLE (Est.)</TableHead>
              <TableHead className="text-right">ARO (Est.)</TableHead>
              <TableHead className="text-right">ALE (Calculated)</TableHead>
              <TableHead>MITRE Techniques</TableHead>
              {/* Optional: Add column for linked Gap ID/Description if needed */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenariosWithAle.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.sle)}</TableCell>
                <TableCell className="text-right">{item.aro?.toFixed(2) ?? 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={getAleBadgeVariant(item.ale)}>{formatCurrency(item.ale)}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {item.mitre_techniques && item.mitre_techniques.length > 0 
                    ? item.mitre_techniques.join(', ') 
                    : <span className="text-muted-foreground">N/A</span>}
                </TableCell>
                {/* Optional: Display linked Gap ID */}
                {/* <TableCell>{item.gap_id ?? 'N/A'}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
