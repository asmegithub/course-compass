import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/course-api';
import {
  DollarSign, Users, BookOpen, Star, TrendingUp,
  ArrowUpRight, ArrowDownRight, PlusCircle, Eye, MoreVertical,
  MessageSquare, Edit, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');
  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const instructorCourses = useMemo(() => {
    if (!user?.id) return [];
    return courses.filter((course) => course.instructorId === user.id);
  }, [courses, user?.id]);

  const publishedCourses = instructorCourses.filter((course) => course.status === 'APPROVED');
  const draftCourses = instructorCourses.filter((course) => course.status !== 'APPROVED');

  const stats = useMemo(() => {
    const totalStudents = instructorCourses.reduce((sum, course) => sum + course.enrollmentCount, 0);
    const avgRating = instructorCourses.length
      ? instructorCourses.reduce((sum, course) => sum + course.averageRating, 0) / instructorCourses.length
      : 0;
    return {
      totalStudents,
      activeCourses: publishedCourses.length,
      avgRating: avgRating.toFixed(1),
    };
  }, [instructorCourses, publishedCourses.length]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Instructor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.firstName}! Manage your courses and track performance.</p>
          </div>
          <Button onClick={() => navigate('/instructor/courses/new')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Course
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: '—', icon: DollarSign, change: 'API pending', up: true },
            { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: Users, change: 'Live', up: true },
            { label: 'Active Courses', value: stats.activeCourses.toString(), icon: BookOpen, change: 'Live', up: true },
            { label: 'Avg. Rating', value: stats.avgRating, icon: Star, change: 'Live', up: true },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium flex items-center gap-0.5 text-muted-foreground">
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course Management */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts & Pending ({draftCourses.length})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="published" className="space-y-3 mt-4">
                {isLoading && (
                  <div className="text-muted-foreground">Loading courses...</div>
                )}
                {isError && (
                  <div className="text-destructive">Failed to load courses.</div>
                )}
                {!isLoading && !isError && publishedCourses.length === 0 && (
                  <div className="text-muted-foreground">No published courses yet.</div>
                )}
                {!isLoading && !isError && publishedCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={course.thumbnail} alt="" className="w-full sm:w-28 h-18 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrollmentCount}</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {course.averageRating}</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Revenue API pending</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Trend API pending</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Q&A API pending</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="default" className="text-xs">{course.status}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/instructor/courses/${course.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="drafts" className="space-y-3 mt-4">
                {isLoading && (
                  <div className="text-muted-foreground">Loading courses...</div>
                )}
                {isError && (
                  <div className="text-destructive">Failed to load courses.</div>
                )}
                {!isLoading && !isError && draftCourses.length === 0 && (
                  <div className="text-muted-foreground">No drafts or pending courses.</div>
                )}
                {!isLoading && !isError && draftCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={course.thumbnail} alt="" className="w-full sm:w-28 h-18 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{course.totalLessons} lessons</span>
                            <span>Updated {course.updatedAt}</span>
                            <span>{course.level}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={course.status === 'PENDING' ? 'secondary' : 'outline'} className="text-xs">
                            {course.status}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}>
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Earnings Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Earnings Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Earnings data will appear once the payouts API is connected.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">No payouts yet.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
