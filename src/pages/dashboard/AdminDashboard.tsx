import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getCourseApprovals, getUsers } from '@/lib/admin-api';
import { getCourses } from '@/lib/course-api';
import {
  Users, BookOpen, DollarSign, ShieldCheck, Activity,
  CheckCircle2, XCircle, ArrowUpRight,
  Eye,
} from 'lucide-react';

const AdminDashboard = () => {
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  });
  const approvalsQuery = useQuery({
    queryKey: ['course-approvals'],
    queryFn: getCourseApprovals,
  });
  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const users = usersQuery.data || [];
  const approvals = approvalsQuery.data || [];
  const auditLogs = auditLogsQuery.data || [];
  const courses = coursesQuery.data || [];

  const pendingApprovals = approvals.filter((approval) => approval.status === 'PENDING');
    const getInstructorName = (approval: typeof pendingApprovals[number]) => {
      const instructor = approval.course?.instructor;
      if (instructor?.user) {
        return `${instructor.user.firstName} ${instructor.user.lastName}`.trim();
      }
      if (instructor?.firstName || instructor?.lastName) {
        return `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim();
      }
      return 'Unknown instructor';
    };

  const recentUsers = users
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 6);

  const activeCourses = courses.filter((course) => course.status === 'PUBLISHED').length;

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
            { label: 'Total Users', value: users.length.toLocaleString(), icon: Users, change: 'Live' },
            { label: 'Active Courses', value: activeCourses.toString(), icon: BookOpen, change: 'Live' },
            { label: 'Revenue (MTD)', value: '—', icon: DollarSign, change: 'API pending' },
            { label: 'Pending Approvals', value: pendingApprovals.length.toString(), icon: ShieldCheck, change: 'Live' },
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
            {approvalsQuery.isLoading && (
              <div className="text-muted-foreground">Loading approvals...</div>
            )}
            {approvalsQuery.isError && (
              <div className="text-destructive">Failed to load approvals.</div>
            )}
            {!approvalsQuery.isLoading && !approvalsQuery.isError && pendingApprovals.length === 0 && (
              <div className="text-muted-foreground">No pending approvals.</div>
            )}
            {!approvalsQuery.isLoading && !approvalsQuery.isError && pendingApprovals.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm">{approval.course?.title || 'Untitled course'}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {getInstructorName(approval)}
                        {approval.course?.category?.name ? ` · ${approval.course?.category?.name}` : ''}
                        {approval.submittedAt ? ` · Submitted ${approval.submittedAt}` : ''}
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
                      {usersQuery.isLoading && (
                        <tr>
                          <td className="p-4 text-muted-foreground" colSpan={5}>Loading users...</td>
                        </tr>
                      )}
                      {usersQuery.isError && (
                        <tr>
                          <td className="p-4 text-destructive" colSpan={5}>Failed to load users.</td>
                        </tr>
                      )}
                      {!usersQuery.isLoading && !usersQuery.isError && recentUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{u.firstName} {u.lastName}</td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.createdAt}</td>
                          <td className="p-4">
                            <Badge variant={u.isActive ? 'default' : 'destructive'} className="text-xs">
                              {u.isActive ? 'active' : 'inactive'}
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
            {auditLogsQuery.isLoading && (
              <div className="text-muted-foreground">Loading audit logs...</div>
            )}
            {auditLogsQuery.isError && (
              <div className="text-destructive">Failed to load audit logs.</div>
            )}
            {!auditLogsQuery.isLoading && !auditLogsQuery.isError && auditLogs.length === 0 && (
              <div className="text-muted-foreground">No audit logs yet.</div>
            )}
            {!auditLogsQuery.isLoading && !auditLogsQuery.isError && auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="text-accent">{log.admin?.firstName} {log.admin?.lastName}</span> · {log.action?.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">Target: {log.targetType} {log.targetId}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.createdAt}</span>
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
