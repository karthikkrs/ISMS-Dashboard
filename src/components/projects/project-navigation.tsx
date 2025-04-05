'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  ClipboardListIcon, 
  MapIcon, 
  TargetIcon, 
  UsersIcon, 
  FileTextIcon, 
  ShieldIcon, 
  CheckSquareIcon,
  BarChart2Icon
} from 'lucide-react'
import { getBoundaries } from '@/services/boundary-service'
import { useQuery } from '@tanstack/react-query'

interface ProjectNavigationProps {
  projectId: string
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
  
  // Determine if boundaries section is completed
  const boundariesCompleted = boundaries.length > 0
  
  const navItems = [
    {
      name: 'Overview',
      href: `/dashboard/projects/${projectId}`,
      icon: ClipboardListIcon,
      completed: true
    },
    {
      name: 'Boundaries',
      href: `/dashboard/projects/${projectId}/boundaries`,
      icon: MapIcon,
      completed: boundariesCompleted
    },
    {
      name: 'Objectives',
      href: `/dashboard/projects/${projectId}/objectives`,
      icon: TargetIcon,
      completed: false
    },
    {
      name: 'Stakeholders',
      href: `/dashboard/projects/${projectId}/stakeholders`,
      icon: UsersIcon,
      completed: false
    },
    {
      name: 'Statement of Work',
      href: `/dashboard/projects/${projectId}/sow`,
      icon: FileTextIcon,
      completed: false
    },
    {
      name: 'Controls',
      href: `/dashboard/projects/${projectId}/controls`,
      icon: ShieldIcon,
      completed: false
    },
    {
      name: 'Statement of Applicability',
      href: `/dashboard/projects/${projectId}/soa`,
      icon: CheckSquareIcon,
      completed: false
    },
    {
      name: 'Reports',
      href: `/dashboard/projects/${projectId}/reports`,
      icon: BarChart2Icon,
      completed: false
    }
  ]

  return (
    <nav className="mb-8">
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
                {item.completed && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
