import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { applyInstructorProfile, getMyInstructorProfile } from '@/lib/instructor-profile-api';
import { toast } from '@/hooks/use-toast';

const StudentInstructorApplication = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-instructor-profile'],
    queryFn: getMyInstructorProfile,
  });

  const [headline, setHeadline] = useState('');
  const [biography, setBiography] = useState('');
  const [expertise, setExpertise] = useState('');
  const [socialLinks, setSocialLinks] = useState('');

  const statusLabel = useMemo(() => {
    if (!profile) return 'Not Applied';
    return profile.isVerified ? 'Verified' : 'Pending Review';
  }, [profile]);

  const applyMutation = useMutation({
    mutationFn: () => applyInstructorProfile({ headline, biography, expertise, socialLinks }),
    onSuccess: () => {
      toast({ title: 'Application submitted', description: 'Your instructor profile has been sent for admin review.' });
      queryClient.invalidateQueries({ queryKey: ['my-instructor-profile'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to submit application.';
      toast({ title: 'Submission failed', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!headline.trim() || !biography.trim()) {
      toast({ title: 'Missing required fields', description: 'Please provide headline and biography.', variant: 'destructive' });
      return;
    }
    applyMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Apply as Instructor</h1>
          <p className="text-muted-foreground mt-1">Submit your profile for admin verification.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading status...</p>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={profile?.isVerified ? 'default' : profile ? 'secondary' : 'outline'}>{statusLabel}</Badge>
                {profile?.isVerified && <span className="text-sm text-muted-foreground">Your role should now be updated to instructor.</span>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructor Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline *</Label>
              <Input
                placeholder="e.g., Software Engineer & Web Instructor"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Biography *</Label>
              <Textarea
                rows={5}
                placeholder="Tell students about your background and teaching experience"
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expertise (comma-separated)</Label>
              <Input
                placeholder="Java, Spring Boot, React"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Social Links</Label>
              <Input
                placeholder="LinkedIn/GitHub URL or short profile links"
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentInstructorApplication;
