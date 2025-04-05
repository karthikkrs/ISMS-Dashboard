'use client'

import { Project } from '@/types'
import Link from 'next/link'
import { EditIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectNavigation } from '@/components/projects/project-navigation'
import { ProjectDetails, ProjectHeader } from '@/components/projects/project-details'

interface ProjectPageProps {
  project: Project
  id: string
}

export function ProjectPage({ project, id }: ProjectPageProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${id}/edit`}>
              <EditIcon className="h-4 w-4 mr-1" />
              Edit Project
            </Link>
          </Button>
        </div>
        
        <ProjectHeader project={project} />
      </div>
      
      <ProjectNavigation projectId={id} />
      
      <ProjectDetails project={project} />
    </div>
  )
}
