'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBoundaries } from '@/services/boundary-service'
import { Boundary } from '@/types'
import { BoundariesTable } from './boundaries-table'
import { MultiBoundaryForm } from './multi-boundary-form'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BoundariesDashboardProps {
  projectId: string
}

export function BoundariesDashboard({ projectId }: BoundariesDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Fetch boundaries data
  const { 
    data: boundaries = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId)
  })

  // Handle form close
  const handleFormClose = () => {
    setShowAddForm(false)
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading boundaries...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">Error loading boundaries</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Boundaries</h2>
          <p className="text-gray-500">Define the scope of your ISMS by adding departments, systems, and locations</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Boundaries
        </Button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl p-4">
            <MultiBoundaryForm
              projectId={projectId}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Boundaries Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Boundaries</CardTitle>
          <CardDescription>
            Total boundaries defined for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{boundaries.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Total</p>
            </div>
            <div className="flex space-x-8">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">{boundaries.filter(b => b.included).length}</p>
                <p className="text-sm text-muted-foreground">In Scope</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-600">{boundaries.filter(b => !b.included).length}</p>
                <p className="text-sm text-muted-foreground">Out of Scope</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boundaries Table */}
      <BoundariesTable projectId={projectId} boundaries={boundaries} />

      {/* Empty State */}
      {boundaries.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No boundaries defined</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start by adding departments, systems, or locations to define your ISMS scope.
          </p>
          <div className="mt-6">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Boundaries
          </Button>
          </div>
        </div>
      )}
    </div>
  )
}
