import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, BookOpen, DollarSign, ShieldCheck, Activity,
  CheckCircle2, XCircle, Clock, TrendingUp, ArrowUpRight,
  Eye,
} from 'lucide-react';

const pendingApprovals = [
  { id: '1', title: 'Advanced React Patterns', instructor: 'Abebe Bekele', submittedAt: '2026-02-08', category: 'Programming' },
  { id: '2', title: 'Business Analytics with Excel', instructor: 'Meron Tadesse', submittedAt: '2026-02-07', category: 'Business' },
  { id: '3', title: 'Mobile Photography Masterclass', instructor: 'Solomon Gebre', submittedAt: '2026-02-05', category: 'Design' },
];

const recentUsers = [
  { id: '1', name: 'Dawit Alemu', email: 'dawit@example.com', role: 'STUDENT', joinedAt: '2026-02-09', status: 'active' },
  { id: '2', name: 'Sara Tadesse', email: 'sara@example.com', role: 'INSTRUCTOR', joinedAt: '2026-02-08', status: 'active' },
  { id: '3', name: 'Henok Girma', email: 'henok@example.com', role: 'STUDENT', joinedAt: '2026-02-07', status: 'inactive' },
  { id: '4', name: 'Hana Mesfin', email: 'hana@example.com', role: 'STUDENT', joinedAt: '2026-02-06', status: 'active' },
];

const auditLogs = [
  { id: '1', admin: 'Tigist Haile', action: 'APPROVE_COURSE', target: 'Python for Data Science', time: '2h ago' },
  { id: '2', admin: 'Tigist Haile', action: 'BAN_USER', target: 'spam_user@test.com', time: '5h ago' },
  { id: '3', admin: 'Tigist Haile', action: 'UPDATE_SETTING', target: 'platform_fee → 15%', time: '1d ago' },
  { id: '4', admin: 'Tigist Haile', action: 'PROCESS_REFUND', target: 'TXN-00234', time: '2d ago' },
];

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: '52,340', icon: Users, change: '+342 this week' },
            { label: 'Active Courses', value: '186', icon: BookOpen, change: '+12 this month' },
            { label: 'Revenue (MTD)', value: 'ETB 890K', icon: DollarSign, change: '+18% vs last' },
            { label: 'Pending Approvals', value: '3', icon: ShieldCheck, change: 'Needs attention' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <ArrowUpRight className="h-4 w-4 text-success" />
                </div>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-success mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approvals">Course Approvals</TabsTrigger>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Approvals */}
          <TabsContent value="approvals" className="space-y-3">
            {pendingApprovals.map((course) => (
              <Card key={course.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {course.instructor} · {course.category} · Submitted {course.submittedAt}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Eye className="h-3 w-3" /> Review
                      </Button>
                      <Button size="sm" variant="accent" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1 text-xs">
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.joinedAt}</td>
                          <td className="p-4">
                            <Badge variant={u.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                              {u.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs */}
          <TabsContent value="audit" className="space-y-3">
            {auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="text-accent">{log.admin}</span> · {log.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">Target: {log.target}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
