'use client'

import { useState } from 'react'
import { ProjectWithStatus, ProjectStatus } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link' // Added Link import
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EditIcon } from 'lucide-react'
import { ProjectEditDialog } from './project-edit-dialog'

interface ProjectsTableProps {
  projects: ProjectWithStatus[]
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [editingProject, setEditingProject] = useState<ProjectWithStatus | null>(null)

  const getStatusBadgeVariant = (status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Completed':
        return 'default' // Greenish in default theme
      case 'In Progress':
        return 'secondary' // Bluish in default theme
      case 'On Hold':
        return 'destructive' // Yellowish/Orangish in default theme
      default:
        return 'outline'
    }
  }

  const handleEditClick = (project: ProjectWithStatus) => {
    setEditingProject(project)
  }

  const handleCloseDialog = () => {
    setEditingProject(null)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                {/* Adding explicit link styling */}
                <Link 
                  href={`/dashboard/projects/${project.id}`} 
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {project.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEditClick(project)}>
                  <EditIcon className="h-4 w-4" />
                  <span className="sr-only">Edit Project Status</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          isOpen={!!editingProject}
          onClose={handleCloseDialog}
        />
      )}
    </>
  )
}
