'use client';

import { useState } from 'react';
import { Tables } from '@/types/database.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileX, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BoundarySidebarProps {
  boundaries: Tables<'boundaries'>[];
  selectedBoundaryId: string | null;
  onSelectBoundary: (boundaryId: string) => void;
}

export function BoundarySidebar({ 
  boundaries, 
  selectedBoundaryId, 
  onSelectBoundary 
}: BoundarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group boundaries by type
  const groupedBoundaries = boundaries.reduce<Record<string, Tables<'boundaries'>[]>>((acc, boundary) => {
    const type = boundary.type || 'Uncategorized';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(boundary);
    return acc;
  }, {});

  // Filter boundaries by search query
  const filteredTypes = Object.entries(groupedBoundaries).reduce<Record<string, Tables<'boundaries'>[]>>(
    (filtered, [type, typeBoundaries]) => {
      const matchingBoundaries = typeBoundaries.filter(
        (boundary) => 
          boundary.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (boundary.description && boundary.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (matchingBoundaries.length > 0) {
        filtered[type] = matchingBoundaries;
      }

      return filtered;
    },
    {}
  );

  // Sort types alphabetically
  const sortedTypes = Object.entries(filteredTypes).sort(([a], [b]) => a.localeCompare(b));

  // No boundaries found after filtering
  const noBoundariesFound = sortedTypes.length === 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boundaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-240px)]">
            {noBoundariesFound ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileX className="h-12 w-12 mb-2 text-muted-foreground/70" />
                <p>No boundaries found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedTypes.map(([type, typeBoundaries]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-medium text-sm sticky top-0 bg-background/95 backdrop-blur-sm p-1">
                      {type}
                    </h3>
                    <div className="space-y-1">
                      {typeBoundaries.map((boundary) => (
                        <button
                          key={boundary.id}
                          className={`w-full text-left p-2 rounded-md transition-colors hover:bg-accent flex justify-between items-center ${
                            selectedBoundaryId === boundary.id 
                              ? 'bg-accent text-accent-foreground font-medium' 
                              : ''
                          }`}
                          onClick={() => onSelectBoundary(boundary.id)}
                        >
                          <div className="truncate flex-1">
                            <div className="font-medium flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1 inline" />
                              {boundary.name}
                            </div>
                            {boundary.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {boundary.description}
                              </div>
                            )}
                          </div>
                          {!boundary.included && (
                            <Badge variant="outline" className="ml-2 shrink-0 border-dashed">
                              Excluded
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
