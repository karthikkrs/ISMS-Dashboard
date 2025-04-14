'use client';

import React, { useState, useEffect } from 'react'; // Removed useMemo
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, markProjectPhaseComplete } from '@/services/project-service';
import { saveProjectAnswer, getProjectAnswersGroupedByDomain } from '@/services/questionnaire-service'; // Removed getQuestionnaireQuestions, getProjectAnswers
// Import TablesInsert helper type
import { TablesInsert } from '@/types/database.types'; // Removed Tables import which was unused
import { ProjectWithStatus } from '@/types'; // Added missing import
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardFooter
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Removed unused Project type declaration
// Use the imported TablesInsert helper type
type ProjectQuestionnaireAnswerInsert = TablesInsert<'project_questionnaire_answers'>;

interface QuestionnaireDashboardProps {
  projectId: string;
}

// Define the allowed answer statuses
const ANSWER_STATUS_OPTIONS = ['Compliant', 'Non-Compliant', 'Partially Compliant', 'Not Applicable', 'Not Answered'] as const;
type AnswerStatus = typeof ANSWER_STATUS_OPTIONS[number];

export function QuestionnaireDashboard({ projectId }: QuestionnaireDashboardProps) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, { status: AnswerStatus | null; notes: string | null }>>({});

  // Fetch project data for completion status
  const { data: project, isLoading: isLoadingProject } = useQuery<ProjectWithStatus | null>({ // Use ProjectWithStatus
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // Fetch questions and existing answers grouped by domain
  const { data: groupedData, isLoading: isLoadingQuestions, error: questionsError } = useQuery({
      queryKey: ['questionnaireAnswersGrouped', projectId],
      queryFn: () => getProjectAnswersGroupedByDomain(projectId),
      enabled: !!projectId,
  });

  // Initialize local state when data loads
  useEffect(() => {
    if (groupedData) {
      const initialAnswers: Record<string, { status: AnswerStatus | null; notes: string | null }> = {};
      Object.values(groupedData).flat().forEach(item => {
        if (item.answer) {
          initialAnswers[item.id] = {
            status: item.answer.answer_status as AnswerStatus | null,
            notes: item.answer.evidence_notes,
          };
        } else {
           initialAnswers[item.id] = { status: 'Not Answered', notes: '' }; // Default state
        }
      });
      setLocalAnswers(initialAnswers);
    }
  }, [groupedData]);


  // Mutation for saving a single answer
  const { mutate: saveAnswer } = useMutation({ // Removed isSavingAnswer
    mutationFn: (answerData: ProjectQuestionnaireAnswerInsert) => saveProjectAnswer(answerData),
    onSuccess: (savedAnswer) => {
      // Update the specific answer in the query cache for grouped data
      queryClient.setQueryData(['questionnaireAnswersGrouped', projectId], (oldData: typeof groupedData | undefined) => {
          if (!oldData) return oldData;
          const newData = { ...oldData };
          let updated = false;
          for (const domain in newData) {
              const index = newData[domain].findIndex(q => q.id === savedAnswer.question_id);
              if (index !== -1) {
                  newData[domain][index] = { ...newData[domain][index], answer: savedAnswer };
                  updated = true;
                  break;
              }
          }
          return updated ? newData : oldData;
      });
      setMutationError(null); // Clear previous errors on success
    },
    onError: (error) => {
      console.error("Failed to save answer:", error);
      setMutationError(error.message || 'Failed to save answer.');
    },
  });

  // Mutation for marking the phase complete
  const { mutate: markComplete, isPending: isMarkingComplete } = useMutation({
    mutationFn: () => markProjectPhaseComplete(projectId, 'questionnaire_completed_at'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
      setMutationError(null);
    },
    onError: (error) => {
      console.error("Failed to mark questionnaire complete:", error);
      setMutationError(error.message || 'Failed to mark phase as complete.');
    },
  });

  const handleAnswerChange = (questionId: string, type: 'status' | 'notes', value: string | null) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: value,
      },
    }));

    // Trigger save mutation immediately on change (debouncing could be added for notes)
    const currentAnswer = localAnswers[questionId];
    const answerData: ProjectQuestionnaireAnswerInsert = {
        project_id: projectId,
        question_id: questionId,
        answer_status: type === 'status' ? value : currentAnswer?.status,
        evidence_notes: type === 'notes' ? value : currentAnswer?.notes,
    };
    saveAnswer(answerData);
  };


  const handleMarkComplete = () => {
    if (!project || project.questionnaire_completed_at || isMarkingComplete) {
      return;
    }
    // Optional: Check if all questions are answered before marking complete
    // const allAnswered = Object.values(localAnswers).every(a => a.status && a.status !== 'Not Answered');
    // if (!allAnswered) {
    //   setMutationError("Please answer all questions before marking as complete.");
    //   return;
    // }
    setMutationError(null);
    markComplete();
  };

  const isQuestionnaireComplete = !!project?.questionnaire_completed_at;

  if (isLoadingProject || isLoadingQuestions) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin" /> Loading Questionnaire Data...</div>;
  }

  if (questionsError) {
    return <div className="text-red-500 p-4"><AlertCircle className="mr-2 h-4 w-4 inline" /> Error loading questions: {questionsError.message}</div>;
  }

  return (
    <div className="space-y-8">
      {groupedData && Object.entries(groupedData).map(([domain, questions]) => (
        <Card key={domain}>
          <CardHeader>
            <CardTitle>{domain}</CardTitle>
            <CardDescription>Answer the questions related to {domain.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((item) => (
              <div key={item.id} className="space-y-3 p-4 border rounded-md">
                <Label htmlFor={`status-${item.id}`} className="font-semibold flex items-center">
                  {item.question_text}
                  {item.guidance && (
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>{item.guidance}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                  )}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Select
                       value={localAnswers[item.id]?.status ?? 'Not Answered'}
                       onValueChange={(value) => handleAnswerChange(item.id, 'status', value)}
                       disabled={isQuestionnaireComplete}
                     >
                       <SelectTrigger id={`status-${item.id}`}>
                         <SelectValue placeholder="Select status" />
                       </SelectTrigger>
                       <SelectContent>
                         {ANSWER_STATUS_OPTIONS.map(status => (
                           <SelectItem key={status} value={status}>{status}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Textarea
                       id={`notes-${item.id}`}
                       placeholder="Add notes or reasons..."
                       value={localAnswers[item.id]?.notes ?? ''}
                       onChange={(e) => handleAnswerChange(item.id, 'notes', e.target.value)}
                       disabled={isQuestionnaireComplete}
                       className="h-[38px]" // Match select height
                     />
                   </div>
                </div>
                 {/* Indicate saving status? Maybe a subtle spinner near the row */}
                 {/* {isSavingAnswer && localAnswers[item.id] === currentlySavingAnswerId && <Loader2 className="h-4 w-4 animate-spin" />} */}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Mutation Error Display */}
      {mutationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{mutationError}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons Section */}
      <div className="mt-6 pt-6 border-t flex justify-end gap-2">
        <Button
          onClick={handleMarkComplete}
          disabled={isQuestionnaireComplete || isMarkingComplete}
          variant={isQuestionnaireComplete ? "secondary" : "default"}
        >
          {isMarkingComplete ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isQuestionnaireComplete ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : null}
          {isQuestionnaireComplete ? 'Questionnaire Phase Completed' : 'Mark Questionnaire as Complete'}
        </Button>

        <Button asChild variant="outline" disabled={!isQuestionnaireComplete}>
          <Link href={`/dashboard/projects/${projectId}/evidence-gaps`}>
            Proceed to Evidence & Gaps
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
