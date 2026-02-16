import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/courses/CourseCard';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/course-api';

const FeaturedCourses = () => {
  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const featuredCourses = courses.filter(c => c.isFeatured).slice(0, 4);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Featured Courses
            </h2>
            <p className="text-muted-foreground">
              Hand-picked courses to help you succeed
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses?featured=true">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Course Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading && (
            <div className="sm:col-span-2 lg:col-span-4 text-muted-foreground">
              Loading featured courses...
            </div>
          )}
          {isError && (
            <div className="sm:col-span-2 lg:col-span-4 text-destructive">
              Failed to load featured courses.
            </div>
          )}
          {!isLoading && !isError && featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {!isLoading && !isError && featuredCourses.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-4 text-muted-foreground">
              No featured courses available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
