import { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Award, Clock, TrendingUp, Play, Bell, CreditCard, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCertificates, getCourses, getLessons, getMyEnrollments, getNotifications } from '@/lib/course-api';

const StudentDashboard = () => {
  const { user } = useAuth();

  const enrollmentsQuery = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: getMyEnrollments,
    enabled: Boolean(user?.id),
  });

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons'],
    queryFn: getLessons,
    enabled: Boolean(enrollmentsQuery.data?.length),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: getNotifications,
    enabled: Boolean(user?.id),
  });

  const certificatesQuery = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: getCertificates,
    enabled: Boolean(user?.id),
  });

  const formatTimeAgo = (value?: string) => {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';
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

        const lastLessonTitle = lessons.find((lesson) => lesson.id === enrollment.lastAccessedLessonId)?.title
          || lessons.find((lesson) => lesson.sectionId && lesson.isPublished)?.title
          || 'Start course';

        const progressValue = Math.max(0, Math.min(100, Math.round(enrollment.progress)));

        return {
          ...course,
          progress: progressValue,
          completedLessons: enrollment.completedLessonsCount,
          lastLesson: lastLessonTitle,
        };
      })
      .filter(Boolean);
  }, [enrollmentsQuery.data, coursesQuery.data, lessonsQuery.data]);

  const stats = useMemo(() => {
    const enrollments = enrollmentsQuery.data || [];
    const courses = coursesQuery.data || [];
    const certificates = certificatesQuery.data || [];

    const enrolledCoursesCount = enrollments.length;
    const certificatesCount = certificates.filter((certificate) => certificate.studentId === user?.id).length;

    const totalMinutes = enrollments.reduce((sum, enrollment) => {
      const course = courses.find((item) => item.id === enrollment.courseId);
      if (!course) return sum;
      return sum + course.totalDuration * (enrollment.progress / 100);
    }, 0);
    const hoursLearned = Math.round(totalMinutes / 60);

    const completionRate = enrollments.length
      ? Math.round(enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / enrollments.length)
      : 0;

    return {
      enrolledCoursesCount,
      certificatesCount,
      hoursLearned,
      completionRate,
    };
  }, [enrollmentsQuery.data, coursesQuery.data, certificatesQuery.data, user?.id]);

  const recentNotifications = useMemo(() => {
    const notifications = notificationsQuery.data || [];
    return notifications
      .filter((notification) => notification.userId === user?.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3)
      .map((notification) => ({
        id: notification.id,
        title: notification.title || 'Notification',
        message: notification.message || '',
        time: formatTimeAgo(notification.createdAt),
        type: notification.type || 'SYSTEM',
      }));
  }, [notificationsQuery.data, user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Enrolled Courses', value: stats.enrolledCoursesCount.toString(), icon: BookOpen, color: 'text-accent' },
            { label: 'Certificates', value: stats.certificatesCount.toString(), icon: Award, color: 'text-secondary' },
            { label: 'Hours Learned', value: stats.hoursLearned.toString(), icon: Clock, color: 'text-info' },
            { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-success' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold font-display mt-1">{stat.value}</p>
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
            <h2 className="font-display text-lg font-semibold">Continue Learning</h2>
            {enrolledCourses.length === 0 && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  You are not enrolled in any courses yet.
                </CardContent>
              </Card>
            )}
            {enrolledCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full sm:w-40 h-32 sm:h-auto object-cover"
                  />
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Last: {course.lastLesson}
                        </p>
                      </div>
                      <Badge variant={course.progress >= 90 ? 'default' : 'secondary'} className="shrink-0 text-xs">
                        {course.progress}%
                      </Badge>
                    </div>
                    <Progress value={course.progress} className="mt-3 h-2" />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                      <Button size="sm" variant="accent" className="h-7 text-xs gap-1" asChild>
                        <Link to={`/courses/${course.slug}`}>
                          <Play className="h-3 w-3" />
                          Resume
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentNotifications.length === 0 && (
                  <div className="text-xs text-muted-foreground">No notifications yet.</div>
                )}
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/dashboard/certificates">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <Award className="h-4 w-4" /> My Certificates
                  </Button>
                </Link>
                <Link to="/dashboard/payments">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <CreditCard className="h-4 w-4" /> Payment History
                  </Button>
                </Link>
                <Link to="/dashboard/become-instructor">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <GraduationCap className="h-4 w-4" /> Apply as Instructor
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <BookOpen className="h-4 w-4" /> Browse Courses
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
