import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCourse,
  createCourseSection,
  createLesson,
  createLessonResource,
  createCourseOutcome,
  createCourseRequirement,
  createQuestion,
  createQuestionOption,
  createQuiz,
  deleteCourseOutcome,
  deleteCourseRequirement,
  deleteCourseSection,
  deleteDiscussionReply,
  deleteQuestion,
  deleteQuestionOption,
  deleteQuiz,
  deleteLesson,
  deleteLessonDiscussion,
  deleteLessonResource,
  CoursePayload,
  getCategories,
  getCourseById,
  getCourseOutcomes,
  getCourseRequirements,
  getCourseSections,
  getDiscussionReplies,
  getLessonDiscussions,
  getLessons,
  getLessonResources,
  getQuestionOptions,
  getQuestions,
  getQuizzes,
  updateCourse as updateCourseApi,
  uploadCourseMedia,
} from '@/lib/course-api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload, Image, Video, PlusCircle, Trash2, GripVertical,
  ChevronDown, ChevronUp, Save, Send, ArrowLeft, FileText, Globe,
} from 'lucide-react';

interface SectionForm {
  id: string;
  title: string;
  titleAm: string;
  lessons: LessonForm[];
  isExpanded: boolean;
}

interface LessonForm {
  id: string;
  title: string;
  titleAm: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';
  videoFile: File | null;
  videoUrl: string;
  documentFile: File | null;
  documentUrl: string;
  documentType: string;
  content: string;
  duration: number;
  isFree: boolean;
  isDownloadable: boolean;
  quiz: QuizForm | null;
}

interface QuizForm {
  id: string;
  title: string;
  titleAm: string;
  titleOm: string;
  description: string;
  quizType: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: string;
  isActive: boolean;
  questions: QuestionForm[];
}

interface QuestionForm {
  id: string;
  questionText: string;
  questionTextAm: string;
  questionTextOm: string;
  questionTextGz: string;
  type: string;
  explanation: string;
  explanationAm: string;
  explanationOm: string;
  explanationGz: string;
  points: number;
  imageUrl: string;
  options: OptionForm[];
}

interface OptionForm {
  id: string;
  optionText: string;
  optionTextAm: string;
  optionTextOm: string;
  optionTextGz: string;
  isCorrect: boolean;
}

interface ListItem {
  id: string;
  text: string;
}

const emptyCourse = {
  title: '', titleAm: '', titleOm: '', titleGz: '', slug: '',
  description: '', descriptionAm: '', descriptionOm: '', descriptionGz: '',
  categoryId: '', level: '' as string,
  price: '', discountPrice: '', currency: 'ETB',
  thumbnail: '',
  previewVideo: '',
  thumbnailFile: null as File | null,
  thumbnailPreview: '',
  previewVideoFile: null as File | null,
  previewVideoName: '',
};

const createOptionForm = (isCorrect: boolean = false): OptionForm => ({
  id: crypto.randomUUID(),
  optionText: '',
  optionTextAm: '',
  optionTextOm: '',
  optionTextGz: '',
  isCorrect,
});

const createQuestionForm = (): QuestionForm => ({
  id: crypto.randomUUID(),
  questionText: '',
  questionTextAm: '',
  questionTextOm: '',
  questionTextGz: '',
  type: 'MULTIPLE_CHOICE',
  explanation: '',
  explanationAm: '',
  explanationOm: '',
  explanationGz: '',
  points: 1,
  imageUrl: '',
  options: [createOptionForm(true), createOptionForm(false)],
});

const createQuizForm = (title?: string): QuizForm => ({
  id: crypto.randomUUID(),
  title: title || '',
  titleAm: '',
  titleOm: '',
  description: '',
  quizType: 'MULTIPLE_CHOICE',
  passingScore: 70,
  maxAttempts: 1,
  timeLimit: 0,
  shuffleQuestions: true,
  shuffleOptions: true,
  showCorrectAnswers: 'AFTER_SUBMIT',
  isActive: true,
  questions: [createQuestionForm()],
});

const createLessonForm = (): LessonForm => ({
  id: crypto.randomUUID(),
  title: '', titleAm: '', type: 'VIDEO',
  videoFile: null, videoUrl: '', documentFile: null, documentUrl: '', documentType: '',
  content: '', duration: 0, isFree: false, isDownloadable: false,
  quiz: null,
});

const createSection = (): SectionForm => ({
  id: crypto.randomUUID(),
  title: '', titleAm: '',
  lessons: [createLessonForm()],
  isExpanded: true,
});

const createListItem = (): ListItem => ({
  id: crypto.randomUUID(),
  text: '',
});

const InstructorCourseCreate = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [course, setCourse] = useState(emptyCourse);
  const [sections, setSections] = useState<SectionForm[]>([createSection()]);
  const [outcomes, setOutcomes] = useState<ListItem[]>([createListItem()]);
  const [requirements, setRequirements] = useState<ListItem[]>([createListItem()]);
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingPreviewVideo, setIsUploadingPreviewVideo] = useState(false);
  const [pendingLessonUploads, setPendingLessonUploads] = useState(0);
  const [isEditInitialized, setIsEditInitialized] = useState(false);
  const [isEditLocked, setIsEditLocked] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(courseId as string),
    enabled: isEditMode,
  });

  const sectionsQuery = useQuery({
    queryKey: ['course-sections', courseId],
    queryFn: getCourseSections,
    enabled: isEditMode,
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: getLessons,
    enabled: isEditMode,
  });

  const outcomesQuery = useQuery({
    queryKey: ['course-outcomes', courseId],
    queryFn: getCourseOutcomes,
    enabled: isEditMode,
  });

  const requirementsQuery = useQuery({
    queryKey: ['course-requirements', courseId],
    queryFn: getCourseRequirements,
    enabled: isEditMode,
  });

  const lessonResourcesQuery = useQuery({
    queryKey: ['lesson-resources', courseId],
    queryFn: getLessonResources,
    enabled: isEditMode,
  });

  const quizzesQuery = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: getQuizzes,
    enabled: isEditMode,
  });

  const questionsQuery = useQuery({
    queryKey: ['questions', courseId],
    queryFn: getQuestions,
    enabled: isEditMode,
  });

  const questionOptionsQuery = useQuery({
    queryKey: ['question-options', courseId],
    queryFn: getQuestionOptions,
    enabled: isEditMode,
  });

  const discussionsQuery = useQuery({
    queryKey: ['lesson-discussions', courseId],
    queryFn: getLessonDiscussions,
    enabled: isEditMode,
  });

  const repliesQuery = useQuery({
    queryKey: ['discussion-replies', courseId],
    queryFn: getDiscussionReplies,
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!isEditMode || isEditInitialized || !courseQuery.data) {
      return;
    }
    if (isEditMode && (quizzesQuery.isLoading || questionsQuery.isLoading || questionOptionsQuery.isLoading)) {
      return;
    }

    const courseData = courseQuery.data;
    const locked = courseData.status === 'PUBLISHED' || courseData.status === 'APPROVED';
    setIsEditLocked(locked);

    setCourse({
      ...emptyCourse,
      title: courseData.title || '',
      titleAm: courseData.titleAm || '',
      titleOm: courseData.titleOm || '',
      titleGz: courseData.titleGz || '',
      slug: courseData.slug || '',
      description: courseData.description || '',
      descriptionAm: courseData.descriptionAm || '',
      descriptionOm: courseData.descriptionOm || '',
      descriptionGz: courseData.descriptionGz || '',
      categoryId: courseData.categoryId || '',
      level: courseData.level || '',
      price: courseData.price != null ? String(courseData.price) : '',
      discountPrice: courseData.discountPrice != null ? String(courseData.discountPrice) : '',
      currency: courseData.currency || 'ETB',
      thumbnail: courseData.thumbnail || '',
      previewVideo: courseData.previewVideo || '',
      thumbnailPreview: courseData.thumbnail || '',
      previewVideoName: courseData.previewVideo ? courseData.previewVideo.split('/').pop() || '' : '',
      thumbnailFile: null,
      previewVideoFile: null,
    });

    const allSections = sectionsQuery.data || [];
    const allLessons = lessonsQuery.data || [];
    const allQuizzes = quizzesQuery.data || [];
    const allQuestions = questionsQuery.data || [];
    const allQuestionOptions = questionOptionsQuery.data || [];
    const courseSections = allSections
      .filter((section) => section.courseId === courseData.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (courseSections.length > 0) {
      setSections(
        courseSections.map((section) => {
          const sectionLessons = allLessons
            .filter((lesson) => lesson.sectionId === section.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((lesson) => {
              const lessonQuiz = allQuizzes.find((quiz) => quiz.lessonId === lesson.id);
              const quizQuestions = lessonQuiz
                ? allQuestions.filter((question) => question.quizId === lessonQuiz.id).sort((a, b) => a.orderIndex - b.orderIndex)
                : [];

              const quizForm: QuizForm | null = lessonQuiz
                ? {
                    id: lessonQuiz.id,
                    title: lessonQuiz.title || '',
                    titleAm: lessonQuiz.titleAm || '',
                    titleOm: lessonQuiz.titleOm || '',
                    description: lessonQuiz.description || '',
                    quizType: lessonQuiz.quizType || 'MULTIPLE_CHOICE',
                    passingScore: lessonQuiz.passingScore || 0,
                    maxAttempts: lessonQuiz.maxAttempts || 0,
                    timeLimit: lessonQuiz.timeLimit || 0,
                    shuffleQuestions: lessonQuiz.shuffleQuestions,
                    shuffleOptions: lessonQuiz.shuffleOptions,
                    showCorrectAnswers: lessonQuiz.showCorrectAnswers || 'AFTER_SUBMIT',
                    isActive: lessonQuiz.isActive,
                    questions: quizQuestions.map((question) => {
                      const questionOptions = allQuestionOptions
                        .filter((option) => option.questionId === question.id)
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((option) => ({
                          id: option.id,
                          optionText: option.optionText || '',
                          optionTextAm: option.optionTextAm || '',
                          optionTextOm: option.optionTextOm || '',
                          optionTextGz: option.optionTextGz || '',
                          isCorrect: option.isCorrect,
                        }));

                      return {
                        id: question.id,
                        questionText: question.questionText || '',
                        questionTextAm: question.questionTextAm || '',
                        questionTextOm: question.questionTextOm || '',
                        questionTextGz: question.questionTextGz || '',
                        type: question.type || 'MULTIPLE_CHOICE',
                        explanation: question.explanation || '',
                        explanationAm: question.explanationAm || '',
                        explanationOm: question.explanationOm || '',
                        explanationGz: question.explanationGz || '',
                        points: question.points || 1,
                        imageUrl: question.imageUrl || '',
                        options: questionOptions.length > 0 ? questionOptions : [createOptionForm()],
                      };
                    }),
                  }
                : null;

              return {
                id: lesson.id,
                title: lesson.title || '',
                titleAm: lesson.titleAm || '',
                type: lesson.type,
                videoFile: null,
                videoUrl: lesson.videoUrl || '',
                documentFile: null,
                documentUrl: lesson.documentUrl || '',
                documentType: lesson.documentType || '',
                content: lesson.content || '',
                duration: lesson.duration || 0,
                isFree: Boolean(lesson.isFree),
                isDownloadable: Boolean(lesson.isDownloadable),
                quiz: quizForm,
              };
            });

          return {
            id: section.id,
            title: section.title || '',
            titleAm: section.titleAm || '',
            lessons: sectionLessons.length > 0 ? sectionLessons : [createLessonForm()],
            isExpanded: true,
          };
        })
      );
    }

    const nextOutcomes = (outcomesQuery.data || [])
      .filter((item) => item.courseId === courseData.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => ({ id: item.id, text: item.text }));
    setOutcomes(nextOutcomes.length > 0 ? nextOutcomes : [createListItem()]);

    const nextRequirements = (requirementsQuery.data || [])
      .filter((item) => item.courseId === courseData.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => ({ id: item.id, text: item.text }));
    setRequirements(nextRequirements.length > 0 ? nextRequirements : [createListItem()]);

    setIsEditInitialized(true);
  }, [
    courseQuery.data,
    isEditInitialized,
    isEditMode,
    lessonsQuery.data,
    outcomesQuery.data,
    questionOptionsQuery.data,
    questionOptionsQuery.isLoading,
    questionsQuery.data,
    questionsQuery.isLoading,
    quizzesQuery.data,
    quizzesQuery.isLoading,
    requirementsQuery.data,
    sectionsQuery.data,
  ]);

  const createCourseMutation = useMutation({
    mutationFn: async (payload: CoursePayload) => {
      const updatedCourse = isEditMode
        ? await updateCourseApi(courseId as string, payload)
        : await createCourse(payload);

      const courseIdValue = updatedCourse.id;

      if (isEditMode) {
        const existingSections = (sectionsQuery.data || []).filter((section) => section.courseId === courseIdValue);
        const existingSectionIds = new Set(existingSections.map((section) => section.id));
        const existingLessons = (lessonsQuery.data || []).filter((lesson) => existingSectionIds.has(lesson.sectionId));
        const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id));
        const existingResources = (lessonResourcesQuery.data || []).filter((resource) => existingLessonIds.has(resource.lessonId));
        const existingOutcomes = (outcomesQuery.data || []).filter((item) => item.courseId === courseIdValue);
        const existingRequirements = (requirementsQuery.data || []).filter((item) => item.courseId === courseIdValue);
        const quizzesData = quizzesQuery.data || await getQuizzes();
        const questionsData = questionsQuery.data || await getQuestions();
        const questionOptionsData = questionOptionsQuery.data || await getQuestionOptions();
        const existingQuizzes = quizzesData.filter((quiz) => existingLessonIds.has(quiz.lessonId));
        const existingQuizIds = new Set(existingQuizzes.map((quiz) => quiz.id));
        const existingQuestions = questionsData.filter((question) => existingQuizIds.has(question.quizId));
        const existingQuestionIds = new Set(existingQuestions.map((question) => question.id));
        const existingQuestionOptions = questionOptionsData.filter((option) => existingQuestionIds.has(option.questionId));
        const discussionsData = discussionsQuery.data || await getLessonDiscussions();
        const repliesData = repliesQuery.data || await getDiscussionReplies();
        const existingDiscussions = discussionsData.filter((discussion) => existingLessonIds.has(discussion.lessonId));
        const existingReplies = repliesData.filter((reply) =>
          existingDiscussions.some((discussion) => discussion.id === reply.discussionId)
        );

        await Promise.all(existingQuestionOptions.map((option) => deleteQuestionOption(option.id)));
        await Promise.all(existingQuestions.map((question) => deleteQuestion(question.id)));
        await Promise.all(existingQuizzes.map((quiz) => deleteQuiz(quiz.id)));
        await Promise.all(existingReplies.map((reply) => deleteDiscussionReply(reply.id)));
        await Promise.all(existingDiscussions.map((discussion) => deleteLessonDiscussion(discussion.id)));
        await Promise.all(existingResources.map((resource) => deleteLessonResource(resource.id)));
        await Promise.all(existingLessons.map((lesson) => deleteLesson(lesson.id)));
        await Promise.all(existingSections.map((section) => deleteCourseSection(section.id)));
        await Promise.all(existingOutcomes.map((item) => deleteCourseOutcome(item.id)));
        await Promise.all(existingRequirements.map((item) => deleteCourseRequirement(item.id)));
      }

      const trimmedOutcomes = outcomes.map((item) => item.text.trim()).filter(Boolean);
      for (let index = 0; index < trimmedOutcomes.length; index += 1) {
        await createCourseOutcome({
          courseId: courseIdValue,
          text: trimmedOutcomes[index],
          orderIndex: index,
        });
      }

      const trimmedRequirements = requirements.map((item) => item.text.trim()).filter(Boolean);
      for (let index = 0; index < trimmedRequirements.length; index += 1) {
        await createCourseRequirement({
          courseId: courseIdValue,
          text: trimmedRequirements[index],
          orderIndex: index,
        });
      }

      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const section = sections[sectionIndex];
        const sectionTitle = section.title.trim();
        if (!sectionTitle) {
          throw new Error(`Section ${sectionIndex + 1} title is required.`);
        }

        const createdSection = await createCourseSection({
          courseId: courseIdValue,
          title: sectionTitle,
          titleAm: section.titleAm.trim() || undefined,
          orderIndex: sectionIndex,
        });

        for (let lessonIndex = 0; lessonIndex < section.lessons.length; lessonIndex += 1) {
          const lesson = section.lessons[lessonIndex];
          const lessonTitle = lesson.title.trim();
          if (!lessonTitle) {
            throw new Error(`Lesson ${lessonIndex + 1} in section ${sectionIndex + 1} needs a title.`);
          }

          const createdLesson = await createLesson({
            sectionId: createdSection.id,
            title: lessonTitle,
            titleAm: lesson.titleAm.trim() || undefined,
            type: lesson.type,
            videoUrl: lesson.type === 'VIDEO' ? lesson.videoUrl || undefined : undefined,
            duration: Number(lesson.duration) || 0,
            documentUrl: lesson.type === 'DOCUMENT' ? lesson.documentUrl || undefined : undefined,
            documentType: lesson.type === 'DOCUMENT' ? lesson.documentType || undefined : undefined,
            content: lesson.type === 'TEXT' ? lesson.content.trim() || undefined : undefined,
            orderIndex: lessonIndex,
            isFree: lesson.isFree,
            isDownloadable: lesson.isDownloadable,
            isPublished: true,
          });

          if (lesson.type === 'DOCUMENT' && lesson.documentUrl) {
            await createLessonResource({
              lessonId: createdLesson.id,
              title: `${lessonTitle} Resource`,
              type: lesson.documentType || 'DOCUMENT',
              url: lesson.documentUrl,
              fileSize: lesson.documentFile?.size || 0,
              orderIndex: 0,
            });
          }

          if (lesson.quiz) {
            const quizTitle = lesson.quiz.title.trim() || `${lessonTitle} Quiz`;
            const createdQuiz = await createQuiz({
              lessonId: createdLesson.id,
              title: quizTitle,
              titleAm: lesson.quiz.titleAm.trim() || undefined,
              titleOm: lesson.quiz.titleOm.trim() || undefined,
              description: lesson.quiz.description.trim() || undefined,
              quizType: lesson.quiz.quizType,
              passingScore: Number(lesson.quiz.passingScore) || 0,
              maxAttempts: Number(lesson.quiz.maxAttempts) || 0,
              timeLimit: Number(lesson.quiz.timeLimit) || 0,
              shuffleQuestions: lesson.quiz.shuffleQuestions,
              shuffleOptions: lesson.quiz.shuffleOptions,
              showCorrectAnswers: lesson.quiz.showCorrectAnswers,
              isActive: lesson.quiz.isActive,
            });

            let questionOrder = 0;
            for (const question of lesson.quiz.questions) {
              const questionText = question.questionText.trim();
              if (!questionText) {
                continue;
              }

              const createdQuestion = await createQuestion({
                quizId: createdQuiz.id,
                questionText,
                questionTextAm: question.questionTextAm.trim() || undefined,
                questionTextOm: question.questionTextOm.trim() || undefined,
                questionTextGz: question.questionTextGz.trim() || undefined,
                type: question.type,
                explanation: question.explanation.trim() || undefined,
                explanationAm: question.explanationAm.trim() || undefined,
                explanationOm: question.explanationOm.trim() || undefined,
                explanationGz: question.explanationGz.trim() || undefined,
                points: Number(question.points) || 1,
                orderIndex: questionOrder,
                imageUrl: question.imageUrl.trim() || undefined,
              });

              let optionOrder = 0;
              for (const option of question.options) {
                const optionText = option.optionText.trim();
                if (!optionText) {
                  continue;
                }

                await createQuestionOption({
                  questionId: createdQuestion.id,
                  optionText,
                  optionTextAm: option.optionTextAm.trim() || undefined,
                  optionTextOm: option.optionTextOm.trim() || undefined,
                  optionTextGz: option.optionTextGz.trim() || undefined,
                  isCorrect: option.isCorrect,
                  orderIndex: optionOrder,
                });

                optionOrder += 1;
              }

              questionOrder += 1;
            }
          }
        }
      }

      return updatedCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: isEditMode ? 'Course updated' : 'Course submitted for review',
        description: isEditMode
          ? 'Your course updates have been saved.'
          : 'Your course has been submitted and will be reviewed by an admin.',
      });
      navigate('/instructor');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create course.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const updateCourse = (field: string, value: string | File | null) => {
    setCourse((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateCourse('thumbnailFile', file);
      updateCourse('thumbnailPreview', URL.createObjectURL(file));
      setIsUploadingThumbnail(true);
      try {
        const uploaded = await uploadCourseMedia(file);
        updateCourse('thumbnail', uploaded.url);
      } catch (error: unknown) {
        updateCourse('thumbnail', '');
        const message = error instanceof Error ? error.message : 'Failed to upload thumbnail.';
        toast({ title: 'Thumbnail upload failed', description: message, variant: 'destructive' });
      } finally {
        setIsUploadingThumbnail(false);
      }
    }
  };

  const handlePreviewVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateCourse('previewVideoFile', file);
      updateCourse('previewVideoName', file.name);
      setIsUploadingPreviewVideo(true);
      try {
        const uploaded = await uploadCourseMedia(file);
        updateCourse('previewVideo', uploaded.url);
      } catch (error: unknown) {
        updateCourse('previewVideo', '');
        const message = error instanceof Error ? error.message : 'Failed to upload preview video.';
        toast({ title: 'Preview video upload failed', description: message, variant: 'destructive' });
      } finally {
        setIsUploadingPreviewVideo(false);
      }
    }
  };

  const addSection = () => setSections((prev) => [...prev, createSection()]);

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, field: string, value: string | boolean) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const addLesson = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, createLessonForm()] } : s
      )
    );
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      )
    );
  };

  const updateLesson = (sectionId: string, lessonId: string, field: string, value: unknown) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId
                  ? {
                      ...l,
                      [field]: value,
                      quiz: field === 'type' && value === 'QUIZ' && !l.quiz
                        ? createQuizForm(l.title)
                        : l.quiz,
                    }
                  : l
              ),
            }
          : s
      )
    );
  };

  const toggleLessonQuiz = (sectionId: string, lessonId: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId
                  ? { ...l, quiz: enabled ? (l.quiz ?? createQuizForm(l.title)) : null }
                  : l
              ),
            }
          : s
      )
    );
  };

  const updateLessonQuiz = (sectionId: string, lessonId: string, field: keyof QuizForm, value: unknown) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? { ...l, quiz: { ...l.quiz, [field]: value } }
                  : l
              ),
            }
          : s
      )
    );
  };

  const addQuizQuestion = (sectionId: string, lessonId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? { ...l, quiz: { ...l.quiz, questions: [...l.quiz.questions, createQuestionForm()] } }
                  : l
              ),
            }
          : s
      )
    );
  };

  const removeQuizQuestion = (sectionId: string, lessonId: string, questionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? { ...l, quiz: { ...l.quiz, questions: l.quiz.questions.filter((q) => q.id !== questionId) } }
                  : l
              ),
            }
          : s
      )
    );
  };

  const updateQuizQuestion = (
    sectionId: string,
    lessonId: string,
    questionId: string,
    field: keyof QuestionForm,
    value: unknown
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? {
                      ...l,
                      quiz: {
                        ...l.quiz,
                        questions: l.quiz.questions.map((q) =>
                          q.id === questionId ? { ...q, [field]: value } : q
                        ),
                      },
                    }
                  : l
              ),
            }
          : s
      )
    );
  };

  const addQuizOption = (sectionId: string, lessonId: string, questionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? {
                      ...l,
                      quiz: {
                        ...l.quiz,
                        questions: l.quiz.questions.map((q) =>
                          q.id === questionId
                            ? { ...q, options: [...q.options, createOptionForm()] }
                            : q
                        ),
                      },
                    }
                  : l
              ),
            }
          : s
      )
    );
  };

  const removeQuizOption = (sectionId: string, lessonId: string, questionId: string, optionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? {
                      ...l,
                      quiz: {
                        ...l.quiz,
                        questions: l.quiz.questions.map((q) =>
                          q.id === questionId
                            ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
                            : q
                        ),
                      },
                    }
                  : l
              ),
            }
          : s
      )
    );
  };

  const updateQuizOption = (
    sectionId: string,
    lessonId: string,
    questionId: string,
    optionId: string,
    field: keyof OptionForm,
    value: unknown
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId && l.quiz
                  ? {
                      ...l,
                      quiz: {
                        ...l.quiz,
                        questions: l.quiz.questions.map((q) =>
                          q.id === questionId
                            ? {
                                ...q,
                                options: q.options.map((o) =>
                                  o.id === optionId ? { ...o, [field]: value } : o
                                ),
                              }
                            : q
                        ),
                      },
                    }
                  : l
              ),
            }
          : s
      )
    );
  };

  const addOutcome = () => setOutcomes((prev) => [...prev, createListItem()]);

  const updateOutcome = (id: string, value: string) => {
    setOutcomes((prev) => prev.map((item) => (item.id === id ? { ...item, text: value } : item)));
  };

  const removeOutcome = (id: string) => {
    setOutcomes((prev) => prev.filter((item) => item.id !== id));
  };

  const addRequirement = () => setRequirements((prev) => [...prev, createListItem()]);

  const updateRequirement = (id: string, value: string) => {
    setRequirements((prev) => prev.map((item) => (item.id === id ? { ...item, text: value } : item)));
  };

  const removeRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLessonVideo = async (sectionId: string, lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateLesson(sectionId, lessonId, 'videoFile', file);
      setPendingLessonUploads((prev) => prev + 1);
      try {
        const uploaded = await uploadCourseMedia(file);
        updateLesson(sectionId, lessonId, 'videoUrl', uploaded.url);
      } catch (error: unknown) {
        updateLesson(sectionId, lessonId, 'videoUrl', '');
        const message = error instanceof Error ? error.message : 'Failed to upload lesson video.';
        toast({ title: 'Lesson video upload failed', description: message, variant: 'destructive' });
      } finally {
        setPendingLessonUploads((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const handleLessonDocument = async (sectionId: string, lessonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateLesson(sectionId, lessonId, 'documentFile', file);
      setPendingLessonUploads((prev) => prev + 1);
      try {
        const uploaded = await uploadCourseMedia(file);
        updateLesson(sectionId, lessonId, 'documentUrl', uploaded.url);
        updateLesson(sectionId, lessonId, 'documentType', file.type || 'application/octet-stream');
      } catch (error: unknown) {
        updateLesson(sectionId, lessonId, 'documentUrl', '');
        updateLesson(sectionId, lessonId, 'documentType', '');
        const message = error instanceof Error ? error.message : 'Failed to upload lesson document.';
        toast({ title: 'Lesson document upload failed', description: message, variant: 'destructive' });
      } finally {
        setPendingLessonUploads((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const handleSaveDraft = () => {
    toast({ title: 'Course saved as draft', description: 'You can continue editing later.' });
  };

  const handleSubmit = () => {
    if (!course.title || !course.description || !course.categoryId || !course.level) {
      toast({ title: 'Missing required fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    if (isEditMode && isEditLocked) {
      toast({ title: 'Editing disabled', description: 'Approved courses cannot be edited.' });
      return;
    }
    if (pendingLessonUploads > 0 || isUploadingThumbnail || isUploadingPreviewVideo) {
      toast({ title: 'Upload in progress', description: 'Please wait for media uploads to finish before submitting.' });
      return;
    }
    const totalDuration = sections.reduce((acc, section) => acc + section.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0), 0);
    const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);
    const normalizedSlug = course.slug.trim() || course.title.trim().toLowerCase().replace(/\s+/g, '-');

    const payload: CoursePayload = {
      instructorId: user?.id,
      categoryId: course.categoryId,
      title: course.title.trim(),
      titleAm: course.titleAm.trim() || undefined,
      titleOm: course.titleOm.trim() || undefined,
      titleGz: course.titleGz.trim() || undefined,
      slug: normalizedSlug,
      description: course.description.trim(),
      descriptionAm: course.descriptionAm.trim() || undefined,
      descriptionOm: course.descriptionOm.trim() || undefined,
      descriptionGz: course.descriptionGz.trim() || undefined,
      thumbnail: course.thumbnail || undefined,
      previewVideo: course.previewVideo || undefined,
      price: Number(course.price) || 0,
      discountPrice: course.discountPrice ? Number(course.discountPrice) : undefined,
      currency: course.currency,
      level: course.level,
      status: isEditMode ? (courseQuery.data?.status || 'PENDING') : 'PENDING',
      totalDuration,
      totalLessons,
      enrollmentCount: 0,
      averageRating: 0,
      totalReviews: 0,
      isFeatured: false,
      isPopular: false,
    };

    createCourseMutation.mutate(payload);
  };

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  if (isEditMode && courseQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="py-12 text-muted-foreground">Loading course...</div>
      </DashboardLayout>
    );
  }

  if (isEditMode && courseQuery.isError) {
    return (
      <DashboardLayout>
        <div className="py-12 text-destructive">Failed to load course for editing.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/instructor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {sections.length} sections · {totalLessons} lessons
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="h-4 w-4" /> Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              className="gap-2"
              disabled={
                createCourseMutation.isPending ||
                isUploadingThumbnail ||
                isUploadingPreviewVideo ||
                pendingLessonUploads > 0 ||
                isEditLocked
              }
            >
              <Send className="h-4 w-4" /> {isEditMode ? 'Update Course' : 'Submit for Review'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="localization">
              <Globe className="h-3 w-3 mr-1" /> Localization
            </TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete Web Development Bootcamp 2026"
                      value={course.title}
                      onChange={(e) => updateCourse('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={course.categoryId} onValueChange={(v) => updateCourse('categoryId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level *</Label>
                    <Select value={course.level} onValueChange={(v) => updateCourse('level', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="ALL_LEVELS">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      placeholder="What will students learn? Why should they take this course?"
                      value={course.description}
                      onChange={(e) => updateCourse('description', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learning Outcomes & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>What you'll learn</Label>
                  {outcomes.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        placeholder={`Outcome ${index + 1}`}
                        value={item.text}
                        onChange={(e) => updateOutcome(item.id, e.target.value)}
                      />
                      {outcomes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeOutcome(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOutcome} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Outcome
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Requirements</Label>
                  {requirements.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        placeholder={`Requirement ${index + 1}`}
                        value={item.text}
                        onChange={(e) => updateRequirement(item.id, e.target.value)}
                      />
                      {requirements.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeRequirement(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addRequirement} className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Requirement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:w-64 h-40 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {course.thumbnailPreview ? (
                      <img src={course.thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Image className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-xs">750×422 recommended</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Upload thumbnail image</Label>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
                    <label className="inline-flex cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                      <Button variant="outline" size="sm" asChild>
                        <span><Upload className="h-4 w-4 mr-2" /> Choose Image</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Upload a short preview video that shows students what they'll learn. This appears on the course page.
                  </p>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex cursor-pointer">
                      <input type="file" accept="video/*" className="hidden" onChange={handlePreviewVideo} />
                      <Button variant="outline" size="sm" asChild>
                        <span><Video className="h-4 w-4 mr-2" /> Upload Video</span>
                      </Button>
                    </label>
                    {course.previewVideoName && (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="h-3 w-3" /> {course.previewVideoName}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum */}
          <TabsContent value="curriculum" className="space-y-4 mt-6">
            {sections.map((section, sIndex) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-xs font-medium text-muted-foreground">Section {sIndex + 1}</span>
                    <div className="flex-1">
                      <Input
                        placeholder="Section title (e.g., Getting Started)"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="h-8 text-sm font-semibold"
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => updateSection(section.id, 'isExpanded', !section.isExpanded)}
                    >
                      {section.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {sections.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(section.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {section.isExpanded && (
                  <CardContent className="space-y-3">
                    {section.lessons.map((lesson, lIndex) => (
                      <div key={lesson.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                          <span className="text-xs text-muted-foreground font-medium">Lesson {lIndex + 1}</span>
                          <div className="flex-1">
                            <Input
                              placeholder="Lesson title"
                              value={lesson.title}
                              onChange={(e) => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          {section.lessons.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLesson(section.id, lesson.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={lesson.type}
                              onValueChange={(v) => updateLesson(section.id, lesson.id, 'type', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="DOCUMENT">Document</SelectItem>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="QUIZ">Quiz</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-xs"
                              value={lesson.duration || ''}
                              onChange={(e) => updateLesson(section.id, lesson.id, 'duration', Number(e.target.value))}
                            />
                          </div>
                          <div className="flex items-end gap-4 sm:col-span-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isFree}
                                onCheckedChange={(v) => updateLesson(section.id, lesson.id, 'isFree', v)}
                              />
                              <Label className="text-xs">Free Preview</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={lesson.isDownloadable}
                                onCheckedChange={(v) => updateLesson(section.id, lesson.id, 'isDownloadable', v)}
                              />
                              <Label className="text-xs">Downloadable</Label>
                            </div>
                          </div>
                        </div>

                        {/* Upload area based on type */}
                        {lesson.type === 'VIDEO' && (
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer">
                              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleLessonVideo(section.id, lesson.id, e)} />
                              <Button variant="outline" size="sm" asChild>
                                <span><Video className="h-3 w-3 mr-1" /> Upload Video</span>
                              </Button>
                            </label>
                            {lesson.videoUrl && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{lesson.videoFile?.name || lesson.videoUrl}</span>
                            )}
                          </div>
                        )}
                        {lesson.type === 'DOCUMENT' && (
                          <div className="flex items-center gap-3">
                            <label className="inline-flex cursor-pointer">
                              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={(e) => handleLessonDocument(section.id, lesson.id, e)} />
                              <Button variant="outline" size="sm" asChild>
                                <span><FileText className="h-3 w-3 mr-1" /> Upload Document</span>
                              </Button>
                            </label>
                            {lesson.documentFile && (
                              <span className="text-xs text-muted-foreground">{lesson.documentFile.name}</span>
                            )}
                          </div>
                        )}
                        {lesson.type === 'TEXT' && (
                          <Textarea
                            placeholder="Write lesson content here..."
                            rows={3}
                            value={lesson.content}
                            onChange={(e) => updateLesson(section.id, lesson.id, 'content', e.target.value)}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addLesson(section.id)} className="gap-1">
                      <PlusCircle className="h-3 w-3" /> Add Lesson
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
            <Button variant="outline" onClick={addSection} className="gap-2 w-full">
              <PlusCircle className="h-4 w-4" /> Add Section
            </Button>
          </TabsContent>

          {/* Quizzes */}
          <TabsContent value="quizzes" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lesson Quizzes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Add optional quizzes for each lesson. Quizzes can include multiple questions and answer options.
              </CardContent>
            </Card>

            {sections.map((section, sIndex) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Section {sIndex + 1}: {section.title || 'Untitled section'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.lessons.map((lesson, lIndex) => (
                    <div key={lesson.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">{lesson.title || `Lesson ${lIndex + 1}`}</p>
                          <p className="text-xs text-muted-foreground">Lesson {lIndex + 1}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="secondary" className="text-[10px]">{lesson.type}</Badge>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={Boolean(lesson.quiz)}
                              onCheckedChange={(value) => toggleLessonQuiz(section.id, lesson.id, value)}
                            />
                            <Label className="text-xs">Enable Quiz</Label>
                          </div>
                        </div>
                      </div>

                      {!lesson.quiz && (
                        <p className="text-xs text-muted-foreground">No quiz added for this lesson.</p>
                      )}

                      {lesson.quiz && (
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Quiz Title</Label>
                              <Input
                                value={lesson.quiz.title}
                                onChange={(e) => updateLessonQuiz(section.id, lesson.id, 'title', e.target.value)}
                                placeholder="Quiz title"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                rows={3}
                                value={lesson.quiz.description}
                                onChange={(e) => updateLessonQuiz(section.id, lesson.id, 'description', e.target.value)}
                                placeholder="Quiz instructions or overview"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Quiz Type</Label>
                              <Select
                                value={lesson.quiz.quizType}
                                onValueChange={(value) => updateLessonQuiz(section.id, lesson.id, 'quizType', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                  <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Passing Score</Label>
                              <Input
                                type="number"
                                min={0}
                                value={lesson.quiz.passingScore}
                                onChange={(e) => updateLessonQuiz(section.id, lesson.id, 'passingScore', Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Max Attempts</Label>
                              <Input
                                type="number"
                                min={0}
                                value={lesson.quiz.maxAttempts}
                                onChange={(e) => updateLessonQuiz(section.id, lesson.id, 'maxAttempts', Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Time Limit (min)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={lesson.quiz.timeLimit}
                                onChange={(e) => updateLessonQuiz(section.id, lesson.id, 'timeLimit', Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Show Correct Answers</Label>
                              <Select
                                value={lesson.quiz.showCorrectAnswers}
                                onValueChange={(value) => updateLessonQuiz(section.id, lesson.id, 'showCorrectAnswers', value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AFTER_SUBMIT">After Submit</SelectItem>
                                  <SelectItem value="AFTER_PASS">After Pass</SelectItem>
                                  <SelectItem value="ALWAYS">Always</SelectItem>
                                  <SelectItem value="NEVER">Never</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={lesson.quiz.shuffleQuestions}
                                  onCheckedChange={(value) => updateLessonQuiz(section.id, lesson.id, 'shuffleQuestions', value)}
                                />
                                <Label className="text-xs">Shuffle Questions</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={lesson.quiz.shuffleOptions}
                                  onCheckedChange={(value) => updateLessonQuiz(section.id, lesson.id, 'shuffleOptions', value)}
                                />
                                <Label className="text-xs">Shuffle Options</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={lesson.quiz.isActive}
                                  onCheckedChange={(value) => updateLessonQuiz(section.id, lesson.id, 'isActive', value)}
                                />
                                <Label className="text-xs">Active</Label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Questions</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => addQuizQuestion(section.id, lesson.id)}
                              >
                                <PlusCircle className="h-3 w-3" /> Add Question
                              </Button>
                            </div>
                            {lesson.quiz.questions.map((question, qIndex) => (
                              <div key={question.id} className="border rounded-lg p-4 space-y-3 bg-muted/40">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">Question {qIndex + 1}</span>
                                  {lesson.quiz.questions.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => removeQuizQuestion(section.id, lesson.id, question.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs">Question Text</Label>
                                    <Input
                                      value={question.questionText}
                                      onChange={(e) => updateQuizQuestion(section.id, lesson.id, question.id, 'questionText', e.target.value)}
                                      placeholder="Type the question"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Question Type</Label>
                                    <Select
                                      value={question.type}
                                      onValueChange={(value) => updateQuizQuestion(section.id, lesson.id, question.id, 'type', value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                        <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Points</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      className="h-8 text-xs"
                                      value={question.points}
                                      onChange={(e) => updateQuizQuestion(section.id, lesson.id, question.id, 'points', Number(e.target.value))}
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs">Explanation</Label>
                                    <Textarea
                                      rows={2}
                                      value={question.explanation}
                                      onChange={(e) => updateQuizQuestion(section.id, lesson.id, question.id, 'explanation', e.target.value)}
                                      placeholder="Explain the correct answer"
                                    />
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <Label className="text-xs">Image URL</Label>
                                    <Input
                                      value={question.imageUrl}
                                      onChange={(e) => updateQuizQuestion(section.id, lesson.id, question.id, 'imageUrl', e.target.value)}
                                      placeholder="Optional image URL"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Options</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => addQuizOption(section.id, lesson.id, question.id)}
                                    >
                                      <PlusCircle className="h-3 w-3" /> Add Option
                                    </Button>
                                  </div>
                                  {question.options.map((option, oIndex) => (
                                    <div key={option.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <Input
                                        value={option.optionText}
                                        onChange={(e) => updateQuizOption(section.id, lesson.id, question.id, option.id, 'optionText', e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={option.isCorrect}
                                          onCheckedChange={(value) => updateQuizOption(section.id, lesson.id, question.id, option.id, 'isCorrect', value)}
                                        />
                                        <Label className="text-xs">Correct</Label>
                                      </div>
                                      {question.options.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive"
                                          onClick={() => removeQuizOption(section.id, lesson.id, question.id, option.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={course.currency} onValueChange={(v) => updateCourse('currency', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETB">ETB (Birr)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Original Price *</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="1499"
                      value={course.price}
                      onChange={(e) => updateCourse('price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Price</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="299"
                      value={course.discountPrice}
                      onChange={(e) => updateCourse('discountPrice', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localization */}
          <TabsContent value="localization" className="space-y-6 mt-6">
            {/* Amharic */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Amharic Translation (አማርኛ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Amharic)</Label>
                  <Input placeholder="ርዕስ በአማርኛ" value={course.titleAm} onChange={(e) => updateCourse('titleAm', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Amharic)</Label>
                  <Textarea rows={4} placeholder="ገለጻ በአማርኛ" value={course.descriptionAm} onChange={(e) => updateCourse('descriptionAm', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Oromifa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Oromifa Translation (Afaan Oromoo)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Oromifa)</Label>
                  <Input placeholder="Mata duree Afaan Oromootiin" value={course.titleOm} onChange={(e) => updateCourse('titleOm', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Oromifa)</Label>
                  <Textarea rows={4} placeholder="Ibsa Afaan Oromootiin" value={course.descriptionOm} onChange={(e) => updateCourse('descriptionOm', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Geez */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Geez Translation (ግዕዝ)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (Geez)</Label>
                  <Input placeholder="ርእስ ብግዕዝ" value={course.titleGz} onChange={(e) => updateCourse('titleGz', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Geez)</Label>
                  <Textarea rows={4} placeholder="ገለጻ ብግዕዝ" value={course.descriptionGz} onChange={(e) => updateCourse('descriptionGz', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstructorCourseCreate;
