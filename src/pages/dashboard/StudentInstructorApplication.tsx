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
import { useTranslation } from 'react-i18next';

const StudentInstructorApplication = () => {
  const { t } = useTranslation();
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
    if (!profile) return t('instructorApplication.statusNotApplied', 'Not Applied');
    return profile.isVerified
      ? t('instructorApplication.statusVerified', 'Verified')
      : t('instructorApplication.statusPending', 'Pending Review');
  }, [profile, t]);

  const applyMutation = useMutation({
    mutationFn: () => applyInstructorProfile({ headline, biography, expertise, socialLinks }),
    onSuccess: () => {
      toast({
        title: t('instructorApplication.successTitle', 'Application submitted'),
        description: t('instructorApplication.successDesc', 'Your instructor profile has been sent for admin review.'),
      });
      queryClient.invalidateQueries({ queryKey: ['my-instructor-profile'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('instructorApplication.failedDesc', 'Failed to submit application.');
      toast({ title: t('instructorApplication.failedTitle', 'Submission failed'), description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!headline.trim() || !biography.trim()) {
      toast({
        title: t('instructorApplication.missingFieldsTitle', 'Missing required fields'),
        description: t('instructorApplication.missingFieldsDesc', 'Please provide headline and biography.'),
        variant: 'destructive',
      });
      return;
    }
    applyMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t('instructorApplication.title', 'Apply as Instructor')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('instructorApplication.subtitle', 'Submit your profile for admin verification.')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('instructorApplication.applicationStatus', 'Application Status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                {t('instructorApplication.loadingStatus', 'Loading status...')}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant={profile?.isVerified ? 'default' : profile ? 'secondary' : 'outline'}>
                  {statusLabel}
                </Badge>
                {profile?.isVerified && (
                  <span className="text-sm text-muted-foreground">
                    {t('instructorApplication.verifiedNote', 'Your role should now be updated to instructor.')}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('instructorApplication.profileSection', 'Instructor Profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('instructorApplication.headlineLabel', 'Headline')} *</Label>
              <Input
                placeholder={t('instructorApplication.headlinePlaceholder', 'e.g., Software Engineer & Web Instructor')}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('instructorApplication.biographyLabel', 'Biography')} *</Label>
              <Textarea
                rows={5}
                placeholder={t('instructorApplication.biographyPlaceholder', 'Tell students about your background and teaching experience')}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('instructorApplication.expertiseLabel', 'Expertise (comma-separated)')}</Label>
              <Input
                placeholder={t('instructorApplication.expertisePlaceholder', 'Java, Spring Boot, React')}
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('instructorApplication.socialLinksLabel', 'Social Links')}</Label>
              <Input
                placeholder={t('instructorApplication.socialLinksPlaceholder', 'LinkedIn/GitHub URL or short profile links')}
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} disabled={applyMutation.isPending}>
              {applyMutation.isPending
                ? t('instructorApplication.submitting', 'Submitting...')
                : t('instructorApplication.submitButton', 'Submit for Verification')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentInstructorApplication;
