import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  Globe, 
  Award, 
  Play, 
  FileText,
  Lock,
  Check,
  Heart,
  Share2,
  Download,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';
import { mockCourses, mockReviews, formatDuration, formatPrice } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const CourseDetail = () => {
  const { slug } = useParams();
  const course = mockCourses.find(c => c.slug === slug) || mockCourses[0];
  const reviews = mockReviews.filter(r => r.courseId === course.id);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Mock curriculum data
  const sections = [
    {
      id: '1',
      title: 'Getting Started',
      lessons: [
        { id: 'l1', title: 'Course Introduction', type: 'VIDEO', duration: 5, isFree: true },
        { id: 'l2', title: 'Setting Up Your Environment', type: 'VIDEO', duration: 15, isFree: true },
        { id: 'l3', title: 'Course Resources', type: 'DOCUMENT', duration: 2, isFree: false },
      ],
    },
    {
      id: '2',
      title: 'Core Fundamentals',
      lessons: [
        { id: 'l4', title: 'Understanding the Basics', type: 'VIDEO', duration: 25, isFree: false },
        { id: 'l5', title: 'Your First Project', type: 'VIDEO', duration: 30, isFree: false },
        { id: 'l6', title: 'Knowledge Check', type: 'QUIZ', duration: 10, isFree: false },
      ],
    },
    {
      id: '3',
      title: 'Advanced Techniques',
      lessons: [
        { id: 'l7', title: 'Deep Dive into Advanced Topics', type: 'VIDEO', duration: 45, isFree: false },
        { id: 'l8', title: 'Real-World Case Study', type: 'VIDEO', duration: 35, isFree: false },
        { id: 'l9', title: 'Final Assessment', type: 'QUIZ', duration: 20, isFree: false },
      ],
    },
  ];

  const discount = course.discountPrice 
    ? Math.round((1 - course.discountPrice / course.price) * 100) 
    : 0;

  const whatYoullLearn = [
    'Build real-world projects from scratch',
    'Understand core concepts and best practices',
    'Master advanced techniques used by professionals',
    'Get job-ready skills for the industry',
    'Earn a verified certificate upon completion',
    'Access to exclusive community and resources',
  ];

  const requirements = [
    'Basic computer skills',
    'A computer with internet access',
    'Willingness to learn and practice',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero text-primary-foreground py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2 text-sm">
                  <Link to="/courses" className="hover:text-accent">Courses</Link>
                  <ChevronRight className="h-4 w-4" />
                  <Link to={`/courses?category=${course.category?.slug}`} className="hover:text-accent">
                    {course.category?.name}
                  </Link>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-bold">
                  {course.title}
                </h1>

                <p className="text-lg text-primary-foreground/80">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-bold">{course.averageRating.toFixed(1)}</span>
                    <span className="text-primary-foreground/70">
                      ({course.totalReviews.toLocaleString()} reviews)
                    </span>
                  </div>
                  <span className="text-primary-foreground/50">•</span>
                  <span>{course.enrollmentCount.toLocaleString()} students</span>
                </div>

                <div className="flex items-center gap-4">
                  <img 
                    src={course.instructor?.user?.profileImage}
                    alt={`${course.instructor?.user?.firstName} ${course.instructor?.user?.lastName}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">
                      {course.instructor?.user?.firstName} {course.instructor?.user?.lastName}
                    </p>
                    <p className="text-sm text-primary-foreground/70">
                      {course.instructor?.headline}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.totalDuration)} total</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.totalLessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span>Available in 4 languages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>Certificate included</span>
                  </div>
                </div>
              </div>

              {/* Purchase Card - Desktop */}
              <div className="hidden lg:block">
                <div className="bg-card text-card-foreground rounded-xl shadow-xl overflow-hidden sticky top-24">
                  {/* Preview */}
                  <div className="relative aspect-video">
                    <img 
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group">
                      <div className="h-16 w-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-8 w-8 text-accent-foreground" />
                      </div>
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Price */}
                    <div className="flex items-center gap-3">
                      <span className="font-display text-3xl font-bold">
                        {formatPrice(course.discountPrice || course.price, course.currency)}
                      </span>
                      {course.discountPrice && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(course.price, course.currency)}
                          </span>
                          <Badge className="bg-success text-success-foreground">
                            {discount}% OFF
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* CTA Buttons */}
                    <Button variant="accent" className="w-full" size="lg">
                      Enroll Now
                    </Button>
                    <Button variant="outline" className="w-full">
                      Add to Cart
                    </Button>

                    {/* Guarantee */}
                    <p className="text-xs text-center text-muted-foreground">
                      30-Day Money-Back Guarantee
                    </p>

                    {/* Quick Info */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-semibold">This course includes:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          {formatDuration(course.totalDuration)} on-demand video
                        </li>
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Downloadable resources
                        </li>
                        <li className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          Offline access
                        </li>
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          Certificate of completion
                        </li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                      >
                        <Heart className={cn("h-4 w-4 mr-2", isWishlisted && "fill-destructive text-destructive")} />
                        Wishlist
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Purchase Bar */}
        <div className="lg:hidden sticky bottom-0 z-40 bg-card border-t p-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-display text-xl font-bold">
                {formatPrice(course.discountPrice || course.price, course.currency)}
              </span>
              {course.discountPrice && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  {formatPrice(course.price, course.currency)}
                </span>
              )}
            </div>
            <Button variant="accent" className="flex-1">
              Enroll Now
            </Button>
          </div>
        </div>

        {/* Course Content */}
        <section className="container py-12">
          <div className="lg:max-w-3xl">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* What You'll Learn */}
                <div className="bg-card rounded-xl p-6 border">
                  <h2 className="font-display text-xl font-bold mb-4">What you'll learn</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {whatYoullLearn.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <Check className="h-5 w-5 text-success shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {requirements.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Description */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Description</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{course.description}</p>
                    <p>
                      This comprehensive course covers everything you need to know to master the subject. 
                      Whether you're a complete beginner or looking to enhance your existing skills, 
                      this course provides practical, hands-on learning experiences.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    {sections.length} sections • {course.totalLessons} lessons • {formatDuration(course.totalDuration)} total
                  </span>
                </div>

                <Accordion type="multiple" className="space-y-3">
                  {sections.map((section) => (
                    <AccordionItem 
                      key={section.id} 
                      value={section.id}
                      className="bg-card rounded-lg border px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{section.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {section.lessons.length} lessons
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <ul className="space-y-2">
                          {section.lessons.map((lesson) => (
                            <li 
                              key={lesson.id}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.type === 'VIDEO' && <Play className="h-4 w-4 text-muted-foreground" />}
                                {lesson.type === 'DOCUMENT' && <FileText className="h-4 w-4 text-muted-foreground" />}
                                {lesson.type === 'QUIZ' && <Award className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.isFree && (
                                  <Badge variant="outline" className="text-xs">Preview</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration}min
                                </span>
                                {!lesson.isFree && <Lock className="h-3 w-3 text-muted-foreground" />}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Instructor Tab */}
              <TabsContent value="instructor" className="space-y-6">
                <div className="flex items-start gap-6">
                  <img 
                    src={course.instructor?.user?.profileImage}
                    alt={`${course.instructor?.user?.firstName} ${course.instructor?.user?.lastName}`}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-display text-xl font-bold">
                      {course.instructor?.user?.firstName} {course.instructor?.user?.lastName}
                    </h3>
                    <p className="text-muted-foreground">{course.instructor?.headline}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span>{course.instructor?.averageRating} rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.instructor?.totalStudents.toLocaleString()} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.instructor?.totalCourses} courses</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {course.instructor?.biography}
                </p>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-display text-5xl font-bold text-foreground">
                      {course.averageRating.toFixed(1)}
                    </div>
                    <div className="flex gap-1 justify-center my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.round(course.averageRating) 
                              ? "fill-warning text-warning" 
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.totalReviews.toLocaleString()} reviews
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center font-semibold text-accent">
                          {review.student?.firstName?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              {review.student?.firstName} {review.student?.lastName}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1 my-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i < review.rating 
                                    ? "fill-warning text-warning" 
                                    : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {review.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
