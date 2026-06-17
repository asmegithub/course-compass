import { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  Check,
  Play,
  FileText,
  BookOpen,
  Loader2,
  Award,
  BookmarkPlus,
  Bookmark,
  Trash2,
} from "lucide-react";
import { formatDuration } from "@/lib/formatters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourses,
  getCourseById,
  getCourseSections,
  getLessons,
  getMyCourseEnrollment,
  getLessonProgresses,
  recordLessonProgress,
  getQuizzes,
  getQuestions,
  getQuestionOptions,
  getQuizAttempts,
  createQuizAttempt,
  createQuizAnswer,
  getVideoProgress,
  upsertVideoProgress,
  getBookmarks,
  createBookmark,
  deleteBookmark,
  getLessonNotes,
  createLessonNote,
  deleteLessonNote,
  getQuizAnswers,
  getLessonResources,
  createDownload,
  type LessonPayload,
  type CourseSectionPayload,
  type QuizPayload,
  type QuizAttemptPayload,
  type QuestionPayload,
  type QuestionOptionPayload,
} from "@/lib/course-api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const toAbsoluteMediaUrl = (url?: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatInlineMarkdown = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
};

const renderLessonTextHtml = (rawContent: string) => {
  const content = rawContent.trim();
  if (!content) return "";

  // Keep backward compatibility with previously stored HTML content.
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  const htmlParts: string[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    htmlParts.push(`<p>${formatInlineMarkdown(paragraphBuffer.join(" "))}</p>`);
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    htmlParts.push(
      `<ul style="list-style:disc;padding-left:1.5rem;margin:0.75rem 0;">${listBuffer.map((item) => `<li style="margin:0.35rem 0;">${formatInlineMarkdown(item)}</li>`).join("")}</ul>`,
    );
    listBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const headingMatch = /^(#{1,3})\s*(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (headingText) {
        htmlParts.push(
          `<h${level}>${formatInlineMarkdown(headingText)}</h${level}>`,
        );
        continue;
      }
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
      flushParagraph();
      listBuffer.push(trimmed.slice(2));
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  return htmlParts.join("\n");
};

const Learn = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slugValue = slug || "";
  const isUuidSlug = isUuid(slugValue);
  const requestedLessonId = searchParams.get("lesson");

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<string, string>>(
    {},
  );
  const [quizSubmitted, setQuizSubmitted] = useState<{
    earned: number;
    total: number;
    passed: boolean;
  } | null>(null);
  const [quizStartedAt, setQuizStartedAt] = useState<number>(Date.now());
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [lessonNoteContent, setLessonNoteContent] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoResumeAppliedRef = useRef(false);
  const lastSavedPositionRef = useRef(0);
  const lastSaveTimeRef = useRef(0);
  const lastEnrollmentProgressRefreshRef = useRef(0);
  const videoCompletionRecordedRef = useRef(false);

  // Lesson.duration is stored in minutes in this codebase.
  // (We also track real video completion using the HTML video duration in seconds.)

  const courseByIdQuery = useQuery({
    queryKey: ["course", slugValue],
    queryFn: () => getCourseById(slugValue),
    enabled: Boolean(slugValue) && isUuidSlug,
  });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
    enabled: Boolean(slugValue) && !isUuidSlug,
  });

  const course = isUuidSlug
    ? courseByIdQuery.data
    : coursesQuery.data?.find((c) => c.slug === slugValue);

  const enrollmentQuery = useQuery({
    queryKey: ["my-course-enrollment", course?.id, user?.id],
    queryFn: () => getMyCourseEnrollment(course!.id),
    enabled: Boolean(course?.id) && isLoggedIn,
  });

  const enrollment = enrollmentQuery.data ?? null;

  const sectionsQuery = useQuery({
    queryKey: ["course-sections", course?.id],
    queryFn: () => getCourseSections(course!.id),
    enabled: Boolean(course?.id),
  });

  const lessonsQuery = useQuery({
    queryKey: ["lessons", course?.id],
    queryFn: () => getLessons(course!.id),
    enabled: Boolean(course?.id),
  });

  const progressQuery = useQuery({
    queryKey: ["lesson-progresses", enrollment?.id],
    queryFn: () => getLessonProgresses(enrollment!.id),
    enabled: Boolean(enrollment?.id),
  });

  const recordProgressMutation = useMutation({
    mutationFn: ({
      lessonId,
      status,
    }: {
      lessonId: string;
      status: "IN_PROGRESS" | "COMPLETED";
    }) => recordLessonProgress(enrollment!.id, lessonId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-progresses", enrollment?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-course-enrollment", course?.id, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments", user?.id] });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Progress update failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", selectedLessonId],
    queryFn: () =>
      getQuizzes(selectedLessonId ? { lessonId: selectedLessonId } : undefined),
    enabled: Boolean(selectedLessonId),
  });
  const questionsQuery = useQuery({
    queryKey: ["questions", selectedLessonId],
    queryFn: async () => {
      if (!selectedLessonId) return [];
      const quizzes = await getQuizzes({ lessonId: selectedLessonId });
      if (quizzes.length === 0) return [];
      return getQuestions({ quizId: quizzes[0].id });
    },
    enabled: Boolean(selectedLessonId),
  });
  const optionsQuery = useQuery({
    queryKey: ["question-options", selectedLessonId],
    queryFn: async () => {
      if (!selectedLessonId) return [];
      const quizzes = await getQuizzes({ lessonId: selectedLessonId });
      if (quizzes.length === 0) return [];
      const questions = await getQuestions({ quizId: quizzes[0].id });
      if (questions.length === 0) return [];
      return getQuestionOptions({ quizId: quizzes[0].id });
    },
    enabled: Boolean(selectedLessonId),
  });
  const quizAttemptsQuery = useQuery({
    queryKey: ["quiz-attempts", user?.id, selectedLessonId],
    queryFn: async () => {
      if (!user?.id || !selectedLessonId) return [];
      const quizzes = await getQuizzes({ lessonId: selectedLessonId });
      if (quizzes.length === 0) return [];
      return getQuizAttempts({ studentId: user.id, quizId: quizzes[0].id });
    },
    enabled: Boolean(user?.id && selectedLessonId),
  });
  const quizAnswersQuery = useQuery({
    queryKey: ["quiz-answers", user?.id, selectedLessonId],
    queryFn: async () => {
      if (!user?.id || !selectedLessonId) return [];
      const quizzes = await getQuizzes({ lessonId: selectedLessonId });
      if (quizzes.length === 0) return [];
      return getQuizAnswers({ studentId: user.id });
    },
    enabled: Boolean(user?.id && selectedLessonId),
  });

  const videoProgressQuery = useQuery({
    queryKey: ["video-progress", enrollment?.id, selectedLessonId],
    queryFn: () => getVideoProgress(enrollment!.id, selectedLessonId!),
    enabled: Boolean(enrollment?.id && selectedLessonId),
  });

  const upsertVideoProgressMutation = useMutation({
    mutationFn: (payload: {
      lastWatchedPosition: number;
      watchedDuration: number;
      totalDuration: number;
    }) =>
      upsertVideoProgress(
        enrollment!.id,
        selectedLesson!.id,
        payload.lastWatchedPosition,
        payload.watchedDuration,
        payload.totalDuration,
      ),
    onSuccess: () => {
      // Avoid spamming enrollment refetch on every 15s time update.
      const now = Date.now();
      if (now - lastEnrollmentProgressRefreshRef.current < 15000) return;
      lastEnrollmentProgressRefreshRef.current = now;
      queryClient.invalidateQueries({
        queryKey: ["my-course-enrollment", course?.id, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["lesson-progresses", enrollment?.id],
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Video progress save failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks", selectedLessonId],
    queryFn: () => getBookmarks(selectedLessonId!),
    enabled: Boolean(selectedLessonId),
  });
  const createBookmarkMutation = useMutation({
    mutationFn: (payload: { timestamp: number; note?: string }) =>
      createBookmark({
        courseId: course!.id,
        lessonId: selectedLesson!.id,
        timestamp: payload.timestamp,
        note: payload.note ?? "",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", selectedLesson?.id],
      }),
  });
  const deleteBookmarkMutation = useMutation({
    mutationFn: deleteBookmark,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", selectedLesson?.id],
      }),
  });
  const lessonNotesQuery = useQuery({
    queryKey: ["lesson-notes", selectedLessonId, user?.id],
    queryFn: () => getLessonNotes(selectedLessonId || undefined),
    enabled: Boolean(selectedLessonId && user?.id),
  });
  const lessonResourcesQuery = useQuery({
    queryKey: ["lesson-resources", selectedLessonId],
    queryFn: () =>
      getLessonResources(
        selectedLessonId ? { lessonId: selectedLessonId } : undefined,
      ),
    enabled: Boolean(selectedLessonId),
  });
  const createLessonNoteMutation = useMutation({
    mutationFn: (payload: { content: string; timestamp?: number }) =>
      createLessonNote({
        lessonId: selectedLesson!.id,
        studentId: user!.id,
        content: payload.content,
        timestamp: payload.timestamp ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-notes", selectedLesson?.id, user?.id],
      });
      setLessonNoteContent("");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to save lesson note.";
      toast({
        title: "Could not save note",
        description: message,
        variant: "destructive",
      });
    },
  });
  const deleteLessonNoteMutation = useMutation({
    mutationFn: deleteLessonNote,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-notes", selectedLesson?.id, user?.id],
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete lesson note.";
      toast({
        title: "Could not delete note",
        description: message,
        variant: "destructive",
      });
    },
  });
  const createDownloadMutation = useMutation({
    mutationFn: (payload: { fileUrl: string; fileSize?: number }) =>
      createDownload({
        lessonId: selectedLesson!.id,
        userId: user!.id,
        fileUrl: payload.fileUrl,
        fileSize: payload.fileSize,
        videoQuality: "ORIGINAL",
      }),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to record download.";
      toast({
        title: "Download logging failed",
        description: message,
        variant: "destructive",
      });
    },
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
    () =>
      new Set(
        (progressQuery.data || [])
          .filter((p) => p.status === "COMPLETED")
          .map((p) => p.lessonId),
      ),
    [progressQuery.data],
  );

  const allLessons = useMemo(
    () => curriculumSections.flatMap((s) => s.lessons),
    [curriculumSections],
  );

  const selectedLesson = useMemo(() => {
    if (selectedLessonId)
      return allLessons.find((l) => l.id === selectedLessonId);
    return allLessons[0] ?? null;
  }, [selectedLessonId, allLessons]);

  useEffect(() => {
    if (allLessons.length === 0 || selectedLessonId) return;
    const hasRequestedLesson =
      requestedLessonId &&
      allLessons.some((lesson) => lesson.id === requestedLessonId);
    if (hasRequestedLesson && requestedLessonId) {
      setSelectedLessonId(requestedLessonId);
      return;
    }
    const resumeLessonId = enrollment?.lastAccessedLessonId;
    const hasResumeLesson =
      resumeLessonId &&
      allLessons.some((lesson) => lesson.id === resumeLessonId);
    if (hasResumeLesson && resumeLessonId) {
      setSelectedLessonId(resumeLessonId);
      return;
    }
    setSelectedLessonId(allLessons[0].id);
  }, [
    allLessons,
    selectedLessonId,
    enrollment?.lastAccessedLessonId,
    requestedLessonId,
  ]);

  useEffect(() => {
    setQuizSelections({});
    setQuizSubmitted(null);
    setQuizStartedAt(Date.now());
    setLessonNoteContent("");
    videoResumeAppliedRef.current = false;
    videoCompletionRecordedRef.current = false;
  }, [selectedLessonId]);

  const videoProgress = videoProgressQuery.data ?? null;
  useEffect(() => {
    if (selectedLesson?.type !== "VIDEO" || videoResumeAppliedRef.current)
      return;
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
    if (!v || !enrollment || !selectedLesson || selectedLesson.type !== "VIDEO")
      return;
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
    const position = Math.floor(v.currentTime);

    // If the browser doesn't reliably fire `onEnded`, complete when we're at the end
    // (within a small tolerance).
    if (
      selectedLesson.type === "VIDEO" &&
      !videoCompletionRecordedRef.current
    ) {
      const duration =
        Number.isFinite(v.duration) && v.duration > 0
          ? Math.floor(v.duration)
          : 0;
      const tolerance = 2;
      if (duration > 0 && position > 0 && position >= duration - tolerance) {
        void handleVideoEnded();
      }
    }

    if (now - lastSaveTimeRef.current < 15000) return;
    if (position > 0 && position !== lastSavedPositionRef.current) {
      const duration =
        Number.isFinite(v.duration) && v.duration > 0
          ? Math.floor(v.duration)
          : position;
      lastSavedPositionRef.current = position;
      lastSaveTimeRef.current = now;
      upsertVideoProgressMutation.mutate({
        lastWatchedPosition: position,
        watchedDuration: position,
        totalDuration: duration,
      });
    }
  };

  const renderedTextContent = useMemo(
    () =>
      selectedLesson?.type === "TEXT" && selectedLesson.content
        ? renderLessonTextHtml(selectedLesson.content)
        : "",
    [selectedLesson?.type, selectedLesson?.content],
  );
  const notesForCurrentLesson = useMemo(() => {
    const notes = lessonNotesQuery.data ?? [];
    return notes
      .filter(
        (note) =>
          note.lessonId === selectedLesson?.id && note.studentId === user?.id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
  }, [lessonNotesQuery.data, selectedLesson?.id, user?.id]);
  const estimatedReadingMinutes = useMemo(() => {
    if (selectedLesson?.type !== "TEXT" || !selectedLesson.content) return 0;
    const plainText = selectedLesson.content.replace(/<[^>]*>/g, " ").trim();
    if (!plainText) return 0;
    const words = plainText.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [selectedLesson?.type, selectedLesson?.content]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-foreground font-medium">Loading session...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(`/courses/${slugValue}/learn`)}`}
        replace
      />
    );
  }

  if (course && enrollmentQuery.isSuccess && !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <p className="text-foreground mb-4">
            You are not enrolled in this course.
          </p>
          <Button asChild>
            <Link to={`/courses/${slugValue}`}>View course & enroll</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-foreground font-medium">Loading course...</p>
      </div>
    );
  }

  const progressPercent = enrollment.progress ?? 0;

  const handleMarkComplete = () => {
    if (!selectedLesson) return;
    recordProgressMutation.mutate({
      lessonId: selectedLesson.id,
      status: "COMPLETED",
    });
  };

  const handleSelectLesson = (lesson: LessonPayload) => {
    setSelectedLessonId(lesson.id);
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("lesson", lesson.id);
        return next;
      },
      { replace: true },
    );
    recordProgressMutation.mutate({
      lessonId: lesson.id,
      status: "IN_PROGRESS",
    });
  };
  const handleVideoEnded = async () => {
    if (!selectedLesson || selectedLesson.type !== "VIDEO") return;
    if (videoCompletionRecordedRef.current) return;
    videoCompletionRecordedRef.current = true;
    const currentIndex = allLessons.findIndex(
      (lesson) => lesson.id === selectedLesson.id,
    );
    const nextLesson =
      currentIndex >= 0 && currentIndex < allLessons.length - 1
        ? allLessons[currentIndex + 1]
        : null;

    try {
      // Ensure final watched state is persisted before marking lesson completed.
      const v = videoRef.current;
      if (v && enrollment) {
        const finalPos = Math.floor(v.currentTime);
        const duration =
          Number.isFinite(v.duration) && v.duration > 0
            ? Math.floor(v.duration)
            : finalPos;
        if (finalPos > 0) {
          await upsertVideoProgressMutation.mutateAsync({
            lastWatchedPosition: finalPos,
            watchedDuration: finalPos,
            totalDuration: duration,
          });
        }
      }

      await recordProgressMutation.mutateAsync({
        lessonId: selectedLesson.id,
        status: "COMPLETED",
      });
      if (nextLesson) {
        handleSelectLesson(nextLesson);
      }
    } catch {
      // keep user on current lesson if completion recording fails
      toast({
        title: "Could not complete video lesson",
        description:
          "Progress was not recorded. Please try again or check network requests.",
        variant: "destructive",
      });
    }
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
            <h1 className="font-semibold truncate text-sm sm:text-base">
              {course.title}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {enrollment.completedLessonsCount} of {allLessons.length} lessons
              · {Math.round(progressPercent)}% complete
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
                              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                              isSelected && "bg-accent text-accent-foreground",
                              !isSelected && "hover:bg-muted",
                            )}
                          >
                            {isCompleted ? (
                              <Check className="h-4 w-4 shrink-0 text-green-600" />
                            ) : lesson.type === "VIDEO" ? (
                              <Play className="h-4 w-4 shrink-0" />
                            ) : lesson.type === "QUIZ" ? (
                              <Award className="h-4 w-4 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0" />
                            )}
                            <span className="flex-1 truncate">
                              {lesson.title}
                            </span>
                            {lesson.duration > 0 && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDuration(Number(lesson.duration ?? 0))}
                              </span>
                            )}
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
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.type === "VIDEO" &&
                    selectedLesson.videoUrl && (
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
                            onEnded={handleVideoEnded}
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
                                onChange={(e) =>
                                  setBookmarkNote(e.target.value)
                                }
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
                                  createBookmarkMutation.mutate({
                                    timestamp,
                                    note: bookmarkNote.trim(),
                                  });
                                  setBookmarkNote("");
                                }}
                              >
                                <BookmarkPlus className="h-3 w-3" /> Add at
                                current time
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
                                    if (videoRef.current && b.timestamp != null)
                                      videoRef.current.currentTime =
                                        b.timestamp;
                                  }}
                                >
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {Math.floor((b.timestamp ?? 0) / 60)}:
                                    {(b.timestamp ?? 0) % 60 < 10 ? "0" : ""}
                                    {(b.timestamp ?? 0) % 60}
                                  </span>
                                  {b.note && (
                                    <span className="ml-2 truncate">
                                      {b.note}
                                    </span>
                                  )}
                                </button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() =>
                                    deleteBookmarkMutation.mutate(b.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </li>
                            ))}
                            {(bookmarksQuery.data ?? []).length === 0 && (
                              <li className="text-xs text-muted-foreground py-2">
                                No bookmarks. Pause at a position and click
                                &quot;Add at current time&quot;.
                              </li>
                            )}
                          </ul>
                        </div>
                      </>
                    )}
                  {selectedLesson.type === "DOCUMENT" &&
                    selectedLesson.documentUrl && (
                      <div className="mb-6">
                        <a
                          href={toAbsoluteMediaUrl(selectedLesson.documentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline"
                        >
                          Open document
                        </a>
                      </div>
                    )}

                  {(selectedLesson.isDownloadable ||
                    (lessonResourcesQuery.data ?? []).some(
                      (resource) => resource.lessonId === selectedLesson.id,
                    ) ||
                    selectedLesson.documentUrl) && (
                    <div className="mb-6 rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="font-medium text-sm">
                          Downloadable resources
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {(lessonResourcesQuery.data ?? []).filter(
                            (resource) =>
                              resource.lessonId === selectedLesson.id,
                          ).length > 0
                            ? `${(lessonResourcesQuery.data ?? []).filter((resource) => resource.lessonId === selectedLesson.id).length} file(s)`
                            : "1 file"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(lessonResourcesQuery.data ?? [])
                          .filter(
                            (resource) =>
                              resource.lessonId === selectedLesson.id,
                          )
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {resource.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {resource.type}
                                  {resource.fileSize > 0
                                    ? ` • ${(resource.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                    : ""}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={createDownloadMutation.isPending}
                                onClick={() => {
                                  void createDownloadMutation.mutateAsync({
                                    fileUrl: toAbsoluteMediaUrl(resource.url),
                                    fileSize: resource.fileSize,
                                  });
                                }}
                                asChild
                              >
                                <a
                                  href={toAbsoluteMediaUrl(resource.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  Download
                                </a>
                              </Button>
                            </div>
                          ))}

                        {selectedLesson.documentUrl &&
                          (lessonResourcesQuery.data ?? []).filter(
                            (resource) =>
                              resource.lessonId === selectedLesson.id,
                          ).length === 0 && (
                            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {selectedLesson.title} attachment
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Lesson file
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={createDownloadMutation.isPending}
                                onClick={() => {
                                  void createDownloadMutation.mutateAsync({
                                    fileUrl: toAbsoluteMediaUrl(
                                      selectedLesson.documentUrl,
                                    ),
                                  });
                                }}
                                asChild
                              >
                                <a
                                  href={toAbsoluteMediaUrl(
                                    selectedLesson.documentUrl,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  Download
                                </a>
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                  {selectedLesson.type === "TEXT" && selectedLesson.content && (
                    <div className="mb-6 rounded-lg border border-border bg-card p-4 sm:p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-medium">Reading lesson</h3>
                        {estimatedReadingMinutes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ~{estimatedReadingMinutes} min read
                          </span>
                        )}
                      </div>
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: renderedTextContent,
                        }}
                      />
                      <div className="mt-5 flex justify-end">
                        <Button
                          onClick={handleMarkComplete}
                          disabled={
                            completedLessonIds.has(selectedLesson.id) ||
                            recordProgressMutation.isPending
                          }
                        >
                          {completedLessonIds.has(selectedLesson.id) ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            "Mark as completed"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="font-medium text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Lesson notes
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Write a note for this lesson"
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs flex-1"
                        value={lessonNoteContent}
                        onChange={(e) => setLessonNoteContent(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          !lessonNoteContent.trim() ||
                          createLessonNoteMutation.isPending
                        }
                        onClick={() => {
                          if (!selectedLesson || !user?.id) return;
                          const timestamp =
                            selectedLesson.type === "VIDEO" && videoRef.current
                              ? Math.floor(videoRef.current.currentTime)
                              : 0;
                          createLessonNoteMutation.mutate({
                            content: lessonNoteContent.trim(),
                            timestamp,
                          });
                        }}
                      >
                        Add note
                      </Button>
                    </div>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {notesForCurrentLesson.map((note) => (
                        <li
                          key={note.id}
                          className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                        >
                          <button
                            type="button"
                            className="text-left flex-1 min-w-0"
                            onClick={() => {
                              if (
                                selectedLesson.type === "VIDEO" &&
                                videoRef.current &&
                                note.timestamp >= 0
                              ) {
                                videoRef.current.currentTime = note.timestamp;
                              }
                            }}
                          >
                            {selectedLesson.type === "VIDEO" && (
                              <span className="font-mono text-xs text-muted-foreground mr-2">
                                {Math.floor((note.timestamp ?? 0) / 60)}:
                                {(note.timestamp ?? 0) % 60 < 10 ? "0" : ""}
                                {(note.timestamp ?? 0) % 60}
                              </span>
                            )}
                            <span className="truncate">{note.content}</span>
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() =>
                              deleteLessonNoteMutation.mutate(note.id)
                            }
                            disabled={deleteLessonNoteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                      {!lessonNotesQuery.isLoading &&
                        notesForCurrentLesson.length === 0 && (
                          <li className="text-xs text-muted-foreground py-2">
                            No notes yet for this lesson.
                          </li>
                        )}
                      {lessonNotesQuery.isLoading && (
                        <li className="text-xs text-muted-foreground py-2">
                          Loading notes...
                        </li>
                      )}
                    </ul>
                  </div>

                  {selectedLesson.type === "QUIZ" &&
                    (() => {
                      const quizzes = quizzesQuery.data ?? [];
                      const quiz: QuizPayload | undefined = quizzes.find(
                        (q) => q.lessonId === selectedLesson.id,
                      );
                      const allQuestions = questionsQuery.data ?? [];
                      const allOptions = optionsQuery.data ?? [];
                      const questions: QuestionPayload[] = quiz
                        ? allQuestions
                            .filter((q) => q.quizId === quiz.id)
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                        : [];
                      const optionsByQuestion = allOptions.reduce<
                        Record<string, QuestionOptionPayload[]>
                      >((acc, o) => {
                        if (!acc[o.questionId]) acc[o.questionId] = [];
                        acc[o.questionId].push(o);
                        return acc;
                      }, {});
                      const attempts: QuizAttemptPayload[] = (
                        quizAttemptsQuery.data ?? []
                      ).filter(
                        (a) =>
                          a.quizId === quiz?.id && a.studentId === user?.id,
                      );
                      const attemptsUsed = attempts.length;
                      const maxAttempts = Math.max(
                        0,
                        Number(quiz?.maxAttempts ?? 0),
                      );
                      const attemptsRemaining =
                        maxAttempts === 0
                          ? Infinity
                          : Math.max(0, maxAttempts - attemptsUsed);
                      const limitReached =
                        maxAttempts > 0 && attemptsRemaining <= 0;
                      const totalPoints = questions.reduce(
                        (sum, q) => sum + q.points,
                        0,
                      );
                      const handleQuizSubmit = async () => {
                        if (!quiz) return;
                        if (!user?.id) {
                          toast({
                            title: "Login required",
                            description:
                              "Please sign in to submit quiz attempts.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (limitReached) {
                          toast({
                            title: "Attempt limit reached",
                            description: "No attempts remaining for this quiz.",
                            variant: "destructive",
                          });
                          return;
                        }

                        let earned = 0;
                        const evaluatedAnswers = questions.map((q) => {
                          const selectedId = quizSelections[q.id];
                          const opts = (optionsByQuestion[q.id] ?? []).sort(
                            (a, b) => a.orderIndex - b.orderIndex,
                          );
                          const selected = opts.find(
                            (o) => o.id === selectedId,
                          );
                          const isCorrect = Boolean(selected?.isCorrect);
                          const pointsEarned = isCorrect ? q.points : 0;
                          if (isCorrect) earned += q.points;
                          return {
                            questionId: q.id,
                            selectedOptionId: selectedId,
                            isCorrect,
                            pointsEarned,
                          };
                        });
                        const passed =
                          totalPoints > 0 &&
                          (earned / totalPoints) * 100 >= quiz.passingScore;

                        try {
                          const elapsedSeconds = Math.max(
                            0,
                            Math.floor((Date.now() - quizStartedAt) / 1000),
                          );
                          const attempt = await createQuizAttempt({
                            studentId: user.id,
                            quizId: quiz.id,
                            score:
                              totalPoints > 0
                                ? Number(
                                    ((earned / totalPoints) * 100).toFixed(2),
                                  )
                                : 0,
                            totalPoints: earned,
                            maxPoints: totalPoints,
                            isPassed: passed,
                            attemptNumber: attemptsUsed + 1,
                            timeTaken: elapsedSeconds,
                            startedAt: new Date(quizStartedAt).toISOString(),
                          });

                          await Promise.all(
                            evaluatedAnswers.map((answer) =>
                              createQuizAnswer({
                                attemptId: attempt.id,
                                questionId: answer.questionId,
                                selectedOptionId: answer.selectedOptionId,
                                isCorrect: answer.isCorrect,
                                pointsEarned: answer.pointsEarned,
                              }),
                            ),
                          );

                          await queryClient.invalidateQueries({
                            queryKey: ["quiz-attempts", user.id],
                          });
                          setQuizSubmitted({
                            earned,
                            total: totalPoints,
                            passed,
                          });
                        } catch (err) {
                          const message =
                            err instanceof Error
                              ? err.message
                              : "Unable to submit quiz attempt.";
                          toast({
                            title: "Quiz submission failed",
                            description: message,
                            variant: "destructive",
                          });
                        }
                      };
                      if (
                        quizzesQuery.isLoading ||
                        questionsQuery.isLoading ||
                        optionsQuery.isLoading ||
                        quizAttemptsQuery.isLoading
                      ) {
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

                      const latestAttempt =
                        attempts
                          .slice()
                          .sort(
                            (a, b) =>
                              (b.attemptNumber || 0) - (a.attemptNumber || 0),
                          )[0] || null;
                      const bestAttempt =
                        attempts.reduce<QuizAttemptPayload | null>(
                          (best, attempt) => {
                            if (!best) return attempt;
                            return (attempt.score ?? 0) > (best.score ?? 0)
                              ? attempt
                              : best;
                          },
                          null,
                        );
                      const answersForLatestAttempt = latestAttempt
                        ? (quizAnswersQuery.data ?? []).filter(
                            (answer) => answer.attemptId === latestAttempt.id,
                          )
                        : [];

                      if (quizSubmitted !== null) {
                        return (
                          <div className="space-y-4 py-4">
                            <div className="rounded-lg border border-border bg-card p-6 text-center">
                              <Award className="h-12 w-12 mx-auto mb-3 text-primary" />
                              <h3 className="font-semibold text-lg">
                                {quizSubmitted.passed
                                  ? "Passed!"
                                  : "Not passed"}
                              </h3>
                              <p className="text-muted-foreground mt-1">
                                You scored {quizSubmitted.earned} out of{" "}
                                {quizSubmitted.total} (
                                {quizSubmitted.total > 0
                                  ? Math.round(
                                      (quizSubmitted.earned /
                                        quizSubmitted.total) *
                                        100,
                                    )
                                  : 0}
                                %). Passing score is {quiz.passingScore}%.
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                              <p className="font-medium mb-1">Attempts</p>
                              <p className="text-muted-foreground">
                                Used: {attemptsUsed + 1}
                                {maxAttempts > 0
                                  ? ` / ${maxAttempts}`
                                  : " (unlimited)"}
                              </p>
                              {bestAttempt && (
                                <p className="text-muted-foreground mt-1">
                                  Best recorded score before this submission:{" "}
                                  {Math.round(bestAttempt.score)}%
                                </p>
                              )}
                              {latestAttempt &&
                                answersForLatestAttempt.length > 0 && (
                                  <div className="mt-4 text-left border-t pt-4">
                                    <p className="font-medium text-sm mb-2">
                                      Answer review
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {questions.map((question) => {
                                        const answer =
                                          answersForLatestAttempt.find(
                                            (item) =>
                                              item.questionId === question.id,
                                          );
                                        const selectedOption =
                                          answer?.selectedOptionId
                                            ? (
                                                optionsByQuestion[
                                                  question.id
                                                ] ?? []
                                              ).find(
                                                (option) =>
                                                  option.id ===
                                                  answer.selectedOptionId,
                                              )
                                            : undefined;
                                        const correctOption = (
                                          optionsByQuestion[question.id] ?? []
                                        ).find((option) => option.isCorrect);
                                        return (
                                          <div
                                            key={question.id}
                                            className="rounded-md border p-3 text-sm"
                                          >
                                            <p className="font-medium">
                                              {question.questionText}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Your answer:{" "}
                                              {selectedOption?.optionText ||
                                                "Not answered"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Correct answer:{" "}
                                              {correctOption?.optionText ||
                                                "Not available"}
                                            </p>
                                            <p
                                              className={`text-xs mt-1 ${answer?.isCorrect ? "text-success" : "text-destructive"}`}
                                            >
                                              {answer?.isCorrect
                                                ? "Correct"
                                                : "Incorrect"}
                                              {typeof answer?.pointsEarned ===
                                              "number"
                                                ? ` • ${answer.pointsEarned} points`
                                                : ""}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
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
                            <h3 className="font-semibold text-lg">
                              {quiz.title}
                            </h3>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {quiz.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Attempts: {attemptsUsed}
                              {Number.isFinite(attemptsRemaining)
                                ? ` / ${maxAttempts} (remaining ${attemptsRemaining})`
                                : " (unlimited)"}
                            </p>
                            <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                              Attempts used: {attemptsUsed}
                              {maxAttempts > 0
                                ? ` / ${maxAttempts}`
                                : " (unlimited)"}
                              {maxAttempts > 0 && (
                                <span className="ml-2">
                                  • Remaining: {attemptsRemaining}
                                </span>
                              )}
                              {bestAttempt && (
                                <span className="ml-2">
                                  • Best: {Math.round(bestAttempt.score)}%
                                </span>
                              )}
                              {quizAnswersQuery.isLoading && (
                                <span className="ml-2">
                                  • Loading answer review…
                                </span>
                              )}
                            </div>
                            {attempts.length > 0 && (
                              <div className="mt-3 rounded-lg border border-border p-3">
                                <p className="text-xs font-medium mb-2">
                                  Previous attempts
                                </p>
                                <ul className="space-y-1 text-xs text-muted-foreground max-h-28 overflow-y-auto">
                                  {attempts
                                    .slice()
                                    .sort(
                                      (a, b) =>
                                        (b.attemptNumber || 0) -
                                        (a.attemptNumber || 0),
                                    )
                                    .map((attempt) => (
                                      <li
                                        key={attempt.id}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <span>
                                          Attempt #{attempt.attemptNumber || 0}
                                        </span>
                                        <span>
                                          {Math.round(attempt.score)}%{" "}
                                          {attempt.isPassed
                                            ? "• Passed"
                                            : "• Not passed"}
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <form
                            className="space-y-6"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void handleQuizSubmit();
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
                                          checked={
                                            quizSelections[q.id] === opt.id
                                          }
                                          onChange={() =>
                                            setQuizSelections((prev) => ({
                                              ...prev,
                                              [q.id]: opt.id,
                                            }))
                                          }
                                          className="h-4 w-4"
                                        />
                                        <span className="text-sm">
                                          {opt.optionText}
                                        </span>
                                      </label>
                                    ))}
                                </div>
                              </div>
                            ))}
                            <Button
                              type="submit"
                              className="w-full sm:w-auto"
                              disabled={limitReached}
                            >
                              {limitReached
                                ? "No attempts left"
                                : "Submit quiz"}
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
                          if (idx > 0) handleSelectLesson(allLessons[idx - 1]);
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    {allLessons.indexOf(selectedLesson) <
                      allLessons.length - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const idx = allLessons.indexOf(selectedLesson);
                          if (idx < allLessons.length - 1)
                            handleSelectLesson(allLessons[idx + 1]);
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                  {selectedLesson.type !== "TEXT" && (
                    <Button
                      onClick={handleMarkComplete}
                      disabled={
                        completedLessonIds.has(selectedLesson.id) ||
                        recordProgressMutation.isPending
                      }
                    >
                      {completedLessonIds.has(selectedLesson.id) ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        "Mark as complete"
                      )}
                    </Button>
                  )}
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
                  variant={isSelected ? "default" : "outline"}
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
