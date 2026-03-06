import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Search, Mail, TrendingUp, GraduationCap, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyInstructorEnrollments } from '@/lib/course-api';

const InstructorStudents = () => {
  const [search, setSearch] = useState('');
  const { data: enrollments = [], isLoading, error } = useQuery({
    queryKey: ['instructor-enrollments'],
    queryFn: getMyInstructorEnrollments,
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return enrollments.filter(
      (e) =>
        (e.studentName || '').toLowerCase().includes(term) ||
        (e.studentEmail || '').toLowerCase().includes(term) ||
        (e.courseTitle || '').toLowerCase().includes(term)
    );
  }, [enrollments, search]);

  const uniqueStudents = useMemo(() => new Set(enrollments.map((e) => e.studentId)).size, [enrollments]);
  const completedCount = useMemo(() => enrollments.filter((e) => e.isCompleted).length, [enrollments]);
  const avgProgress = useMemo(() => {
    if (!enrollments.length) return 0;
    const sum = enrollments.reduce((a, e) => a + e.progress, 0);
    return Math.round(sum / enrollments.length);
  }, [enrollments]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load students.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track your enrolled students.</p>
          </div>
          <Badge variant="secondary" className="gap-1 text-sm w-fit">
            <Users className="h-4 w-4" /> {enrollments.length} Enrollments · {uniqueStudents} Students
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Enrollments', value: String(enrollments.length), icon: Users },
            { label: 'Unique Students', value: String(uniqueStudents), icon: TrendingUp },
            { label: 'Completed', value: String(completedCount), icon: GraduationCap },
            { label: 'Avg. Progress', value: `${avgProgress}%`, icon: Clock },
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
          <Input placeholder="Search students or courses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Student list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No enrollments yet.</p>
            ) : (
              filtered.map((enrollment) => (
                <div key={enrollment.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {(enrollment.studentName || enrollment.studentEmail || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{enrollment.studentName || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">{enrollment.studentEmail || enrollment.studentId}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{enrollment.courseTitle || enrollment.courseId}</span>
                      {enrollment.enrolledAt && ` · Enrolled ${new Date(enrollment.enrolledAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, enrollment.progress || 0)}%`,
                              backgroundColor: enrollment.isCompleted ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8">{Math.round(enrollment.progress || 0)}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`mailto:${enrollment.studentEmail || ''}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstructorStudents;
