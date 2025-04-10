import { createClient } from '@/utils/supabase/client'; // Use client for mutations/queries from components
import { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

type QuestionnaireQuestion = Tables<'questionnaire_questions'>;
type ProjectQuestionnaireAnswer = Tables<'project_questionnaire_answers'>;
type ProjectQuestionnaireAnswerInsert = TablesInsert<'project_questionnaire_answers'>;
type ProjectQuestionnaireAnswerUpdate = TablesUpdate<'project_questionnaire_answers'>;

const supabase = createClient();

/**
 * Fetches all predefined questionnaire questions.
 * @returns Promise<QuestionnaireQuestion[]>
 */
export async function getQuestionnaireQuestions(): Promise<QuestionnaireQuestion[]> {
  const { data, error } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .order('iso_domain', { ascending: true }) // Optional: order by domain
    .order('created_at', { ascending: true }); // Optional: secondary sort

  if (error) {
    console.error('Error fetching questionnaire questions:', error);
    throw new Error('Failed to fetch questionnaire questions.');
  }
  return data || [];
}

/**
 * Fetches all answers for a specific project.
 * @param projectId The ID of the project.
 * @returns Promise<ProjectQuestionnaireAnswer[]>
 */
export async function getProjectAnswers(projectId: string): Promise<ProjectQuestionnaireAnswer[]> {
  if (!projectId) {
    throw new Error('Project ID is required to fetch answers.');
  }

  const { data, error } = await supabase
    .from('project_questionnaire_answers')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error(`Error fetching answers for project ${projectId}:`, error);
    throw new Error('Failed to fetch project answers.');
  }
  return data || [];
}

/**
 * Saves (inserts or updates) a single answer for a project questionnaire question.
 * @param answerData The answer data including project_id, question_id, answer_status, etc.
 * @returns Promise<ProjectQuestionnaireAnswer>
 */
export async function saveProjectAnswer(
  answerData: ProjectQuestionnaireAnswerInsert | ProjectQuestionnaireAnswerUpdate
): Promise<ProjectQuestionnaireAnswer> {
  if (!answerData.project_id || !answerData.question_id) {
    throw new Error('Project ID and Question ID are required to save an answer.');
  }

  // Ensure the object passed to upsert has the required fields, even if they are optional in the Update type.
  // The onConflict clause handles the logic, but the object needs to satisfy the base Insert type structure for upsert.
  const dataToUpsert: ProjectQuestionnaireAnswerInsert = {
    project_id: answerData.project_id, // Explicitly include required fields
    question_id: answerData.question_id, // Explicitly include required fields
    ...answerData, // Spread the rest of the data
    answered_at: answerData.answer_status ? new Date().toISOString() : answerData.answered_at, // Set timestamp only if status is provided
    updated_at: new Date().toISOString(), // Ensure updated_at is always set
  };

  // Remove potentially undefined id if it exists from Update type, as upsert handles PK
  if ('id' in dataToUpsert) {
      delete (dataToUpsert as any).id;
  }


  const { data, error } = await supabase
    .from('project_questionnaire_answers')
    .upsert(dataToUpsert as any, { onConflict: 'project_id, question_id' }) // Use 'as any' to bypass strict type check here, as we've ensured required fields exist
    .select()
    .single(); // Expecting a single row back

  if (error) {
    console.error('Error saving project answer:', error);
    throw new Error('Failed to save project answer.');
  }

  if (!data) {
     throw new Error('Failed to save project answer, no data returned.');
  }

  return data;
}

// Potential future function: Get answers grouped by domain for easier display
export async function getProjectAnswersGroupedByDomain(projectId: string) {
  if (!projectId) {
    throw new Error('Project ID is required.');
  }

  // Fetch questions and answers separately and join/group in code
  // This is often more flexible than complex SQL joins, especially with RLS
  const [questions, answers] = await Promise.all([
    getQuestionnaireQuestions(),
    getProjectAnswers(projectId),
  ]);

  const answersMap = new Map(answers.map(a => [a.question_id, a]));

  const grouped: Record<string, (QuestionnaireQuestion & { answer?: ProjectQuestionnaireAnswer })[]> = {};

  questions.forEach(q => {
    const domain = q.iso_domain || 'Uncategorized'; // Handle potential null domain
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push({
      ...q,
      answer: answersMap.get(q.id), // Attach the answer if it exists
    });
  });

  return grouped;
}
