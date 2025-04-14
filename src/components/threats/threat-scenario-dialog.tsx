'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThreatScenarioForm } from './threat-scenario-form';
import { Tables } from '@/types/database.types';

type ThreatScenario = Tables<'threat_scenarios'>;

interface ThreatScenarioDialogProps {
  projectId: string;
  gapId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (scenario: ThreatScenario) => void;
}

export function ThreatScenarioDialog({
  projectId,
  gapId,
  isOpen,
  onOpenChange,
  onSuccess
}: ThreatScenarioDialogProps) {
  
  const handleSuccess = (scenario: ThreatScenario) => {
    // Close the dialog
    onOpenChange(false);
    
    // Pass the created scenario to the parent
    if (onSuccess) {
      onSuccess(scenario);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Threat Scenario</DialogTitle>
          <DialogDescription>
            Define a potential threat scenario that could impact your assets or systems.
          </DialogDescription>
        </DialogHeader>
        <ThreatScenarioForm
          projectId={projectId}
          gapId={gapId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
