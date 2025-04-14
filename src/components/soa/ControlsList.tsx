'use client'

import { useState, useRef, useMemo } from 'react'
import { useDrag } from 'react-dnd'
import { Control } from '@/services/control-service'
import { BoundaryControlWithDetails } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useEffect } from 'react'

// Define the item type for drag and drop
const ITEM_TYPE = 'control'

interface DraggableControlProps {
  control: Control
  isAssociated: boolean
}

const DraggableControl = ({ control, isAssociated }: DraggableControlProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  
  // Set up drag source
  const [{ isDragging }, dragRef, preview] = useDrag(() => ({
    type: ITEM_TYPE,
    item: () => {
      console.log('Started dragging control:', control.id, control.reference);
      return { control };
    },
    canDrag: !isAssociated,
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ target?: string }>();
      if (dropResult) {
        console.log('Dropped control on target:', dropResult.target, 'Control:', control.reference);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))
  
  // Hide default browser preview and use custom drag layer
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])
  
  // Apply the drag ref to our element via callback ref
  const dragProps = {
    ref: (node: HTMLDivElement | null) => {
      ref.current = node
      dragRef(node)
    }
  }
  
  return (
    <div 
      {...dragProps}
      className={`p-2 mb-2 border rounded cursor-grab ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${isAssociated ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'}`}
      title={isAssociated ? `${control.reference} is already applied to this boundary` : control.description}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{control.reference}</span>
            {control.domain && (
              <Badge variant="secondary" className="text-xs">{control.domain}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate">{control.description}</p>
        </div>
      </div>
    </div>
  )
}

interface ControlsListProps {
  controls: Control[]
  boundaryControls: BoundaryControlWithDetails[]
  selectedBoundaryId: string | null
}

export function ControlsList({ 
  controls, 
  boundaryControls,
  selectedBoundaryId 
}: ControlsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  
  // Get all available domains from controls
  const domains = useMemo(() => {
    const domainSet = new Set<string>()
    controls.forEach(control => {
      if (control.domain) {
        domainSet.add(control.domain)
      }
    })
    return Array.from(domainSet).sort()
  }, [controls])

  // Filter controls by search query and domain
  const filteredControls = useMemo(() => {
    return controls.filter(control => {
      const matchesSearch = searchQuery === '' || 
        control.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.description.toLowerCase().includes(searchQuery.toLowerCase())
        
      const matchesDomain = !domainFilter || control.domain === domainFilter
      
      return matchesSearch && matchesDomain
    })
  }, [controls, searchQuery, domainFilter])
  
  // Group filtered controls by domain
  const controlsByDomain = useMemo(() => {
    const grouped: Record<string, Control[]> = {}
    
    filteredControls.forEach(control => {
      const domain = control.domain || 'Uncategorized'
      if (!grouped[domain]) {
        grouped[domain] = []
      }
      grouped[domain].push(control)
    })
    
    // Sort domains alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredControls])
  
  // Function to check if a control is already associated with the selected boundary
  const isControlAssociatedWithSelectedBoundary = (controlId: string): boolean => {
    if (!selectedBoundaryId) return false
    
    return boundaryControls.some(bc => 
      bc.control_id === controlId && 
      bc.boundary_id === selectedBoundaryId
    )
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Available Controls</CardTitle>
        <CardDescription>Drag controls to the boundary panel</CardDescription>
        <div className="flex flex-col gap-2 mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search controls..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant={domainFilter === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setDomainFilter(null)}
            >
              All
            </Badge>
            {domains.map(domain => (
              <Badge 
                key={domain}
                variant={domainFilter === domain ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDomainFilter(domain)}
              >
                {domain}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)] pr-4">
          {controlsByDomain.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No controls found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
            </div>
          ) : (
            <div className="space-y-6">
              {controlsByDomain.map(([domain, controls]) => (
                <div key={domain} className="mb-4">
                  <h3 className="font-semibold text-md mb-2 sticky top-0 bg-gray-100 p-1 rounded">{domain}</h3>
                  {controls.map(control => (
                    <DraggableControl 
                      key={control.id} 
                      control={control}
                      isAssociated={isControlAssociatedWithSelectedBoundary(control.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
