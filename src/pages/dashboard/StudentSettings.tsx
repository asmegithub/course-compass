import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, Globe, UserCheck, Upload, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const StudentSettings = () => {
  const { user } = useAuth();
  const [showParentSection, setShowParentSection] = useState(
    !!(user?.parentName || user?.parentEmail || user?.parentPhone)
  );

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    profileImage: user?.profileImage ?? '',
    timezone: user?.timezone ?? '',
    language: user?.language ?? 'en',
    parentName: user?.parentName ?? '',
    parentEmail: user?.parentEmail ?? '',
    parentPhone: user?.parentPhone ?? '',
    parentRelationship: user?.parentRelationship ?? '',
  });

  const saveMut = useMutation({
    mutationFn: (payload: typeof form) =>
      apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => toast({ title: 'Settings saved!', description: 'Your profile has been updated.' }),
    onError: () => toast({ title: 'Save failed', variant: 'destructive' }),
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const handleSave = () => saveMut.mutate(form);

  const getInitials = (first = '', last = '') => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and guardian information.</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-violet-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-violet-500/30">
                <AvatarImage src={form.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-700 text-white font-semibold text-xl">
                  {getInitials(form.firstName, form.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mt-1">
                    <Upload className="h-3 w-3" /> Change avatar URL
                  </span>
                  <Input
                    className="mt-1.5 h-7 text-xs bg-white/5 border-white/10"
                    placeholder="https://example.com/avatar.png"
                    value={form.profileImage}
                    onChange={handleChange('profileImage')}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={handleChange('firstName')} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={handleChange('lastName')} className="bg-white/5 border-white/10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </Label>
              <Input id="phone" value={form.phone} onChange={handleChange('phone')} placeholder="+251 9XX XXX XXXX" className="bg-white/5 border-white/10" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">Bio</Label>
              <Textarea id="bio" value={form.bio} onChange={handleChange('bio')} rows={3} placeholder="Write a short bio..." className="bg-white/5 border-white/10 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Language
                </Label>
                <select
                  value={form.language}
                  onChange={handleChange('language')}
                  className="w-full h-9 text-sm bg-white/5 border border-white/10 rounded-md px-3 text-foreground"
                >
                  <option value="en">English</option>
                  <option value="am">Amharic (አማርኛ)</option>
                  <option value="om">Oromo (Afaan Oromoo)</option>
                  <option value="gz">Ge'ez (ግዕዝ)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Timezone</Label>
                <Input value={form.timezone} onChange={handleChange('timezone')} placeholder="e.g. Africa/Addis_Ababa" className="bg-white/5 border-white/10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent / Guardian */}
        <Card className="overflow-hidden">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowParentSection(s => !s)}
          >
            <CardHeader className="hover:bg-white/3 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-base">Parent / Guardian Information</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Optional</span>
                  {showParentSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              <CardDescription className="text-xs">
                Adding parent or guardian contact allows instructors and platform staff to communicate with them about course progress.
              </CardDescription>
            </CardHeader>
          </button>

          {showParentSection && (
            <CardContent className="space-y-4 border-t border-white/10 pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Parent / Guardian Full Name</Label>
                  <Input
                    value={form.parentName}
                    onChange={handleChange('parentName')}
                    placeholder="e.g. Abebe Bikila"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Relationship</Label>
                  <select
                    value={form.parentRelationship}
                    onChange={handleChange('parentRelationship')}
                    className="w-full h-9 text-sm bg-white/5 border border-white/10 rounded-md px-3 text-foreground"
                  >
                    <option value="">Select...</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Parent Email
                </Label>
                <Input
                  type="email"
                  value={form.parentEmail}
                  onChange={handleChange('parentEmail')}
                  placeholder="parent@example.com"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Parent Phone
                </Label>
                <Input
                  value={form.parentPhone}
                  onChange={handleChange('parentPhone')}
                  placeholder="+251 9XX XXX XXXX"
                  className="bg-white/5 border-white/10"
                />
              </div>

              {(form.parentName || form.parentEmail || form.parentPhone) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-300 font-medium">✅ Parent information is set</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructors and platform admins will see a <span className="text-amber-300 font-medium">Parent Badge</span> next to your messages and profile.
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saveMut.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMut.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;
