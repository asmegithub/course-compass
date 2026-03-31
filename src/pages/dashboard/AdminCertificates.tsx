import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, getApiBaseUrl } from '@/lib/api';

type AdminCertificate = {
  id: string;
  certificateNumber?: string;
  certificateUrl?: string;
  verificationCode?: string;
  issuedAt?: string;
  student?: { firstName?: string; lastName?: string; email?: string };
  course?: { title?: string };
  enrollment?: { id?: string };
};

const toAbsoluteUrl = (maybeUrl?: string) => {
  if (!maybeUrl) return '';
  if (maybeUrl.startsWith('http://') || maybeUrl.startsWith('https://')) return maybeUrl;
  if (maybeUrl.startsWith('/')) return `${getApiBaseUrl()}${maybeUrl}`;
  return maybeUrl;
};

const getAllCertificates = async (): Promise<AdminCertificate[]> => {
  const data = await apiFetch<AdminCertificate[]>('/api/certificates/all');
  return Array.isArray(data) ? data : [];
};

const generateSampleCertificate = async (): Promise<AdminCertificate> => {
  return apiFetch<AdminCertificate>('/api/certificates/sample', { method: 'POST' });
};

const deleteSampleCertificate = async (certificateId: string): Promise<void> => {
  await apiFetch<void>(`/api/certificates/${certificateId}/sample`, { method: 'DELETE' });
};

const AdminCertificates = () => {
  const { toast } = useToast();

  const certsQuery = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: getAllCertificates,
  });

  const sampleMutation = useMutation({
    mutationFn: generateSampleCertificate,
    onSuccess: () => {
      toast({ title: 'Sample certificate generated' });
      certsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate sample',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteSampleMutation = useMutation({
    mutationFn: deleteSampleCertificate,
    onSuccess: () => {
      toast({ title: 'Sample certificate deleted' });
      certsQuery.refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete sample',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const list = certsQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Certificates</h1>
            <p className="text-muted-foreground mt-1">View issued certificates and generate a sample for preview.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => certsQuery.refetch()} disabled={certsQuery.isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="accent" onClick={() => sampleMutation.mutate()} disabled={sampleMutation.isPending}>
              <Award className="h-4 w-4 mr-2" />
              {sampleMutation.isPending ? 'Generating…' : 'Generate sample'}
            </Button>
          </div>
        </div>

        {certsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {certsQuery.isError && <p className="text-sm text-destructive">Failed to load certificates.</p>}

        {!certsQuery.isLoading && !certsQuery.isError && list.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No certificates found.</p>
              <p className="text-sm text-muted-foreground mt-1">Click “Generate sample” to create one now.</p>
            </CardContent>
          </Card>
        )}

        {!certsQuery.isLoading && !certsQuery.isError && list.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const studentName = c.student ? `${c.student.firstName ?? ''} ${c.student.lastName ?? ''}`.trim() : '';
              const isSample = (c.certificateNumber ?? '').startsWith('SAMPLE-') && !c.enrollment?.id;
              return (
                <Card key={c.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{c.certificateNumber ?? `Certificate #${c.id.slice(0, 8)}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {c.course?.title ? c.course.title : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {studentName || c.student?.email || 'Sample / system'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '–'}
                        </p>
                        {c.certificateUrl && (
                          <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs" asChild>
                            <a href={toAbsoluteUrl(c.certificateUrl)} target="_blank" rel="noopener noreferrer">
                              View / Download <ExternalLink className="h-3 w-3 ml-0.5 inline" />
                            </a>
                          </Button>
                        )}

                        {isSample && (
                          <div className="pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={deleteSampleMutation.isPending}
                              onClick={() => deleteSampleMutation.mutate(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete sample
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificates;

