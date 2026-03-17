import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getCourses, getReviews } from '@/lib/course-api';
import { Star } from 'lucide-react';

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const InstructorReviews = () => {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const { data: courses = [], isLoading: coursesLoading, isError: coursesError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } = useQuery({
    queryKey: ['reviews'],
    queryFn: getReviews,
    enabled: Boolean(user?.id),
  });

  const instructorCourses = useMemo(() => {
    if (!user?.id) return [];
    return courses.filter((c) => c.instructorId === user.id);
  }, [courses, user?.id]);

  const selectedCourse = useMemo(
    () => instructorCourses.find((c) => c.id === selectedCourseId) ?? null,
    [instructorCourses, selectedCourseId],
  );

  const courseReviews = useMemo(() => {
    if (!selectedCourseId) return [];
    return reviews
      .filter((r) => r.courseId === selectedCourseId && r.visible)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [reviews, selectedCourseId]);

  const avgRating = useMemo(() => {
    if (courseReviews.length === 0) return 0;
    const sum = courseReviews.reduce((s, r) => s + (r.rating ?? 0), 0);
    return sum / courseReviews.length;
  }, [courseReviews]);

  const isLoading = coursesLoading || reviewsLoading;
  const isError = coursesError || reviewsError;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a course to view student reviews.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {instructorCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCourse && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{selectedCourse.category?.name ?? 'Category'}</Badge>
                <Badge variant="outline">{selectedCourse.level?.replace('_', ' ') ?? 'Level'}</Badge>
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {avgRating ? avgRating.toFixed(1) : '0.0'} ({courseReviews.length})
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading && <p className="text-sm text-muted-foreground">Loading reviews...</p>}
        {isError && <p className="text-sm text-destructive">Failed to load reviews.</p>}

        {!isLoading && !isError && !selectedCourseId && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Select a course to view its reviews.
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && selectedCourseId && courseReviews.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No reviews for this course yet.
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && selectedCourseId && courseReviews.length > 0 && (
          <div className="space-y-3">
            {courseReviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.studentName ?? 'Student'}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {r.rating.toFixed(1)}
                    </Badge>
                  </div>
                  {r.title && <p className="font-medium text-sm">{r.title}</p>}
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{r.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorReviews;

