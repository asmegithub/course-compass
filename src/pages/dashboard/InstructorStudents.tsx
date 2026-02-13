import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Search, Mail, TrendingUp, GraduationCap, Clock } from 'lucide-react';
import { useState } from 'react';

const mockStudents = [
  { id: '1', name: 'Abebe Kebede', email: 'abebe@example.com', avatar: '', course: 'Web Development Bootcamp', progress: 85, enrolledAt: '2026-01-10', lastActive: '2 hours ago' },
  { id: '2', name: 'Sara Tadesse', email: 'sara@example.com', avatar: '', course: 'UI/UX Design Masterclass', progress: 62, enrolledAt: '2026-01-15', lastActive: '1 day ago' },
  { id: '3', name: 'Dawit Haile', email: 'dawit@example.com', avatar: '', course: 'Python for Data Science', progress: 100, enrolledAt: '2025-12-01', lastActive: '3 hours ago' },
  { id: '4', name: 'Meron Alemu', email: 'meron@example.com', avatar: '', course: 'Web Development Bootcamp', progress: 34, enrolledAt: '2026-02-01', lastActive: '5 days ago' },
  { id: '5', name: 'Yonas Gebre', email: 'yonas@example.com', avatar: '', course: 'Mobile App Development', progress: 50, enrolledAt: '2026-01-20', lastActive: '12 hours ago' },
  { id: '6', name: 'Tigist Worku', email: 'tigist@example.com', avatar: '', course: 'UI/UX Design Masterclass', progress: 91, enrolledAt: '2025-11-15', lastActive: '30 min ago' },
];

const InstructorStudents = () => {
  const [search, setSearch] = useState('');
  const filtered = mockStudents.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track your enrolled students.</p>
          </div>
          <Badge variant="secondary" className="gap-1 text-sm w-fit">
            <Users className="h-4 w-4" /> {mockStudents.length} Total Students
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Enrolled', value: '1,245', icon: Users },
            { label: 'Active This Week', value: '892', icon: TrendingUp },
            { label: 'Completed Course', value: '324', icon: GraduationCap },
            { label: 'Avg. Completion', value: '72%', icon: Clock },
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
            {filtered.map((student) => (
              <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {student.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">{student.course}</span> · Enrolled {student.enrolledAt}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${student.progress}%`,
                            backgroundColor: student.progress === 100 ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8">{student.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last active {student.lastActive}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No students found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstructorStudents;
