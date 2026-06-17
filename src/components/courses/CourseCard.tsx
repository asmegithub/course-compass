import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types';
import { formatPrice } from '@/lib/formatters';
import { getLocalizedTitle } from '@/lib/localized-content';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard = ({ course, className }: CourseCardProps) => {
  const { t } = useTranslation();
  const displayTitle = getLocalizedTitle(course);
  const discount = course.discountPrice 
    ? Math.round((1 - course.discountPrice / course.price) * 100) 
    : 0;

  const levelKey = `courses.levels.${course.level}`;
  const translatedLevel = t(levelKey);
  const displayLevel =
    translatedLevel && translatedLevel !== levelKey
      ? translatedLevel
      : course.level.toLowerCase().replace('_', ' ');

  return (
    <Link 
      to={`/courses/${course.slug}`}
      className={cn(
        "group block bg-card rounded-md overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[2/1] overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={displayTitle || course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {course.isFeatured && (
          <Badge className="absolute top-1 left-1 bg-accent text-accent-foreground border-0 text-[9px] px-1 py-0 h-4 leading-none">
            {t('home.featured')}
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="absolute top-1 right-1 bg-success text-success-foreground border-0 text-[9px] px-1 py-0 h-4 leading-none">
            {discount}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1">
        {/* Category & Level */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium text-accent truncate">
            {course.category?.icon} {course.category?.name}
          </span>
          <Badge variant="outline" className="text-[9px] capitalize px-1 py-0 h-3.5 leading-none shrink-0">
            {displayLevel}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-display text-xs font-semibold text-card-foreground line-clamp-1 leading-snug group-hover:text-accent transition-colors">
          {displayTitle || course.title}
        </h3>

        {/* Compact Stats */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-warning text-warning" />
            {course.averageRating.toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            {course.enrollmentCount}
          </span>
          <span className="flex items-center gap-0.5">
            <BookOpen className="h-2.5 w-2.5" />
            {course.totalLessons}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1">
          <span className="font-display text-xs font-bold text-foreground">
            {formatPrice(course.discountPrice || course.price, course.currency)}
          </span>
          {course.discountPrice && (
            <span className="text-[9px] text-muted-foreground line-through">
              {formatPrice(course.price, course.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
