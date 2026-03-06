import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMyPayments } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';

const StudentPaymentHistory = () => {
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['my-payments'],
    queryFn: getMyPayments,
  });

  const list = payments ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1">View your course purchase history</p>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
        {error && (
          <p className="text-sm text-destructive">Failed to load payments.</p>
        )}
        {!isLoading && !error && list.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No payments yet.</p>
              <p className="text-sm text-muted-foreground mt-1">When you purchase a course, it will appear here.</p>
            </CardContent>
          </Card>
        )}
        {!isLoading && !error && list.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Course</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Gateway</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="p-4 text-muted-foreground">
                          {p.paidAt || p.createdAt
                            ? new Date(p.paidAt || p.createdAt!).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '–'}
                        </td>
                        <td className="p-4 font-medium">{p.courseTitle || 'Course'}</td>
                        <td className="p-4 text-muted-foreground">{p.gateway || '–'}</td>
                        <td className="p-4 text-right font-medium">
                          {p.amount != null ? formatPrice(p.amount, p.currency || 'ETB') : '–'}
                        </td>
                        <td className="p-4">
                          <Badge variant={p.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {p.status || '–'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentPaymentHistory;
