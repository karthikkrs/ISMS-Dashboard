'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, ListChecks } from 'lucide-react';
// Import the actual service function
import { getThreatScenariosForProject } from '@/services/threat-service'; // Renamed function

type ThreatScenario = Tables<'threat_scenarios'>;

interface ThreatScenarioListProps {
  projectId: string;
  onSelectScenario: (scenario: ThreatScenario) => void;
  // Add other props as needed, e.g., for filtering or display options
}


export function ThreatScenarioList({ projectId, onSelectScenario }: ThreatScenarioListProps) {
  
  // Fetch threat scenarios for the project
  const { data: scenarios, isLoading, error } = useQuery<ThreatScenario[]>({
    queryKey: ['threatScenarios', projectId],
    queryFn: () => getThreatScenariosForProject(projectId), // Use renamed function
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> Loading scenarios...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline" /> Error loading scenarios: {error.message}</div>;
  }

  return (
    <div className="space-y-3">
       <h4 className="text-md font-semibold flex items-center"><ListChecks className="mr-2 h-5 w-5"/> Select Existing Scenario</h4>
      <ScrollArea className="h-60 w-full rounded-md border p-2"> {/* Adjust height as needed */}
        {scenarios && scenarios.length > 0 ? (
          scenarios.map((scenario) => (
            <div 
              key={scenario.id} 
              className="p-2 mb-1 border-b last:border-b-0 hover:bg-muted/50 rounded-sm flex justify-between items-center"
            >
              <div>
                 <p className="text-sm font-medium">{scenario.name}</p>
                 <p className="text-xs text-muted-foreground line-clamp-1">{scenario.description || 'No description'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelectScenario(scenario)}
              >
                Select
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground p-4 text-center">No threat scenarios defined yet.</p>
        )}
      </ScrollArea>
    </div>
  );
}
