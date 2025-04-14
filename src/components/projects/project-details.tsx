'use client'

import { ProjectWithStatus } from '@/types'
import { format } from 'date-fns'
import { Calendar, Clock, CheckCircle } from 'lucide-react' // Updated icons
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // Removed CardDescription
import { Badge } from '@/components/ui/badge' // Import Badge
import { Progress } from '@/components/ui/progress' // Import Progress

interface ProjectDetailsProps {
  project: ProjectWithStatus
}

// Helper function to format date consistently
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  // Using 'MMM d, yyyy' format as seen in the template example "Apr 7, 2025"
  return format(new Date(dateString), 'MMM d, yyyy');
};

export function ProjectDetails({ project }: ProjectDetailsProps) {

  // Calculate progress (excluding Objectives)
  const phases = [
    // project.objectives_completed_at, // Removed Objectives
    project.boundaries_completed_at,
    project.stakeholders_completed_at,
    project.soa_completed_at,
    project.evidence_gaps_completed_at,
    // Add other phases if they exist in ProjectWithStatus type
  ];
  const completedPhases = phases.filter(Boolean).length;
  const totalPhases = phases.length;
  const progressValue = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

  // Helper to render phase status badge
  const renderPhaseStatus = (label: string, completedAt: string | null | undefined) => (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{label}:</span>
      {completedAt ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed {formatDate(completedAt)}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-amber-600 bg-amber-50">
          Pending
        </Badge>
      )}
    </div>
  );

  return (
    // Structure matches template: grid with 2/3 and 1/3 columns
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Project Overview Card - Matches template */}
      <Card className="md:col-span-2 shadow-sm">
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Key information about this ISMS project</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            {/* Apply muted background for description - Matches template */}
            <div className="p-4 bg-muted/50 rounded-md min-h-[6rem]"> {/* Adjusted min-height */}
              <p className="text-sm text-muted-foreground">
                {project.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Grid for Timeline and Details - Matches template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Start:</span>
                  <span className="text-sm">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">End:</span>
                  <span className="text-sm">{formatDate(project.end_date)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Project Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{formatDate(project.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm">{formatDate(project.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Progress Card - Matches template */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <p className="text-sm text-muted-foreground">Phase completion status</p>
        </CardHeader>
        <CardContent>
          {/* Progress Bar - Matches template */}
          <div className="mb-4">
            <Progress value={progressValue} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {completedPhases} of {totalPhases} phases completed {/* Updated total */}
            </p>
          </div>

          {/* Phase Status Badges - Matches template */}
          <div className="space-y-4 mt-6">
            {/* {renderPhaseStatus("Objectives", project.objectives_completed_at)} Removed Objectives */}
            {renderPhaseStatus("Boundaries", project.boundaries_completed_at)}
            {renderPhaseStatus("Stakeholders", project.stakeholders_completed_at)}
            {renderPhaseStatus("SOA", project.soa_completed_at)}
            {renderPhaseStatus("Evidence/Gaps", project.evidence_gaps_completed_at)}
            {/* Add other phases here if needed, using renderPhaseStatus */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Remove the ProjectHeader component as it's integrated into ProjectPage now
/*
export function ProjectHeader({ project }: ProjectDetailsProps) {
  // ... (previous code removed) ...
}
*/
