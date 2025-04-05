'use client'

import { ObjectivesList } from './objectives-list'

interface ObjectivesDashboardProps {
  projectId: string
}

export function ObjectivesDashboard({ projectId }: ObjectivesDashboardProps) {
  return (
    <div className="space-y-8">
      <ObjectivesList projectId={projectId} />
    </div>
  )
}
