import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Star,
  Grid3X3,
  List,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getApprovedCourses, getCategories } from '@/lib/course-api';
import { cn } from '@/lib/utils';

const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const coursesQuery = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
  });

  const categoriesQuery = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });

  const courses = coursesQuery.data || [];
  const categories = categoriesQuery.data || [];
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');

  // Filter courses
  const filteredCourses = courses.filter(course => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory && course.category?.slug !== selectedCategory) return false;
    if (selectedLevels.length && !selectedLevels.includes(course.level)) return false;
    if (selectedRating && course.averageRating < selectedRating) return false;
    return true;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.enrollmentCount - a.enrollmentCount;
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price-low':
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      case 'price-high':
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevels([]);
    setSelectedRating(null);
    setSearchParams({});
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    selectedLevels.length > 0,
    selectedRating,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-12">
          <div className="container">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Explore Courses
            </h1>
            <p className="text-primary-foreground/80 max-w-2xl">
              Discover thousands of courses taught by expert instructors. 
              Learn at your own pace and earn certificates.
            </p>
          </div>
        </div>

        <div className="container py-8">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Toggle */}
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* View Toggle */}
            <div className="hidden md:flex border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === 'grid' && "bg-muted")}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === 'list' && "bg-muted")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className={cn(
              "w-64 shrink-0 space-y-6",
              showFilters ? "block" : "hidden lg:block"
            )}>
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Filters</span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-3">
                <h3 className="font-semibold">Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        selectedCategory === cat.slug 
                          ? "bg-accent/10 text-accent" 
                          : "hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(
                          selectedCategory === cat.slug ? '' : cat.slug
                        )}
                        className="sr-only"
                      />
                      <span>{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="space-y-3">
                <h3 className="font-semibold">Level</h3>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels([...selectedLevels, level]);
                          } else {
                            setSelectedLevels(selectedLevels.filter(l => l !== level));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">
                        {level.toLowerCase().replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <h3 className="font-semibold">Rating</h3>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <label 
                      key={rating} 
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        selectedRating === rating 
                          ? "bg-accent/10 text-accent" 
                          : "hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(
                          selectedRating === rating ? null : rating
                        )}
                        className="sr-only"
                      />
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm">{rating}+ & up</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* Course Grid */}
            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                  Showing {sortedCourses.length} results
              </div>

                {(coursesQuery.isLoading || categoriesQuery.isLoading) && (
                  <div className="text-muted-foreground">Loading courses...</div>
                )}

                {(coursesQuery.isError || categoriesQuery.isError) && (
                  <div className="text-destructive">Failed to load courses.</div>
                )}

                {!coursesQuery.isLoading && !coursesQuery.isError && sortedCourses.length > 0 && (
                  <div className={cn(
                    "grid gap-6",
                    viewMode === 'grid' 
                      ? "sm:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  )}>
                    {sortedCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}

                {!coursesQuery.isLoading && !coursesQuery.isError && sortedCourses.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">
                      No courses found matching your criteria.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
