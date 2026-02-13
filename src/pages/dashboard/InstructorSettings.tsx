import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { User, Upload, Globe, Bell, Shield, Linkedin, Github, Twitter } from 'lucide-react';

const InstructorSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    headline: 'Senior Software Engineer & Educator',
    bio: 'Passionate about teaching the next generation of developers in Ethiopia and Africa. 10+ years of experience in web development.',
    expertise: ['React', 'Node.js', 'Python', 'UI/UX'],
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
  });
  const [notifications, setNotifications] = useState({
    newEnrollment: true,
    newReview: true,
    newQuestion: true,
    payoutUpdate: true,
    marketing: false,
  });
  const [newExpertise, setNewExpertise] = useState('');

  const addExpertise = () => {
    if (newExpertise.trim() && !profile.expertise.includes(newExpertise.trim())) {
      setProfile((p) => ({ ...p, expertise: [...p.expertise, newExpertise.trim()] }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (tag: string) => {
    setProfile((p) => ({ ...p, expertise: p.expertise.filter((e) => e !== tag) }));
  };

  const handleSave = () => {
    toast({ title: 'Settings saved', description: 'Your profile has been updated.' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your instructor profile and preferences.</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Upload className="h-3 w-3" /> Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 2MB</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input placeholder="Your professional title" value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Biography</Label>
              <Textarea rows={4} placeholder="Tell students about yourself..." value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Expertise Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.expertise.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeExpertise(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add expertise..." value={newExpertise} onChange={(e) => setNewExpertise(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())} />
                <Button variant="outline" size="sm" onClick={addExpertise}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Website', icon: Globe, field: 'website' as const, placeholder: 'https://yoursite.com' },
              { label: 'LinkedIn', icon: Linkedin, field: 'linkedin' as const, placeholder: 'https://linkedin.com/in/...' },
              { label: 'GitHub', icon: Github, field: 'github' as const, placeholder: 'https://github.com/...' },
              { label: 'Twitter / X', icon: Twitter, field: 'twitter' as const, placeholder: 'https://x.com/...' },
            ].map((s) => (
              <div key={s.field} className="flex items-center gap-3">
                <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input placeholder={s.placeholder} value={profile[s.field]} onChange={(e) => setProfile((p) => ({ ...p, [s.field]: e.target.value }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'New Enrollment', desc: 'When a student enrolls in your course', key: 'newEnrollment' as const },
              { label: 'New Review', desc: 'When a student leaves a review', key: 'newReview' as const },
              { label: 'New Question', desc: 'When a student asks a question', key: 'newQuestion' as const },
              { label: 'Payout Updates', desc: 'When your payout is processed', key: 'payoutUpdate' as const },
              { label: 'Marketing Emails', desc: 'Tips and promotional emails', key: 'marketing' as const },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={notifications[n.key]} onCheckedChange={(v) => setNotifications((prev) => ({ ...prev, [n.key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="px-8">Save Changes</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorSettings;
