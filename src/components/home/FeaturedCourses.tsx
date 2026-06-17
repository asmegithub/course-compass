import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/courses/CourseCard';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/course-api';

const FeaturedCourses = () => {
  const { t } = useTranslation();
  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const featuredCourses = courses
    .filter((c) => c.isFeatured && c.isPublished !== false)
    .slice(0, 4);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t('home.featuredCourses')}
            </h2>
            <p className="text-muted-foreground">
              {t('home.featuredCoursesSubtitle')}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses?featured=true">
              {t('home.viewAll')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Outer alignment container to horizontally center incomplete card rows */}
        <div className="flex justify-center">
          {/* Course Grid: Changed grid-cols-2 to grid-cols-1 for better mobile sizing.
            Added justify-center so rows with fewer than 4 items align outward from the center.
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl justify-center">
            {isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span>{t('home.loadingFeatured')}</span>
              </div>
            )}
            {isError && (
              <div className="col-span-full text-destructive text-center py-4">
                Failed to load featured courses.
              </div>
            )}
            {!isLoading && !isError && featuredCourses.map((course) => (
              /* CourseCard components will now occupy identical structural widths */
              <CourseCard key={course.id} course={course} />
            ))}
            {!isLoading && !isError && featuredCourses.length === 0 && (
              <div className="col-span-full text-muted-foreground text-center py-4">
                {t('home.noFeatured')}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;