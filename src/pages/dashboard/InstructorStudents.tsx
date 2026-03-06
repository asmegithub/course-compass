import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Mail,
  TrendingUp,
  GraduationCap,
  Clock,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyInstructorEnrollments } from "@/lib/course-api";
import { useAuth } from "@/contexts/AuthContext";
import { getAllEnrollments, getCourses } from "@/lib/course-api";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

const InstructorStudents = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const {
    data: courses = [],
    isLoading: isCoursesLoading,
    isError: isCoursesError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const {
    data: enrollments = [],
    isLoading: isEnrollmentsLoading,
    isError: isEnrollmentsError,
  } = useQuery({
    queryKey: ["enrollments", "all"],
    queryFn: getAllEnrollments,
    enabled: Boolean(user?.id),
  });

  const instructorCourseIds = useMemo(() => {
    if (!user?.id) return new Set<string>();
    return new Set(
      courses
        .filter((course) => course.instructorId === user.id)
        .map((course) => course.id),
    );
  }, [courses, user?.id]);

  const instructorEnrollments = useMemo(() => {
    if (!user?.id) return [];
    return enrollments.filter((enrollment) => {
      if (instructorCourseIds.has(enrollment.courseId)) return true;
      return enrollment.courseInstructorUserId === user.id;
    });
  }, [enrollments, instructorCourseIds, user?.id]);

  const filtered = instructorEnrollments.filter((enrollment) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (enrollment.studentName || "").toLowerCase().includes(keyword) ||
      (enrollment.studentEmail || "").toLowerCase().includes(keyword) ||
      (enrollment.courseTitle || "").toLowerCase().includes(keyword)
    );
  });

  const stats = useMemo(() => {
    const totalEnrolled = instructorEnrollments.length;
    const totalStudents = new Set(
      instructorEnrollments
        .map((enrollment) => enrollment.studentId)
        .filter(Boolean),
    ).size;
    const completedCourses = instructorEnrollments.filter(
      (enrollment) => enrollment.isCompleted || enrollment.progress >= 100,
    ).length;
    const activeThisWeek = instructorEnrollments.filter((enrollment) => {
      if (!enrollment.updatedAt) return false;
      const updatedAt = new Date(enrollment.updatedAt);
      if (Number.isNaN(updatedAt.getTime())) return false;
      return Date.now() - updatedAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const avgCompletion =
      totalEnrolled > 0
        ? Math.round(
            instructorEnrollments.reduce(
              (sum, enrollment) => sum + enrollment.progress,
              0,
            ) / totalEnrolled,
          )
        : 0;

    return {
      totalEnrolled,
      totalStudents,
      completedCourses,
      activeThisWeek,
      avgCompletion,
    };
  }, [instructorEnrollments]);

  const isLoading = isCoursesLoading || isEnrollmentsLoading;
  const isError = isCoursesError || isEnrollmentsError;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Students
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and track your enrolled students.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1 text-sm w-fit">
            {/* <Users className="h-4 w-4" /> {enrollments.length} Enrollments · {uniqueStudents} Students */}
            <Users className="h-4 w-4" /> {stats.totalStudents} Total Students
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Enrollments",
              value: String(enrollments.length),
              icon: Users,
            },
            // { label: 'Unique Students', value: String(uniqueStudents), icon: TrendingUp },
            // { label: 'Completed', value: String(completedCount), icon: GraduationCap },
            // { label: 'Avg. Progress', value: `${avgProgress}%`, icon: Clock },
            {
              label: "Total Enrolled",
              value: stats.totalEnrolled.toLocaleString(),
              icon: Users,
            },
            {
              label: "Active This Week",
              value: stats.activeThisWeek.toLocaleString(),
              icon: TrendingUp,
            },
            {
              label: "Completed Course",
              value: stats.completedCourses.toLocaleString(),
              icon: GraduationCap,
            },
            {
              label: "Avg. Completion",
              value: `${stats.avgCompletion}%`,
              icon: Clock,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <s.icon className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students or courses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Student list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-center text-muted-foreground py-8">
                Loading students...
              </p>
            )}
            {isError && (
              <p className="text-center text-destructive py-8">
                Failed to load student data.
              </p>
            )}
            {!isLoading &&
              !isError &&
              filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.studentAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {(student.studentName || "S")
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {student.studentName || "Student"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.studentEmail || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">
                        {student.courseTitle || "Course"}
                      </span>{" "}
                      · Enrolled {formatDate(student.enrolledAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${student.progress >= 100 ? "bg-accent" : "bg-primary"}`}
                            style={{
                              width: `${Math.min(100, Math.max(0, student.progress))}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8">
                          {Math.round(student.progress)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last active {formatRelativeTime(student.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!student.studentEmail}
                      onClick={() => {
                        if (student.studentEmail) {
                          window.location.href = `mailto:${student.studentEmail}`;
                        }
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            {!isLoading && !isError && filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No students found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstructorStudents;
