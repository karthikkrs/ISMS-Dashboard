'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ClipboardListIcon, 
  MapIcon, 
  UsersIcon, 
  CheckSquareIcon,
  BarChart2Icon,
  FileSearchIcon,
  ClipboardCheckIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { getBoundaries } from '@/services/boundary-service'
import { getStakeholders } from '@/services/stakeholder-service';
import { getProjectBoundaryControls } from '@/services/boundary-control-service';
import { getProjectById } from '@/services/project-service'; // Import service to get project details
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components

interface ProjectNavigationProps {
  projectId: string;
}

export function ProjectNavigation({ projectId }: ProjectNavigationProps) {
  const pathname = usePathname()
  
  // Fetch boundaries data to check if completed
  const { data: boundaries = [] } = useQuery({
    queryKey: ['boundaries', projectId],
    queryFn: () => getBoundaries(projectId),
    // Don't show loading or error states in the navigation
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })
  
  // Fetch stakeholders data to check if completed
  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders', projectId],
    queryFn: () => getStakeholders(projectId),
    // Don't show loading or error states in the navigation
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })
  
  // Fetch boundary controls data to check if SoA is completed
  const { data: boundaryControls = [] } = useQuery({
    queryKey: ['projectBoundaryControls', projectId],
    queryFn: () => getProjectBoundaryControls(projectId),
    // Don't show loading or error states in the navigation
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Fetch project data to check questionnaire completion status
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Determine if sections are completed
  const boundariesCompleted = boundaries.length > 0
  const stakeholdersCompleted = stakeholders.length > 0
  const questionnaireCompleted = !!project?.questionnaire_completed_at; // Check the timestamp
  const soaCompleted = boundaryControls.length > 0
  
  const navItems = [
    {
      name: 'Overview',
      href: `/dashboard/projects/${projectId}`,
      icon: ClipboardListIcon,
      completed: true // Assuming overview is always accessible
    },
    {
      name: 'Boundaries',
      href: `/dashboard/projects/${projectId}/boundaries`,
      icon: MapIcon,
      completed: boundariesCompleted
    },
    {
      name: 'Stakeholders',
      href: `/dashboard/projects/${projectId}/stakeholders`,
      icon: UsersIcon,
      completed: stakeholdersCompleted
    },
    {
      name: 'Questionnaire',
      href: `/dashboard/projects/${projectId}/questionnaire`,
      icon: ClipboardCheckIcon,
      completed: questionnaireCompleted
    },
    {
      name: 'Statement of Applicability',
      href: `/dashboard/projects/${projectId}/soa`,
      icon: CheckSquareIcon,
      completed: soaCompleted
    },
    { // Add new navigation item
      name: 'Evidence & Gaps',
      href: `/dashboard/projects/${projectId}/evidence-gaps`,
      icon: FileSearchIcon, 
      completed: false // Placeholder, logic to determine completion needed later
    },
    {
      name: 'Risk Register',
      href: `/dashboard/projects/${projectId}/risk-register`,
      icon: AlertTriangleIcon,
      completed: false, // Placeholder, logic to determine completion needed later
    },
    {
      name: 'Reports',
      href: `/dashboard/projects/${projectId}/reports`,
      icon: BarChart2Icon,
      completed: false,
    },
  ];

  // Determine the active tab value based on the current pathname
  const activeTabValue = navItems.find(item => pathname === item.href)?.href || navItems[0].href;

  return (
    <Tabs defaultValue={activeTabValue} className="mb-6">
      <TabsList className="inline-flex h-auto bg-transparent p-0">
        {navItems.map((item) => (
          <TabsTrigger 
            key={item.href} 
            value={item.href} 
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none h-auto px-3 py-1.5 mr-1 rounded-md text-sm font-medium"
            asChild // Important: Allows Link to control navigation
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              {item.completed && (
                <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
              )}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
