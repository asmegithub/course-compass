import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FirstLoginTour } from "@/components/onboarding/FirstLoginTour";
import { useQuery } from "@tanstack/react-query";
import { getNotificationUnreadCount } from "@/lib/course-api";
import { getChatUnreadCount } from "@/lib/chat-api";
import { useTranslation } from "react-i18next";
import { supportedLngs, languageNames, type Locale } from "@/i18n";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GraduationCap,
  BookOpen,
  Award,
  CreditCard,
  Bell,
  Heart,
  Settings,
  LogOut,
  BarChart3,
  Users,
  PlusCircle,
  DollarSign,
  Landmark,
  Star,
  ShieldCheck,
  Shield,
  FolderOpen,
  Tag,
  FileText,
  Activity,
  Mail,
  Cog,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Globe,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  labelKey: string;
  defaultLabel: string;
  href: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { labelKey: "dashboardNav.dashboard", defaultLabel: "Dashboard", href: "/dashboard", icon: BookOpen },
  {
    labelKey: "dashboardNav.becomeInstructor",
    defaultLabel: "Become Instructor",
    href: "/dashboard/become-instructor",
    icon: User,
  },
  { labelKey: "dashboardNav.myCourses", defaultLabel: "My Courses", href: "/dashboard/courses", icon: GraduationCap },
  { labelKey: "dashboardNav.quizHistory", defaultLabel: "Quiz History", href: "/dashboard/quiz-history", icon: BarChart3 },
  { labelKey: "dashboardNav.certificates", defaultLabel: "Certificates", href: "/dashboard/certificates", icon: Award },
  { labelKey: "dashboardNav.payments", defaultLabel: "Payments", href: "/dashboard/payments", icon: CreditCard },
  {
    labelKey: "dashboardNav.referralWithdrawals",
    defaultLabel: "Referral withdrawals",
    href: "/dashboard/referral-withdrawals",
    icon: DollarSign,
  },
  { labelKey: "dashboardNav.wishlist", defaultLabel: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { labelKey: "dashboardNav.notifications", defaultLabel: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { labelKey: "dashboardNav.chat", defaultLabel: "Messages", href: "/dashboard/chat", icon: MessageSquare },
  { labelKey: "dashboardNav.settings", defaultLabel: "Settings", href: "/dashboard/settings", icon: Settings },
];

const instructorNav: NavItem[] = [
  { labelKey: "dashboardNav.dashboard", defaultLabel: "Dashboard", href: "/instructor", icon: BarChart3 },
  { labelKey: "dashboardNav.myCourses", defaultLabel: "My Courses", href: "/instructor/courses", icon: BookOpen },
  { labelKey: "dashboardNav.createCourse", defaultLabel: "Create Course", href: "/instructor/courses/new", icon: PlusCircle },
  { labelKey: "dashboardNav.students", defaultLabel: "Students", href: "/instructor/students", icon: Users },
  { labelKey: "dashboardNav.chat", defaultLabel: "Messages", href: "/instructor/chat", icon: MessageSquare },
  { labelKey: "dashboardNav.reviews", defaultLabel: "Reviews", href: "/instructor/reviews", icon: Star },
  { labelKey: "dashboardNav.earnings", defaultLabel: "Earnings", href: "/instructor/earnings", icon: DollarSign },
  { labelKey: "dashboardNav.payouts", defaultLabel: "Payouts", href: "/instructor/payouts", icon: Landmark },
  { labelKey: "dashboardNav.settings", defaultLabel: "Settings", href: "/instructor/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { labelKey: "dashboardNav.dashboard", defaultLabel: "Dashboard", href: "/admin", icon: Activity },
  { labelKey: "dashboardNav.notifications", defaultLabel: "Notifications", href: "/admin/notifications", icon: Bell },
  { labelKey: "dashboardNav.chat", defaultLabel: "Messages", href: "/admin/chat", icon: MessageSquare },
  { labelKey: "dashboardNav.users", defaultLabel: "Users", href: "/admin/users", icon: Users },
  { labelKey: "dashboardNav.courseApprovals", defaultLabel: "Course Approvals", href: "/admin/approvals", icon: ShieldCheck },
  {
    labelKey: "dashboardNav.instructorVerify",
    defaultLabel: "Instructor Verify",
    href: "/admin/instructor-verifications",
    icon: ShieldCheck,
  },
  { labelKey: "dashboardNav.categories", defaultLabel: "Categories", href: "/admin/categories", icon: FolderOpen },
  { labelKey: "dashboardNav.coupons", defaultLabel: "Coupons", href: "/admin/coupons", icon: Tag },
  { labelKey: "dashboardNav.certificates", defaultLabel: "Certificates", href: "/admin/certificates", icon: Award },
  { labelKey: "dashboardNav.payments", defaultLabel: "Payments", href: "/admin/payments", icon: CreditCard },
  {
    labelKey: "dashboardNav.manualPayments",
    defaultLabel: "Manual Payments",
    href: "/admin/manual-payments",
    icon: CreditCard,
  },
  { labelKey: "dashboardNav.payouts", defaultLabel: "Payouts", href: "/admin/payouts", icon: Landmark },
  { labelKey: "dashboardNav.auditLogs", defaultLabel: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { labelKey: "dashboardNav.emailLogs", defaultLabel: "Email Logs", href: "/admin/email-logs", icon: Mail },
  { labelKey: "dashboardNav.rbac", defaultLabel: "RBAC", href: "/admin/rbac", icon: Shield },
  { labelKey: "dashboardNav.systemSettings", defaultLabel: "System Settings", href: "/admin/settings", icon: Cog },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const navRef = useRef<HTMLElement>(null);

  // Persist and restore sidebar scroll position so it doesn't jump to top on navigation
  const NAV_SCROLL_KEY = `sidebar-scroll-${user?.role ?? 'unknown'}`;

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    // Restore saved position
    const saved = sessionStorage.getItem(NAV_SCROLL_KEY);
    if (saved) {
      nav.scrollTop = Number(saved);
    }
    // Save position on every scroll
    const handleScroll = () => {
      sessionStorage.setItem(NAV_SCROLL_KEY, String(nav.scrollTop));
    };
    nav.addEventListener('scroll', handleScroll, { passive: true });
    return () => nav.removeEventListener('scroll', handleScroll);
  }, [location.pathname, NAV_SCROLL_KEY]);
  const unreadCountQuery = useQuery({
    queryKey: ["notification-unread-count", user?.id],
    queryFn: getNotificationUnreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
  });
  const unreadCount = unreadCountQuery.data ?? 0;

  const chatUnreadQuery = useQuery({
    queryKey: ["chat-unread-count", user?.id],
    queryFn: getChatUnreadCount,
    enabled: Boolean(user?.id),
    refetchInterval: 12000,
  });
  const chatUnreadCount = chatUnreadQuery.data?.unreadCount ?? 0;

  const { t, i18n } = useTranslation();
  const { siteName } = useSystemSettings();
  const setLanguage = (lng: Locale) => {
    void i18n.changeLanguage(lng);
  };

  const navItems =
    user?.role === "ADMIN"
      ? adminNav
      : user?.role === "INSTRUCTOR"
        ? instructorNav
        : studentNav;

  const roleLabel =
    user?.role === "ADMIN"
      ? t("dashboardNav.adminPanel", "Admin")
      : user?.role === "INSTRUCTOR"
        ? t("dashboardNav.instructorPanel", "Instructor")
        : t("dashboardNav.studentPanel", "Student");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <FirstLoginTour />
      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-[100] h-screen text-sidebar-foreground flex flex-col transition-[width,transform] duration-300 shadow-xl lg:shadow-card bg-sidebar backdrop-blur-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-[4.5rem] w-64" : "w-64",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-sidebar-border transition-all duration-300 shrink-0",
            isCollapsed ? "lg:px-2 lg:justify-center px-4 justify-between" : "px-4 justify-between",
          )}
        >
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 min-w-0 transition-opacity",
              isCollapsed && "lg:justify-center",
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
              <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span
              className={cn(
                "font-display text-lg font-bold truncate",
                isCollapsed && "lg:hidden",
              )}
            >
              {siteName || "BeteGubae"}
            </span>
          </Link>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Desktop header collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hidden lg:flex text-sidebar-foreground/70 hover:text-sidebar-foreground h-8 w-8 shrink-0",
              isCollapsed && "lg:hidden",
            )}
            onClick={toggleCollapse}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Role badge */}
        <div
          className={cn(
            "py-3 transition-all shrink-0",
            isCollapsed ? "lg:px-2 lg:flex lg:justify-center px-4" : "px-4",
          )}
        >
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center rounded-full text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground transition-all cursor-default",
                  isCollapsed
                    ? "lg:h-7 lg:w-7 lg:p-0 lg:justify-center gap-1.5 px-2.5 py-1"
                    : "gap-1.5 px-2.5 py-1",
                )}
              >
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className={cn("truncate", isCollapsed && "lg:hidden")}>
                  {roleLabel}
                </span>
              </span>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="hidden lg:block z-[110]">
                <span>{roleLabel}</span>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Nav items */}
        <nav
          ref={navRef}
          className={cn(
            "flex-1 py-2 space-y-1 overflow-y-auto overflow-x-hidden",
            isCollapsed ? "lg:px-2 px-3" : "px-3",
          )}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isChat = item.href.endsWith("/chat");
            const isNotif = item.href.endsWith("/notifications");
            const badgeCount = isChat ? chatUnreadCount : isNotif ? unreadCount : 0;
            const label = t(item.labelKey, item.defaultLabel);

            return (
              <Tooltip key={item.href} delayDuration={150}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    data-tour={`nav:${item.href}`}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed
                        ? "lg:justify-center lg:px-0 lg:h-11 justify-between px-3 py-2.5"
                        : "justify-between px-3 py-2.5",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent",
                    )}
                  >
                    <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "lg:gap-0")}>
                      <div className="relative flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {badgeCount > 0 && isCollapsed && (
                          <span
                            className={cn(
                              "hidden lg:flex absolute -top-1.5 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full text-[9px] font-bold items-center justify-center ring-2 ring-sidebar leading-none",
                              isChat
                                ? "bg-accent text-accent-foreground"
                                : "bg-destructive text-destructive-foreground",
                            )}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </div>
                      <span className={cn("truncate", isCollapsed && "lg:hidden")}>
                        {label}
                      </span>
                    </div>

                    {badgeCount > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shrink-0",
                          isCollapsed && "lg:hidden",
                          isActive
                            ? "bg-sidebar-primary-foreground text-sidebar-primary"
                            : isChat
                              ? "bg-accent text-accent-foreground"
                              : "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="hidden lg:flex items-center gap-2 z-[110]">
                    <span>{label}</span>
                    {badgeCount > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          isChat
                            ? "bg-accent text-accent-foreground"
                            : "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User + logout */}
        <div
          className={cn(
            "border-t border-sidebar-border transition-all shrink-0",
            isCollapsed ? "lg:p-2 p-4" : "p-4",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 mb-3",
              isCollapsed && "lg:justify-center lg:gap-0 lg:mb-2",
            )}
          >
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0 cursor-pointer">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="hidden lg:block z-[110]">
                  <p className="font-medium text-xs">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                </TooltipContent>
              )}
            </Tooltip>

            <div className={cn("min-w-0 flex-1", isCollapsed && "lg:hidden")}>
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "sm"}
                className={cn(
                  "text-sidebar-foreground/70 hover:text-destructive transition-all",
                  isCollapsed
                    ? "lg:h-9 lg:w-9 lg:mx-auto lg:flex w-full justify-start"
                    : "w-full justify-start",
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className={cn("ml-2", isCollapsed && "lg:hidden")}>
                  {t("common.signOut", "Sign Out")}
                </span>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="hidden lg:block z-[110]">
                {t("common.signOut", "Sign Out")}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Desktop Collapse / Expand Toggle Button at bottom of sidebar */}
        <div className="hidden lg:flex border-t border-sidebar-border p-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all h-8",
              isCollapsed ? "justify-center px-0" : "justify-between px-2.5",
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={cn("text-xs font-normal", isCollapsed && "hidden")}>
              Collapse sidebar
            </span>
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                toggleCollapse();
              } else {
                setSidebarOpen((prev) => !prev);
              }
            }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-foreground hover:bg-muted"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Language / ቋንቋ">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {supportedLngs.map((lng) => (
                  <DropdownMenuItem
                    key={lng}
                    onClick={() => setLanguage(lng)}
                    className={i18n.language?.startsWith(lng) ? "bg-accent/10 font-semibold" : ""}
                  >
                    {languageNames[lng]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative" asChild title="Messages">
              <Link to={`${user?.role === "ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : "/dashboard"}/chat`}>
                <MessageSquare className="h-5 w-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-[10px] text-accent-foreground font-bold flex items-center justify-center">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to={`${user?.role === "ADMIN" ? "/admin" : user?.role === "INSTRUCTOR" ? "/instructor" : "/dashboard"}/notifications`}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm" data-tour="back-to-site">
                {t("dashboardNav.backToSite", "Back to Site")}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
