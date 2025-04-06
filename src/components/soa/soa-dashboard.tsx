'use client'

import { useState, useEffect, useMemo } from 'react' // Added useMemo
import { useQuery } from '@tanstack/react-query'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { getBoundaries } from '@/services/boundary-service'
import { getControls } from '@/services/control-service'
import { getBoundaryControlsWithDetails } from '@/services/boundary-control-service'
import { Boundary, Control } from '@/types' // Control type now includes domain
import { ControlsList } from './controls-list'
import { BoundaryControlsList } from './boundary-controls-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Loader2 } from 'lucide-react'

interface SoaDashboardProps {
  projectId: string
}

export function SoaDashboard({ projectId }: SoaDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null) // Changed from selectedCategory
  const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null)
  
  // Fetch boundaries for the project
  const { 
    data: boundaries = [], 
    isLoading: boundariesLoading,
    error: boundariesError
  } = useQuery({
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId)
  })
  
  // Fetch all controls
  const {
    data: controls = [],
    isLoading: controlsLoading,
    error: controlsError
  } = useQuery({
    queryKey: ['controls'],
    queryFn: () => getControls()
  })
  
  // Fetch boundary controls for the selected boundary
  const {
    data: boundaryControls = [],
    isLoading: boundaryControlsLoading,
    error: boundaryControlsError,
    refetch: refetchBoundaryControls
  } = useQuery({
    queryKey: ['boundaryControls', selectedBoundary],
    queryFn: () => selectedBoundary ? getBoundaryControlsWithDetails(selectedBoundary) : Promise.resolve([]),
    enabled: !!selectedBoundary
  })
  
  // Set the first boundary as selected by default
  useEffect(() => {
    if (boundaries.length > 0 && !selectedBoundary) {
      setSelectedBoundary(boundaries[0].id)
    }
  }, [boundaries, selectedBoundary])

  // Group controls by domain
  const controlsByDomain = useMemo(() => {
    return controls.reduce((acc, control) => {
      const domain = control.domain || 'Uncategorized';
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(control);
      return acc;
    }, {} as Record<string, Control[]>);
  }, [controls]);

  const domains = Object.keys(controlsByDomain).sort();

  // Filter controls based on search term and selected domain
  const filteredControlsByDomain = useMemo(() => {
    const filtered: Record<string, Control[]> = {};
    for (const domain in controlsByDomain) {
      const domainControls = controlsByDomain[domain].filter(control => {
        const matchesSearch = searchTerm === '' ||
          control.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          control.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDomain = !selectedDomain || control.domain === selectedDomain;

        // Filter out controls that are already associated with the selected boundary
        const isNotAssociated = !boundaryControls.some(bc => bc.control_id === control.id);

        return matchesSearch && matchesDomain && isNotAssociated;
      });
      if (domainControls.length > 0) {
        filtered[domain] = domainControls;
      }
    }
    return filtered;
  }, [controlsByDomain, searchTerm, selectedDomain, boundaryControls]);
  
  // Loading state
  if (boundariesLoading || controlsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading Statement of Applicability...</p>
      </div>
    )
  }
  
  // Error state
  if (boundariesError || controlsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">Error loading Statement of Applicability</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Statement of Applicability</h2>
            <p className="text-gray-500">Drag and drop controls to assign them to boundaries</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Boundaries selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Boundaries</CardTitle>
              <CardDescription>Select a boundary to assign controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {boundaries.map(boundary => (
                  <Button
                    key={boundary.id}
                    variant={selectedBoundary === boundary.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedBoundary(boundary.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span>{boundary.name}</span>
                      <span className="text-xs text-muted-foreground">{boundary.type}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Controls and assigned controls */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Drag controls to assign them to the selected boundary</CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search controls..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex-shrink-0">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="available" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="available" className="flex-1">Available Controls</TabsTrigger>
                  <TabsTrigger value="assigned" className="flex-1">Assigned Controls</TabsTrigger>
                </TabsList>
                
                <TabsContent value="available" className="mt-4">
                  {/* Domain Filter Buttons */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedDomain === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDomain(null)}
                      >
                        All Domains
                      </Button>
                      {domains.map(domain => (
                        <Button
                          key={domain}
                          variant={selectedDomain === domain ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedDomain(domain)}
                        >
                          {domain}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Controls List Grouped by Domain */}
                  {Object.keys(filteredControlsByDomain).length > 0 ? (
                    Object.entries(filteredControlsByDomain).map(([domain, domainControls]) => (
                      <div key={domain} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 border-b pb-1">{domain}</h3>
                        <ControlsList
                          controls={domainControls}
                          boundaryId={selectedBoundary || ''}
                          onControlAssigned={() => refetchBoundaryControls()}
                        />
                      </div>
                    ))
                  ) : (
                     <div className="text-center py-8 border rounded-md bg-gray-50">
                       <p className="text-gray-500">No available controls match the current filter.</p>
                     </div>
                  )}
                </TabsContent>
                
                <TabsContent value="assigned" className="mt-4">
                  {boundaryControlsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <BoundaryControlsList 
                      boundaryControls={boundaryControls} 
                      onControlRemoved={() => refetchBoundaryControls()}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  )
}
