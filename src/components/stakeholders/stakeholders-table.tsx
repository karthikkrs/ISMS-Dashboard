'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStakeholders, deleteStakeholder } from '@/services/stakeholder-service'
import { Stakeholder } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StakeholderForm } from './stakeholder-form'
import { Loader2, Pencil, Trash, Mail, Phone } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"

interface StakeholdersTableProps {
  projectId: string
}

export function StakeholdersTable({ projectId }: StakeholdersTableProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null)
  
  // Fetch stakeholders data
  const { 
    data: stakeholders = [], 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => getStakeholders(projectId)
  })

  // Handle form close
  const handleFormClose = () => {
    setShowAddForm(false)
    setEditingStakeholder(null)
    refetch()
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this stakeholder?')) {
      try {
        await deleteStakeholder(id)
        refetch()
      } catch (error) {
        console.error('Error deleting stakeholder:', error)
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading stakeholders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-red-500 mb-4">Error loading stakeholders</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Stakeholders</h2>
          <p className="text-gray-500">Manage key stakeholders for your ISMS project</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Stakeholder
        </Button>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingStakeholder) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-4">
            <StakeholderForm
              projectId={projectId}
              stakeholder={editingStakeholder || undefined}
              isEditing={!!editingStakeholder}
              onSuccess={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Stakeholders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">Total Stakeholders</p>
              <p className="text-3xl font-bold">{stakeholders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">With Contact Info</p>
              <p className="text-3xl font-bold text-blue-600">
                {stakeholders.filter(s => s.email || s.phone).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium">With Responsibilities</p>
              <p className="text-3xl font-bold text-green-600">
                {stakeholders.filter(s => s.responsibilities).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stakeholders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Responsibilities</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.map((stakeholder) => (
              <TableRow key={stakeholder.id}>
                <TableCell className="font-medium">{stakeholder.name}</TableCell>
                <TableCell>{stakeholder.role || '-'}</TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {stakeholder.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{stakeholder.email}</span>
                      </div>
                    )}
                    {stakeholder.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{stakeholder.phone}</span>
                      </div>
                    )}
                    {!stakeholder.email && !stakeholder.phone && '-'}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {stakeholder.responsibilities || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingStakeholder(stakeholder)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(stakeholder.id)}
                    >
                      <Trash size={16} className="text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {stakeholders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No stakeholders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {stakeholders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No stakeholders defined</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start by adding key stakeholders to document roles and responsibilities.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Stakeholder
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
