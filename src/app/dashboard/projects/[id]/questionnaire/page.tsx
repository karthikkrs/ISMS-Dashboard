import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { QuestionnaireDashboard } from '@/components/questionnaire/questionnaire-dashboard'; // Adjust path if needed
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Database } from '@/types/database.types'; // Import Database type

interface QuestionnairePageProps {
  params: {
    id: string;
  };
}

// Apply the fix suggested by the error: await params
export default async function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) { 
  const resolvedParams = await params; // Await the promise
  const { id: projectId } = resolvedParams; // Destructure from resolved params
  const cookieStore = await cookies(); // Await the cookies() function call

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors in middleware
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch the project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, user_id') // Select only necessary fields
    .eq('id', projectId)
    .single();

  // Basic authorization: Ensure the user owns the project or handle permissions appropriately
  if (projectError || !project || project.user_id !== user.id) {
     console.error('Project fetch error or unauthorized access:', projectError);
     notFound(); // Or redirect to an unauthorized page
  }


  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Project Overview
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{project.name} - Questionnaire</h1>
        <p className="text-gray-500">Complete the initial compliance questionnaire based on ISO 27001 domains.</p>
      </div>

      {/* Render the main dashboard component, passing the projectId */}
      <QuestionnaireDashboard projectId={projectId} />
    </div>
  );
}
