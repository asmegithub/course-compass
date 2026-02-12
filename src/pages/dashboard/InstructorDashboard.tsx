import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses } from '@/lib/mock-data';
import {
  DollarSign, Users, BookOpen, Star, TrendingUp,
  ArrowUpRight, ArrowDownRight, PlusCircle, Eye, MoreVertical,
  MessageSquare, Edit, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const instructorCourses = mockCourses.map((c) => ({
  ...c,
  earnings: Math.floor(Math.random() * 50000) + 10000,
  studentsThisMonth: Math.floor(Math.random() * 200) + 30,
  discussions: Math.floor(Math.random() * 50) + 5,
  pendingQuestions: Math.floor(Math.random() * 10),
}));

const draftCourses = [
  {
    id: 'draft-1', title: 'Advanced React Patterns', status: 'DRAFT' as const,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop',
    totalLessons: 12, updatedAt: '2026-02-10', level: 'ADVANCED' as const,
  },
  {
    id: 'draft-2', title: 'Node.js Microservices', status: 'PENDING' as const,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
    totalLessons: 24, updatedAt: '2026-02-08', level: 'INTERMEDIATE' as const,
  },
];

const recentPayouts = [
  { id: '1', amount: 12500, currency: 'ETB', status: 'COMPLETED', date: '2026-01-15' },
  { id: '2', amount: 8700, currency: 'ETB', status: 'PENDING', date: '2026-02-01' },
  { id: '3', amount: 15200, currency: 'ETB', status: 'COMPLETED', date: '2025-12-15' },
];

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('published');

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
            { label: 'Total Revenue', value: 'ETB 125,000', icon: DollarSign, change: '+12%', up: true },
            { label: 'Total Students', value: '45,230', icon: Users, change: '+8%', up: true },
            { label: 'Active Courses', value: '12', icon: BookOpen, change: '+2', up: true },
            { label: 'Avg. Rating', value: '4.8', icon: Star, change: '+0.2', up: true },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-green-600' : 'text-destructive'}`}>
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
                  <TabsTrigger value="published">Published ({instructorCourses.length})</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts & Pending ({draftCourses.length})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="published" className="space-y-3 mt-4">
                {instructorCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <img src={course.thumbnail} alt="" className="w-full sm:w-28 h-18 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrollmentCount}</span>
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {course.averageRating}</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ETB {course.earnings.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{course.studentsThisMonth} this month</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {course.pendingQuestions} questions</span>
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
                {draftCourses.map((course) => (
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
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="font-semibold">ETB 125,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Withdrawn</span>
                    <span className="font-semibold">ETB 98,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-semibold text-primary">ETB 26,500</span>
                  </div>
                  <Button variant="accent" size="sm" className="w-full mt-2">
                    Request Payout
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPayouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">ETB {p.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.date}</p>
                    </div>
                    <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-xs">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
