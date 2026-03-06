import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCertificates } from '@/lib/course-api';

const StudentCertificates = () => {
  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: getCertificates,
  });

  const list = certificates ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Certificates</h1>
          <p className="text-muted-foreground mt-1">Certificates for courses you have completed</p>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">Failed to load certificates.</p>
        )}
        {!isLoading && !error && list.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No certificates yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Complete courses to earn certificates.</p>
            </CardContent>
          </Card>
        )}
        {!isLoading && !error && list.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">Certificate #{c.certificateNumber || c.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issued {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '–'}
                      </p>
                      {c.certificateUrl && (
                        <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" asChild>
                          <a href={c.certificateUrl} target="_blank" rel="noopener noreferrer">
                            View / Download <ExternalLink className="h-3 w-3 ml-0.5 inline" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCertificates;
