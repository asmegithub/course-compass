import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCourseById,
  getReviews,
  getLessonDiscussions,
  getDiscussionReplies,
  createDiscussionReply,
  getLessons,
  type ReviewPayload,
  type LessonDiscussionPayload,
  type DiscussionReplyPayload,
} from '@/lib/course-api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft, Star, Users, DollarSign, BookOpen, MessageSquare,
  Send, BarChart3, Loader2,
} from 'lucide-react';

const InstructorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(courseId!),
    enabled: Boolean(courseId),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: getReviews,
    enabled: Boolean(courseId),
  });

  const lessonsQuery = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => getLessons(courseId!),
    enabled: Boolean(courseId),
  });

  const discussionsQuery = useQuery({
    queryKey: ['lesson-discussions'],
    queryFn: getLessonDiscussions,
    enabled: Boolean(courseId),
  });

  const repliesQuery = useQuery({
    queryKey: ['discussion-replies'],
    queryFn: getDiscussionReplies,
    enabled: Boolean(courseId),
  });

  const course = courseQuery.data;
  const allReviews = reviewsQuery.data ?? [];
  const allLessons = lessonsQuery.data ?? [];
  const allDiscussions = discussionsQuery.data ?? [];
  const allReplies = repliesQuery.data ?? [];

  const courseLessonIds = useMemo(() => new Set(allLessons.map((l) => l.id)), [allLessons]);
  const lessonsById = useMemo(() => Object.fromEntries(allLessons.map((l) => [l.id, l])), [allLessons]);

  const displayReviews = useMemo(
    () => (course ? allReviews.filter((r) => r.courseId === course.id) : []),
    [course, allReviews]
  );

  const discussionsForCourse = useMemo(() => {
    const list = allDiscussions.filter((d) => courseLessonIds.has(d.lessonId));
    const repliesByDiscussion = allReplies.reduce<Record<string, DiscussionReplyPayload[]>>((acc, r) => {
      if (!acc[r.discussionId]) acc[r.discussionId] = [];
      acc[r.discussionId].push(r);
      return acc;
    }, {});
    return list.map((d) => ({
      ...d,
      lessonTitle: lessonsById[d.lessonId]?.title ?? 'Lesson',
      replies: repliesByDiscussion[d.id] ?? [],
    }));
  }, [allDiscussions, allReplies, courseLessonIds, lessonsById]);

  const replyMutation = useMutation({
    mutationFn: (payload: { discussionId: string; content: string }) =>
      createDiscussionReply({
        discussionId: payload.discussionId,
        userId: user!.id,
        content: payload.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-replies'] });
      toast({ title: 'Reply posted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to post reply', description: err.message, variant: 'destructive' });
    },
  });

  const handleReply = (discussionId: string) => {
    const text = replyTexts[discussionId]?.trim();
    if (!text || !user) return;
    replyMutation.mutate({ discussionId, content: text });
    setReplyTexts((prev) => ({ ...prev, [discussionId]: '' }));
  };

  const ratingDist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    displayReviews.forEach((r) => {
      const idx = Math.min(Math.max(r.rating, 1), 5) - 1;
      counts[idx]++;
    });
    const total = displayReviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars, i) => ({
      stars,
      count: counts[4 - i],
      pct: Math.round((counts[4 - i] / total) * 100),
    }));
  }, [displayReviews]);

  const isLoading = courseQuery.isLoading || (courseId && !course && !courseQuery.isError);
  const notFound = courseId && !courseQuery.isLoading && !course;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[40vh] gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading course...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !course) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <p className="text-muted-foreground">Course not found.</p>
          <Button variant="outline" onClick={() => navigate('/instructor')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const courseStats = [
    { label: 'Students', value: String(course.enrollmentCount ?? 0), icon: Users },
    { label: 'Rating', value: `${Number(course.averageRating ?? 0).toFixed(1)} ★`, icon: Star },
    {
      label: 'Revenue',
      value: `ETB ${(((course.enrollmentCount ?? 0) * Number(course.discountPrice ?? course.price ?? 0) * 0.7) / 1000).toFixed(0)}k`,
      icon: DollarSign,
    },
    { label: 'Lessons', value: String(course.totalLessons ?? 0), icon: BookOpen },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/instructor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-bold text-foreground">{course.title}</h1>
              <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {course.status ?? 'DRAFT'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{course.description ?? ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {courseStats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <s.icon className="h-4 w-4" />
                  <span className="text-xs">{s.label}</span>
                </div>
                <p className="text-lg font-bold font-display">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1">
              <BarChart3 className="h-3 w-3" /> Overview
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1">
              <Star className="h-3 w-3" /> Reviews ({displayReviews.length})
            </TabsTrigger>
            <TabsTrigger value="discussions" className="gap-1">
              <MessageSquare className="h-3 w-3" /> Discussions ({discussionsForCourse.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Course Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{course.category?.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{course.level ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">
                      ETB {course.discountPrice ?? course.price ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-medium">{course.totalReviews ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{course.createdAt ?? '—'}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Enrollment Trend (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {[45, 62, 38, 75, 52, 88, 67].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-primary/20 rounded-t"
                          style={{ height: `${v}%` }}
                        >
                          <div className="w-full h-full bg-primary rounded-t opacity-80" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold font-display">
                      {Number(course.averageRating ?? 0).toFixed(1)}
                    </p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= Math.round(Number(course.averageRating ?? 0))
                              ? 'text-accent fill-accent'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {course.totalReviews ?? 0} reviews
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    {ratingDist.map((r) => (
                      <div key={r.stars} className="flex items-center gap-2 text-sm">
                        <span className="w-12 text-right text-muted-foreground">
                          {r.stars} star
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-muted-foreground">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {displayReviews.length === 0 && (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
              {displayReviews.map((review: ReviewPayload) => (
                <Card key={review.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {(review.studentName ?? '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {review.studentName ?? 'Student'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
                                  s <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.createdAt}
                          </span>
                        </div>
                        {review.title && (
                          <p className="font-medium text-sm mt-1">{review.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {review.helpfulCount} helpful
                          </span>
                          <Badge
                            variant={review.visible ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {review.visible ? 'Visible' : 'Hidden'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discussions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {discussionsForCourse.length} discussions from students
              </p>
            </div>

            {discussionsForCourse.length === 0 && (
              <p className="text-sm text-muted-foreground">No discussions yet.</p>
            )}

            {discussionsForCourse.map((discussion) => (
              <Card key={discussion.id}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {(discussion.userName ?? '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {discussion.userName ?? 'Student'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {discussion.createdAt}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {discussion.lessonTitle}
                      </Badge>
                      <p className="text-sm mt-2">{discussion.content}</p>
                    </div>
                  </div>

                  {discussion.replies.length > 0 && (
                    <div className="ml-12 space-y-3 border-l-2 border-border pl-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {(reply.userName ?? '?')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">
                                {reply.userName ?? 'User'}
                              </span>
                              {reply.userId === user?.id && (
                                <Badge variant="default" className="text-[10px] h-4">
                                  Instructor
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {reply.createdAt}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ml-12 flex gap-2">
                    <Textarea
                      placeholder="Write a reply as instructor..."
                      rows={2}
                      className="text-sm flex-1"
                      value={replyTexts[discussion.id] || ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [discussion.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="icon"
                      className="shrink-0 self-end"
                      onClick={() => handleReply(discussion.id)}
                      disabled={!replyTexts[discussion.id]?.trim() || replyMutation.isPending}
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstructorCourseDetail;
