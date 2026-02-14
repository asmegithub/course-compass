import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Search, Ban, CheckCircle2, Eye, Mail, UserPlus } from 'lucide-react';

const allUsers = [
  { id: '1', name: 'Dawit Alemu', email: 'dawit@example.com', role: 'STUDENT', joinedAt: '2026-02-09', status: 'active', courses: 4 },
  { id: '2', name: 'Sara Tadesse', email: 'sara@example.com', role: 'INSTRUCTOR', joinedAt: '2026-02-08', status: 'active', courses: 3 },
  { id: '3', name: 'Henok Girma', email: 'henok@example.com', role: 'STUDENT', joinedAt: '2026-02-07', status: 'banned', courses: 1 },
  { id: '4', name: 'Hana Mesfin', email: 'hana@example.com', role: 'STUDENT', joinedAt: '2026-02-06', status: 'active', courses: 6 },
  { id: '5', name: 'Abebe Bekele', email: 'abebe@example.com', role: 'INSTRUCTOR', joinedAt: '2025-12-01', status: 'active', courses: 12 },
  { id: '6', name: 'Tigist Haile', email: 'tigist@example.com', role: 'ADMIN', joinedAt: '2025-06-15', status: 'active', courses: 0 },
  { id: '7', name: 'Meron Tadesse', email: 'meron@example.com', role: 'INSTRUCTOR', joinedAt: '2026-01-10', status: 'active', courses: 2 },
  { id: '8', name: 'Solomon Gebre', email: 'solomon@example.com', role: 'STUDENT', joinedAt: '2026-01-20', status: 'inactive', courses: 0 },
];

const AdminUsers = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<typeof allUsers[0] | null>(null);
  const [users, setUsers] = useState(allUsers);

  const filtered = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleBan = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">{users.length} total users on the platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-foreground' },
            { label: 'Students', value: users.filter(u => u.role === 'STUDENT').length, color: 'text-info' },
            { label: 'Instructors', value: users.filter(u => u.role === 'INSTRUCTOR').length, color: 'text-accent' },
            { label: 'Banned', value: users.filter(u => u.status === 'banned').length, color: 'text-destructive' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Courses</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'INSTRUCTOR' ? 'secondary' : 'outline'} className="text-xs">{u.role}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{u.joinedAt}</td>
                      <td className="p-4 text-muted-foreground">{u.courses}</td>
                      <td className="p-4">
                        <Badge variant={u.status === 'active' ? 'default' : u.status === 'banned' ? 'destructive' : 'secondary'} className="text-xs">{u.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleBan(u.id)}>
                            {u.status === 'banned' ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Ban className="h-3.5 w-3.5 text-destructive" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User detail dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium ml-1">{selectedUser.name}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-1">{selectedUser.email}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <Badge variant="secondary" className="ml-1 text-xs">{selectedUser.role}</Badge></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedUser.status === 'active' ? 'default' : 'destructive'} className="ml-1 text-xs">{selectedUser.status}</Badge></div>
                  <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium ml-1">{selectedUser.joinedAt}</span></div>
                  <div><span className="text-muted-foreground">Courses:</span> <span className="font-medium ml-1">{selectedUser.courses}</span></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
