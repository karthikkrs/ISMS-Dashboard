'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBoundaries } from '@/services/boundary-service'
import { Boundary } from '@/types'
import { BoundariesTable } from './boundaries-table'
import { BoundaryForm } from './boundary-form'
import { Button } from '@/components/ui/button'
import { PlusIcon, Loader2Icon } from 'lucide-react'
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
        <Loader2Icon className="h-8 w-8 animate-spin text-primary mb-4" />
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
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Boundary
        </Button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <BoundaryForm
              projectId={projectId}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Boundaries Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Boundaries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{boundaries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Included in Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{boundaries.filter(b => b.included).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Excluded from Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{boundaries.filter(b => !b.included).length}</p>
          </CardContent>
        </Card>
      </div>

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
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Boundary
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
