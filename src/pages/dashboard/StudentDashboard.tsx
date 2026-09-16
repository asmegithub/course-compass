import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Play,
  Bell,
  CreditCard,
  GraduationCap,
  Share2,
  Banknote,
  UserCheck,
  Edit3,
  MapPin,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getCertificates,
  getCourses,
  getLessons,
  getMyEnrollments,
  getNotifications,
  getReferralBalance,
  getMyWithdrawals,
} from "@/lib/course-api";
import StudentProfileEnrollmentDialog from "@/components/enrollment/StudentProfileEnrollmentDialog";
import { getStudentProfile, type StudentDetailedProfile } from "@/lib/student-profile";
import { useTranslation } from "react-i18next";

const StudentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentDetailedProfile | null>(null);

  useEffect(() => {
    if (user?.id) {
      setStudentProfile(getStudentProfile(user.id));
    }
  }, [user?.id]);

  const enrollmentsQuery = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: getMyEnrollments,
    enabled: Boolean(user?.id),
  });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  const lessonsQuery = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
    enabled: Boolean(enrollmentsQuery.data?.length),
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: getNotifications,
    enabled: Boolean(user?.id),
  });

  const certificatesQuery = useQuery({
    queryKey: ["certificates", user?.id],
    queryFn: getCertificates,
    enabled: Boolean(user?.id),
  });

  const referralBalanceQuery = useQuery({
    queryKey: ["referral-balance"],
    queryFn: getReferralBalance,
    enabled: Boolean(user?.id),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["referral-withdrawals"],
    queryFn: getMyWithdrawals,
    enabled: Boolean(user?.id),
  });

  const balance = referralBalanceQuery.data?.balance ?? 0;
  const totalEarned = referralBalanceQuery.data?.totalEarned ?? 0;
  const withdrawals = withdrawalsQuery.data ?? [];

  const formatTimeAgo = (value?: string) => {
    if (!value) return "";
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    const diffMins = Math.max(1, Math.round(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const enrolledCourses = useMemo(() => {
    const enrollments = enrollmentsQuery.data || [];
    const courses = coursesQuery.data || [];
    const lessons = lessonsQuery.data || [];

    return enrollments
      .map((enrollment) => {
        const course = courses.find((item) => item.id === enrollment.courseId);
        if (!course) return null;

        const lastLessonTitle =
          lessons.find(
            (lesson) => lesson.id === enrollment.lastAccessedLessonId,
          )?.title ||
          lessons.find((lesson) => lesson.sectionId && lesson.isPublished)
            ?.title ||
          "Start course";

        const progressValue = Math.max(
          0,
          Math.min(100, Math.round(enrollment.progress)),
        );

        return {
          ...course,
          progress: progressValue,
          completedLessons: enrollment.completedLessonsCount,
          lastLesson: lastLessonTitle,
          lastAccessedLessonId: enrollment.lastAccessedLessonId,
        };
      })
      .filter(Boolean);
  }, [enrollmentsQuery.data, coursesQuery.data, lessonsQuery.data]);

  const stats = useMemo(() => {
    const enrollments = enrollmentsQuery.data || [];
    const courses = coursesQuery.data || [];
    const certificates = certificatesQuery.data || [];

    const enrolledCoursesCount = enrollments.length;
    const certificatesCount = certificates.filter(
      (certificate) => certificate.studentId === user?.id,
    ).length;

    const totalMinutes = enrollments.reduce((sum, enrollment) => {
      const course = courses.find((item) => item.id === enrollment.courseId);
      if (!course) return sum;
      return sum + course.totalDuration * (enrollment.progress / 100);
    }, 0);
    const hoursLearned = Math.round(totalMinutes / 60);

    const completionRate = enrollments.length
      ? Math.round(
          enrollments.reduce(
            (sum, enrollment) => sum + enrollment.progress,
            0,
          ) / enrollments.length,
        )
      : 0;

    return {
      enrolledCoursesCount,
      certificatesCount,
      hoursLearned,
      completionRate,
    };
  }, [
    enrollmentsQuery.data,
    coursesQuery.data,
    certificatesQuery.data,
    user?.id,
  ]);

  const recentNotifications = useMemo(() => {
    const notifications = notificationsQuery.data || [];
    return notifications
      .filter((notification) => notification.userId === user?.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 3)
      .map((notification) => ({
        id: notification.id,
        title: notification.title || "Notification",
        message: notification.message || "",
        time: formatTimeAgo(notification.createdAt),
        type: notification.type || "SYSTEM",
      }));
  }, [notificationsQuery.data, user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("studentPortal.welcomeBack", { name: user?.firstName || "Student" })}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("studentPortal.continueJourney")}
            </p>
          </div>
          <Button
            variant={studentProfile ? "outline" : "accent"}
            size="sm"
            onClick={() => setShowProfileDialog(true)}
            className="gap-2 self-start sm:self-auto"
          >
            <UserCheck className="h-4 w-4" />
            {studentProfile ? t("studentPortal.editProfile") : t("studentPortal.fillProfile")}
          </Button>
        </div>

        {/* Student Profile Quick Status Card */}
        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm">
                    {studentProfile?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t("checkout.studentProfileTitle")}
                  </span>
                  {studentProfile?.ordination && (
                    <Badge variant="secondary" className="text-xs">
                      {studentProfile.ordination}
                    </Badge>
                  )}
                  {studentProfile?.gender && (
                    <Badge variant="outline" className="text-xs">
                      {studentProfile.gender === "MALE" ? "ወንድ" : "ሴት"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    {t("studentPortal.educationLevel")}{" "}
                    <strong className="font-medium text-foreground">
                      {studentProfile?.previousEducation || t("studentPortal.notSpecified")}
                    </strong>
                  </span>
                  <span>
                    {t("studentPortal.residence")}{" "}
                    <strong className="font-medium text-foreground">
                      {studentProfile?.residenceLocation || (studentProfile?.residenceType === "ETHIOPIA" ? t("studentPortal.inEthiopia") : studentProfile?.residenceType ? t("studentPortal.abroad") : t("studentPortal.notSpecified"))}
                    </strong>
                  </span>
                  {studentProfile?.currentOccupation && (
                    <span>
                      {t("studentPortal.occupation")}{" "}
                      <strong className="font-medium text-foreground">
                        {studentProfile.currentOccupation}
                      </strong>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileDialog(true)}
              className="text-xs text-primary hover:text-primary gap-1 shrink-0 self-end sm:self-center"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {studentProfile ? t("studentPortal.edit") : t("studentPortal.completeNow")}
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: t("studentPortal.enrolledCourses"),
              value: stats.enrolledCoursesCount.toString(),
              icon: BookOpen,
              color: "text-accent",
            },
            {
              label: t("studentPortal.certificates"),
              value: stats.certificatesCount.toString(),
              icon: Award,
              color: "text-secondary",
            },
            {
              label: t("studentPortal.hoursLearned"),
              value: stats.hoursLearned.toString(),
              icon: Clock,
              color: "text-info",
            },
            {
              label: t("studentPortal.completionRate"),
              value: `${stats.completionRate}%`,
              icon: TrendingUp,
              color: "text-success",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold font-display mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold">
              {t("studentPortal.continueLearning")}
            </h2>
            {enrolledCourses.length === 0 && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {t("studentPortal.noEnrollments")}
                </CardContent>
              </Card>
            )}
            {enrolledCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <Link
                    to={`/courses/${course.slug || course.id}`}
                    className="shrink-0 group overflow-hidden block"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full sm:w-40 h-32 sm:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/courses/${course.slug || course.id}`}>
                          <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("studentPortal.lastLesson", { lesson: course.lastLesson })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          course.progress >= 90 ? "default" : "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {course.progress}%
                      </Badge>
                    </div>
                    <Progress value={course.progress} className="mt-3 h-2" />
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                      <span className="text-xs text-muted-foreground">
                        {t("studentPortal.lessonsProgress", { completed: course.completedLessons, total: course.totalLessons })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          asChild
                        >
                          <Link to={`/courses/${course.slug || course.id}?tab=discussion`}>
                            <MessageSquare className="h-3 w-3" />
                            {t("studentPortal.detailsAndDiscussion")}
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="accent"
                          className="h-7 text-xs gap-1"
                          asChild
                        >
                          <Link
                            to={`/courses/${course.slug || course.id}/learn${course.lastAccessedLessonId ? `?lesson=${encodeURIComponent(course.lastAccessedLessonId)}` : ""}`}
                          >
                            <Play className="h-3 w-3" />
                            {course.progress > 0 ? t("studentPortal.resume") : t("studentPortal.start")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Referral Balance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  {t("studentPortal.referralBalance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold font-display">
                  {referralBalanceQuery.isLoading
                    ? "..."
                    : `ETB ${balance.toFixed(2)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("studentPortal.referralDesc", { total: totalEarned.toFixed(2) })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link to="/courses">
                      <Share2 className="h-3.5 w-3.5 mr-1" /> {t("studentPortal.useForCourse")}
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={balance <= 0}
                    asChild
                  >
                    <Link to="/dashboard/referral-withdrawals">{t("studentPortal.withdraw", "Withdraw")}</Link>
                  </Button>
                </div>
                {withdrawals.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent withdrawals
                    </p>
                    {withdrawals.slice(0, 3).map((w) => (
                      <div key={w.id} className="flex justify-between text-xs">
                        <span>ETB {w.amount.toFixed(2)}</span>
                        <Badge
                          variant={
                            w.status === "COMPLETED" ? "default" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {w.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t("studentPortal.recentNotifications")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNotifications.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t("studentPortal.noNotifications")}
                  </div>
                )}
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t("studentPortal.quickActions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/dashboard/certificates">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Award className="h-4 w-4" /> {t("dashboardNav.certificates")}
                  </Button>
                </Link>
                <Link to="/dashboard/payments">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> {t("dashboardNav.payments")}
                  </Button>
                </Link>
                <Link to="/dashboard/referral-withdrawals">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Banknote className="h-4 w-4" /> {t("dashboardNav.referralWithdrawals")}
                  </Button>
                </Link>
                <Link to="/dashboard/become-instructor">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <GraduationCap className="h-4 w-4" /> {t("studentPortal.applyAsInstructor")}
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <BookOpen className="h-4 w-4" /> {t("studentPortal.browseCourses")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Student Profile Dialog */}
      <StudentProfileEnrollmentDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onComplete={(profile) => {
          if (profile && user?.id) {
            setStudentProfile(profile);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default StudentDashboard;
