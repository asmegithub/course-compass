import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, ArrowUpRight, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEnrollments, getCourses, getInstructorEarnings } from '@/lib/course-api';
import { formatPrice } from '@/lib/formatters';

const getMonthKey = (value: Date) => `${value.getFullYear()}-${value.getMonth()}`;

const buildLastSixMonths = () => {
  const now = new Date();
  const months: { label: string; key: string }[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      key: getMonthKey(date),
    });
  }
  return months;
};

const estimateCoursePrice = (price?: number, discountPrice?: number) => {
  if (typeof discountPrice === 'number' && discountPrice > 0) return discountPrice;
  if (typeof price === 'number' && price > 0) return price;
  return 0;
};

const InstructorEarnings = () => {
  const { user } = useAuth();

  const { data: courses = [], isLoading: isCoursesLoading, isError: isCoursesError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: enrollments = [], isLoading: isEnrollmentsLoading, isError: isEnrollmentsError } = useQuery({
    queryKey: ['enrollments', 'all'],
    queryFn: getAllEnrollments,
    enabled: Boolean(user?.id),
  });

  const { data: earningRows = [], isLoading: isEarningsLoading, isError: isEarningsError } = useQuery({
    queryKey: ['instructor-earnings'],
    queryFn: getInstructorEarnings,
    enabled: Boolean(user?.id),
  });

  const instructorCourses = useMemo(() => {
    if (!user?.id) return [];
    return courses.filter((course) => course.instructorId === user.id);
  }, [courses, user?.id]);

  const courseMap = useMemo(
    () => new Map(instructorCourses.map((course) => [course.id, course])),
    [instructorCourses],
  );

  const instructorEnrollments = useMemo(() => {
    if (!user?.id) return [];
    return enrollments.filter((enrollment) => courseMap.has(enrollment.courseId));
  }, [courseMap, enrollments, user?.id]);

  const earningsRow = useMemo(() => {
    if (!user?.id) return null;
    return earningRows.find((row) => row.instructorUserId === user.id) || null;
  }, [earningRows, user?.id]);

  const totalEstimatedRevenue = useMemo(
    () => instructorEnrollments.reduce((sum, enrollment) => {
      const course = courseMap.get(enrollment.courseId);
      return sum + estimateCoursePrice(course?.price, course?.discountPrice);
    }, 0),
    [courseMap, instructorEnrollments],
  );

  const monthlyData = useMemo(() => {
    const months = buildLastSixMonths();
    const totals = new Map(months.map((month) => [month.key, 0]));

    instructorEnrollments.forEach((enrollment) => {
      if (!enrollment.enrolledAt) return;
      const date = new Date(enrollment.enrolledAt);
      if (Number.isNaN(date.getTime())) return;
      const key = getMonthKey(date);
      if (!totals.has(key)) return;

      const course = courseMap.get(enrollment.courseId);
      const price = estimateCoursePrice(course?.price, course?.discountPrice);
      totals.set(key, (totals.get(key) || 0) + price);
    });

    return months.map((month) => ({ month: month.label, earnings: totals.get(month.key) || 0 }));
  }, [courseMap, instructorEnrollments]);

  const courseEarnings = useMemo(() => {
    const currentMonth = new Date();
    const currentMonthKey = getMonthKey(currentMonth);

    return instructorCourses
      .map((course) => {
        const enrollmentsForCourse = instructorEnrollments.filter((enrollment) => enrollment.courseId === course.id);
        const price = estimateCoursePrice(course.price, course.discountPrice);

        const thisMonth = enrollmentsForCourse.reduce((sum, enrollment) => {
          if (!enrollment.enrolledAt) return sum;
          const date = new Date(enrollment.enrolledAt);
          if (Number.isNaN(date.getTime())) return sum;
          return getMonthKey(date) === currentMonthKey ? sum + price : sum;
        }, 0);

        return {
          id: course.id,
          title: course.title,
          students: enrollmentsForCourse.length,
          revenue: enrollmentsForCourse.length * price,
          thisMonth,
        };
      })
      .sort((left, right) => right.revenue - left.revenue);
  }, [instructorCourses, instructorEnrollments]);

  const thisMonthRevenue = monthlyData[monthlyData.length - 1]?.earnings || 0;
  const totalRevenue = earningsRow?.totalEarnings || totalEstimatedRevenue;
  const avgPerCourse = instructorCourses.length > 0 ? totalRevenue / instructorCourses.length : 0;
  const currentBalance = earningsRow?.currentBalance || 0;
  const isLoading = isCoursesLoading || isEnrollmentsLoading || isEarningsLoading;
  const isError = isCoursesError || isEnrollmentsError || isEarningsError;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your revenue and course performance.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, change: 'Live' },
            { label: 'This Month', value: formatPrice(thisMonthRevenue), icon: TrendingUp, change: 'Live' },
            { label: 'Avg. per Course', value: formatPrice(avgPerCourse), icon: BookOpen, change: 'Live' },
            { label: 'Current Balance', value: formatPrice(currentBalance), icon: DollarSign, change: 'Live' },
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Earnings (ETB)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Loading earnings chart...</p>}
            {isError && <p className="text-sm text-destructive">Failed to load earnings data.</p>}
            {!isLoading && !isError && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => [formatPrice(value), 'Earnings']} />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading course earnings...</p>}
            {isError && <p className="text-sm text-destructive">Failed to load course earnings.</p>}
            {!isLoading && !isError && courseEarnings.length === 0 && (
              <p className="text-sm text-muted-foreground">No course earnings data yet.</p>
            )}
            {!isLoading && !isError && courseEarnings.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{c.students} students enrolled</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(c.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatPrice(c.thisMonth)}</p>
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
};

export default InstructorEarnings;
