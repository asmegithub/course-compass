import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getApprovedCourses, getCategories } from '@/lib/course-api';
import { Loader2, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { CourseCategory } from '@/types';

const getLocalizedCategoryName = (category: CourseCategory, language: string) => {
  switch (language) {
    case 'am':
      return category.nameAm || category.name;
    case 'om':
      return category.nameOm || category.name;
    case 'gez':
    case 'gz':
      return category.nameGz || category.name;
    default:
      return category.name;
  }
};

const Categories = () => {
  const { t, i18n } = useTranslation();
  const language = (i18n.language || 'en').split('-')[0];

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
  });

  const courseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const course of courses) {
      const key = course.category?.slug || course.category?.id;
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [courses]);

  const featuredCategories = categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-accent blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary blur-3xl" />
          </div>
          <div className="container relative py-16 lg:py-24">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>{t('common.categories')}</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
                Explore courses by category
              </h1>
              <p className="text-lg text-primary-foreground/80 max-w-2xl">
                Discover focused learning paths and jump into the subject area that fits your goals.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-12 lg:py-16">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold">All Categories</h2>
              <p className="text-muted-foreground text-sm">{featuredCategories.length} categories available</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/courses">
                {t('common.exploreCourses')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading categories...</span>
            </div>
          )}

          {isError && (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                Failed to load categories.
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && featuredCategories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No categories available right now.
              </CardContent>
            </Card>
          )}

          {!isLoading && !isError && featuredCategories.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredCategories.map((category) => {
                const count = courseCounts.get(category.slug) || courseCounts.get(category.id) || 0;
                return (
                  <Link
                    key={category.id}
                    to={`/courses?category=${category.slug}`}
                    className="group"
                  >
                    <Card className="h-full overflow-hidden border-border/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                            {category.icon || '📚'}
                          </div>
                          <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {count} courses
                          </div>
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold group-hover:text-accent transition-colors">
                            {getLocalizedCategoryName(category, language)}
                          </h3>
                          {category.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center text-sm font-medium text-accent">
                          Browse courses <ArrowRight className="h-4 w-4 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-12 rounded-2xl border bg-muted/30 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">Not sure where to start?</h3>
                <p className="text-muted-foreground mt-1">
                  Browse all courses and filter by level, rating, or language.
                </p>
              </div>
              <Button asChild variant="accent">
                <Link to="/courses">Browse all courses</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
