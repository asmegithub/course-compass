import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCourses,
  getCourseSections,
  getLessons,
  getQuizzes,
  getQuestions,
  getQuestionOptions,
  getQuizAttempts,
  getQuizAnswers,
  getMyEnrollments,
  type QuizAttemptPayload,
} from "@/lib/course-api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, CheckCircle2, XCircle, History } from "lucide-react";

const StudentQuizHistory = () => {
  const { user } = useAuth();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null,
  );

  const coursesQuery = useQuery({ queryKey: ["courses"], queryFn: getCourses });
  const sectionsQuery = useQuery({
    queryKey: ["course-sections"],
    queryFn: () => getCourseSections(),
  });
  const lessonsQuery = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
  });
  const quizzesQuery = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizzes(),
  });
  const questionsQuery = useQuery({
    queryKey: ["questions"],
    queryFn: () => getQuestions(),
  });
  const optionsQuery = useQuery({
    queryKey: ["question-options"],
    queryFn: () => getQuestionOptions(),
  });
  const enrollmentsQuery = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: getMyEnrollments,
    enabled: Boolean(user?.id),
  });
  const attemptsQuery = useQuery({
    queryKey: ["quiz-attempts", user?.id],
    queryFn: () =>
      getQuizAttempts(user?.id ? { studentId: user.id } : undefined),
    enabled: Boolean(user?.id),
  });
  const answersQuery = useQuery({
    queryKey: ["quiz-answers", user?.id],
    queryFn: () =>
      getQuizAnswers(user?.id ? { studentId: user.id } : undefined),
    enabled: Boolean(user?.id),
  });

  const isLoading =
    coursesQuery.isLoading ||
    sectionsQuery.isLoading ||
    lessonsQuery.isLoading ||
    quizzesQuery.isLoading ||
    questionsQuery.isLoading ||
    optionsQuery.isLoading ||
    enrollmentsQuery.isLoading ||
    attemptsQuery.isLoading ||
    answersQuery.isLoading;

  const enrolledCourseIds = useMemo(
    () =>
      new Set(
        (enrollmentsQuery.data ?? []).map((enrollment) => enrollment.courseId),
      ),
    [enrollmentsQuery.data],
  );

  const sectionById = useMemo(() => {
    const map = new Map<
      string,
      { id: string; courseId: string; title: string }
    >();
    for (const section of sectionsQuery.data ?? []) {
      map.set(section.id, {
        id: section.id,
        courseId: section.courseId,
        title: section.title,
      });
    }
    return map;
  }, [sectionsQuery.data]);

  const lessonById = useMemo(() => {
    const map = new Map<
      string,
      { id: string; title: string; courseId: string }
    >();
    for (const lesson of lessonsQuery.data ?? []) {
      const section = sectionById.get(lesson.sectionId);
      if (!section) continue;
      map.set(lesson.id, {
        id: lesson.id,
        title: lesson.title,
        courseId: section.courseId,
      });
    }
    return map;
  }, [lessonsQuery.data, sectionById]);

  const courseById = useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const course of coursesQuery.data ?? []) {
      map.set(course.id, { id: course.id, title: course.title });
    }
    return map;
  }, [coursesQuery.data]);

  const quizzesInMyCourses = useMemo(() => {
    return (quizzesQuery.data ?? []).filter((quiz) => {
      const lesson = lessonById.get(quiz.lessonId);
      if (!lesson) return false;
      return enrolledCourseIds.has(lesson.courseId);
    });
  }, [quizzesQuery.data, lessonById, enrolledCourseIds]);

  const attemptsByQuizId = useMemo(() => {
    const grouped = new Map<string, QuizAttemptPayload[]>();
    for (const attempt of attemptsQuery.data ?? []) {
      if (!attempt.quizId) continue;
      const existing = grouped.get(attempt.quizId) ?? [];
      existing.push(attempt);
      grouped.set(attempt.quizId, existing);
    }
    for (const [quizId, attempts] of grouped.entries()) {
      grouped.set(
        quizId,
        attempts
          .slice()
          .sort((a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0)),
      );
    }
    return grouped;
  }, [attemptsQuery.data]);

  const quizRows = useMemo(() => {
    return quizzesInMyCourses
      .map((quiz) => {
        const attempts = attemptsByQuizId.get(quiz.id) ?? [];
        const lesson = lessonById.get(quiz.lessonId);
        const course = lesson ? courseById.get(lesson.courseId) : undefined;
        const latest =
          attempts.length > 0 ? attempts[attempts.length - 1] : null;
        const best = attempts.reduce<number>(
          (max, attempt) => Math.max(max, attempt.score || 0),
          0,
        );
        return {
          quiz,
          attempts,
          lessonTitle: lesson?.title ?? "Lesson",
          courseTitle: course?.title ?? "Course",
          latest,
          best,
        };
      })
      .filter((item) => item.attempts.length > 0)
      .sort((a, b) => b.attempts.length - a.attempts.length);
  }, [quizzesInMyCourses, attemptsByQuizId, lessonById, courseById]);

  useEffect(() => {
    if (quizRows.length === 0) {
      setSelectedQuizId(null);
      setSelectedAttemptId(null);
      return;
    }
    if (
      !selectedQuizId ||
      !quizRows.some((row) => row.quiz.id === selectedQuizId)
    ) {
      setSelectedQuizId(quizRows[0].quiz.id);
    }
  }, [quizRows, selectedQuizId]);

  const selectedQuizRow = useMemo(
    () => quizRows.find((row) => row.quiz.id === selectedQuizId) ?? null,
    [quizRows, selectedQuizId],
  );

  useEffect(() => {
    if (!selectedQuizRow) {
      setSelectedAttemptId(null);
      return;
    }
    const attempts = selectedQuizRow.attempts;
    if (attempts.length === 0) {
      setSelectedAttemptId(null);
      return;
    }
    if (
      !selectedAttemptId ||
      !attempts.some((attempt) => attempt.id === selectedAttemptId)
    ) {
      setSelectedAttemptId(attempts[attempts.length - 1].id);
    }
  }, [selectedQuizRow, selectedAttemptId]);

  const selectedAttempt = useMemo(() => {
    if (!selectedQuizRow || !selectedAttemptId) return null;
    return (
      selectedQuizRow.attempts.find(
        (attempt) => attempt.id === selectedAttemptId,
      ) ?? null
    );
  }, [selectedQuizRow, selectedAttemptId]);

  const questionById = useMemo(() => {
    const map = new Map<string, (typeof questionsQuery.data)[number]>();
    for (const question of questionsQuery.data ?? []) {
      map.set(question.id, question);
    }
    return map;
  }, [questionsQuery.data]);

  const optionsByQuestionId = useMemo(() => {
    const map = new Map<string, typeof optionsQuery.data>();
    for (const option of optionsQuery.data ?? []) {
      const existing = map.get(option.questionId) ?? [];
      existing.push(option);
      map.set(option.questionId, existing);
    }
    return map;
  }, [optionsQuery.data]);

  const answersForSelectedAttempt = useMemo(() => {
    if (!selectedAttempt) return [];
    return (answersQuery.data ?? []).filter(
      (answer) => answer.attemptId === selectedAttempt.id,
    );
  }, [answersQuery.data, selectedAttempt]);

  const questionRows = useMemo(() => {
    if (!selectedQuizRow) return [];
    const quizQuestionList = (questionsQuery.data ?? [])
      .filter((question) => question.quizId === selectedQuizRow.quiz.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return quizQuestionList.map((question) => {
      const answer = answersForSelectedAttempt.find(
        (item) => item.questionId === question.id,
      );
      const options = optionsByQuestionId.get(question.id) ?? [];
      const selectedOption = answer?.selectedOptionId
        ? options.find((option) => option.id === answer.selectedOptionId)
        : undefined;
      const correctOptions = options.filter((option) => option.isCorrect);

      return {
        question,
        answer,
        selectedOptionText: selectedOption?.optionText ?? "No answer",
        correctAnswerText:
          correctOptions.map((option) => option.optionText).join(", ") ||
          "No correct option set",
      };
    });
  }, [
    selectedQuizRow,
    questionsQuery.data,
    answersForSelectedAttempt,
    optionsByQuestionId,
  ]);

  const totalAttempts = (attemptsQuery.data ?? []).length;
  const avgScore = totalAttempts
    ? Math.round(
        (attemptsQuery.data ?? []).reduce(
          (sum, attempt) => sum + (attempt.score || 0),
          0,
        ) / totalAttempts,
      )
    : 0;
  const passRate = totalAttempts
    ? Math.round(
        ((attemptsQuery.data ?? []).filter((attempt) => attempt.isPassed)
          .length /
          totalAttempts) *
          100,
      )
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Quiz History
          </h1>
          <p className="text-muted-foreground mt-1">
            Review all your attempts, score trends, and answer breakdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display">{totalAttempts}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Attempts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display">{avgScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average Score
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display">{passRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Pass Rate</p>
            </CardContent>
          </Card>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Loading quiz history...
          </p>
        )}

        {!isLoading && quizRows.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No quiz attempts yet. Complete a quiz from your enrolled courses
              to see history.
            </CardContent>
          </Card>
        )}

        {!isLoading && quizRows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Attempted Quizzes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quizRows.map((row) => (
                  <button
                    key={row.quiz.id}
                    className={`w-full text-left rounded-md border p-3 transition-colors ${selectedQuizId === row.quiz.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                    onClick={() => setSelectedQuizId(row.quiz.id)}
                  >
                    <p className="text-sm font-medium truncate">
                      {row.quiz.title || "Quiz"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {row.courseTitle} · {row.lessonTitle}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{row.attempts.length} attempts</span>
                      <span>Best {Math.round(row.best)}%</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {selectedQuizRow && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Score Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Latest
                          </p>
                          <p className="text-lg font-semibold">
                            {Math.round(selectedQuizRow.latest?.score || 0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Best</p>
                          <p className="text-lg font-semibold">
                            {Math.round(selectedQuizRow.best)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Attempts
                          </p>
                          <p className="text-lg font-semibold">
                            {selectedQuizRow.attempts.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Course
                          </p>
                          <p className="text-sm font-medium truncate">
                            {selectedQuizRow.courseTitle}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {selectedQuizRow.attempts.map((attempt) => {
                          const score = Math.max(
                            0,
                            Math.min(100, Math.round(attempt.score || 0)),
                          );
                          return (
                            <button
                              key={attempt.id}
                              className={`w-full rounded-md border px-3 py-2 text-left ${selectedAttemptId === attempt.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                              onClick={() => setSelectedAttemptId(attempt.id)}
                            >
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>
                                  Attempt #{attempt.attemptNumber || 0}
                                </span>
                                <span>{score}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full ${attempt.isPassed ? "bg-emerald-500" : "bg-amber-500"}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Answer Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAttempt ? (
                        <>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline">
                              Attempt #{selectedAttempt.attemptNumber || 0}
                            </Badge>
                            <span>
                              {Math.round(selectedAttempt.score || 0)}%
                            </span>
                            <span>
                              {selectedAttempt.isPassed
                                ? "Passed"
                                : "Not passed"}
                            </span>
                          </div>
                          {questionRows.map((row, index) => {
                            const isCorrect = Boolean(row.answer?.isCorrect);
                            return (
                              <div
                                key={row.question.id}
                                className="rounded-md border p-3"
                              >
                                <p className="text-sm font-medium">
                                  {index + 1}. {row.question.questionText}
                                </p>
                                <div className="mt-2 text-xs space-y-1">
                                  <p>
                                    <span className="text-muted-foreground">
                                      Your answer:
                                    </span>{" "}
                                    <span
                                      className={
                                        isCorrect
                                          ? "text-emerald-600"
                                          : "text-amber-600"
                                      }
                                    >
                                      {row.selectedOptionText}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="text-muted-foreground">
                                      Correct answer:
                                    </span>{" "}
                                    <span>{row.correctAnswerText}</span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    {isCorrect ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-amber-600" />
                                    )}
                                    <span>
                                      {isCorrect ? "Correct" : "Needs review"}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {questionRows.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No detailed answers found for this attempt.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Select an attempt to review answers.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentQuizHistory;
