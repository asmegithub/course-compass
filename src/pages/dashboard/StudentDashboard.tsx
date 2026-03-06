import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Award, Clock, TrendingUp, Play, Bell, CreditCard, GraduationCap, Share2, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCertificates, getCourses, getLessons, getMyEnrollments, getNotifications, getReferralBalance, getMyWithdrawals, requestWithdrawal } from '@/lib/course-api';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

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

  const referralBalanceQuery = useQuery({
    queryKey: ['referral-balance'],
    queryFn: getReferralBalance,
    enabled: Boolean(user?.id),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ['referral-withdrawals'],
    queryFn: getMyWithdrawals,
    enabled: Boolean(user?.id),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => requestWithdrawal(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-balance'] });
      queryClient.invalidateQueries({ queryKey: ['referral-withdrawals'] });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      toast({ title: 'Withdrawal requested', description: 'Your request has been submitted. You will be notified when it is processed.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Withdrawal failed', description: err.message, variant: 'destructive' });
    },
  });

  const balance = referralBalanceQuery.data?.balance ?? 0;
  const totalEarned = referralBalanceQuery.data?.totalEarned ?? 0;
  const withdrawals = withdrawalsQuery.data ?? [];

  const handleWithdraw = () => {
    const num = parseFloat(withdrawAmount);
    if (Number.isNaN(num) || num <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }
    if (num > balance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    withdrawMutation.mutate(num);
  };

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
                        <Link to={`/courses/${course.slug}/learn`}>
                          <Play className="h-3 w-3" />
                          {course.progress > 0 ? 'Continue' : 'Start'}
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
            {/* Referral Balance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Referral Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold font-display">
                  {referralBalanceQuery.isLoading ? '...' : `ETB ${balance.toFixed(2)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Earned from referrals: ETB {totalEarned.toFixed(2)}. Share a course; when a friend enrolls, you get 5%.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link to="/courses">
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Use for course
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={balance <= 0 || withdrawMutation.isPending}
                    onClick={() => setWithdrawOpen(true)}
                  >
                    Withdraw
                  </Button>
                </div>
                {withdrawals.length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Recent withdrawals</p>
                    {withdrawals.slice(0, 3).map((w) => (
                      <div key={w.id} className="flex justify-between text-xs">
                        <span>ETB {w.amount.toFixed(2)}</span>
                        <Badge variant={w.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px]">
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

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw referral balance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Available: ETB {balance.toFixed(2)}. Enter the amount you want to withdraw. Requests are processed by the team.
          </p>
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="Amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? 'Submitting...' : 'Request withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentDashboard;
