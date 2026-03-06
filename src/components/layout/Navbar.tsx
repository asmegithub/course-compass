import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { getNotificationUnreadCount } from '@/lib/course-api';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, Menu, X, GraduationCap, ShoppingCart, Bell, User,
  BookOpen, Heart, LogOut, Settings, Globe, BarChart3, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supportedLngs, languageNames, type Locale } from '@/i18n';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const setLanguage = (lng: Locale) => {
    void i18n.changeLanguage(lng);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'INSTRUCTOR' ? '/instructor' : '/dashboard';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: getNotificationUnreadCount,
    enabled: isLoggedIn,
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <GraduationCap className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground hidden sm:block">{t('common.brand')}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('common.exploreCourses')}</Link>
          {/* <DropdownMenu>
            <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Categories</DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card">
              <DropdownMenuItem asChild><Link to="/courses?category=programming">💻 Programming</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/courses?category=business">📊 Business</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/courses?category=design">🎨 Design</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/courses?category=marketing">📈 Marketing</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/courses?category=languages">🌍 Languages</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/categories" className="font-medium">View All Categories</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder={t('common.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-accent" />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex" title={t('language.english')}><Globe className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card">
              {supportedLngs.map((lng) => (
                <DropdownMenuItem key={lng} onClick={() => setLanguage(lng)} className={i18n.language?.startsWith(lng) ? 'bg-accent/10' : ''}>
                  {languageNames[lng]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-xs text-accent-foreground flex items-center justify-center font-semibold">2</span>
              </Button>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to={`${dashboardPath}/notifications`}>
                  <Bell className="h-5 w-5" />
                  {Number(unreadCount) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center font-semibold min-w-5">
                      {Number(unreadCount) > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-accent-foreground" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath} className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {user?.role === 'ADMIN' ? t('common.adminPanel') : user?.role === 'INSTRUCTOR' ? t('common.instructorDashboard') : t('common.myLearning')}
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'STUDENT' && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/wishlist" className="flex items-center gap-2"><Heart className="h-4 w-4" /> {t('common.wishlist')}</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'INSTRUCTOR' && (
                    <DropdownMenuItem asChild>
                      <Link to="/instructor/earnings" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> {t('common.earnings')}</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/approvals" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t('common.approvals')}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`${dashboardPath}/settings`} className="flex items-center gap-2"><Settings className="h-4 w-4" /> {t('common.settings')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> {t('common.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex"><Link to="/auth">{t('common.signIn')}</Link></Button>
              <Button variant="accent" asChild><Link to="/auth?mode=signup">{t('common.getStarted')}</Link></Button>
            </>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("lg:hidden overflow-hidden transition-all duration-300 ease-in-out", isMenuOpen ? "max-h-96" : "max-h-0")}>
        <div className="container py-4 space-y-4 border-t border-border">
          <form onSubmit={handleSearch} className="md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder={t('common.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 bg-muted/50 border-0" />
            </div>
          </form>
          <nav className="flex flex-col gap-2">
            <Link to="/courses" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>{t('common.exploreCourses')}</Link>
            {isLoggedIn && (
              <Link to={dashboardPath} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>{t('common.dashboard')}</Link>
            )}
            {!isLoggedIn && (
              <Link to="/auth" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors sm:hidden" onClick={() => setIsMenuOpen(false)}>{t('common.signIn')}</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
