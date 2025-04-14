'use client';

import { useState } from 'react';
import { BoundaryControlWithDetails } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileX, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BoundaryControlListProps {
  boundaryControls: BoundaryControlWithDetails[];
  selectedBoundaryControlId: string | null;
  onSelectBoundaryControl: (boundaryControlId: string) => void;
}

export function BoundaryControlList({ 
  boundaryControls, 
  selectedBoundaryControlId, 
  onSelectBoundaryControl 
}: BoundaryControlListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter controls by search query
  const filteredControls = boundaryControls.filter((bc) => {
    const control = bc.controls;
    if (!control) return false;
    
    return (
      control.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      control.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (control.domain && control.domain.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Group controls by domain
  const groupedControls = filteredControls.reduce<Record<string, BoundaryControlWithDetails[]>>(
    (acc, bc) => {
      const domain = bc.controls?.domain || 'Uncategorized';
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(bc);
      return acc;
    },
    {}
  );

  // Sort domains alphabetically
  const sortedDomains = Object.entries(groupedControls).sort(([a], [b]) => a.localeCompare(b));

  // No controls found after filtering
  const noControlsFound = sortedDomains.length === 0;

  // Helper to get badge variant based on compliance status
  const getComplianceBadgeVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Compliant': return 'default'; 
      case 'Partially Compliant': return 'secondary'; 
      case 'Non Compliant': return 'destructive';
      default: return 'outline'; 
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search controls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-240px)]">
            {noControlsFound ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileX className="h-12 w-12 mb-2 text-muted-foreground/70" />
                <p>No controls found for this boundary</p>
                <p className="text-sm">Try selecting a different boundary</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDomains.map(([domain, domainControls]) => (
                  <div key={domain} className="space-y-2">
                    <h3 className="font-medium text-sm sticky top-0 bg-background/95 backdrop-blur-sm p-1">
                      {domain}
                    </h3>
                    <div className="space-y-1">
                      {domainControls.map((bc) => (
                        <button
                          key={bc.id}
                          className={`w-full text-left p-2 rounded-md transition-colors hover:bg-accent flex justify-between items-center ${
                            selectedBoundaryControlId === bc.id 
                              ? 'bg-accent text-accent-foreground font-medium' 
                              : ''
                          }`}
                          onClick={() => onSelectBoundaryControl(bc.id)}
                        >
                          <div className="truncate flex-1">
                            <div className="font-medium flex items-center">
                              <Shield className="h-3.5 w-3.5 mr-1 inline" />
                              {bc.controls?.reference}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {bc.controls?.description}
                            </div>
                          </div>
                          <div className="shrink-0 ml-2 flex items-center">
                            {bc.is_applicable ? (
                              <Badge variant={getComplianceBadgeVariant(bc.compliance_status)}>
                                {bc.compliance_status || 'Not Assessed'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-dashed">
                                Not Applicable
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
