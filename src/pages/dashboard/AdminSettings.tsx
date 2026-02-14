import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Globe, DollarSign, Mail, ShieldCheck, Palette } from 'lucide-react';

const AdminSettings = () => {
  const { toast } = useToast();
  const [general, setGeneral] = useState({
    siteName: 'LearnHub',
    tagline: 'Ethiopia\'s Premier Learning Platform',
    supportEmail: 'support@learnhub.et',
    defaultLanguage: 'en',
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: true,
  });

  const [financial, setFinancial] = useState({
    platformFee: 15,
    minPayout: 500,
    payoutSchedule: 'MONTHLY',
    currency: 'ETB',
    taxRate: 0,
    refundWindow: 30,
  });

  const [email, setEmail] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    senderName: 'LearnHub',
    senderEmail: 'no-reply@learnhub.et',
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
                <Button variant="accent" className="gap-1" onClick={() => save('Financial')}><Save className="h-4 w-4" /> Save Changes</Button>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
