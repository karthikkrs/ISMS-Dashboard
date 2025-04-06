'use client';

'use client';

'use client';

import React, { useState, useMemo } from 'react'; // Import useMemo
import { useQuery } from '@tanstack/react-query';
// Import the newly added service function
import { getProjectBoundaryControlsWithDetails } from '@/services/boundary-control-service'; 
import { BoundaryControlWithDetails, Gap } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import SelectGroup, SelectLabel
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { EvidenceList } from './evidence-list';
import { EvidenceForm } from './evidence-form';
import { GapList } from './gap-list';
import { GapForm } from './gap-form';
import { ComplianceAssessment } from './compliance-assessment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EvidenceGapsDashboardProps {
  projectId: string;
}

// Remove the mock function as we now have the real one
// const fetchProjectBoundaryControls = ... 

export function EvidenceGapsDashboard({ projectId }: EvidenceGapsDashboardProps) {
  const [selectedBoundaryControlId, setSelectedBoundaryControlId] = useState<string | null>(null);
  const [editingGap, setEditingGap] = useState<Gap | null>(null);
  const [showGapFormDialog, setShowGapFormDialog] = useState(false);

  // Fetch boundary controls with details for the project
  const { data: boundaryControls = [], isLoading, error, refetch } = useQuery<BoundaryControlWithDetails[]>({
    queryKey: ['projectBoundaryControlsWithDetails', projectId], // Distinct query key
    // Use the actual service function
    queryFn: () => getProjectBoundaryControlsWithDetails(projectId), 
  });

  // Group controls by boundary name using useMemo for performance
  const groupedControls = useMemo(() => {
    const groups: { [boundaryName: string]: BoundaryControlWithDetails[] } = {};
    boundaryControls.forEach(bc => {
      const boundaryName = bc.boundaries?.name || 'Unknown Boundary';
      if (!groups[boundaryName]) {
        groups[boundaryName] = [];
      }
      groups[boundaryName].push(bc);
    });
    // Optional: Sort controls within each group, e.g., by reference
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.controls?.reference.localeCompare(b.controls?.reference || '') || 0);
    });
    return groups;
  }, [boundaryControls]);

  const selectedBoundaryControl = boundaryControls.find(bc => bc.id === selectedBoundaryControlId);

  const handleRefetchData = () => {
    // Refetch the main list of boundary controls; child components refetch their own data internally
    refetch();
  };

  const handleGapSaved = () => {
    handleRefetchData(); // Refetch main data
    setEditingGap(null);
    setShowGapFormDialog(false);
  };

  const handleEditGap = (gap: Gap) => {
    setEditingGap(gap);
    setShowGapFormDialog(true);
  };

  const handleAddNewGap = () => {
    setEditingGap(null);
    setShowGapFormDialog(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> Error loading project controls: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Evidence & Gap Analysis</h2>
        <p className="text-muted-foreground">
          Manage evidence, identify gaps, and assess compliance for project controls.
        </p>
      </div>

      {/* Boundary Control Selector */}
      <div className="max-w-lg"> {/* Increased max-width */}
         <Label htmlFor="boundary-control-select">Select Control</Label>
         <Select
            onValueChange={setSelectedBoundaryControlId}
            value={selectedBoundaryControlId || ''}
          >
            <SelectTrigger id="boundary-control-select">
              <SelectValue placeholder="Select a control to manage..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(groupedControls).length > 0 ? (
                Object.entries(groupedControls).map(([boundaryName, controlsInGroup]) => (
                  <SelectGroup key={boundaryName}>
                    <SelectLabel>{boundaryName}</SelectLabel>
                    {controlsInGroup.map(bc => (
                      <SelectItem key={bc.id} value={bc.id}>
                        {/* Display Control Domain and Ref within the group */}
                        <span className="text-muted-foreground mr-2">[{bc.controls?.domain || 'No Domain'}]</span> 
                        <span>{bc.controls?.reference} - {bc.controls?.description.substring(0, 60)}...</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))
              ) : (
                <SelectItem value="-" disabled>No applicable controls found for this project</SelectItem>
              )}
            </SelectContent>
          </Select>
      </div>

      {/* Display content only if a control is selected */}
      {selectedBoundaryControl ? (
        <Tabs defaultValue="evidence" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4"> {/* Added mb-4 */}
            <TabsTrigger value="evidence">Evidence Management</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Assessment</TabsTrigger>
          </TabsList>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="mt-0 space-y-4"> {/* Removed mt-4 from TabsContent */}
             <EvidenceForm
                boundaryControlId={selectedBoundaryControlId!}
                onEvidenceAdded={handleRefetchData} 
              />
             <Card>
                <CardHeader>
                  <CardTitle>Uploaded Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                   <EvidenceList boundaryControlId={selectedBoundaryControlId!} />
                </CardContent>
             </Card>
          </TabsContent>

          {/* Gaps Tab */}
          <TabsContent value="gaps" className="mt-0 space-y-4"> {/* Removed mt-4 */}
             <Dialog open={showGapFormDialog} onOpenChange={setShowGapFormDialog}>
                <DialogTrigger asChild>
                   <Button onClick={handleAddNewGap}>Identify New Gap</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                   <DialogHeader>
                     <DialogTitle>{editingGap ? 'Edit Gap' : 'Identify New Gap'}</DialogTitle>
                   </DialogHeader>
                   <GapForm
                      boundaryControlId={selectedBoundaryControlId!}
                      existingGap={editingGap}
                      onGapSaved={handleGapSaved}
                      onCancel={() => setShowGapFormDialog(false)}
                    />
                </DialogContent>
             </Dialog>

             <Card>
               <CardHeader>
                 <CardTitle>Identified Gaps</CardTitle>
               </CardHeader>
               <CardContent>
                  <GapList
                    boundaryControlId={selectedBoundaryControlId!}
                    onEditGap={handleEditGap}
                  />
               </CardContent>
             </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-0"> {/* Removed mt-4 */}
             <ComplianceAssessment
                boundaryControl={selectedBoundaryControl}
                onAssessmentSaved={handleRefetchData} 
              />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select a control above to manage its evidence, gaps, and compliance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
