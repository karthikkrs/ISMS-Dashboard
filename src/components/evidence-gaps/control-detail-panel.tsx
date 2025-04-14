'use client';

import { useState } from 'react';
import { BoundaryControlWithDetails, Gap } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileSearchIcon, CheckSquareIcon, PlusCircle } from 'lucide-react';
import { EvidenceList } from './evidence-list';
import { GapList } from './gap-list';
import { ComplianceAssessment } from './compliance-assessment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EvidenceForm } from './evidence-form';
import { GapForm } from './gap-form';

interface ControlDetailPanelProps {
  boundaryControl: BoundaryControlWithDetails | null;
  projectId: string;
  onRefetch: () => void;
}

export function ControlDetailPanel({
  boundaryControl,
  projectId,
  onRefetch,
}: ControlDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('gaps');
  
  // Dialog states
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [showGapDialog, setShowGapDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [editingGap, setEditingGap] = useState<Gap | null>(null);

  if (!boundaryControl) {
    return (
      <Card className="h-full flex items-center justify-center text-center p-8">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select a control</h3>
          <p className="text-sm text-muted-foreground">
            Choose a control from the sidebar to view its details, gaps, and evidence.
          </p>
        </div>
      </Card>
    );
  }

  const { controls, boundaries, compliance_status } = boundaryControl;

  // Helper to get badge variant based on compliance status
  const getComplianceBadgeVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Compliant': return 'default'; 
      case 'Partially Compliant': return 'secondary'; 
      case 'Non Compliant': return 'destructive';
      default: return 'outline'; 
    }
  };

  // Event handlers
  const handleEvidenceAdded = () => {
    setShowEvidenceDialog(false);
    onRefetch();
  };

  const handleGapSaved = () => {
    setShowGapDialog(false);
    setEditingGap(null);
    onRefetch();
  };

  const handleAssessmentSaved = () => {
    setShowComplianceDialog(false);
    onRefetch();
  };

  // Ensure only one dialog is open at a time
  const openEvidenceDialog = () => {
    setShowGapDialog(false);
    setShowComplianceDialog(false);
    setEditingGap(null);
    setShowEvidenceDialog(true);
  };

  const openGapDialog = (gapToEdit: Gap | null = null) => {
    setShowEvidenceDialog(false);
    setShowComplianceDialog(false);
    setEditingGap(gapToEdit);
    setShowGapDialog(true);
  };

  const openComplianceDialog = () => {
    setShowEvidenceDialog(false);
    setShowGapDialog(false);
    setEditingGap(null);
    setShowComplianceDialog(true);
  };

  return (
    <div className="h-full space-y-4">
      {/* Control Information Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                {controls?.reference}{" "}
                <Badge 
                  variant={getComplianceBadgeVariant(compliance_status)} 
                  className="ml-2"
                >
                  {compliance_status || 'Not Assessed'}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {controls?.description}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openComplianceDialog}
            >
              <CheckSquareIcon className="h-4 w-4 mr-2" />
              Assess Compliance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Domain:</span>
              <span>{controls?.domain || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Boundary:</span>
              <span className="text-right">{boundaries?.name || 'N/A'}</span>
            </div>
            {/* Add any other relevant metadata fields here */}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Gaps and Evidence */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="gaps" className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="evidence" className="flex items-center">
              <FileSearchIcon className="h-4 w-4 mr-2" />
              Evidence
            </TabsTrigger>
          </TabsList>
          
          {/* Add button specific to the active tab */}
          {activeTab === 'gaps' ? (
            <Button size="sm" onClick={() => openGapDialog(null)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Gap
            </Button>
          ) : (
            <Button size="sm" onClick={openEvidenceDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Evidence
            </Button>
          )}
        </div>

        <TabsContent value="gaps" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <GapList
                projectId={projectId}
                boundaryControlId={boundaryControl.id}
                onEditGap={(gap) => openGapDialog(gap)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <EvidenceList
                projectId={projectId}
                boundaryControlId={boundaryControl.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Evidence Management */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Evidence for {controls?.reference}</DialogTitle>
            <DialogDescription>
              Upload or link to evidence demonstrating compliance with this control.
            </DialogDescription>
          </DialogHeader>
          <EvidenceForm
            projectId={projectId}
            boundaryControlId={boundaryControl.id}
            onEvidenceAdded={handleEvidenceAdded}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for Gap Management */}
      <Dialog open={showGapDialog} onOpenChange={(open) => {
        setShowGapDialog(open);
        if (!open) setEditingGap(null);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingGap ? 'Edit Gap' : 'Add Gap'} for {controls?.reference}</DialogTitle>
            <DialogDescription>
              {editingGap ? 'Update the details of this identified gap.' : 'Document a gap or non-compliance issue with this control.'}
            </DialogDescription>
          </DialogHeader>
          <GapForm
            projectId={projectId}
            boundaryControlId={boundaryControl.id}
            existingGap={editingGap}
            onGapSaved={handleGapSaved}
            onCancel={() => setShowGapDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for Compliance Assessment */}
      <Dialog open={showComplianceDialog} onOpenChange={setShowComplianceDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assess Compliance for {controls?.reference}</DialogTitle>
            <DialogDescription>
              Evaluate the compliance status of this control based on evidence and gaps.
            </DialogDescription>
          </DialogHeader>
          <ComplianceAssessment
            boundaryControl={boundaryControl}
            onAssessmentSaved={handleAssessmentSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
