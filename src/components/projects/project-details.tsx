'use client'

import { Project } from '@/types'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectDetailsProps {
  project: Project
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  // Pre-calculate status on the server with a fixed date to avoid hydration errors
  const startDate = project.start_date ? new Date(project.start_date) : null
  const endDate = project.end_date ? new Date(project.end_date) : null
  
  // Use a fixed date string for server rendering to avoid hydration mismatch
  const serverDate = new Date(project.updated_at)
  
  let status = 'Not Started'
  let statusColor = 'bg-gray-100 text-gray-800'
  
  if (!startDate && !endDate) {
    status = 'Not Started'
    statusColor = 'bg-gray-100 text-gray-800'
  } else if (startDate && !endDate) {
    if (startDate > serverDate) {
      status = 'Not Started'
      statusColor = 'bg-gray-100 text-gray-800'
    } else {
      status = 'In Progress'
      statusColor = 'bg-blue-100 text-blue-800'
    }
  } else if (startDate && endDate) {
    if (startDate > serverDate) {
      status = 'Not Started'
      statusColor = 'bg-gray-100 text-gray-800'
    } else if (endDate < serverDate) {
      status = 'Completed'
      statusColor = 'bg-green-100 text-green-800'
    } else {
      status = 'In Progress'
      statusColor = 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Key information about this ISMS project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-gray-500">{project.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Timeline</h3>
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
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Project Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>Created: {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>Last Updated: {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>ISMS implementation status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Boundaries</span>
                  <span className="text-xs text-gray-500">Not Started</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Objectives</span>
                  <span className="text-xs text-gray-500">Not Started</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Stakeholders</span>
                  <span className="text-xs text-gray-500">Not Started</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Controls</span>
                  <span className="text-xs text-gray-500">Not Started</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Statement of Applicability</span>
                  <span className="text-xs text-gray-500">Not Started</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">0%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-0"></div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export function ProjectHeader({ project }: ProjectDetailsProps) {
  // Pre-calculate status on the server with a fixed date to avoid hydration errors
  const startDate = project.start_date ? new Date(project.start_date) : null
  const endDate = project.end_date ? new Date(project.end_date) : null
  
  // Use a fixed date string for server rendering to avoid hydration mismatch
  const serverDate = new Date(project.updated_at)
  
  let status = 'Not Started'
  let statusColor = 'bg-gray-100 text-gray-800'
  
  if (!startDate && !endDate) {
    status = 'Not Started'
    statusColor = 'bg-gray-100 text-gray-800'
  } else if (startDate && !endDate) {
    if (startDate > serverDate) {
      status = 'Not Started'
      statusColor = 'bg-gray-100 text-gray-800'
    } else {
      status = 'In Progress'
      statusColor = 'bg-blue-100 text-blue-800'
    }
  } else if (startDate && endDate) {
    if (startDate > serverDate) {
      status = 'Not Started'
      statusColor = 'bg-gray-100 text-gray-800'
    } else if (endDate < serverDate) {
      status = 'Completed'
      statusColor = 'bg-green-100 text-green-800'
    } else {
      status = 'In Progress'
      statusColor = 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <div className="flex items-center mt-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
            {status}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            Created {format(new Date(project.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </div>
  )
}
