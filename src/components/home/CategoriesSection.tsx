import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/lib/course-api';

const CategoriesSection = () => {
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });

  return (
    <section className="py-16 lg:py-24 bg-muted/50">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Explore by Category
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From programming to personal development, find courses in the field you're passionate about
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading && (
            <div className="col-span-2 md:col-span-3 lg:col-span-6 text-muted-foreground text-center">
              Loading categories...
            </div>
          )}
          {isError && (
            <div className="col-span-2 md:col-span-3 lg:col-span-6 text-destructive text-center">
              Failed to load categories.
            </div>
          )}
          {!isLoading && !isError && categories.map((category) => (
            <Link
              key={category.id}
              to={`/courses?category=${category.slug}`}
              className="group flex flex-col items-center p-6 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <span className="text-4xl mb-3">{category.icon || '📚'}</span>
              <h3 className="font-semibold text-card-foreground text-center group-hover:text-accent transition-colors">
                {category.name}
              </h3>
              {category.nameAm && (
                <p className="text-xs text-muted-foreground mt-1">
                  {category.nameAm}
                </p>
              )}
            </Link>
          ))}
          {!isLoading && !isError && categories.length === 0 && (
            <div className="col-span-2 md:col-span-3 lg:col-span-6 text-muted-foreground text-center">
              No categories available.
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="outline" asChild>
            <Link to="/categories">
              Browse All Categories
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
