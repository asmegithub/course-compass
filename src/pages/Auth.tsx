import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getApiBaseUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { supportedLngs, languageNames, type Locale } from '@/i18n';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, BookOpen, Globe, Users, ChevronDown, ChevronUp, MapPin, Briefcase, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveStudentProfile, ORDINATION_OPTIONS, EDUCATION_OPTIONS } from '@/lib/student-profile';
import { getStoredUser } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect';

const Auth = () => {
  const { t, i18n } = useTranslation();
  const setLanguage = (lng: Locale) => {
    void i18n.changeLanguage(lng);
  };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, signup, applyOAuthTokens, user, isLoading } = useAuth();
  const { toast } = useToast();

  const roleOptions: { role: Exclude<UserRole, 'GUEST'>; labelKey: string; descKey: string; icon: React.ElementType }[] = [
    { role: 'STUDENT', labelKey: 'auth.student', descKey: 'auth.studentDesc', icon: BookOpen },
    { role: 'INSTRUCTOR', labelKey: 'auth.instructor', descKey: 'auth.instructorDesc', icon: GraduationCap },
  ];

  // Modal state for separate signup popup
  const [signUpModalOpen, setSignUpModalOpen] = useState(
    searchParams.get('mode') === 'signup'
  );

  // Sign In state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Sign Up state (in popup modal)
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'GUEST'>>('STUDENT');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('');
  const [showParentFields, setShowParentFields] = useState(false);

  // Optional student church profile fields
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [ordination, setOrdination] = useState('ምእመን');
  const [otherOrdination, setOtherOrdination] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [previousEducation, setPreviousEducation] = useState('ፊደል/ንባብ');
  const [otherPreviousEducation, setOtherPreviousEducation] = useState('');
  const [residenceType, setResidenceType] = useState<'ETHIOPIA' | 'ABROAD'>('ETHIOPIA');
  const [residenceLocation, setResidenceLocation] = useState('');
  const [currentOccupation, setCurrentOccupation] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [concurrentOpen, setConcurrentOpen] = useState(false);
  const [lastLoginAttempt, setLastLoginAttempt] = useState<{ email: string; password: string } | null>(null);

  const concurrentMessage = useMemo(
    () => "You have already logged in in an other device.",
    []
  );

  // Sync modal state if mode=signup query param changes
  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setSignUpModalOpen(true);
    }
  }, [searchParams]);

  const handleModalClose = (open: boolean) => {
    setSignUpModalOpen(open);
    if (!open && searchParams.get('mode') === 'signup') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('mode');
      const search = newParams.toString();
      navigate(search ? `/auth?${search}` : '/auth', { replace: true });
    }
  };

  useEffect(() => {
    if (!user) return;
    const redirect = searchParams.get('redirect');
    const storedRedirect = (() => {
      try {
        return localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      } catch {
        return null;
      }
    })();
    const candidateRedirect = redirect || storedRedirect;
    const safeRedirect = candidateRedirect && candidateRedirect.startsWith('/') && !candidateRedirect.startsWith('/auth')
      ? candidateRedirect
      : null;
    const role = user.role;
    const normalizedRole = (role as string) === 'ROLE_ADMIN' ? 'ADMIN' : role;
    const dest = safeRedirect || (normalizedRole === 'ADMIN' ? '/admin' : normalizedRole === 'INSTRUCTOR' ? '/instructor' : '/dashboard');
    try {
      localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    } catch {
      // ignore storage errors
    }
    navigate(dest, { replace: true });
  }, [user, navigate, searchParams]);

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (!redirect) return;
    if (!redirect.startsWith('/') || redirect.startsWith('/auth')) return;
    try {
      localStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirect);
    } catch {
      // ignore storage errors
    }
  }, [searchParams]);

  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (!oauthError) return;
    toast({ title: 'OAuth login failed', description: oauthError });
    window.history.replaceState({}, '', '/auth');
  }, [searchParams, toast]);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    if (accessToken && refreshToken) {
      applyOAuthTokens(accessToken, refreshToken)
        .then(() => {
          const redirect = searchParams.get('redirect');
          const path = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/auth';
          window.history.replaceState({}, '', path);
        })
        .catch(() => {
          toast({ title: 'OAuth login failed', description: 'Please try again.' });
          window.history.replaceState({}, '', '/auth');
        });
    }
  }, [applyOAuthTokens, searchParams, toast]);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLastLoginAttempt({ email: signinEmail, password: signinPassword });
      await login({ email: signinEmail, password: signinPassword });
    } catch (error) {
      const err = error as (Error & { status?: number; code?: string });
      if (err?.status === 409 && err?.code === 'ALREADY_LOGGED_IN') {
        setConcurrentOpen(true);
        return;
      }
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast({ title: 'Auth error', description: message });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast({ title: 'Agree to terms', description: 'Please accept the terms to continue.' });
      return;
    }
    try {
      await signup({
        email: signupEmail,
        password: signupPassword,
        firstName,
        lastName,
        role: selectedRole,
        parentName: selectedRole === 'STUDENT' && parentName ? parentName : undefined,
        parentEmail: selectedRole === 'STUDENT' && parentEmail ? parentEmail : undefined,
        parentPhone: selectedRole === 'STUDENT' && parentPhone ? parentPhone : undefined,
        parentRelationship: selectedRole === 'STUDENT' && parentRelationship ? parentRelationship : undefined,
      });
      const createdUser = getStoredUser();
      // Save student church profile to localStorage if any profile field was filled
      if (selectedRole === 'STUDENT' && showProfileFields && createdUser?.id) {
        saveStudentProfile(createdUser.id, {
          fullName: `${firstName} ${lastName}`.trim(),
          ordination,
          otherOrdination: ordination === 'ሌላ' ? otherOrdination : '',
          gender,
          previousEducation,
          otherPreviousEducation: previousEducation === 'ሌላ' ? otherPreviousEducation : '',
          residenceType,
          residenceLocation,
          currentOccupation,
        });
      }
      setSignUpModalOpen(false);
      toast({ title: 'Success', description: 'Account created successfully!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      toast({ title: 'Auth error', description: message });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${getApiBaseUrl()}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Already logged in dialog */}
      <Dialog open={concurrentOpen} onOpenChange={setConcurrentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Already signed in</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{concurrentMessage}</p>
            <p className="text-sm text-muted-foreground">
              If you continue with <span className="font-medium text-foreground">Force login</span>, your first session will be terminated.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConcurrentOpen(false)}>Cancel</Button>
            <Button
              variant="accent"
              disabled={isLoading}
              onClick={async () => {
                try {
                  const attempt = lastLoginAttempt ?? { email: signinEmail, password: signinPassword };
                  setConcurrentOpen(false);
                  await login({ ...attempt, forceLogin: true });
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Authentication failed.';
                  toast({ title: 'Auth error', description: message });
                }
              }}
            >
              Force login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal Dialog */}
      <Dialog open={signUpModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">{t('common.brand')}</span>
            </div>
            <DialogTitle className="text-xl font-bold font-display pt-1">
              {t('auth.createAccount')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('auth.signUpSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Role Selector */}
          {/* <div className="mt-2">
            <Label className="text-xs text-muted-foreground mb-2 block">{t('auth.selectRole')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                    selectedRole === opt.role
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-semibold">{t(opt.labelKey)}</div>
                    <div className="text-[10px] opacity-80">{t(opt.descKey)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div> */}

          <form onSubmit={handleSignup} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-firstName" className="text-xs">{t('auth.firstName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="signup-firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ዮሐንስ / John"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-lastName" className="text-xs">{t('auth.lastName')}</Label>
                <Input
                  id="signup-lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ተስፋዬ / Doe"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-xs">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-xs">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 h-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* If STUDENT: Parent Information optional card */}
            {selectedRole === 'STUDENT' && (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowParentFields(!showParentFields)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    {t('auth.parentInfo', 'Parent / Guardian Information')}
                    <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {t('auth.optional', 'Optional')}
                    </span>
                  </span>
                  {showParentFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showParentFields && (
                  <div className="space-y-2.5 pt-1 text-xs">
                    <p className="text-[11px] text-muted-foreground">
                      {t('auth.parentInfoDesc', 'Enable your parents or guardians to connect directly with platform owners and your course instructors.')}
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="parentName" className="text-xs">{t('auth.parentName', 'Parent / Guardian Name')}</Label>
                      <Input
                        id="parentName"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Martha Smith"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="parentEmail" className="text-xs">{t('auth.parentEmail', 'Parent Email')}</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent@example.com"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="parentPhone" className="text-xs">{t('auth.parentPhone', 'Parent Phone')}</Label>
                        <Input
                          id="parentPhone"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="+1 555-0199"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="parentRelationship" className="text-xs">{t('auth.parentRelationship', 'Relationship')}</Label>
                      <Input
                        id="parentRelationship"
                        value={parentRelationship}
                        onChange={(e) => setParentRelationship(e.target.value)}
                        placeholder="e.g. Mother, Father, Guardian"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If STUDENT: Church & Background Profile optional card */}
            {selectedRole === 'STUDENT' && (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowProfileFields(!showProfileFields)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-accent" />
                    {t('auth.churchProfile', 'Church & Background Profile (ክህነትና የትምህርት ዝግጅት)')}
                    <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {t('auth.optional', 'Optional')}
                    </span>
                  </span>
                  {showProfileFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showProfileFields && (
                  <div className="space-y-3 pt-1 text-xs">
                    <p className="text-[11px] text-muted-foreground">
                      {t('auth.churchProfileDesc', 'Optional details for course tracking, ordination records, and certificate issuance.')}
                    </p>

                    {/* Ordination & Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label htmlFor="signup-ordination" className="text-xs flex items-center gap-1">
                          <Award className="h-3 w-3 text-muted-foreground" />
                          ክህነት / Ordination Status
                        </Label>
                        <Select value={ordination} onValueChange={setOrdination}>
                          <SelectTrigger id="signup-ordination" className="h-8 text-xs">
                            <SelectValue placeholder="ክህነት ይምረጡ" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDINATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {ordination === 'ሌላ' && (
                          <Input
                            className="mt-1 h-7 text-xs"
                            placeholder="ክህነትዎን ይጥቀሱ"
                            value={otherOrdination}
                            onChange={(e) => setOtherOrdination(e.target.value)}
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">ጾታ / Gender</Label>
                        <div className="flex items-center gap-4 h-8 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="modalSignupGender"
                              value="MALE"
                              checked={gender === 'MALE'}
                              onChange={() => setGender('MALE')}
                              className="accent-primary"
                            />
                            ወንድ (Male)
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="modalSignupGender"
                              value="FEMALE"
                              checked={gender === 'FEMALE'}
                              onChange={() => setGender('FEMALE')}
                              className="accent-primary"
                            />
                            ሴት (Female)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Previous Education reached */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-education" className="text-xs flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        ካሁን በፊት የደረሱበት ትምህርት / Previous Education
                      </Label>
                      <Select value={previousEducation} onValueChange={setPreviousEducation}>
                        <SelectTrigger id="signup-education" className="h-8 text-xs">
                          <SelectValue placeholder="የትምህርት ደረጃ ይምረጡ" />
                        </SelectTrigger>
                        <SelectContent>
                          {EDUCATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {previousEducation === 'ሌላ' && (
                        <Input
                          className="mt-1 h-7 text-xs"
                          placeholder="የደረሱበትን የትምህርት ደረጃ ይጥቀሱ"
                          value={otherPreviousEducation}
                          onChange={(e) => setOtherPreviousEducation(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Residence Address */}
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        የመኖሪያ አድራሻ / Residence
                      </Label>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="modalSignupResidenceType"
                            value="ETHIOPIA"
                            checked={residenceType === 'ETHIOPIA'}
                            onChange={() => setResidenceType('ETHIOPIA')}
                            className="accent-primary"
                          />
                          በኢትዮጵያ ውስጥ (In Ethiopia)
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="modalSignupResidenceType"
                            value="ABROAD"
                            checked={residenceType === 'ABROAD'}
                            onChange={() => setResidenceType('ABROAD')}
                            className="accent-primary"
                          />
                          በውጭ ሀገር (Abroad)
                        </label>
                      </div>
                      <Input
                        placeholder={
                          residenceType === 'ETHIOPIA'
                            ? 'ከተማ / ክልል (ለምሳሌ፡ አዲስ አበባ፣ ባሕር ዳር...)'
                            : 'ሀገርና ከተማ (e.g. USA, Germany, London...)'
                        }
                        value={residenceLocation}
                        onChange={(e) => setResidenceLocation(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Current Occupation */}
                    <div className="space-y-1">
                      <Label htmlFor="signup-occupation" className="text-xs flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        የአሁን የሥራ ሁኔታ / Current Occupation
                      </Label>
                      <Input
                        id="signup-occupation"
                        placeholder="ለምሳሌ፡ መምህር፣ የሕክምና ባለሙያ፣ ነጋዴ፣ ተማሪ..."
                        value={currentOccupation}
                        onChange={(e) => setCurrentOccupation(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 pt-1">
              <Checkbox id="modal-terms" checked={agreeTerms} onCheckedChange={(c) => setAgreeTerms(c as boolean)} className="mt-0.5" />
              <Label htmlFor="modal-terms" className="text-xs text-muted-foreground font-normal leading-relaxed">
                {t('auth.agreeTerms')} <Link to="/terms" className="text-accent hover:underline">{t('auth.terms')}</Link> {t('auth.agreeTermsSuffix')} <Link to="/privacy" className="text-accent hover:underline">{t('auth.privacy')}</Link>
              </Label>
            </div>

            <Button type="submit" variant="accent" className="w-full" size="default" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('auth.createAccountButton')}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t('auth.google')}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => handleModalClose(false)}
              className="text-accent font-medium hover:underline cursor-pointer"
            >
              {t('common.signIn')}
            </button>
          </p>
        </DialogContent>
      </Dialog>

      {/* Left Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-card">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> {t('auth.backToHome')}
          </Link>

          {/* Language toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <GraduationCap className="h-6 w-6 text-accent-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">{t('common.brand')}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('language.english')}>
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {supportedLngs.map((lng) => (
                  <DropdownMenuItem key={lng} onClick={() => setLanguage(lng)} className={i18n.language?.startsWith(lng) ? 'bg-accent/10' : ''}>
                    {languageNames[lng]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-muted-foreground">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSignin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="signin-email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-email"
                  type="email"
                  required
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">{t('auth.password')}</Label>
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">{t('auth.forgotPassword')}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type={showSigninPassword ? 'text' : 'password'}
                  required
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSigninPassword(!showSigninPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('auth.signInButton')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {t('auth.google')}
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook (soon)
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('auth.dontHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => setSignUpModalOpen(true)}
              className="text-accent font-medium hover:underline cursor-pointer"
            >
              {t('auth.signUp')}
            </button>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 gradient-hero" />
        <img src="/bete-gubae.png" alt="Students learning" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground max-w-md">
            <h2 className="font-display text-3xl font-bold mb-4">
              {t('auth.bannerTitle', 'Know your faith, love your Church, and live by preserving the traditions of your fathers')}
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              {t('auth.bannerSubtitle', 'Learn the teachings and traditions of the Ethiopian Orthodox Tewahedo Church. Study Nibab, Zema, Liturgy, Qine, Diguwa, and more, so that you may know and love your Church and participate in her worship with knowledge, understanding, and devotion.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
