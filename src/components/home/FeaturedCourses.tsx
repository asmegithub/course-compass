import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CourseCard from '@/components/courses/CourseCard';
import { mockCourses } from '@/lib/mock-data';

const FeaturedCourses = () => {
  const featuredCourses = mockCourses.filter(c => c.isFeatured).slice(0, 4);

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
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
