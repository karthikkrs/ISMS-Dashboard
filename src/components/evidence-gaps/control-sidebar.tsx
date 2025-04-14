'use client';

import { useState } from 'react';
import { Control } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ControlSidebarProps {
  controls: Control[];
  selectedControlId: string | null;
  onSelectControl: (controlId: string) => void;
}

export function ControlSidebar({ 
  controls, 
  selectedControlId, 
  onSelectControl 
}: ControlSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group controls by domain
  const groupedControls = controls.reduce<Record<string, Control[]>>((acc, control) => {
    const domain = control.domain || 'Uncategorized';
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(control);
    return acc;
  }, {});

  // Filter controls by search query
  const filteredDomains = Object.entries(groupedControls).reduce<Record<string, Control[]>>(
    (filtered, [domain, domainControls]) => {
      const matchingControls = domainControls.filter(
        (control) => 
          control.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          control.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matchingControls.length > 0) {
        filtered[domain] = matchingControls;
      }

      return filtered;
    },
    {}
  );

  // Sort domains alphabetically
  const sortedDomains = Object.entries(filteredDomains).sort(([a], [b]) => a.localeCompare(b));

  // No controls found after filtering
  const noControlsFound = sortedDomains.length === 0;

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
                <p>No controls found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDomains.map(([domain, domainControls]) => (
                  <div key={domain} className="space-y-2">
                    <h3 className="font-medium text-sm sticky top-0 bg-background/95 backdrop-blur-sm p-1">
                      {domain}
                    </h3>
                    <div className="space-y-1">
                      {domainControls.map((control) => (
                        <button
                          key={control.id}
                          className={`w-full text-left p-2 rounded-md transition-colors hover:bg-accent flex justify-between items-center ${
                            selectedControlId === control.id 
                              ? 'bg-accent text-accent-foreground font-medium' 
                              : ''
                          }`}
                          onClick={() => onSelectControl(control.id)}
                        >
                          <div className="truncate flex-1">
                            <div className="font-medium">{control.reference}</div>
                            <div className="text-xs text-muted-foreground truncate">{control.description}</div>
                          </div>
                          {domain && (
                            <Badge variant="outline" className="ml-2 shrink-0">
                              {domain}
                            </Badge>
                          )}
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
