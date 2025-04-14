'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStats } from '@/types'
// Removed React import
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ClipboardListIcon, ClockIcon, CheckCircleIcon } from 'lucide-react' // Removed PauseCircleIcon

interface ProjectStatsProps {
  stats: ProjectStats
}

export function ProjectStatsCards({ stats }: ProjectStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <ClipboardListIcon className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">All ISMS projects</p>
        </CardContent>
      </Card>
      
      {/* Removed Not Started Card */}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <ClockIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.in_progress}</div>
          <p className="text-xs text-gray-500">Active projects</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-gray-500">Finished projects</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProjectStatsChart({ stats }: ProjectStatsProps) {
  // Reverted: Removed client-side rendering logic

  const data = [
    { name: 'In Progress', value: stats.in_progress, color: '#3b82f6' },
    { name: 'Completed', value: stats.completed, color: '#22c55e' },
    { name: 'On Hold', value: stats.on_hold, color: '#eab308' },
  ]

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Project Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {/* Reverted: Original chart rendering */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name="Projects">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
