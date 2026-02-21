import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Star, Clock, Users, BookOpen, Globe, Award, Play, FileText,
  Lock, Check, Heart, Share2, Download, ChevronRight, PlayCircle,
  MessageSquare, Send, ThumbsUp, CheckCircle2, X,
} from 'lucide-react';
import { formatDuration, formatPrice } from '@/lib/formatters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEnrollment,
  createReview,
  createDiscussionReply,
  createLessonDiscussion,
  deleteReview,
  deleteEnrollment,
  getApprovedCourses,
  getCourseById,
  getCourseSections,
  getCourseOutcomes,
  getCourseRequirements,
  getMyCourseEnrollment,
  getDiscussionReplies,
  getLessonDiscussions,
  getLessons,
  getReviews,
  updateReview,
  CourseOutcomePayload,
  CourseRequirementPayload,
  LessonPayload,
} from '@/lib/course-api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DiscussionReplyView {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isInstructor: boolean;
  content: string;
  createdAt: string;
  likes: number;
}

interface DiscussionView {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  question: string;
  createdAt: string;
  likes: number;
  lessonId: string;
  replies: DiscussionReplyView[];
}

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slugValue = slug || '';
  const isUuidSlug = isUuid(slugValue);

  const courseByIdQuery = useQuery({
    queryKey: ['course', slugValue],
    queryFn: () => getCourseById(slugValue),
    enabled: Boolean(slugValue) && isUuidSlug,
  });

  const coursesQuery = useQuery({
    queryKey: ['courses', 'approved'],
    queryFn: getApprovedCourses,
    enabled: Boolean(slugValue) && !isUuidSlug,
  });

  const course = isUuidSlug
    ? courseByIdQuery.data
    : coursesQuery.data?.find(c => c.slug === slugValue);

  const sectionsQuery = useQuery({
    queryKey: ['course-sections'],
    queryFn: getCourseSections,
    enabled: Boolean(course?.id),
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons'],
    queryFn: getLessons,
    enabled: Boolean(course?.id),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', course?.id],
    queryFn: getReviews,
    enabled: Boolean(course?.id),
  });

  const outcomesQuery = useQuery({
    queryKey: ['course-outcomes', course?.id],
    queryFn: getCourseOutcomes,
    enabled: Boolean(course?.id),
  });

  const requirementsQuery = useQuery({
    queryKey: ['course-requirements', course?.id],
    queryFn: getCourseRequirements,
    enabled: Boolean(course?.id),
  });

  const discussionQuery = useQuery({
    queryKey: ['lesson-discussions', course?.id],
    queryFn: async () => {
      const [allDiscussions, allReplies, allSections, allLessons] = await Promise.all([
        getLessonDiscussions(),
        getDiscussionReplies(),
        getCourseSections(),
        getLessons(),
      ]);

      const lessonSectionIds = new Set(allLessons.map((lesson) => lesson.sectionId).filter(Boolean));
      const courseSectionIdsFromCourse = new Set(
        allSections
          .filter((section) => section.courseId === course?.id)
          .map((section) => section.id)
      );
      const courseSectionIdsFromLessons = new Set(
        allSections
          .filter((section) => lessonSectionIds.has(section.id))
          .map((section) => section.id)
      );
      const courseSectionIds = courseSectionIdsFromCourse.size > 0
        ? courseSectionIdsFromCourse
        : courseSectionIdsFromLessons;

      const courseLessons = allLessons.filter((lesson) => courseSectionIds.has(lesson.sectionId));
      const courseLessonIds = new Set(courseLessons.map((lesson) => lesson.id));

      const courseDiscussions = allDiscussions.filter((discussion) => courseLessonIds.has(discussion.lessonId));
      const discussionIds = new Set(courseDiscussions.map((discussion) => discussion.id));
      const courseReplies = allReplies.filter((reply) => discussionIds.has(reply.discussionId));

      return { courseLessons, courseDiscussions, courseReplies };
    },
    enabled: Boolean(course?.id),
  });

  const myEnrollmentQuery = useQuery({
    queryKey: ['my-course-enrollment', course?.id, user?.id],
    queryFn: () => getMyCourseEnrollment(course!.id),
    enabled: Boolean(course?.id) && isLoggedIn,
  });

  const curriculumSections = useMemo(() => {
    if (!course?.id) {
      return [] as Array<{ id: string; title: string; lessons: LessonPayload[] }>;
    }

    const allSections = sectionsQuery.data || [];
    const allLessons = lessonsQuery.data || [];
    const lessonSectionIds = new Set(allLessons.map((lesson) => lesson.sectionId).filter(Boolean));
    const courseSections = allSections.filter((section) => section.courseId === course.id);
    const inferredSections = allSections.filter((section) => lessonSectionIds.has(section.id));
    const sectionsToUse = (courseSections.length > 0 ? courseSections : inferredSections)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return sectionsToUse.map((section) => ({
      id: section.id,
      title: section.title || 'Course Section',
      lessons: allLessons
        .filter((lesson) => lesson.sectionId === section.id && lesson.isPublished)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  }, [sectionsQuery.data, lessonsQuery.data, course?.id]);

  const reviews = useMemo(() => {
    return (reviewsQuery.data || []).filter((review) => review.courseId === course?.id && review.visible);
  }, [reviewsQuery.data, course?.id]);

  const whatYoullLearn = useMemo<string[]>(() => {
    const items = (outcomesQuery.data || [])
      .filter((outcome: CourseOutcomePayload) => outcome.courseId === course?.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((outcome) => outcome.text)
      .filter(Boolean);
    return items;
  }, [outcomesQuery.data, course?.id]);

  const requirements = useMemo<string[]>(() => {
    const items = (requirementsQuery.data || [])
      .filter((requirement: CourseRequirementPayload) => requirement.courseId === course?.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((requirement) => requirement.text)
      .filter(Boolean);
    return items;
  }, [requirementsQuery.data, course?.id]);

  const discussions = useMemo<DiscussionView[]>(() => {
    const courseDiscussions = discussionQuery.data?.courseDiscussions || [];
    const courseReplies = discussionQuery.data?.courseReplies || [];

    return courseDiscussions.map((discussion) => {
      const userName = discussion.userName || 'Learner';
      return {
        id: discussion.id,
        userId: discussion.userId,
        userName,
        userAvatar: userName[0]?.toUpperCase() || 'L',
        question: discussion.content,
        createdAt: discussion.createdAt ? new Date(discussion.createdAt).toLocaleDateString() : '',
        likes: 0,
        lessonId: discussion.lessonId,
        replies: courseReplies
          .filter((reply) => reply.discussionId === discussion.id)
          .map((reply) => {
            const replyName = reply.userName || 'Learner';
            return {
              id: reply.id,
              userId: reply.userId,
              userName: replyName,
              userAvatar: replyName[0]?.toUpperCase() || 'L',
              isInstructor: reply.userRole === 'INSTRUCTOR' || reply.userId === course?.instructorId,
              content: reply.content,
              createdAt: reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : '',
              likes: 0,
            };
          }),
      };
    });
  }, [discussionQuery.data, course?.instructorId]);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<{ title: string; id: string; videoUrl?: string } | null>(null);

  // Discussion state
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsEnrolled(false);
      return;
    }
    setIsEnrolled(Boolean(myEnrollmentQuery.data?.id));
  }, [isLoggedIn, myEnrollmentQuery.data?.id]);

  const myReview = useMemo(() => {
    if (!user?.id || !course?.id) return null;
    return (reviewsQuery.data || []).find((review) => review.courseId === course.id && review.studentId === user.id) || null;
  }, [reviewsQuery.data, user?.id, course?.id]);

  useEffect(() => {
    if (!myReview) {
      setReviewRating(0);
      setReviewTitle('');
      setReviewContent('');
      return;
    }
    setReviewRating(myReview.rating || 0);
    setReviewTitle(myReview.title || '');
    setReviewContent(myReview.content || '');
  }, [myReview]);

  const enrollMutation = useMutation({
    mutationFn: () => createEnrollment({ courseId: course.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-course-enrollment', course?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course', slugValue] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'approved'] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: string) => deleteEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-course-enrollment', course?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course', slugValue] });
      queryClient.invalidateQueries({ queryKey: ['courses', 'approved'] });
    },
  });

  const postDiscussionMutation = useMutation({
    mutationFn: (payload: { lessonId: string; userId: string; content: string }) => createLessonDiscussion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-discussions', course?.id] });
    },
  });

  const postReplyMutation = useMutation({
    mutationFn: (payload: { discussionId: string; userId: string; content: string }) => createDiscussionReply(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-discussions', course?.id] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !course?.id) {
        throw new Error('Missing user or course details');
      }
      if (reviewRating < 1) {
        throw new Error('Please select a rating');
      }

      if (myReview?.id) {
        return updateReview(myReview.id, {
          courseId: course.id,
          studentId: user.id,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          content: reviewContent.trim(),
        });
      }

      return createReview({
        courseId: course.id,
        studentId: user.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        content: reviewContent.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', course?.id] });
      setIsReviewDialogOpen(false);
      toast({ title: myReview ? 'Review updated' : 'Review submitted' });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to submit review.';
      toast({ title: 'Review failed', description: message, variant: 'destructive' });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!myReview?.id) {
        throw new Error('Review not found');
      }
      return deleteReview(myReview.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', course?.id] });
      setReviewRating(0);
      setReviewTitle('');
      setReviewContent('');
      toast({ title: 'Review deleted' });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to delete review.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    },
  });

  const isLoading =
    courseByIdQuery.isLoading ||
    coursesQuery.isLoading ||
    myEnrollmentQuery.isLoading ||
    sectionsQuery.isLoading ||
    lessonsQuery.isLoading ||
    reviewsQuery.isLoading ||
    outcomesQuery.isLoading ||
    requirementsQuery.isLoading ||
    discussionQuery.isLoading;
  const isError =
    courseByIdQuery.isError ||
    coursesQuery.isError ||
    sectionsQuery.isError ||
    lessonsQuery.isError ||
    reviewsQuery.isError ||
    outcomesQuery.isError ||
    requirementsQuery.isError ||
    discussionQuery.isError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="container py-16 text-muted-foreground">Loading course...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="container py-16 text-destructive">Failed to load course.</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <div className="container py-16 text-muted-foreground">Course not found.</div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = course.discountPrice 
    ? Math.round((1 - course.discountPrice / course.price) * 100) 
    : 0;

  const firstPreviewLesson = curriculumSections
    .flatMap((section) => section.lessons)
    .find((lesson) => lesson.isFree && lesson.type === 'VIDEO');

  const instructorFullName = `${course.instructor?.user?.firstName || ''} ${course.instructor?.user?.lastName || ''}`.trim()
    || course.instructor?.user?.email?.split('@')[0]
    || 'Unknown Instructor';
  const instructorInitial = instructorFullName[0]?.toUpperCase() || 'I';
  const instructorHeadline = course.instructor?.headline || instructorFullName;
  const instructorRating = Number(course.instructor?.averageRating ?? 0);
  const instructorTotalStudents = Number(course.instructor?.totalStudents ?? 0);
  const instructorTotalCourses = Number(course.instructor?.totalCourses ?? 0);
  const instructorAverageEarnings = Number(course.instructor?.totalRevenue ?? 0);
  const instructorBiography = course.instructor?.biography || 'Biography is not available yet.';
  const canDisplayEnrollCta = !isLoggedIn || user?.role === 'STUDENT';


  const handleEnroll = async () => {
    if (!isLoggedIn) {
      const redirectTo = `${location.pathname}${location.search}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    if (user?.role !== 'STUDENT') {
      toast({
        title: 'Enrollment not allowed',
        description: 'Only student accounts can enroll in courses.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await enrollMutation.mutateAsync();
      setIsEnrolled(true);
      toast({ title: 'Enrolled Successfully! 🎉', description: `You are now enrolled in "${course.title}". Start learning now!` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to enroll right now.';
      toast({ title: 'Enrollment failed', description: message, variant: 'destructive' });
    }
  };

  const handleUnenroll = async () => {
    const enrollmentId = myEnrollmentQuery.data?.id;
    if (!enrollmentId) {
      setIsEnrolled(false);
      return;
    }

    try {
      await unenrollMutation.mutateAsync(enrollmentId);
      setIsEnrolled(false);
      toast({ title: 'Unenrolled', description: 'You have been unenrolled from this course.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to unenroll right now.';
      toast({ title: 'Unenroll failed', description: message, variant: 'destructive' });
    }
  };

  const handlePreview = (lesson: { title: string; id: string; videoUrl?: string }) => {
    setPreviewLesson(lesson);
    setPreviewOpen(true);
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim() || !user?.id) return;
    const firstLessonId = discussionQuery.data?.courseLessons?.[0]?.id;
    if (!firstLessonId) {
      toast({ title: 'No lesson available', description: 'Cannot post discussion because this course has no lessons yet.', variant: 'destructive' });
      return;
    }

    await postDiscussionMutation.mutateAsync({
      lessonId: firstLessonId,
      userId: user.id,
      content: newQuestion,
    });

    setNewQuestion('');
    toast({ title: 'Question posted!', description: 'Your question has been posted to the discussion.' });
  };

  const handlePostReply = async (discussionId: string) => {
    if (!replyText.trim() || !user?.id) return;

    await postReplyMutation.mutateAsync({
      discussionId,
      userId: user.id,
      content: replyText,
    });

    setReplyText('');
    setReplyingTo(null);
    toast({ title: 'Reply posted!' });
  };

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

                {isEnrolled && (
                  <div className="flex items-center gap-2 bg-success/20 text-success-foreground rounded-lg px-4 py-2 border border-success/30">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium text-sm">You are enrolled in this course</span>
                  </div>
                )}

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
                  {course.instructor?.user?.profileImage ? (
                    <img
                      src={course.instructor.user.profileImage}
                      alt={instructorFullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-accent/20 text-accent flex items-center justify-center font-semibold">
                      {instructorInitial}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{instructorFullName}</p>
                    <p className="text-sm text-primary-foreground/70">
                      {instructorHeadline}
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
                  {/* Preview thumbnail */}
                  <div
                    className="relative aspect-video cursor-pointer"
                    onClick={() => {
                      if (firstPreviewLesson) {
                        handlePreview({
                          title: firstPreviewLesson.title,
                          id: firstPreviewLesson.id,
                          videoUrl: firstPreviewLesson.videoUrl,
                        });
                      }
                    }}
                  >
                    <img 
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group">
                      <div className="h-16 w-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-8 w-8 text-accent-foreground" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Preview this course
                    </div>
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
                    {isEnrolled ? (
                      <>
                        <Button variant="accent" className="w-full" size="lg">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleUnenroll} disabled={unenrollMutation.isPending}>
                          Unenroll
                        </Button>
                      </>
                    ) : (
                      <>
                        {canDisplayEnrollCta && (
                          <Button variant="accent" className="w-full" size="lg" onClick={handleEnroll} disabled={enrollMutation.isPending}>
                            Enroll Now
                          </Button>
                        )}
                        <Button variant="outline" className="w-full">
                          Add to Cart
                        </Button>
                      </>
                    )}

                    {/* <p className="text-xs text-center text-muted-foreground">
                      30-Day Money-Back Guarantee
                    </p> */}

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
            {isEnrolled ? (
              <Button variant="accent" className="flex-1">
                <Play className="h-4 w-4 mr-2" /> Continue Learning
              </Button>
            ) : (
              canDisplayEnrollCta ? (
                <Button variant="accent" className="flex-1" onClick={handleEnroll} disabled={enrollMutation.isPending}>
                  Enroll Now
                </Button>
              ) : (
                <div className="flex-1 text-right text-xs text-muted-foreground">Only students can enroll</div>
              )
            )}
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
                <TabsTrigger value="discussion" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discussion
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
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

                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Description</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{course.description}</p>
                    {/* <p>
                      This comprehensive course covers everything you need to know to master the subject. 
                      Whether you're a complete beginner or looking to enhance your existing skills, 
                      this course provides practical, hands-on learning experiences.
                    </p> */}
                  </div>
                </div>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">
                    {curriculumSections.length} sections • {course.totalLessons} lessons • {formatDuration(course.totalDuration)} total
                  </span>
                </div>

                <Accordion type="multiple" className="space-y-3">
                  {curriculumSections.map((section) => (
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
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg transition-colors",
                                (lesson.isFree || isEnrolled)
                                  ? "hover:bg-muted/50 cursor-pointer"
                                  : "opacity-70"
                              )}
                              onClick={() => {
                                if (lesson.isFree && lesson.type === 'VIDEO') {
                                  handlePreview({
                                    title: lesson.title,
                                    id: lesson.id,
                                    videoUrl: lesson.videoUrl,
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {lesson.type === 'VIDEO' && <Play className="h-4 w-4 text-muted-foreground" />}
                                {lesson.type === 'DOCUMENT' && <FileText className="h-4 w-4 text-muted-foreground" />}
                                {lesson.type === 'QUIZ' && <Award className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.isFree && (
                                  <Badge variant="outline" className="text-xs border-accent text-accent cursor-pointer">
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Preview
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {lesson.duration}min
                                </span>
                                {!lesson.isFree && !isEnrolled && <Lock className="h-3 w-3 text-muted-foreground" />}
                                {isEnrolled && <Check className="h-3 w-3 text-success" />}
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
                  {course.instructor?.user?.profileImage ? (
                    <img
                      src={course.instructor.user.profileImage}
                      alt={instructorFullName}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-accent/20 text-accent flex items-center justify-center font-semibold text-3xl">
                      {instructorInitial}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-xl font-bold">{instructorFullName}</h3>
                    <p className="text-muted-foreground">{instructorHeadline}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span>{instructorRating.toFixed(1)} rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{instructorTotalStudents.toLocaleString()} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{instructorTotalCourses.toLocaleString()} courses</span>
                      </div>
                      {/* <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{formatPrice(instructorAverageEarnings, course.currency)} earnings</span>
                      </div> */}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {instructorBiography}
                </p>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                {isEnrolled && user?.role === 'STUDENT' && !myReview && (
                  <div className="bg-card rounded-xl border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Leave a review</p>
                        <p className="text-xs text-muted-foreground">Share your experience with other students.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                            reviewRating >= value ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                          )}
                          aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                        >
                          <Star className={cn('h-4 w-4', reviewRating >= value && 'fill-warning')} />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder="Title (optional)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Write your review..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => reviewMutation.mutate()}
                        disabled={!reviewContent.trim() || reviewMutation.isPending}
                      >
                        Submit Review
                      </Button>
                    </div>
                  </div>
                )}

                {isEnrolled && user?.role === 'STUDENT' && myReview && (
                  <div className="bg-card rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Your review</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < myReview.rating ? 'fill-warning text-warning' : 'text-muted'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsReviewDialogOpen(true)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteReviewMutation.mutate()}
                          disabled={deleteReviewMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {myReview.title && (
                      <p className="text-sm font-semibold">{myReview.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{myReview.content}</p>
                  </div>
                )}

                {!isEnrolled && (
                  <div className="bg-muted/50 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Enroll in this course to leave a review.
                  </div>
                )}

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
                          {(review.studentName || 'L')[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              {review.studentName || 'Learner'}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
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

              {/* Discussion Tab */}
              <TabsContent value="discussion" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Course Discussion</h2>
                  <Badge variant="secondary">{discussions.length} threads</Badge>
                </div>

                {/* Post a question */}
                {isEnrolled || user?.role === 'INSTRUCTOR' ? (
                  <div className="bg-card rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-medium">Ask a question</p>
                    <Textarea
                      placeholder="What would you like to ask about this course?"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" variant="accent" onClick={handlePostQuestion} disabled={!newQuestion.trim()}>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Post Question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-xl border border-dashed p-6 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {isLoggedIn
                        ? 'Enroll in this course to join the discussion and ask questions.'
                        : 'Log in and enroll to join the discussion.'}
                    </p>
                    {!isEnrolled && isLoggedIn && user?.role === 'STUDENT' && (
                      <Button size="sm" variant="accent" onClick={handleEnroll} disabled={enrollMutation.isPending}>
                        Enroll to Discuss
                      </Button>
                    )}
                  </div>
                )}

                {/* Discussion threads */}
                <div className="space-y-4">
                  {discussions.map((disc) => (
                    <div key={disc.id} className="bg-card rounded-xl border overflow-hidden">
                      {/* Question */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                            {disc.userAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm">{disc.userName}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{disc.createdAt}</span>
                            </div>
                            <p className="text-sm mt-1">{disc.question}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {disc.likes}
                              </button>
                              <button
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                                onClick={() => {
                                  if (isEnrolled || user?.role === 'INSTRUCTOR') {
                                    setReplyingTo(replyingTo === disc.id ? null : disc.id);
                                  }
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Reply ({disc.replies.length})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {disc.replies.length > 0 && (
                        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                          {disc.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3 ml-4">
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                                reply.isInstructor
                                  ? "bg-accent/20 text-accent ring-2 ring-accent/30"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {reply.userAvatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{reply.userName}</p>
                                  {reply.isInstructor && (
                                    <Badge variant="default" className="text-[10px] h-4 px-1.5 bg-accent text-accent-foreground">
                                      Instructor
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{reply.content}</p>
                                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  {reply.likes}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      {replyingTo === disc.id && (
                        <div className="border-t p-3 flex gap-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handlePostReply(disc.id); }}
                            className="flex-1 h-9 text-sm"
                          />
                          <Button size="sm" variant="accent" className="h-9" onClick={() => handlePostReply(disc.id)} disabled={!replyText.trim()}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9" onClick={() => setReplyingTo(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg">
              {previewLesson ? `Preview: ${previewLesson.title}` : 'Course Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black relative flex items-center justify-center">
            {previewLesson?.videoUrl ? (
              <video
                src={previewLesson.videoUrl}
                className="w-full h-full"
                controls
                playsInline
              />
            ) : (
              <>
                <img
                  src={course.thumbnail}
                  alt="Video preview"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                  <div className="h-20 w-20 rounded-full bg-accent/90 flex items-center justify-center animate-pulse">
                    <Play className="h-10 w-10 text-accent-foreground ml-1" />
                  </div>
                  <p className="text-sm text-white/80">Video preview not available</p>
                </div>
              </>
            )}
          </div>
          <div className="p-4 bg-card">
            <h3 className="font-semibold text-sm">{previewLesson?.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              This is a free preview lesson. {!isEnrolled && 'Enroll to access all course content.'}
            </p>
            {!isEnrolled && canDisplayEnrollCta && (
              <Button variant="accent" size="sm" className="mt-3" onClick={() => { handleEnroll(); setPreviewOpen(false); }} disabled={enrollMutation.isPending}>
                Enroll Now — {formatPrice(course.discountPrice || course.price, course.currency)}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Update your review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                    reviewRating >= value ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'
                  )}
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star className={cn('h-4 w-4', reviewRating >= value && 'fill-warning')} />
                </button>
              ))}
            </div>
            <Input
              placeholder="Title (optional)"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your review..."
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="accent"
                onClick={() => reviewMutation.mutate()}
                disabled={!reviewContent.trim() || reviewMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CourseDetail;
