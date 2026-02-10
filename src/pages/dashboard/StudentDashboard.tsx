import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses } from '@/lib/mock-data';
import { BookOpen, Award, Clock, TrendingUp, Play, Bell, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const enrolledCourses = [
  { ...mockCourses[0], progress: 68, completedLessons: 106, lastLesson: 'React Hooks Deep Dive' },
  { ...mockCourses[1], progress: 35, completedLessons: 43, lastLesson: 'Pandas DataFrames' },
  { ...mockCourses[2], progress: 92, completedLessons: 72, lastLesson: 'Design System Creation' },
];

const recentNotifications = [
  { id: '1', title: 'Certificate Earned!', message: 'You completed UI/UX Design Masterclass', time: '2h ago', type: 'success' },
  { id: '2', title: 'New lesson available', message: 'React Advanced Patterns just dropped', time: '5h ago', type: 'info' },
  { id: '3', title: 'Payment confirmed', message: 'ETB 299 for Web Dev Bootcamp', time: '1d ago', type: 'default' },
];

const StudentDashboard = () => {
  const { user } = useAuth();

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
            { label: 'Enrolled Courses', value: '3', icon: BookOpen, color: 'text-accent' },
            { label: 'Certificates', value: '1', icon: Award, color: 'text-secondary' },
            { label: 'Hours Learned', value: '47', icon: Clock, color: 'text-info' },
            { label: 'Completion Rate', value: '65%', icon: TrendingUp, color: 'text-success' },
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
                      <Button size="sm" variant="accent" className="h-7 text-xs gap-1">
                        <Play className="h-3 w-3" />
                        Resume
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
