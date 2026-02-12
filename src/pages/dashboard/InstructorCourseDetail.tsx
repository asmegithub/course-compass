import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { mockCourses, mockReviews } from '@/lib/mock-data';
import {
  ArrowLeft, Star, Users, DollarSign, BookOpen, MessageSquare,
  TrendingUp, Send, ThumbsUp, Pin, MoreVertical, Eye, BarChart3,
} from 'lucide-react';

// Mock discussions for demo
const mockDiscussions = [
  {
    id: 'd1',
    lessonTitle: 'Introduction to HTML',
    user: { firstName: 'Kebede', lastName: 'Mengistu', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
    content: 'I\'m having trouble understanding the difference between div and span. Can you explain when to use each one?',
    isPinned: false,
    createdAt: '2026-02-10',
    replies: [
      {
        id: 'r1',
        user: { firstName: 'Meron', lastName: 'Tadesse', profileImage: '' },
        content: 'I had the same question! Div is block-level and span is inline.',
        createdAt: '2026-02-10',
      },
    ],
  },
  {
    id: 'd2',
    lessonTitle: 'CSS Flexbox Layout',
    user: { firstName: 'Solomon', lastName: 'Gebre', profileImage: '' },
    content: 'The flexbox exercise in this lesson was great, but I\'m struggling with align-items vs align-content. What\'s the key difference?',
    isPinned: true,
    createdAt: '2026-02-09',
    replies: [],
  },
  {
    id: 'd3',
    lessonTitle: 'JavaScript Basics',
    user: { firstName: 'Hanna', lastName: 'Yosef', profileImage: '' },
    content: 'Can you explain closures with a more practical example? The one in the video was a bit abstract for me.',
    isPinned: false,
    createdAt: '2026-02-08',
    replies: [
      {
        id: 'r2',
        user: { firstName: 'Dawit', lastName: 'Kassa', profileImage: '' },
        content: 'I agree, a real-world example would help a lot!',
        createdAt: '2026-02-08',
      },
    ],
  },
];

const InstructorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [discussions, setDiscussions] = useState(mockDiscussions);

  const course = mockCourses.find((c) => c.id === courseId) || mockCourses[0];
  const courseReviews = mockReviews.filter((r) => r.courseId === course.id);

  // Use all reviews if none match (demo)
  const displayReviews = courseReviews.length > 0 ? courseReviews : mockReviews;

  const handleReply = (discussionId: string) => {
    const text = replyTexts[discussionId]?.trim();
    if (!text) return;

    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discussionId
          ? {
              ...d,
              replies: [
                ...d.replies,
                {
                  id: crypto.randomUUID(),
                  user: {
                    firstName: user?.firstName || 'Instructor',
                    lastName: user?.lastName || '',
                    profileImage: user?.profileImage || '',
                  },
                  content: text,
                  createdAt: new Date().toISOString().split('T')[0],
                },
              ],
            }
          : d
      )
    );
    setReplyTexts((prev) => ({ ...prev, [discussionId]: '' }));
  };

  const ratingDist = [
    { stars: 5, count: 65, pct: 65 },
    { stars: 4, count: 20, pct: 20 },
    { stars: 3, count: 10, pct: 10 },
    { stars: 2, count: 3, pct: 3 },
    { stars: 1, count: 2, pct: 2 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/instructor')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-bold text-foreground">{course.title}</h1>
              <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>{course.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{course.description}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Students', value: course.enrollmentCount.toLocaleString(), icon: Users },
            { label: 'Rating', value: `${course.averageRating} ★`, icon: Star },
            { label: 'Revenue', value: `ETB ${(course.enrollmentCount * (course.discountPrice || course.price) * 0.7 / 1000).toFixed(0)}k`, icon: DollarSign },
            { label: 'Lessons', value: course.totalLessons, icon: BookOpen },
          ].map((s) => (
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1"><BarChart3 className="h-3 w-3" /> Overview</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1"><Star className="h-3 w-3" /> Reviews ({displayReviews.length})</TabsTrigger>
            <TabsTrigger value="discussions" className="gap-1"><MessageSquare className="h-3 w-3" /> Discussions ({discussions.length})</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Course Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{course.category?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">ETB {course.discountPrice || course.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Reviews</span>
                    <span className="font-medium">{course.totalReviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{course.createdAt}</span>
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
                        <div className="w-full bg-primary/20 rounded-t" style={{ height: `${v}%` }}>
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

          {/* Reviews */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Rating Distribution */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="text-center">
                    <p className="text-5xl font-bold font-display">{course.averageRating}</p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(course.averageRating) ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{course.totalReviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    {ratingDist.map((r) => (
                      <div key={r.stars} className="flex items-center gap-2 text-sm">
                        <span className="w-12 text-right text-muted-foreground">{r.stars} star</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="w-8 text-xs text-muted-foreground">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review List */}
            <div className="space-y-3">
              {displayReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={review.student?.profileImage} />
                        <AvatarFallback>{review.student?.firstName?.[0]}{review.student?.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{review.student?.firstName} {review.student?.lastName}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.createdAt}</span>
                        </div>
                        {review.title && <p className="font-medium text-sm mt-1">{review.title}</p>}
                        <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <ThumbsUp className="h-3 w-3" /> {review.helpfulCount}
                          </Button>
                          <Badge variant={review.visible ? 'default' : 'secondary'} className="text-[10px]">
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

          {/* Discussions */}
          <TabsContent value="discussions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{discussions.length} discussions from students</p>
            </div>

            {discussions.map((discussion) => (
              <Card key={discussion.id} className={discussion.isPinned ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  {/* Question */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={discussion.user.profileImage} />
                      <AvatarFallback>{discussion.user.firstName[0]}{discussion.user.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{discussion.user.firstName} {discussion.user.lastName}</span>
                        {discussion.isPinned && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">· {discussion.createdAt}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] mt-1">{discussion.lessonTitle}</Badge>
                      <p className="text-sm mt-2">{discussion.content}</p>
                    </div>
                  </div>

                  {/* Existing Replies */}
                  {discussion.replies.length > 0 && (
                    <div className="ml-12 space-y-3 border-l-2 border-border pl-4">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={reply.user.profileImage} />
                            <AvatarFallback className="text-xs">{reply.user.firstName[0]}{reply.user.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{reply.user.firstName} {reply.user.lastName}</span>
                              {reply.user.firstName === user?.firstName && (
                                <Badge variant="default" className="text-[10px] h-4">Instructor</Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">{reply.createdAt}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
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
                      disabled={!replyTexts[discussion.id]?.trim()}
                    >
                      <Send className="h-4 w-4" />
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
