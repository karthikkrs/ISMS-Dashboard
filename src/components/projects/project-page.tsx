'use client'

import React from 'react' // Remove useState import
import { ProjectWithStatus } from '@/types'
import Link from 'next/link'
// Import usePathname for navigation
import { usePathname } from 'next/navigation' // Removed useRouter
// Add ClipboardCheckIcon for Questionnaire
import { ArrowLeft, Edit2, CheckCircle, LayoutDashboard, Users, ShieldCheck, ClipboardList, FolderOpenDot, BarChart3, ClipboardCheck } from 'lucide-react' // Fix ClipboardCheckIcon to ClipboardCheck
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs' // Removed TabsContent import
import { format } from 'date-fns' // Import format from date-fns

interface ProjectPageProps {
  project: ProjectWithStatus
  id: string
  children: React.ReactNode
  // Remove initialTab prop, active tab is determined by route
}

// Helper function to format date using date-fns for consistency
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    // Use a consistent format like 'MMM d, yyyy'
    return format(new Date(dateString), 'MMM d, yyyy'); 
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};

// Helper function to determine badge variant based on status
const getStatusBadgeVariant = (status: string | null | undefined) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success'; // Assuming you have a 'success' variant or will add one
    case 'in progress':
      return 'secondary'; // Or adjust as needed
    case 'not started':
      return 'outline';
    default:
      return 'secondary';
  }
};

// Removed getPhaseCompletionBadge helper function

export function ProjectPage({ project, id, children }: ProjectPageProps) {
  // Removed unused router variable
  const pathname = usePathname();

  // Determine active tab based on pathname
  const getCurrentTab = () => {
    if (pathname === `/dashboard/projects/${id}`) return "overview";
    if (pathname.startsWith(`/dashboard/projects/${id}/boundaries`)) return "boundaries";
    if (pathname.startsWith(`/dashboard/projects/${id}/stakeholders`)) return "stakeholders";
    // Add questionnaire path check
    if (pathname.startsWith(`/dashboard/projects/${id}/questionnaire`)) return "questionnaire"; 
    if (pathname.startsWith(`/dashboard/projects/${id}/soa`)) return "soa";
    if (pathname.startsWith(`/dashboard/projects/${id}/evidence-gaps`)) return "evidence";
    if (pathname.startsWith(`/dashboard/projects/${id}/reports`)) return "reports"; // Assuming reports page exists
    return "overview"; // Default to overview
  };
  const activeTabValue = getCurrentTab();


  // Determine project status text
  const projectStatusText = project.status || 'Not Started';

  return (
    // Adjusted padding and max-width to match template
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header - Matches template */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" className="flex items-center gap-2" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="outline" className="flex items-center gap-2" asChild>
           <Link href={`/dashboard/projects/${id}/edit`}>
             <Edit2 className="h-4 w-4" />
             Edit Project
           </Link>
        </Button>
      </div>

      {/* Project Title - Matches template */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
        <div className="flex items-center gap-3">
          <Badge
             variant={getStatusBadgeVariant(projectStatusText)}
             // Add specific styling based on status if needed
             className={projectStatusText === 'In Progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
          >
            {projectStatusText}
          </Badge>
          <span className="text-muted-foreground text-sm">
            Created {formatDate(project.created_at)}
          </span>
        </div>
      </div>

      {/* Tabs - Use derived activeTabValue, remove onValueChange */}
      <Tabs value={activeTabValue} className="mb-8">
        {/* Adjusted grid-cols and max-width - Increase cols for new tab */}
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7"> 
          {/* Wrap Tab Trigger content in Link for navigation */}
          <TabsTrigger value="overview" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}`}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
                {/* No completion badge for overview */}
             </Link>
          </TabsTrigger>
          <TabsTrigger value="boundaries" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}/boundaries`} className="flex items-center justify-center gap-1"> {/* Adjusted gap */}
                <ShieldCheck className="h-4 w-4" />
                <span>Boundaries</span>
                {project.boundaries_completed_at && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />} {/* Added CheckCircle */}
             </Link>
          </TabsTrigger>
          <TabsTrigger value="stakeholders" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}/stakeholders`} className="flex items-center justify-center gap-1"> {/* Adjusted gap */}
                <Users className="h-4 w-4" />
                <span>Stakeholders</span>
                {project.stakeholders_completed_at && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />} {/* Added CheckCircle */}
             </Link>
          </TabsTrigger>
          {/* Add Questionnaire Tab Trigger */}
          <TabsTrigger value="questionnaire" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}/questionnaire`} className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-4 w-4" />
                <span>Questionnaire</span>
                {project.questionnaire_completed_at && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
             </Link>
          </TabsTrigger>
          <TabsTrigger value="soa" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}/soa`} className="flex items-center justify-center gap-1"> {/* Adjusted gap */}
                <ClipboardList className="h-4 w-4" />
                <span>SOA</span>
                {project.soa_completed_at && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />} {/* Added CheckCircle */}
             </Link>
          </TabsTrigger>
          <TabsTrigger value="evidence" asChild className="flex items-center justify-center gap-2">
             <Link href={`/dashboard/projects/${id}/evidence-gaps`} className="flex items-center justify-center gap-1"> {/* Adjusted gap */}
                <FolderOpenDot className="h-4 w-4" />
                <span>Evidence</span>
                {project.evidence_gaps_completed_at && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />} {/* Added CheckCircle */}
             </Link>
          </TabsTrigger>
           <TabsTrigger value="reports" asChild className="flex items-center justify-center gap-2">
             {/* Assuming reports page exists at /dashboard/projects/${id}/reports */}
             <Link href={`/dashboard/projects/${id}/reports`}>
                <BarChart3 className="h-4 w-4" /> {/* More specific icon */}
                <span>Reports</span>
                {/* Add completion logic if applicable */}
             </Link>
           </TabsTrigger>
        </TabsList>

        {/* Render children directly - assumes parent page handles routing */}
        <div className="mt-6">
          {children}
        </div>
        {/* Removed empty TabsContent elements */}
      </Tabs>

      {/* Removed Save button from template as it might not be needed here */}
      {/*
      <div className="flex justify-center mt-8">
        <Button className="px-8 flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
      */}
    </div>
  )
}
