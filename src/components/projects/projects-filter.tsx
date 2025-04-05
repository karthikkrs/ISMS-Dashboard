'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProjectStatus } from '@/types'
import { SearchIcon, FilterIcon, SortAscIcon, SortDescIcon } from 'lucide-react'
import { useState } from 'react'

interface ProjectsFilterProps {
  onFilterChange: (filters: {
    search: string
    status: ProjectStatus | 'All'
    sortBy: 'name' | 'created_at' | 'start_date' | 'end_date'
    sortOrder: 'asc' | 'desc'
  }) => void
}

export function ProjectsFilter({ onFilterChange }: ProjectsFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'start_date' | 'end_date'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    onFilterChange({ search: value, status, sortBy, sortOrder })
  }

  const handleStatusChange = (newStatus: ProjectStatus | 'All') => {
    setStatus(newStatus)
    onFilterChange({ search, status: newStatus, sortBy, sortOrder })
  }

  const handleSortByChange = (newSortBy: 'name' | 'created_at' | 'start_date' | 'end_date') => {
    setSortBy(newSortBy)
    onFilterChange({ search, status, sortBy: newSortBy, sortOrder })
  }

  const handleSortOrderToggle = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newSortOrder)
    onFilterChange({ search, status, sortBy, sortOrder: newSortOrder })
  }

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={sortOrder === 'asc' ? 'default' : 'outline'}
            size="sm"
            onClick={handleSortOrderToggle}
            className="flex items-center gap-1"
          >
            {sortOrder === 'asc' ? (
              <>
                <SortAscIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Ascending</span>
              </>
            ) : (
              <>
                <SortDescIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Descending</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={status === 'All' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('All')}
        >
          All
        </Button>
        <Button
          variant={status === 'Not Started' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('Not Started')}
        >
          Not Started
        </Button>
        <Button
          variant={status === 'In Progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('In Progress')}
        >
          In Progress
        </Button>
        <Button
          variant={status === 'Completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('Completed')}
        >
          Completed
        </Button>
        <Button
          variant={status === 'On Hold' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusChange('On Hold')}
        >
          On Hold
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center text-sm text-gray-500 mr-2">
          <FilterIcon className="h-4 w-4 mr-1" /> Sort by:
        </span>
        <Button
          variant={sortBy === 'name' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortByChange('name')}
        >
          Name
        </Button>
        <Button
          variant={sortBy === 'created_at' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortByChange('created_at')}
        >
          Created Date
        </Button>
        <Button
          variant={sortBy === 'start_date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortByChange('start_date')}
        >
          Start Date
        </Button>
        <Button
          variant={sortBy === 'end_date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortByChange('end_date')}
        >
          End Date
        </Button>
      </div>
    </div>
  )
}
