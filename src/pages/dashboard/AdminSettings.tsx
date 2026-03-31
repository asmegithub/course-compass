import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Globe, DollarSign, Mail, ShieldCheck, Bell, Landmark, Wallet, Star } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { enableAdminPushNotifications, getAdminPushStatus, sendAdminTestPush } from '@/lib/push-api';
import { createPaymentAccount, createSystemSetting, deletePaymentAccount, getPaymentAccounts, getSystemSettings, PaymentAccount, setCourseFeatured, updatePaymentAccount, updateSystemSetting } from '@/lib/admin-api';
import { createPayoutMethodOption, deletePayoutMethodOption, getPayoutMethodOptions, PayoutMethodOption, updatePayoutMethodOption } from '@/lib/admin-api';
import { getCourses } from '@/lib/course-api';
import type { Course } from '@/types';

const AdminSettings = () => {
  const { toast } = useToast();
  const [general, setGeneral] = useState({
    siteName: 'BeteGubae',
    tagline: 'Ethiopia\'s Premier Learning Platform',
    supportEmail: 'support@BeteGubae.et',
    defaultLanguage: 'en',
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: true,
  });

  const [financial, setFinancial] = useState({
    platformFee: 15,
    referralRewardPercent: 5,
    minPayout: 500,
    payoutSchedule: 'MONTHLY',
    currency: 'ETB',
    taxRate: 0,
    refundWindow: 30,
  });

  const [email, setEmail] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    senderName: 'BeteGubae',
    senderEmail: 'no-reply@BeteGubae.et',
    welcomeEmailEnabled: true,
    enrollmentEmailEnabled: true,
    payoutEmailEnabled: true,
  });

  const [security, setSecurity] = useState({
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    twoFactorRequired: false,
    passwordMinLength: 8,
    autoApproveInstructors: false,
    requireCourseApproval: true,
  });

  const pushStatusQuery = useQuery({
    queryKey: ['admin-push-status'],
    queryFn: getAdminPushStatus,
  });

  const paymentAccountsQuery = useQuery({
    queryKey: ['admin-payment-accounts'],
    queryFn: getPaymentAccounts,
  });

  const payoutMethodsQuery = useQuery({
    queryKey: ['admin-payout-method-options'],
    queryFn: getPayoutMethodOptions,
  });

  const approvedCoursesQuery = useQuery({
    queryKey: ['admin-approved-courses'],
    queryFn: getCourses,
  });

  const systemSettingsQuery = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  });

  const platformFeeSetting = useMemo(
    () => (systemSettingsQuery.data ?? []).find((s) => s.key === 'PLATFORM_FEE_PERCENT' || s.key === 'PLATFORM_FEE'),
    [systemSettingsQuery.data],
  );
  const referralRewardSetting = useMemo(
    () => (systemSettingsQuery.data ?? []).find((s) => s.key === 'REFERRAL_REWARD_PERCENT' || s.key === 'REFERRAL_PERCENT'),
    [systemSettingsQuery.data],
  );

  useEffect(() => {
    const raw = platformFeeSetting?.value;
    if (raw == null || String(raw).trim() === '') return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setFinancial((f) => ({ ...f, platformFee: parsed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformFeeSetting?.value]);

  useEffect(() => {
    const raw = referralRewardSetting?.value;
    if (raw == null || String(raw).trim() === '') return;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return;
    setFinancial((f) => ({ ...f, referralRewardPercent: parsed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralRewardSetting?.value]);

  const upsertPlatformFeeMutation = useMutation({
    mutationFn: async () => {
      const platformPayload = {
        key: 'PLATFORM_FEE_PERCENT',
        value: String(financial.platformFee),
        description: 'Platform fee percentage applied to course payments',
        isPublic: false,
      };
      const referralPayload = {
        key: 'REFERRAL_REWARD_PERCENT',
        value: String(financial.referralRewardPercent),
        description: 'Referral reward percentage credited to a user when a referred friend enrolls',
        isPublic: false,
      };

      if (platformFeeSetting?.id) {
        await updateSystemSetting(platformFeeSetting.id, platformPayload);
      } else {
        await createSystemSetting(platformPayload);
      }
      if (referralRewardSetting?.id) {
        await updateSystemSetting(referralRewardSetting.id, referralPayload);
      } else {
        await createSystemSetting(referralPayload);
      }
      return true;
    },
    onSuccess: () => {
      toast({ title: 'Financial settings saved' });
      systemSettingsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to save financial settings',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const [newAccount, setNewAccount] = useState<Partial<PaymentAccount>>({
    providerName: '',
    type: 'BANK',
    accountName: '',
    accountNumber: '',
    ussdCode: '',
    instructions: '',
    isActive: true,
  });

  const createAccountMutation = useMutation({
    mutationFn: createPaymentAccount,
    onSuccess: () => {
      toast({ title: 'Payment account created', description: 'Students will see it in manual payment option.' });
      setNewAccount({ providerName: '', type: 'BANK', accountName: '', accountNumber: '', ussdCode: '', instructions: '', isActive: true });
      paymentAccountsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<PaymentAccount> }) => updatePaymentAccount(payload.id, payload.data),
    onSuccess: () => {
      toast({ title: 'Payment account updated' });
      paymentAccountsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deletePaymentAccount,
    onSuccess: () => {
      toast({ title: 'Payment account deleted' });
      paymentAccountsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const paymentAccounts = useMemo(() => paymentAccountsQuery.data ?? [], [paymentAccountsQuery.data]);
  const payoutMethods = useMemo(() => payoutMethodsQuery.data ?? [], [payoutMethodsQuery.data]);
  const approvedCourses = useMemo(
    () => (approvedCoursesQuery.data ?? []).filter(
      (c) => (c.status === 'APPROVED' || c.status === 'PUBLISHED') && c.isPublished !== false,
    ),
    [approvedCoursesQuery.data],
  );

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (payload: { courseId: string; isFeatured: boolean }) => setCourseFeatured(payload.courseId, payload.isFeatured),
    onSuccess: () => {
      toast({ title: 'Featured courses updated' });
      approvedCoursesQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update featured flag',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const [newPayoutMethod, setNewPayoutMethod] = useState<Partial<PayoutMethodOption>>({
    name: '',
    type: 'BANK_TRANSFER',
    fieldsJson: JSON.stringify([{ key: 'accountName', label: 'Account name', required: true }, { key: 'accountNumber', label: 'Account number', required: true }, { key: 'bankName', label: 'Bank name', required: true }], null, 2),
    isActive: true,
  });

  const createPayoutMethodMutation = useMutation({
    mutationFn: createPayoutMethodOption,
    onSuccess: () => {
      toast({ title: 'Payout method created', description: 'Instructors can now select it when requesting withdrawals.' });
      payoutMethodsQuery.refetch();
      setNewPayoutMethod({ name: '', type: 'BANK_TRANSFER', fieldsJson: newPayoutMethod.fieldsJson, isActive: true });
    },
    onError: (error) => {
      toast({ title: 'Failed to create payout method', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const updatePayoutMethodMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<PayoutMethodOption> }) => updatePayoutMethodOption(payload.id, payload.data),
    onSuccess: () => {
      toast({ title: 'Payout method updated' });
      payoutMethodsQuery.refetch();
    },
    onError: (error) => {
      toast({ title: 'Failed to update payout method', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const deletePayoutMethodMutation = useMutation({
    mutationFn: deletePayoutMethodOption,
    onSuccess: () => {
      toast({ title: 'Payout method deleted' });
      payoutMethodsQuery.refetch();
    },
    onError: (error) => {
      toast({ title: 'Failed to delete payout method', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    },
  });

  const enablePushMutation = useMutation({
    mutationFn: enableAdminPushNotifications,
    onSuccess: () => {
      toast({ title: 'Push notifications enabled', description: 'This browser is now subscribed for admin alerts.' });
      pushStatusQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Unable to enable push notifications',
        description: error instanceof Error ? error.message : 'Please check browser permissions.',
        variant: 'destructive',
      });
      pushStatusQuery.refetch();
    },
  });

  const testPushMutation = useMutation({
    mutationFn: sendAdminTestPush,
    onSuccess: () => {
      toast({ title: 'Test notification sent', description: 'Check your device notification tray.' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send test notification',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const save = (section: string) => {
    toast({ title: `${section} settings saved`, description: 'Changes have been applied.' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure platform-wide settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general" className="gap-1"><Globe className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="financial" className="gap-1"><DollarSign className="h-3.5 w-3.5" /> Financial</TabsTrigger>
            <TabsTrigger value="email" className="gap-1"><Mail className="h-3.5 w-3.5" /> Email</TabsTrigger>
            <TabsTrigger value="security" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Security</TabsTrigger>
            <TabsTrigger value="featured" className="gap-1"><Star className="h-3.5 w-3.5" /> Featured Courses</TabsTrigger>
            <TabsTrigger value="payment" className="gap-1"><Landmark className="h-3.5 w-3.5" /> Payment Accounts</TabsTrigger>
            <TabsTrigger value="payout-methods" className="gap-1"><Wallet className="h-3.5 w-3.5" /> Payout Methods</TabsTrigger>
            <TabsTrigger value="push" className="gap-1"><Bell className="h-3.5 w-3.5" /> Push</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Site Name</Label><Input value={general.siteName} onChange={e => setGeneral(g => ({ ...g, siteName: e.target.value }))} /></div>
                  <div><Label>Support Email</Label><Input value={general.supportEmail} onChange={e => setGeneral(g => ({ ...g, supportEmail: e.target.value }))} /></div>
                </div>
                <div><Label>Tagline</Label><Input value={general.tagline} onChange={e => setGeneral(g => ({ ...g, tagline: e.target.value }))} /></div>
                <div>
                  <Label>Default Language</Label>
                  <Select value={general.defaultLanguage} onValueChange={v => setGeneral(g => ({ ...g, defaultLanguage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="am">Amharic</SelectItem>
                      <SelectItem value="om">Afaan Oromoo</SelectItem>
                      <SelectItem value="gz">Geez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between"><Label>Maintenance Mode</Label><Switch checked={general.maintenanceMode} onCheckedChange={v => setGeneral(g => ({ ...g, maintenanceMode: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Open Registration</Label><Switch checked={general.registrationOpen} onCheckedChange={v => setGeneral(g => ({ ...g, registrationOpen: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Require Email Verification</Label><Switch checked={general.requireEmailVerification} onCheckedChange={v => setGeneral(g => ({ ...g, requireEmailVerification: v }))} /></div>
                </div>
                <Button variant="accent" className="gap-1" onClick={() => save('General')}><Save className="h-4 w-4" /> Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial */}
          <TabsContent value="financial">
            <Card>
              <CardHeader><CardTitle className="text-lg">Financial Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Platform Fee (%)</Label><Input type="number" value={financial.platformFee} onChange={e => setFinancial(f => ({ ...f, platformFee: Number(e.target.value) }))} /></div>
                  <div><Label>Referral Reward (%)</Label><Input type="number" value={financial.referralRewardPercent} onChange={e => setFinancial(f => ({ ...f, referralRewardPercent: Number(e.target.value) }))} /></div>
                  <div><Label>Min Payout Amount (ETB)</Label><Input type="number" value={financial.minPayout} onChange={e => setFinancial(f => ({ ...f, minPayout: Number(e.target.value) }))} /></div>
                  <div>
                    <Label>Payout Schedule</Label>
                    <Select value={financial.payoutSchedule} onValueChange={v => setFinancial(f => ({ ...f, payoutSchedule: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Refund Window (days)</Label><Input type="number" value={financial.refundWindow} onChange={e => setFinancial(f => ({ ...f, refundWindow: Number(e.target.value) }))} /></div>
                </div>
                <Button
                  variant="accent"
                  className="gap-1"
                  onClick={() => upsertPlatformFeeMutation.mutate()}
                  disabled={upsertPlatformFeeMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  {upsertPlatformFeeMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email */}
          <TabsContent value="email">
            <Card>
              <CardHeader><CardTitle className="text-lg">Email Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>SMTP Host</Label><Input value={email.smtpHost} onChange={e => setEmail(em => ({ ...em, smtpHost: e.target.value }))} /></div>
                  <div><Label>SMTP Port</Label><Input value={email.smtpPort} onChange={e => setEmail(em => ({ ...em, smtpPort: e.target.value }))} /></div>
                  <div><Label>Sender Name</Label><Input value={email.senderName} onChange={e => setEmail(em => ({ ...em, senderName: e.target.value }))} /></div>
                  <div><Label>Sender Email</Label><Input value={email.senderEmail} onChange={e => setEmail(em => ({ ...em, senderEmail: e.target.value }))} /></div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between"><Label>Welcome Email</Label><Switch checked={email.welcomeEmailEnabled} onCheckedChange={v => setEmail(em => ({ ...em, welcomeEmailEnabled: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Enrollment Confirmation Email</Label><Switch checked={email.enrollmentEmailEnabled} onCheckedChange={v => setEmail(em => ({ ...em, enrollmentEmailEnabled: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Payout Notification Email</Label><Switch checked={email.payoutEmailEnabled} onCheckedChange={v => setEmail(em => ({ ...em, payoutEmailEnabled: v }))} /></div>
                </div>
                <Button variant="accent" className="gap-1" onClick={() => save('Email')}><Save className="h-4 w-4" /> Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader><CardTitle className="text-lg">Security & Policies</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Max Login Attempts</Label><Input type="number" value={security.maxLoginAttempts} onChange={e => setSecurity(s => ({ ...s, maxLoginAttempts: Number(e.target.value) }))} /></div>
                  <div><Label>Session Timeout (min)</Label><Input type="number" value={security.sessionTimeout} onChange={e => setSecurity(s => ({ ...s, sessionTimeout: Number(e.target.value) }))} /></div>
                  <div><Label>Min Password Length</Label><Input type="number" value={security.passwordMinLength} onChange={e => setSecurity(s => ({ ...s, passwordMinLength: Number(e.target.value) }))} /></div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between"><Label>Require 2FA for Admins</Label><Switch checked={security.twoFactorRequired} onCheckedChange={v => setSecurity(s => ({ ...s, twoFactorRequired: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Auto-Approve New Instructors</Label><Switch checked={security.autoApproveInstructors} onCheckedChange={v => setSecurity(s => ({ ...s, autoApproveInstructors: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>Require Course Approval</Label><Switch checked={security.requireCourseApproval} onCheckedChange={v => setSecurity(s => ({ ...s, requireCourseApproval: v }))} /></div>
                </div>
                <Button variant="accent" className="gap-1" onClick={() => save('Security')}><Save className="h-4 w-4" /> Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <Card>
              <CardHeader><CardTitle className="text-lg">Featured Courses (Homepage)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Toggle which approved courses appear in the homepage featured section.
                </p>

                {approvedCoursesQuery.isLoading && (
                  <p className="text-sm text-muted-foreground">Loading courses…</p>
                )}
                {approvedCoursesQuery.isError && (
                  <p className="text-sm text-destructive">Failed to load courses.</p>
                )}

                {!approvedCoursesQuery.isLoading && !approvedCoursesQuery.isError && approvedCourses.length === 0 && (
                  <p className="text-sm text-muted-foreground">No approved courses found.</p>
                )}

                <div className="space-y-3">
                  {approvedCourses.map((c: Course) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.category?.name ?? ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Featured</span>
                        <Switch
                          checked={Boolean(c.isFeatured)}
                          disabled={toggleFeaturedMutation.isPending}
                          onCheckedChange={(v) => toggleFeaturedMutation.mutate({ courseId: c.id, isFeatured: v })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader><CardTitle className="text-lg">Payment Accounts (Manual Transfers)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add bank accounts and wallets (Telebirr, etc). Students will see <span className="font-medium">active</span> accounts in the Cart manual payment option.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Provider / Bank / Wallet</Label>
                      <Input value={newAccount.providerName ?? ''} onChange={e => setNewAccount(a => ({ ...a, providerName: e.target.value }))} placeholder="e.g. Commercial Bank of Ethiopia" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={(newAccount.type ?? 'BANK') as string} onValueChange={v => setNewAccount(a => ({ ...a, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BANK">Bank</SelectItem>
                          <SelectItem value="WALLET">Wallet</SelectItem>
                          <SelectItem value="USSD">USSD</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Account Name</Label>
                      <Input value={newAccount.accountName ?? ''} onChange={e => setNewAccount(a => ({ ...a, accountName: e.target.value }))} placeholder="Account holder name" />
                    </div>
                    <div>
                      <Label>Account / Wallet Number</Label>
                      <Input value={newAccount.accountNumber ?? ''} onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))} placeholder="e.g. 1000xxxxxx" />
                    </div>
                    <div>
                      <Label>USSD Code (optional)</Label>
                      <Input value={newAccount.ussdCode ?? ''} onChange={e => setNewAccount(a => ({ ...a, ussdCode: e.target.value }))} placeholder="e.g. *847#" />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center justify-between w-full gap-3 rounded-md border p-3">
                        <div>
                          <p className="text-sm font-medium">Active</p>
                          <p className="text-xs text-muted-foreground">Shown to students</p>
                        </div>
                        <Switch checked={Boolean(newAccount.isActive)} onCheckedChange={v => setNewAccount(a => ({ ...a, isActive: v }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Instructions (optional)</Label>
                    <Input value={newAccount.instructions ?? ''} onChange={e => setNewAccount(a => ({ ...a, instructions: e.target.value }))} placeholder="e.g. Write your full name in transfer description" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="accent"
                      disabled={createAccountMutation.isPending || !newAccount.providerName}
                      onClick={() => createAccountMutation.mutate(newAccount)}
                    >
                      {createAccountMutation.isPending ? 'Saving...' : 'Add Account'}
                    </Button>
                    <Button variant="outline" onClick={() => paymentAccountsQuery.refetch()} disabled={paymentAccountsQuery.isLoading}>
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Existing Accounts</h3>
                    {paymentAccountsQuery.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
                  </div>

                  {!paymentAccountsQuery.isLoading && paymentAccounts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No payment accounts added yet.</p>
                  )}

                  <div className="space-y-3">
                    {paymentAccounts.map((acc) => (
                      <div key={acc.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{acc.providerName}</p>
                            <p className="text-xs text-muted-foreground">{acc.type}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Active</span>
                              <Switch
                                checked={Boolean(acc.isActive)}
                                onCheckedChange={(v) => updateAccountMutation.mutate({ id: acc.id, data: { isActive: v } })}
                                disabled={updateAccountMutation.isPending}
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAccountMutation.mutate(acc.id)}
                              disabled={deleteAccountMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Account Name</Label>
                            <Input
                              defaultValue={acc.accountName ?? ''}
                              onBlur={(e) => updateAccountMutation.mutate({ id: acc.id, data: { accountName: e.target.value } })}
                              placeholder="Account name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Account / Wallet Number</Label>
                            <Input
                              defaultValue={acc.accountNumber ?? ''}
                              onBlur={(e) => updateAccountMutation.mutate({ id: acc.id, data: { accountNumber: e.target.value } })}
                              placeholder="Account / wallet number"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">USSD Code</Label>
                            <Input
                              defaultValue={acc.ussdCode ?? ''}
                              onBlur={(e) => updateAccountMutation.mutate({ id: acc.id, data: { ussdCode: e.target.value } })}
                              placeholder="USSD code"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Instructions</Label>
                            <Input
                              defaultValue={acc.instructions ?? ''}
                              onBlur={(e) => updateAccountMutation.mutate({ id: acc.id, data: { instructions: e.target.value } })}
                              placeholder="Instructions"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payout-methods">
            <Card>
              <CardHeader><CardTitle className="text-lg">Instructor Payout Methods</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Configure system-wide payout methods that instructors can choose from when requesting withdrawals.
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={newPayoutMethod.name ?? ''} onChange={e => setNewPayoutMethod(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Telebirr Wallet" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Input value={newPayoutMethod.type ?? ''} onChange={e => setNewPayoutMethod(m => ({ ...m, type: e.target.value }))} placeholder="e.g. TELEBIRR" />
                    </div>
                  </div>
                  <div>
                    <Label>Fields JSON</Label>
                    <Input value={newPayoutMethod.fieldsJson ?? ''} onChange={e => setNewPayoutMethod(m => ({ ...m, fieldsJson: e.target.value }))} placeholder='[{"key":"phone","label":"Phone","required":true}]' />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide a JSON array of fields with {`key,label,required,placeholder,type`}. (UI uses this to render the form.)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="accent" disabled={createPayoutMethodMutation.isPending || !newPayoutMethod.name || !newPayoutMethod.type} onClick={() => createPayoutMethodMutation.mutate(newPayoutMethod)}>
                      {createPayoutMethodMutation.isPending ? 'Saving...' : 'Add payout method'}
                    </Button>
                    <Button variant="outline" onClick={() => payoutMethodsQuery.refetch()} disabled={payoutMethodsQuery.isLoading}>
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Existing methods</h3>
                    {payoutMethodsQuery.isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
                  </div>

                  {!payoutMethodsQuery.isLoading && payoutMethods.length === 0 && (
                    <p className="text-sm text-muted-foreground">No payout methods configured yet.</p>
                  )}

                  <div className="space-y-3">
                    {payoutMethods.map((m) => (
                      <div key={m.id} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updatePayoutMethodMutation.mutate({ id: m.id, data: { isActive: !(m.isActive ?? true) } })}
                              disabled={updatePayoutMethodMutation.isPending}
                            >
                              {(m.isActive ?? true) ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePayoutMethodMutation.mutate(m.id)}
                              disabled={deletePayoutMethodMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Fields JSON</Label>
                          <Input
                            defaultValue={m.fieldsJson ?? ''}
                            onBlur={(e) => updatePayoutMethodMutation.mutate({ id: m.id, data: { fieldsJson: e.target.value } })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="push">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Push Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Default behavior: admins are auto-subscribed after login (browser permission required).
                  </p>
                  {pushStatusQuery.isLoading && <p className="text-muted-foreground">Checking push status...</p>}
                  {!pushStatusQuery.isLoading && pushStatusQuery.data && (
                    <>
                      <p>
                        <span className="font-medium">Browser Support:</span> {pushStatusQuery.data.supported ? 'Supported' : 'Not supported'}
                      </p>
                      <p>
                        <span className="font-medium">Permission:</span> {pushStatusQuery.data.permission}
                      </p>
                      <p>
                        <span className="font-medium">Subscribed:</span> {pushStatusQuery.data.subscribed ? 'Yes' : 'No'}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="accent"
                    onClick={() => enablePushMutation.mutate()}
                    disabled={enablePushMutation.isPending}
                  >
                    {enablePushMutation.isPending ? 'Enabling...' : 'Enable / Re-subscribe'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testPushMutation.mutate()}
                    disabled={testPushMutation.isPending || !pushStatusQuery.data?.subscribed}
                  >
                    {testPushMutation.isPending ? 'Sending...' : 'Send Test Notification'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
