'use client'

import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectWithStatus, ProjectStatus } from '@/types'
import { format } from 'date-fns'
import { CalendarIcon, ClockIcon, CheckCircleIcon, CircleIcon, ArrowRightIcon } from 'lucide-react' // Added icons
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProjectCardProps {
  project: ProjectWithStatus
}

interface FormattedDates {
  start: string | null;
  end: string | null;
  created: string | null;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [formattedDates, setFormattedDates] = useState<FormattedDates | null>(null);

  useEffect(() => {
    // Format dates only on the client after mount
    setFormattedDates({
      start: project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : null,
      end: project.end_date ? format(new Date(project.end_date), 'MMM d, yyyy') : null,
      created: project.created_at ? format(new Date(project.created_at), 'MMM d, yyyy') : null,
    });
  }, [project.start_date, project.end_date, project.created_at]); // Re-run if project dates change

  // Map status to Badge variant
  const getStatusVariant = (status: ProjectStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed':
        return 'default' // Greenish (default)
      case 'In Progress':
        return 'secondary' // Bluish (secondary)
      case 'On Hold':
        return 'outline' // Yellowish (outline) - Adjust if needed
      default:
        return 'secondary'
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2"> {/* Added gap */}
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle> {/* Adjusted size */}
          <Badge variant={getStatusVariant(project.status)} className="whitespace-nowrap"> {/* Use Badge */}
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {project.description && (
            <p className="text-sm text-gray-500 line-clamp-3">{project.description}</p>
          )}
          
          <div className="space-y-2">
            {formattedDates?.start && (
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Start: {formattedDates.start}</span>
              </div>
            )}
            
            {formattedDates?.end && (
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>End: {formattedDates.end}</span>
              </div>
            )}
            
            {formattedDates?.created && (
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="mr-2 h-4 w-4" />
                <span>Created: {formattedDates.created}</span>
              </div>
            )}
            {/* Show placeholder if dates haven't been formatted yet */}
            {!formattedDates && (
              <div className="space-y-2">
                 {project.start_date && <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>}
                 {project.end_date && <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>}
                 <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Remove Completion Percentage Bar */}
          
          {/* Phase Navigation/Status */}
          <div className="mt-4 pt-4 border-t">
             <h4 className="text-sm font-medium mb-2">Project Phases</h4>
             <div className="space-y-2">
               {/* Boundaries phase depends on nothing before it (since Objectives removed) */}
               <PhaseLink 
                 project={project} 
                 phase="boundaries" 
                 label="Boundaries" 
                 completed={!!project.boundaries_completed_at} 
                 previousPhaseCompleted={true} // Always enabled as the first step
               />
               {/* Stakeholders phase depends on Boundaries */}
               <PhaseLink 
                 project={project} 
                 phase="stakeholders" 
                 label="Stakeholders" 
                 completed={!!project.stakeholders_completed_at} 
                 previousPhaseCompleted={!!project.boundaries_completed_at} 
               />
               {/* SOA phase depends on Stakeholders */}
               <PhaseLink 
                 project={project} 
                 phase="soa" 
                 label="SOA" 
                 completed={!!project.soa_completed_at} 
                 previousPhaseCompleted={!!project.stakeholders_completed_at} 
               />
               {/* Evidence/Gaps phase depends on SOA */}
               <PhaseLink 
                 project={project} 
                 phase="evidence-gaps" 
                 label="Evidence & Gaps" 
                 completed={!!project.evidence_gaps_completed_at} 
                 previousPhaseCompleted={!!project.soa_completed_at} 
               />
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

// Helper component for phase links/status
interface PhaseLinkProps {
  project: ProjectWithStatus;
  phase: 'boundaries' | 'stakeholders' | 'soa' | 'evidence-gaps'; // Removed 'objectives'
  label: string;
  completed: boolean;
  previousPhaseCompleted: boolean; // Add prop to check if previous phase is done
}

function PhaseLink({ project, phase, label, completed, previousPhaseCompleted }: PhaseLinkProps) {
  const Icon = completed ? CheckCircleIcon : CircleIcon;
  const isDisabled = !previousPhaseCompleted; // Link is disabled if previous phase is not complete
  const color = completed ? 'text-green-600' : (isDisabled ? 'text-gray-300' : 'text-gray-400');
  const hoverClass = isDisabled ? '' : 'hover:bg-gray-50';
  const cursorClass = isDisabled ? 'cursor-not-allowed' : '';

  const linkContent = (
    <div className={`flex items-center justify-between text-sm p-2 rounded transition-colors ${hoverClass} ${cursorClass}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className={isDisabled ? 'text-gray-400' : ''}>{label}</span>
      </div>
      {!isDisabled && <ArrowRightIcon className="h-4 w-4 text-gray-400" />}
    </div>
  );

  // Render Link only if not disabled, otherwise render a div
  return isDisabled ? (
    <div title={`${label} phase is locked until the previous phase is complete.`}>{linkContent}</div>
  ) : (
    <Link href={`/dashboard/projects/${project.id}/${phase}`}>{linkContent}</Link>
  );
}
