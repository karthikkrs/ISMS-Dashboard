'use client'

import { useQuery } from '@tanstack/react-query'
import { getProjects, getProjectStats } from '@/services/project-service'
import { ProjectStatus } from '@/types' // Removed ProjectWithStatus
// Removed ProjectCard import
import { ProjectStatsCards } from './project-stats'
import { ProjectsFilter } from './projects-filter'
// import { ProjectsTable } from './projects-table' // Remove table import
import { ProjectCard } from './project-card' // Import ProjectCard
import { Button } from '@/components/ui/button'
import { PlusIcon, Loader2Icon } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

export function ProjectsDashboard() {
  // Fetch projects data
  const { 
    data: projects = [], 
    isLoading: isLoadingProjects,
    error: projectsError
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })

  // Fetch project stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['projectStats'],
    queryFn: getProjectStats
  })

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'All' as ProjectStatus | 'All',
    sortBy: 'created_at' as 'name' | 'created_at' | 'start_date' | 'end_date',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  // Apply filters and sorting to projects
  const filteredProjects = useMemo(() => {
    if (!projects.length) return []

    return projects
      .filter(project => {
        // Filter by search term
        const matchesSearch = filters.search === '' || 
          project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(filters.search.toLowerCase()))
        
        // Filter by status
        const matchesStatus = filters.status === 'All' || project.status === filters.status
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        // Handle null values for dates
        if (filters.sortBy === 'start_date' || filters.sortBy === 'end_date') {
          const aValue = a[filters.sortBy] ? new Date(a[filters.sortBy]!).getTime() : 0
          const bValue = b[filters.sortBy] ? new Date(b[filters.sortBy]!).getTime() : 0
          
          return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        // Sort by name or created_at
        if (filters.sortBy === 'name') {
          return filters.sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        } else {
          // created_at
          const aDate = new Date(a.created_at).getTime()
          const bDate = new Date(b.created_at).getTime()
          return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
        }
      })
  }, [projects, filters])

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  // Loading state
  if (isLoadingProjects || isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Loading projects...</p>
      </div>
    )
  }

  // Error state
  if (projectsError || statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">Error loading projects</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with action button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/projects/new" className="flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats section */}
      {stats && (
        <>
          <ProjectStatsCards stats={stats} />
          {/* ProjectStatsChart removed as per request */}
        </>
      )}

      {/* Filters */}
      <ProjectsFilter onFilterChange={handleFilterChange} />

      {/* Projects grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {projects.length === 0 
              ? "You haven't created any projects yet." 
              : "No projects match your current filters."}
          </p>
          {projects.length === 0 && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create your first project
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Use a responsive grid for ProjectCards
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
