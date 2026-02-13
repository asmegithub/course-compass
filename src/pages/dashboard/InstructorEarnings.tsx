import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, ArrowUpRight, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const monthlyData = [
  { month: 'Sep', earnings: 8200 },
  { month: 'Oct', earnings: 11500 },
  { month: 'Nov', earnings: 9800 },
  { month: 'Dec', earnings: 15200 },
  { month: 'Jan', earnings: 18500 },
  { month: 'Feb', earnings: 12400 },
];

const courseEarnings = [
  { id: '1', title: 'Web Development Bootcamp', students: 1250, revenue: 45000, thisMonth: 8500 },
  { id: '2', title: 'UI/UX Design Masterclass', students: 890, revenue: 32000, thisMonth: 5200 },
  { id: '3', title: 'Python for Data Science', students: 650, revenue: 28000, thisMonth: 4100 },
  { id: '4', title: 'Mobile App Development', students: 420, revenue: 20000, thisMonth: 3200 },
];

const InstructorEarnings = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your revenue and course performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 'ETB 125,000', icon: DollarSign, change: '+12%' },
          { label: 'This Month', value: 'ETB 12,400', icon: TrendingUp, change: '+5%' },
          { label: 'Avg. per Course', value: 'ETB 31,250', icon: BookOpen, change: '+8%' },
          { label: 'Platform Fee', value: '15%', icon: DollarSign, change: '' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-muted-foreground" />
                {s.change && (
                  <span className="text-xs font-medium flex items-center gap-0.5 text-accent">
                    <ArrowUpRight className="h-3 w-3" /> {s.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold font-display">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Earnings (ETB)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value: number) => [`ETB ${value.toLocaleString()}`, 'Earnings']} />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Per-course breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {courseEarnings.map((c) => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.students} students enrolled</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="font-semibold">ETB {c.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">ETB {c.thisMonth.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);

export default InstructorEarnings;
