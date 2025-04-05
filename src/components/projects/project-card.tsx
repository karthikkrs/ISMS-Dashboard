'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectWithStatus } from '@/types'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon, BarChart3Icon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProjectCardProps {
  project: ProjectWithStatus
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Get status color based on project status
  const getStatusColor = (status: ProjectWithStatus['status']) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{project.name}</CardTitle>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {project.description && (
            <p className="text-sm text-gray-500 line-clamp-3">{project.description}</p>
          )}
          
          <div className="space-y-2">
            {project.start_date && (
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Start: {format(new Date(project.start_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {project.end_date && (
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>End: {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="mr-2 h-4 w-4" />
              <span>Created: {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Completion</span>
              <span className="text-sm font-medium">{project.completion_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${project.completion_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}`}>
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
