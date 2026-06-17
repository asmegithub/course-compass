import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/lib/course-api';

const CategoriesSection = () => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });

  return (
    <section className="py-16 lg:py-24 bg-[#f1eae1]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#2e231d] mb-4">
            {t('home.categories.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.categories.subtitle')}
          </p>
        </div>

        {/* Dynamic Centered Flex Container */}
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {isLoading && (
            <div className="w-full text-muted-foreground text-center py-4">
              {t('home.categories.loading')}
            </div>
          )}
          {isError && (
            <div className="w-full text-destructive text-center py-4">
              {t('home.categories.error')}
            </div>
          )}
          {!isLoading && !isError && categories.map((category) => (
            <Link
              key={category.id}
              to={`/courses?category=${category.slug}`}
              className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 w-full sm:w-44 h-44 shrink-0 border border-stone-100"
            >
              <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {category.icon || '📚'}
              </div>
              <h3 className="font-semibold text-stone-800 text-center text-base leading-tight group-hover:text-amber-600 transition-colors px-2 line-clamp-2">
                {category.name}
              </h3>
              {category.nameAm && (
                <p className="text-xs text-stone-400 mt-1 font-light text-center px-2 truncate w-full">
                  {category.nameAm}
                </p>
              )}
            </Link>
          ))}
          {!isLoading && !isError && categories.length === 0 && (
            <div className="w-full text-muted-foreground text-center py-4">
              {t('home.categories.empty')}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            asChild
            className="rounded-full border-2 border-[#1a6296] text-[#1a6296] hover:bg-[#1a6296] hover:text-white px-6 py-5 font-semibold transition-all"
          >
            <Link to="/categories">
              {t('home.categories.browseAll')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;