import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Check, Play, FileText, BookOpen, Loader2, Award, BookmarkPlus, Bookmark, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getApprovedCourses,
  getCourseById,
  getCourseSections,
  getLessons,
  getMyCourseEnrollment,
  getLessonProgresses,
  recordLessonProgress,
  getQuizzes,
  getQuestions,
  getQuestionOptions,
  getVideoProgress,
  upsertVideoProgress,
  type LessonPayload,
  type CourseSectionPayload,
  type QuizPayload,
  type QuestionPayload,
  type QuestionOptionPayload,
} from '@/lib/course-api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const Learn = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const slugValue = slug || '';
  const isUuidSlug = isUuid(slugValue);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<{ earned: number; total: number; passed: boolean } | null>(null);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoResumeAppliedRef = useRef(false);
  const lastSavedPositionRef = useRef(0);
  const lastSaveTimeRef = useRef(0);

  const courseByIdQuery = useQuery({
    queryKey: ['course', slugValue],
    queryFn: () => getCourseById(slugValue),
    enabled: Boolean(slugValue) && isUuidSlug,
  });

  const coursesQuery = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
    enabled: Boolean(slugValue) && !isUuidSlug,
  });

  const course = isUuidSlug ? courseByIdQuery.data : coursesQuery.data?.find((c) => c.slug === slugValue);

  const enrollmentQuery = useQuery({
    queryKey: ['my-course-enrollment', course?.id, user?.id],
    queryFn: () => getMyCourseEnrollment(course!.id),
    enabled: Boolean(course?.id) && isLoggedIn,
  });

  const enrollment = enrollmentQuery.data ?? null;

  const sectionsQuery = useQuery({
    queryKey: ['course-sections', course?.id],
    queryFn: () => getCourseSections(course!.id),
    enabled: Boolean(course?.id),
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons', course?.id],
    queryFn: () => getLessons(course!.id),
    enabled: Boolean(course?.id),
  });

  const progressQuery = useQuery({
    queryKey: ['lesson-progresses', enrollment?.id],
    queryFn: () => getLessonProgresses(enrollment!.id),
    enabled: Boolean(enrollment?.id),
  });

  const recordProgressMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: 'IN_PROGRESS' | 'COMPLETED' }) =>
      recordLessonProgress(enrollment!.id, lessonId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progresses', enrollment?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-course-enrollment', course?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments', user?.id] });
    },
  });

  const quizzesQuery = useQuery({
    queryKey: ['quizzes'],
    queryFn: getQuizzes,
    enabled: Boolean(selectedLesson?.type === 'QUIZ'),
  });
  const questionsQuery = useQuery({
    queryKey: ['questions'],
    queryFn: getQuestions,
    enabled: Boolean(selectedLesson?.type === 'QUIZ'),
  });
  const optionsQuery = useQuery({
    queryKey: ['question-options'],
    queryFn: getQuestionOptions,
    enabled: Boolean(selectedLesson?.type === 'QUIZ'),
  });

  const videoProgressQuery = useQuery({
    queryKey: ['video-progress', enrollment?.id, selectedLesson?.id],
    queryFn: () => getVideoProgress(enrollment!.id, selectedLesson!.id),
    enabled: Boolean(enrollment?.id && selectedLesson?.id && selectedLesson?.type === 'VIDEO'),
  });

  const upsertVideoProgressMutation = useMutation({
    mutationFn: (payload: { lastWatchedPosition: number; watchedDuration: number; totalDuration: number }) =>
      upsertVideoProgress(enrollment!.id, selectedLesson!.id, payload.lastWatchedPosition, payload.watchedDuration, payload.totalDuration),
  });

  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks', selectedLesson?.id],
    queryFn: () => getBookmarks(selectedLesson!.id),
    enabled: Boolean(selectedLesson?.id),
  });
  const createBookmarkMutation = useMutation({
    mutationFn: (payload: { timestamp: number; note?: string }) =>
      createBookmark({
        courseId: course!.id,
        lessonId: selectedLesson!.id,
        timestamp: payload.timestamp,
        note: payload.note ?? '',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks', selectedLesson?.id] }),
  });
  const deleteBookmarkMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks', selectedLesson?.id] }),
  });

  const curriculumSections = useMemo(() => {
    const sections = sectionsQuery.data || [];
    const lessons = lessonsQuery.data || [];
    return sections
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((section) => ({
        ...section,
        lessons: lessons
          .filter((l) => l.sectionId === section.id)
          .sort((a, b) => a.orderIndex - b.orderIndex),
      }));
  }, [sectionsQuery.data, lessonsQuery.data]);

  const completedLessonIds = useMemo(
    () => new Set((progressQuery.data || []).filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId)),
    [progressQuery.data]
  );

  const allLessons = useMemo(
    () => curriculumSections.flatMap((s) => s.lessons),
    [curriculumSections]
  );

  useEffect(() => {
    if (allLessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(allLessons[0].id);
    }
  }, [allLessons, selectedLessonId]);

  useEffect(() => {
    setQuizSelections({});
    setQuizSubmitted(null);
    videoResumeAppliedRef.current = false;
  }, [selectedLessonId]);

  const videoProgress = videoProgressQuery.data ?? null;
  useEffect(() => {
    if (selectedLesson?.type !== 'VIDEO' || videoResumeAppliedRef.current) return;
    const pos = videoProgress?.lastWatchedPosition;
    if (pos != null && pos > 0 && videoRef.current) {
      videoRef.current.currentTime = pos;
      lastSavedPositionRef.current = pos;
      videoResumeAppliedRef.current = true;
    }
  }, [selectedLesson?.type, videoProgress?.lastWatchedPosition]);
  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current || videoResumeAppliedRef.current) return;
    const pos = videoProgress?.lastWatchedPosition;
    if (pos != null && pos > 0) {
      videoRef.current.currentTime = pos;
      lastSavedPositionRef.current = pos;
      videoResumeAppliedRef.current = true;
    }
  };
  const handleVideoPause = () => {
    const v = videoRef.current;
    if (!v || !enrollment || !selectedLesson || selectedLesson.type !== 'VIDEO') return;
    const position = Math.floor(v.currentTime);
    const duration = Number.isFinite(v.duration) ? Math.floor(v.duration) : 0;
    if (position <= 0 && lastSavedPositionRef.current === position) return;
    lastSavedPositionRef.current = position;
    upsertVideoProgressMutation.mutate({
      lastWatchedPosition: position,
      watchedDuration: position,
      totalDuration: duration || position,
    });
  };
  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !enrollment || !selectedLesson) return;
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 15000) return;
    const position = Math.floor(v.currentTime);
    if (position > 0 && position !== lastSavedPositionRef.current) {
      lastSavedPositionRef.current = position;
      lastSaveTimeRef.current = now;
      upsertVideoProgressMutation.mutate({
        lastWatchedPosition: position,
        watchedDuration: position,
        totalDuration: Number.isFinite(v.duration) ? Math.floor(v.duration) : position,
      });
    }
  };

  const selectedLesson = useMemo(() => {
    if (selectedLessonId) return allLessons.find((l) => l.id === selectedLessonId);
    return allLessons[0] ?? null;
  }, [selectedLessonId, allLessons]);

  if (!isLoggedIn) {
    navigate(`/auth?redirect=${encodeURIComponent(`/courses/${slugValue}/learn`)}`);
    return null;
  }

  if (course && enrollmentQuery.isSuccess && !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">You are not enrolled in this course.</p>
          <Button asChild>
            <Link to={`/courses/${slugValue}`}>View course & enroll</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const progressPercent = enrollment.progress ?? 0;

  const handleMarkComplete = () => {
    if (!selectedLesson) return;
    recordProgressMutation.mutate({ lessonId: selectedLesson.id, status: 'COMPLETED' });
  };

  const handleSelectLesson = (lesson: LessonPayload) => {
    setSelectedLessonId(lesson.id);
    recordProgressMutation.mutate({ lessonId: lesson.id, status: 'IN_PROGRESS' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/courses/${slugValue}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate text-sm sm:text-base">{course.title}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {enrollment.completedLessonsCount} of {allLessons.length} lessons · {Math.round(progressPercent)}% complete
            </p>
          </div>
          <Progress value={progressPercent} className="w-24 sm:w-32 h-2" />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="w-72 border-r border-border bg-muted/20 flex flex-col shrink-0 hidden md:flex">
          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-4">
              {curriculumSections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5 mt-1">
                    {section.lessons.map((lesson) => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      const isSelected = selectedLesson?.id === lesson.id;
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectLesson(lesson)}
                            className={cn(
                              'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                              isSelected && 'bg-accent text-accent-foreground',
                              !isSelected && 'hover:bg-muted'
                            )}
                          >
                            {lesson.type === 'VIDEO' ? (
                              <Play className="h-4 w-4 shrink-0" />
                            ) : lesson.type === 'QUIZ' ? (
                              <Award className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0" />
                            )}
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.duration > 0 && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDuration(Math.round(lesson.duration / 60))}
                              </span>
                            )}
                            {isCompleted && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-auto">
          {selectedLesson ? (
            <>
              <div className="flex-1 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-semibold mb-4">{selectedLesson.title}</h2>
                  {selectedLesson.type === 'VIDEO' && selectedLesson.videoUrl && (
                    <>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        <video
                          ref={videoRef}
                          src={selectedLesson.videoUrl}
                          controls
                          className="w-full h-full"
                          playsInline
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onPause={handleVideoPause}
                          onTimeUpdate={handleVideoTimeUpdate}
                        />
                      </div>
                      <div className="mb-6 rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <h3 className="font-medium text-sm flex items-center gap-2">
                            <Bookmark className="h-4 w-4" /> Bookmarks
                          </h3>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs max-w-[160px]"
                              value={bookmarkNote}
                              onChange={(e) => setBookmarkNote(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={createBookmarkMutation.isPending}
                              onClick={() => {
                                const v = videoRef.current;
                                if (!v || !course) return;
                                const timestamp = Math.floor(v.currentTime);
                                createBookmarkMutation.mutate({ timestamp, note: bookmarkNote.trim() });
                                setBookmarkNote('');
                              }}
                            >
                              <BookmarkPlus className="h-3 w-3" /> Add at current time
                            </Button>
                          </div>
                        </div>
                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                          {(bookmarksQuery.data ?? []).map((b) => (
                            <li
                              key={b.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                            >
                              <button
                                type="button"
                                className="text-left flex-1 min-w-0"
                                onClick={() => {
                                  if (videoRef.current && b.timestamp != null) videoRef.current.currentTime = b.timestamp;
                                }}
                              >
                                <span className="font-mono text-xs text-muted-foreground">
                                  {Math.floor((b.timestamp ?? 0) / 60)}:{(b.timestamp ?? 0) % 60 < 10 ? '0' : ''}{(b.timestamp ?? 0) % 60}
                                </span>
                                {b.note && <span className="ml-2 truncate">{b.note}</span>}
                              </button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                onClick={() => deleteBookmarkMutation.mutate(b.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </li>
                          ))}
                          {(bookmarksQuery.data ?? []).length === 0 && (
                            <li className="text-xs text-muted-foreground py-2">No bookmarks. Pause at a position and click &quot;Add at current time&quot;.</li>
                          )}
                        </ul>
                      </div>
                    </>
                  )}
                  {selectedLesson.type === 'DOCUMENT' && selectedLesson.documentUrl && (
                    <div className="mb-6">
                      <a
                        href={selectedLesson.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline"
                      >
                        Open document
                      </a>
                    </div>
                  )}
                  {selectedLesson.type === 'TEXT' && selectedLesson.content && (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none mb-6"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                    />
                  )}
                  {selectedLesson.type === 'QUIZ' && (() => {
                    const quizzes = quizzesQuery.data ?? [];
                    const quiz: QuizPayload | undefined = quizzes.find((q) => q.lessonId === selectedLesson.id);
                    const allQuestions = questionsQuery.data ?? [];
                    const allOptions = optionsQuery.data ?? [];
                    const questions: QuestionPayload[] = quiz
                      ? allQuestions.filter((q) => q.quizId === quiz.id).sort((a, b) => a.orderIndex - b.orderIndex)
                      : [];
                    const optionsByQuestion = allOptions.reduce<Record<string, QuestionOptionPayload[]>>((acc, o) => {
                      if (!acc[o.questionId]) acc[o.questionId] = [];
                      acc[o.questionId].push(o);
                      return acc;
                    }, {});
                    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
                    const handleQuizSubmit = () => {
                      if (!quiz) return;
                      let earned = 0;
                      questions.forEach((q) => {
                        const selectedId = quizSelections[q.id];
                        const opts = (optionsByQuestion[q.id] ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
                        const selected = opts.find((o) => o.id === selectedId);
                        if (selected?.isCorrect) earned += q.points;
                      });
                      const passed = totalPoints > 0 && (earned / totalPoints) * 100 >= quiz.passingScore;
                      setQuizSubmitted({ earned, total: totalPoints, passed });
                    };
                    if (quizzesQuery.isLoading || questionsQuery.isLoading || optionsQuery.isLoading) {
                      return (
                        <div className="flex items-center gap-2 text-muted-foreground py-8">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading quiz...</span>
                        </div>
                      );
                    }
                    if (!quiz || questions.length === 0) {
                      return (
                        <p className="text-muted-foreground py-4">
                          No quiz available for this lesson yet.
                        </p>
                      );
                    }
                    if (quizSubmitted !== null) {
                      return (
                        <div className="space-y-4 py-4">
                          <div className="rounded-lg border border-border bg-card p-6 text-center">
                            <Award className="h-12 w-12 mx-auto mb-3 text-primary" />
                            <h3 className="font-semibold text-lg">
                              {quizSubmitted.passed ? 'Passed!' : 'Not passed'}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              You scored {quizSubmitted.earned} out of {quizSubmitted.total} (
                              {quizSubmitted.total > 0 ? Math.round((quizSubmitted.earned / quizSubmitted.total) * 100) : 0}
                              %). Passing score is {quiz.passingScore}%.
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            You can mark this lesson as complete and continue.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-6 py-4">
                        <div>
                          <h3 className="font-semibold text-lg">{quiz.title}</h3>
                          {quiz.description && (
                            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                          )}
                        </div>
                        <form
                          className="space-y-6"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleQuizSubmit();
                          }}
                        >
                          {questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                              <p className="font-medium text-sm">
                                {idx + 1}. {q.questionText}
                              </p>
                              <div className="space-y-2 pl-4">
                                {(optionsByQuestion[q.id] ?? [])
                                  .sort((a, b) => a.orderIndex - b.orderIndex)
                                  .map((opt) => (
                                    <label
                                      key={opt.id}
                                      className="flex items-center gap-2 cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                                    >
                                      <input
                                        type="radio"
                                        name={q.id}
                                        value={opt.id}
                                        checked={quizSelections[q.id] === opt.id}
                                        onChange={() =>
                                          setQuizSelections((prev) => ({ ...prev, [q.id]: opt.id }))
                                        }
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm">{opt.optionText}</span>
                                    </label>
                                  ))}
                              </div>
                            </div>
                          ))}
                          <Button type="submit" className="w-full sm:w-auto">
                            Submit quiz
                          </Button>
                        </form>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="border-t border-border p-4 bg-card shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {allLessons.indexOf(selectedLesson) > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const idx = allLessons.indexOf(selectedLesson);
                          if (idx > 0) setSelectedLessonId(allLessons[idx - 1].id);
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    {allLessons.indexOf(selectedLesson) < allLessons.length - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const idx = allLessons.indexOf(selectedLesson);
                          if (idx < allLessons.length - 1) setSelectedLessonId(allLessons[idx + 1].id);
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleMarkComplete}
                    disabled={completedLessonIds.has(selectedLesson.id) || recordProgressMutation.isPending}
                  >
                    {completedLessonIds.has(selectedLesson.id) ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      'Mark as complete'
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a lesson from the sidebar to start learning.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile lesson list */}
      <div className="md:hidden border-t border-border p-3 bg-card">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {allLessons.map((lesson) => {
              const isCompleted = completedLessonIds.has(lesson.id);
              const isSelected = selectedLesson?.id === lesson.id;
              return (
                <Button
                  key={lesson.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSelectLesson(lesson)}
                  className="shrink-0"
                >
                  {isCompleted && <Check className="h-3 w-3 mr-1" />}
                  <span className="truncate max-w-[120px]">{lesson.title}</span>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Learn;
