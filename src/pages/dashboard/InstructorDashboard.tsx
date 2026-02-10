import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses } from '@/lib/mock-data';
import {
  DollarSign, Users, BookOpen, Star, TrendingUp, Eye,
  BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const courseStats = mockCourses.slice(0, 4).map((c) => ({
  ...c,
  earnings: Math.floor(Math.random() * 50000) + 10000,
  studentsThisMonth: Math.floor(Math.random() * 200) + 30,
}));

const recentPayouts = [
  { id: '1', amount: 12500, currency: 'ETB', status: 'COMPLETED', date: '2026-01-15' },
  { id: '2', amount: 8700, currency: 'ETB', status: 'PENDING', date: '2026-02-01' },
  { id: '3', amount: 15200, currency: 'ETB', status: 'COMPLETED', date: '2025-12-15' },
];

const InstructorDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome, {user?.firstName}. Here's your overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: 'ETB 125,000', icon: DollarSign, change: '+12%', up: true },
            { label: 'Total Students', value: '45,230', icon: Users, change: '+8%', up: true },
            { label: 'Active Courses', value: '12', icon: BookOpen, change: '+2', up: true },
            { label: 'Avg. Rating', value: '4.8', icon: Star, change: '-0.1', up: false },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? 'text-success' : 'text-destructive'}`}>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Courses performance */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Course Performance</h2>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {courseStats.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <img src={course.thumbnail} alt="" className="w-full sm:w-24 h-16 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrollmentCount}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {course.averageRating}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ETB {course.earnings.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{course.studentsThisMonth} this month</span>
                        </div>
                      </div>
                      <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                        {course.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payouts */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
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
                    <span className="font-semibold text-success">ETB 26,500</span>
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
