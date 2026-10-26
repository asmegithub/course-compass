import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Search, Ban, CheckCircle2, ShieldCheck, ShieldOff,
  UserCog, UserPlus, ChevronDown, AlertTriangle, GraduationCap,
  BookOpen, Crown, Users,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCourses } from '@/lib/course-api';
import { AdminUser, getEnrollments, getUsers, updateUser } from '@/lib/admin-api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/* ─── types ─────────────────────────────────────────── */
type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'GUEST';

type UserView = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  status: 'active' | 'inactive';
  courses: number;
  raw: AdminUser;
};

/* ─── helpers ───────────────────────────────────────── */
const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ADMIN:      { label: 'Admin',      color: 'bg-amber-500/15 text-amber-600 border-amber-400/40',     icon: Crown },
  INSTRUCTOR: { label: 'Instructor', color: 'bg-blue-500/15 text-blue-600 border-blue-400/40',        icon: BookOpen },
  STUDENT:    { label: 'Student',    color: 'bg-emerald-500/15 text-emerald-600 border-emerald-400/40', icon: GraduationCap },
  GUEST:      { label: 'Guest',      color: 'bg-muted text-muted-foreground border-border',             icon: Users },
};

const RoleBadge = ({ role }: { role: string }) => {
  const meta = ROLE_META[role] ?? ROLE_META.GUEST;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
};

/* ─── Confirm dialog ────────────────────────────────── */
type ConfirmProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
};
const ConfirmDialog = ({ open, onConfirm, onCancel, title, description, confirmLabel = 'Confirm', danger }: ConfirmProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-warning'}`} />
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          variant={danger ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/* ─── Register New Admin modal ──────────────────────── */
type NewAdminModalProps = {
  open: boolean;
  onClose: () => void;
  users: UserView[];
  onRegister: (userId: string) => void;
  isPending: boolean;
};
const NewAdminModal = ({ open, onClose, users, onRegister, isPending }: NewAdminModalProps) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');

  const nonAdmins = users.filter(
    (u) => u.role !== 'ADMIN' && (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Grant Admin Role
          </DialogTitle>
          <DialogDescription>
            Search for a user and grant them administrator privileges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-admin-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {nonAdmins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No matching users found</p>
            )}
            {nonAdmins.map((u) => (
              <button
                key={u.id}
                id={`new-admin-user-${u.id}`}
                onClick={() => setSelected(u.id === selected ? '' : u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-0"
                style={{
                  background: selected === u.id
                    ? 'hsl(42 78% 48% / 0.12)'
                    : 'transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))' }}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
                {selected === u.id && (
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            id="confirm-grant-admin"
            disabled={!selected || isPending}
            onClick={() => onRegister(selected)}
            className="gap-2"
            style={{
              background: 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))',
              color: 'white',
            }}
          >
            <Crown className="w-4 h-4" />
            {isPending ? 'Granting…' : 'Grant Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── User detail / role-edit dialog ───────────────── */
type UserDetailDialogProps = {
  user: UserView | null;
  onClose: () => void;
  onRoleChange: (user: UserView, newRole: UserRole) => void;
  onToggleStatus: (user: UserView) => void;
  isRolePending: boolean;
  isStatusPending: boolean;
  currentAdminId?: string;
};
const UserDetailDialog = ({
  user, onClose, onRoleChange, onToggleStatus,
  isRolePending, isStatusPending, currentAdminId,
}: UserDetailDialogProps) => {
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  if (!user) return null;
  const isSelf = user.id === currentAdminId;

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Joined', value: user.joinedAt },
              { label: 'Courses', value: String(user.courses) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3 border" style={{ background: 'hsl(var(--muted)/0.5)' }}>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: 'hsl(var(--muted)/0.3)' }}>
            <div>
              <p className="text-sm font-semibold">Account Status</p>
              <p className="text-xs text-muted-foreground">
                User is currently{' '}
                <span className={user.status === 'active' ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}>
                  {user.status}
                </span>
              </p>
            </div>
            <Button
              id={`toggle-status-${user.id}`}
              size="sm"
              variant={user.status === 'active' ? 'destructive' : 'outline'}
              onClick={() => onToggleStatus(user)}
              disabled={isStatusPending || isSelf}
              className="gap-1.5"
            >
              {user.status === 'active'
                ? <><Ban className="w-3.5 h-3.5" /> Deactivate</>
                : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>
              }
            </Button>
          </div>

          {/* Role change */}
          <div className="space-y-2">
            <Label htmlFor={`role-select-${user.id}`} className="text-sm font-semibold flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Change Role
              {isSelf && (
                <span className="text-xs text-muted-foreground font-normal">(cannot change own role)</span>
              )}
            </Label>

            <div className="flex gap-2">
              <Select
                value={pendingRole ?? user.role}
                onValueChange={(v) => setPendingRole(v as UserRole)}
                disabled={isSelf}
              >
                <SelectTrigger id={`role-select-${user.id}`} className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['STUDENT', 'INSTRUCTOR', 'ADMIN', 'GUEST'] as UserRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-2">
                        {r === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        {r === 'INSTRUCTOR' && <BookOpen className="w-3.5 h-3.5 text-blue-500" />}
                        {r === 'STUDENT' && <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />}
                        {r === 'GUEST' && <Users className="w-3.5 h-3.5" />}
                        {r}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                id={`apply-role-${user.id}`}
                disabled={!pendingRole || pendingRole === user.role || isRolePending || isSelf}
                onClick={() => {
                  if (pendingRole && pendingRole !== user.role) {
                    onRoleChange(user, pendingRole);
                    setPendingRole(null);
                  }
                }}
                className="gap-1.5"
                style={{
                  background: pendingRole && pendingRole !== user.role
                    ? 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))'
                    : undefined,
                  color: pendingRole && pendingRole !== user.role ? 'white' : undefined,
                }}
              >
                {isRolePending ? 'Saving…' : 'Apply'}
              </Button>
            </div>

            {/* Role descriptions */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([
                { role: 'STUDENT', desc: 'Can enroll & take courses' },
                { role: 'INSTRUCTOR', desc: 'Can create & publish courses' },
                { role: 'ADMIN', desc: 'Full platform access' },
                { role: 'GUEST', desc: 'Browse only, no enrollment' },
              ] as { role: UserRole; desc: string }[]).map(({ role, desc }) => (
                <div
                  key={role}
                  className="text-xs p-2 rounded-lg border cursor-pointer transition-all"
                  style={{
                    background: (pendingRole ?? user.role) === role
                      ? 'hsl(42 78% 48% / 0.10)'
                      : 'hsl(var(--muted)/0.3)',
                    borderColor: (pendingRole ?? user.role) === role
                      ? 'hsl(42 78% 48% / 0.5)'
                      : 'hsl(var(--border))',
                  }}
                  onClick={() => !isSelf && setPendingRole(role)}
                >
                  <p className="font-semibold">{role}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════ */
const AdminUsers = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserView | null>(null);
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);
  const [confirm, setConfirm] = useState<{
    user: UserView;
    newRole: UserRole;
  } | null>(null);

  /* ── queries ── */
  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: getUsers });
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const enrollmentsQuery = useQuery({ queryKey: ['admin-enrollments'], queryFn: getEnrollments });

  const users = useMemo<UserView[]>(() => {
    const allUsers = usersQuery.data || [];
    const allCourses = coursesQuery.data || [];
    const allEnrollments = enrollmentsQuery.data || [];

    return allUsers.map((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const joinedAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
      const courseCount =
        user.role === 'INSTRUCTOR'
          ? allCourses.filter((c) => c.instructorId === user.id).length
          : user.role === 'STUDENT'
          ? new Set(
              allEnrollments
                .filter((e) => e.student?.id === user.id)
                .map((e) => e.course?.id)
                .filter(Boolean)
            ).size
          : 0;
      return { id: user.id, name, email: user.email, role: user.role, joinedAt, status: user.isActive ? 'active' : 'inactive', courses: courseCount, raw: user };
    });
  }, [usersQuery.data, coursesQuery.data, enrollmentsQuery.data]);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  /* ── mutations ── */
  const changeRoleMutation = useMutation({
    mutationFn: async ({ user, newRole }: { user: UserView; newRole: UserRole }) =>
      updateUser(user.id, { ...user.raw, role: newRole }),
    onSuccess: (_, { user, newRole }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role updated',
        description: `${user.name} is now ${newRole}.`,
      });
      setSelectedUser(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      toast({ title: 'Role change failed', description: message, variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: UserView) =>
      updateUser(user.id, { ...user.raw, isActive: !user.raw.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Status updated' });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  /* ── role change handler (with confirmation for ADMIN changes) ── */
  const handleRoleChange = (user: UserView, newRole: UserRole) => {
    const isDangerous = newRole === 'ADMIN' || user.role === 'ADMIN';
    if (isDangerous) {
      setConfirm({ user, newRole });
    } else {
      changeRoleMutation.mutate({ user, newRole });
    }
  };

  const confirmRoleChange = () => {
    if (confirm) {
      changeRoleMutation.mutate({ user: confirm.user, newRole: confirm.newRole });
      setConfirm(null);
    }
  };

  /* ── stats ── */
  const stats = [
    { label: 'Total Users',  value: users.length,                                icon: Users,         color: 'text-foreground' },
    { label: 'Admins',       value: users.filter(u => u.role === 'ADMIN').length, icon: Crown,         color: 'text-amber-500' },
    { label: 'Instructors',  value: users.filter(u => u.role === 'INSTRUCTOR').length, icon: BookOpen, color: 'text-blue-500' },
    { label: 'Students',     value: users.filter(u => u.role === 'STUDENT').length, icon: GraduationCap, color: 'text-emerald-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">{users.length} total users — manage roles and access</p>
          </div>
          <Button
            id="open-new-admin-modal"
            onClick={() => setShowNewAdminModal(true)}
            className="gap-2 shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))',
              color: 'white',
            }}
          >
            <Crown className="w-4 h-4" />
            Grant Admin Role
          </Button>
        </div>

        {/* Loading / error */}
        {(usersQuery.isLoading || coursesQuery.isLoading || enrollmentsQuery.isLoading) && (
          <div className="text-muted-foreground text-sm">Loading users…</div>
        )}
        {(usersQuery.isError || coursesQuery.isError || enrollmentsQuery.isError) && (
          <div className="text-destructive text-sm">Failed to load user management data.</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger id="role-filter" className="w-44">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="GUEST">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-semibold text-muted-foreground">User</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">Joined</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground hidden md:table-cell">Courses</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                        No users match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, hsl(205 75% 36%), hsl(42 78% 48%))' }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium leading-tight">
                                {u.name}
                                {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{u.joinedAt}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{u.courses}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            u.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-400/30'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end items-center gap-1">
                            {/* Quick promote to Admin */}
                            {u.role !== 'ADMIN' && !isSelf && (
                              <Button
                                id={`promote-admin-${u.id}`}
                                size="sm"
                                variant="ghost"
                                title="Grant Admin role"
                                onClick={() => handleRoleChange(u, 'ADMIN')}
                                disabled={changeRoleMutation.isPending}
                                className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Quick revoke Admin */}
                            {u.role === 'ADMIN' && !isSelf && (
                              <Button
                                id={`revoke-admin-${u.id}`}
                                size="sm"
                                variant="ghost"
                                title="Revoke Admin role → Student"
                                onClick={() => handleRoleChange(u, 'STUDENT')}
                                disabled={changeRoleMutation.isPending}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                              >
                                <ShieldOff className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Toggle status */}
                            <Button
                              id={`toggle-status-row-${u.id}`}
                              size="sm"
                              variant="ghost"
                              title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                              onClick={() => toggleStatusMutation.mutate(u)}
                              disabled={toggleStatusMutation.isPending || isSelf}
                              className="h-7 w-7 p-0"
                            >
                              {u.status === 'inactive'
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                : <Ban className="h-3.5 w-3.5 text-destructive" />
                              }
                            </Button>
                            {/* Full edit dialog */}
                            <Button
                              id={`edit-user-${u.id}`}
                              size="sm"
                              variant="ghost"
                              title="Manage user"
                              onClick={() => setSelectedUser(u)}
                              className="h-7 w-7 p-0"
                            >
                              <UserCog className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {users.length} users
          </p>
        )}
      </div>

      {/* ── Dialogs ── */}
      <UserDetailDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRoleChange={handleRoleChange}
        onToggleStatus={(u) => toggleStatusMutation.mutate(u)}
        isRolePending={changeRoleMutation.isPending}
        isStatusPending={toggleStatusMutation.isPending}
        currentAdminId={currentUser?.id}
      />

      <NewAdminModal
        open={showNewAdminModal}
        onClose={() => setShowNewAdminModal(false)}
        users={users}
        isPending={changeRoleMutation.isPending}
        onRegister={(userId) => {
          const u = users.find((x) => x.id === userId);
          if (u) {
            setShowNewAdminModal(false);
            handleRoleChange(u, 'ADMIN');
          }
        }}
      />

      {/* Confirmation for dangerous role changes */}
      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.newRole === 'ADMIN'
            ? `Grant Admin to ${confirm?.user.name}?`
            : `Revoke Admin from ${confirm?.user.name}?`
        }
        description={
          confirm?.newRole === 'ADMIN'
            ? `This will give ${confirm?.user.name} full administrator access to the platform, including user management, payments, and all settings.`
            : `This will remove administrator privileges from ${confirm?.user.name}. They will become a ${confirm?.newRole}.`
        }
        confirmLabel={confirm?.newRole === 'ADMIN' ? 'Grant Admin' : 'Revoke Admin'}
        danger={confirm?.newRole !== 'ADMIN'}
        onConfirm={confirmRoleChange}
        onCancel={() => setConfirm(null)}
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
