import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPendingInstructorProfiles, verifyInstructorProfile } from '@/lib/instructor-profile-api';
import { toast } from '@/hooks/use-toast';

const AdminInstructorVerifications = () => {
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading, isError } = useQuery({
    queryKey: ['pending-instructor-profiles'],
    queryFn: getPendingInstructorProfiles,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => verifyInstructorProfile(id, verified),
    onSuccess: (_, variables) => {
      toast({
        title: variables.verified ? 'Profile verified' : 'Profile rejected',
        description: variables.verified ? 'User role updated to INSTRUCTOR.' : 'Profile remains unverified.',
      });
      queryClient.invalidateQueries({ queryKey: ['pending-instructor-profiles'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update profile verification.';
      toast({ title: 'Action failed', description: message, variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Instructor Verifications</h1>
          <p className="text-muted-foreground mt-1">Review and verify instructor applications.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <div className="text-muted-foreground">Loading applications...</div>}
            {isError && <div className="text-destructive">Failed to load applications.</div>}
            {!isLoading && !isError && profiles.length === 0 && (
              <div className="text-muted-foreground">No pending instructor profiles.</div>
            )}

            {!isLoading && !isError && profiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm">
                        {profile.user?.firstName} {profile.user?.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{profile.user?.email}</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Headline:</span> {profile.headline || '—'}</p>
                    <p><span className="font-medium">Bio:</span> {profile.biography || '—'}</p>
                    <p><span className="font-medium">Expertise:</span> {profile.expertise?.join(', ') || '—'}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => verifyMutation.mutate({ id: profile.id, verified: true })}
                      disabled={verifyMutation.isPending}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => verifyMutation.mutate({ id: profile.id, verified: false })}
                      disabled={verifyMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminInstructorVerifications;
