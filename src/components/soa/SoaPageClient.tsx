"use client";

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SoaDashboard } from '@/components/soa/soa-dashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Project } from '@/types'; // Assuming Project type is defined here

interface SoaPageClientProps {
  project: Project; // Receive the fetched project data
  projectId: string;
}

export function SoaPageClient({ project, projectId }: SoaPageClientProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            {/* Use projectId for the link */}
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Project
            </Link>
          </Button>
        </div>
        
        {/* Use project.name from props */}
        <h1 className="text-3xl font-bold">{project.name}</h1> 
        <p className="text-gray-500">Manage controls and their applicability to boundaries</p>
      </div>
      
      <DndProvider backend={HTML5Backend}>
        {/* Pass projectId to SoaDashboard */}
        <SoaDashboard projectId={projectId} /> 
      </DndProvider>
    </div>
  );
}
