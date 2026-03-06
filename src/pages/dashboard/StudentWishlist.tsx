import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, Loader2 } from 'lucide-react';
import { getMyWishlist, getApprovedCourses } from '@/lib/course-api';

const StudentWishlist = () => {
  const { data: wishlist, isLoading, error } = useQuery({
    queryKey: ['wishlist-me'],
    queryFn: getMyWishlist,
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
  });

  const courseIds = (wishlist || []).map((w) => w.courseId);
  const wishlistCourses = (courses || []).filter((c) => c.id && courseIds.includes(c.id));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load wishlist. Please try again.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Wishlist</h1>
          <p className="text-muted-foreground text-sm mt-1">Courses you saved for later.</p>
        </div>

        {!wishlistCourses.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No courses in your wishlist yet.</p>
              <Button asChild variant="accent" className="mt-4">
                <Link to="/courses">Browse courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <Link to={`/courses/${course.slug || course.id}`}>
                  <div className="aspect-video bg-muted" />
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                </Link>
                <CardContent className="pt-0">
                  <Button asChild variant="accent" size="sm" className="w-full">
                    <Link to={`/courses/${course.slug || course.id}`}>View course</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentWishlist;
