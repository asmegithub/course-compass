import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types';
import { formatDuration, formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard = ({ course, className }: CourseCardProps) => {
  const discount = course.discountPrice 
    ? Math.round((1 - course.discountPrice / course.price) * 100) 
    : 0;

  return (
    <Link 
      to={`/courses/${course.slug}`}
      className={cn(
        "group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {course.isFeatured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0">
            Featured
          </Badge>
        )}
        {discount > 0 && (
          <Badge className="absolute top-3 right-3 bg-success text-success-foreground border-0">
            {discount}% OFF
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-accent">
            {course.category?.icon} {course.category?.name}
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {course.level.toLowerCase().replace('_', ' ')}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-card-foreground line-clamp-2 group-hover:text-accent transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2">
          <img 
            src={course.instructor?.user?.profileImage} 
            alt={`${course.instructor?.user?.firstName} ${course.instructor?.user?.lastName}`}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-muted-foreground">
            {course.instructor?.user?.firstName} {course.instructor?.user?.lastName}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">{course.averageRating.toFixed(1)}</span>
            <span>({course.totalReviews.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrollmentCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Duration & Lessons */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course.totalLessons} lessons</span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-foreground">
              {formatPrice(course.discountPrice || course.price, course.currency)}
            </span>
            {course.discountPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(course.price, course.currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
