'use client'

import { StakeholdersTable } from './stakeholders-table'

interface StakeholdersDashboardProps {
  projectId: string
}

export function StakeholdersDashboard({ projectId }: StakeholdersDashboardProps) {
  return (
    <div className="space-y-8">
      <StakeholdersTable projectId={projectId} />
    </div>
  )
}
