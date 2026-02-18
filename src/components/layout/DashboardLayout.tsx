import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  GraduationCap, BookOpen, Award, CreditCard, Bell, Heart, Settings, LogOut,
  BarChart3, Users, PlusCircle, DollarSign, Landmark, Star,
  ShieldCheck, FolderOpen, Tag, FileText, Activity, Mail, Cog,
  Menu, X, ChevronRight, User,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: BookOpen },
  { label: 'Become Instructor', href: '/dashboard/become-instructor', icon: User },
  { label: 'My Courses', href: '/dashboard/courses', icon: GraduationCap },
  { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const instructorNav: NavItem[] = [
  { label: 'Dashboard', href: '/instructor', icon: BarChart3 },
  { label: 'My Courses', href: '/instructor/courses', icon: BookOpen },
  { label: 'Create Course', href: '/instructor/courses/new', icon: PlusCircle },
  { label: 'Students', href: '/instructor/students', icon: Users },
  { label: 'Reviews', href: '/instructor/reviews', icon: Star },
  { label: 'Earnings', href: '/instructor/earnings', icon: DollarSign },
  { label: 'Payouts', href: '/instructor/payouts', icon: Landmark },
  { label: 'Settings', href: '/instructor/settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: Activity },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Course Approvals', href: '/admin/approvals', icon: ShieldCheck },
  { label: 'Instructor Verify', href: '/admin/instructor-verifications', icon: ShieldCheck },
  { label: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  { label: 'Email Logs', href: '/admin/email-logs', icon: Mail },
  { label: 'System Settings', href: '/admin/settings', icon: Cog },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'ADMIN' ? adminNav : user?.role === 'INSTRUCTOR' ? instructorNav : studentNav;
  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'INSTRUCTOR' ? 'Instructor' : 'Student';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-[100] h-screen w-64 text-sidebar-foreground flex flex-col transition-transform duration-300 shadow-xl lg:shadow-card",
        "bg-[hsl(222,47%,11%)] backdrop-blur-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">BeteGubae</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
            <ChevronRight className="h-3 w-3" />
            {roleLabel} Panel
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                 className={cn(
                   "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                   isActive
                     ? "bg-sidebar-primary text-sidebar-primary-foreground"
                     : "text-secondary hover:text-accent hover:bg-sidebar-accent"
                 )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">3</span>
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm">Back to Site</Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
