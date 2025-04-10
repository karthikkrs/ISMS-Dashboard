import { createServerClient } from '@supabase/ssr' // Keep for auth check
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ProjectPage } from '@/components/projects/project-page';
import { ProjectHeader, ProjectDetails } from '@/components/projects/project-details'; // Import ProjectHeader AND ProjectDetails
import { getProjectById } from '@/services/project-service'; // Import service function
import { ProjectWithStatus } from '@/types'; // Import ProjectWithStatus

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // Get the id from params - Adding await based on user feedback, though usually not needed
  const resolvedParams = await params; 
  const { id } = resolvedParams; 
  
  // --- Auth Check (Keep using createServerClient for this) ---
  const cookieStore = await cookies(); // Add await here
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } } // Simplified cookie handling for server component
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }
  // --- End Auth Check ---

  // Log the received ID for debugging
  console.log(`[ProjectDetailPage] Received ID from params: ${id}`);

  // Fetch the processed project data using the service function, passing the server client
  const project: ProjectWithStatus | null = await getProjectById(id, supabase); // Pass server client

  // Log the result of the fetch
  console.log(`[ProjectDetailPage] Fetched project data for ID ${id}:`, project ? 'Found' : 'Not Found');

  // If no project, show 404
  if (!project) {
    notFound();
  }

  // Render ProjectHeader and ProjectPage (which likely includes ProjectDetails)
   return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* ProjectHeader is now rendered inside ProjectPage */}
        {/* Pass project data to ProjectPage */}
        <ProjectPage project={project} id={id}>
           {/* Render ProjectDetails as children for the overview page */}
           <ProjectDetails project={project} /> 
        </ProjectPage> 
      </div>
  );
}
