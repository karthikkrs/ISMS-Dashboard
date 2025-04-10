import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { EvidenceGapsDashboard } from '@/components/evidence-gaps/evidence-gaps-dashboard';
import { ProjectPage } from '@/components/projects/project-page';
import { getProjectById } from '@/services/project-service'; // Import service
import { ProjectWithStatus } from '@/types'; // Import correct type

interface EvidenceGapsPageProps {
  params: { id: string };
}

export default async function EvidenceGapsPage({ params }: EvidenceGapsPageProps) {
  // Await params first as per Next.js docs/errors
  const resolvedParams = await params; 
  const projectId = resolvedParams.id; // Now access id

  // --- Fetch project data (matching [id]/page.tsx structure) ---
  const cookieStore = await cookies() // Ensure await is present

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) { // Use imported CookieOptions type
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore errors for auth
          }
        },
        remove(name: string, options: CookieOptions) { // Use imported CookieOptions type
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore errors for auth
          }
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Check projectId after awaiting params
  if (!projectId) {
      console.error("Project ID is missing from params");
      notFound();
  }
 
   // Fetch processed project data using the service, passing the server client
   const project: ProjectWithStatus | null = await getProjectById(projectId, supabase); // Pass supabase client here
 
   if (!project) {
      console.error(`Project ${projectId} not found or failed to fetch.`);
      notFound();
  }
  // --- End fetch project data ---

  return (
    // Pass the processed project (ProjectWithStatus) to ProjectPage
    <ProjectPage project={project} id={projectId}>  
      <EvidenceGapsDashboard projectId={projectId} /> 
    </ProjectPage>
  );
}
