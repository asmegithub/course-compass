import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CoursePayload, getCourses, updateCourse } from '@/lib/course-api';
import { formatDuration } from '@/lib/formatters';
import {
  Eye, CheckCircle2, XCircle, Clock, BookOpen,
  FileText,
} from 'lucide-react';

const AdminApprovals = () => {
  const queryClient = useQueryClient();
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });
  const [reviewCourseId, setReviewCourseId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const courses = coursesQuery.data || [];
  const reviewCourse = courses.find((course) => course.id === reviewCourseId) || null;
  const rejectDialog = courses.find((course) => course.id === rejectDialogId) || null;

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CoursePayload }) => updateCourse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update course.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const buildPayload = (course: typeof courses[number], status: string): CoursePayload | null => {
    if (!course.categoryId || !course.instructorId) {
      return null;
    }

    return {
      instructorId: course.instructorId,
      categoryId: course.categoryId,
      title: course.title,
      titleAm: course.titleAm,
      titleOm: course.titleOm,
      titleGz: course.titleGz,
      slug: course.slug,
      description: course.description,
      descriptionAm: course.descriptionAm,
      descriptionOm: course.descriptionOm,
      descriptionGz: course.descriptionGz,
      thumbnail: course.thumbnail,
      previewVideo: course.previewVideo,
      price: course.price,
      discountPrice: course.discountPrice,
      currency: course.currency,
      level: course.level,
      status,
      totalDuration: course.totalDuration,
      totalLessons: course.totalLessons,
      enrollmentCount: course.enrollmentCount,
      averageRating: course.averageRating,
      totalReviews: course.totalReviews,
      isFeatured: course.isFeatured,
      isPopular: course.isPopular,
    };
  };

  const handleApprove = (courseId: string) => {
    const current = courses.find((item) => item.id === courseId);
    if (!current) return;
    const payload = buildPayload(current, 'APPROVED');
    if (!payload) {
      toast({ title: 'Missing instructor', description: 'Instructor profile is required to approve.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id: courseId, payload });
    setReviewCourseId(null);
    toast({ title: 'Course Approved', description: 'The course is now live on the platform.' });
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectionReason.trim()) return;
    const payload = buildPayload(rejectDialog, 'REJECTED');
    if (!payload) {
      toast({ title: 'Missing instructor', description: 'Instructor profile is required to reject.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id: rejectDialog.id, payload });
    setRejectDialogId(null);
    setReviewCourseId(null);
    setRejectionReason('');
    toast({ title: 'Course Rejected', description: 'The instructor has been notified with feedback.', variant: 'destructive' });
  };

  const pending = courses.filter(course => course.status === 'PENDING');
  const approved = courses.filter(course => course.status === 'APPROVED' || course.status === 'PUBLISHED');
  const rejected = courses.filter(course => course.status === 'REJECTED');

  const getInstructorName = (course?: typeof courses[number]) => {
    const userProfile = course?.instructor?.user;
    if (userProfile) {
      return `${userProfile.firstName} ${userProfile.lastName}`.trim();
    }
    return 'Unknown instructor';
  };

  const CourseRow = ({ course }: { course: typeof courses[number] }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <img src={course.thumbnail} alt={course.title || 'Course'} className="w-full md:w-40 h-24 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{course.title || 'Untitled course'}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  by {getInstructorName(course)} · {course.category?.name || 'Uncategorized'} · {course.level || '—'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.totalLessons || 0} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(course.totalDuration || 0)}</span>
                  <span className="font-medium text-foreground">ETB {course.discountPrice || course.price || 0}</span>
                </div>
              </div>
              <Badge variant={course.status === 'APPROVED' || course.status === 'PUBLISHED' ? 'default' : course.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                {course.status}
              </Badge>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setReviewCourseId(course.id)}>
                <Eye className="h-3 w-3" /> Review
              </Button>
              {course.status === 'PENDING' && (
                <>
                  <Button size="sm" variant="accent" className="gap-1 text-xs" onClick={() => handleApprove(course.id)} disabled={updateMutation.isPending}>
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => setRejectDialogId(course.id)} disabled={updateMutation.isPending}>
                    <XCircle className="h-3 w-3" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Course Approvals</h1>
          <p className="text-muted-foreground mt-1">Review and manage submitted courses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-warning">{pending.length}</p><p className="text-xs text-muted-foreground mt-1">Pending Review</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-success">{approved.length}</p><p className="text-xs text-muted-foreground mt-1">Approved</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-2xl font-bold font-display text-destructive">{rejected.length}</p><p className="text-xs text-muted-foreground mt-1">Rejected</p></CardContent></Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3">
            {coursesQuery.isError ? (
              <p className="text-destructive text-sm py-8 text-center">Failed to load courses.</p>
            ) : coursesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Loading courses...</p>
            ) : pending.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No pending courses</p>
            ) : (
              pending.map(course => <CourseRow key={course.id} course={course} />)
            )}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3">
            {coursesQuery.isError ? (
              <p className="text-destructive text-sm py-8 text-center">Failed to load courses.</p>
            ) : coursesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Loading courses...</p>
            ) : approved.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No approved courses yet</p>
            ) : (
              approved.map(course => <CourseRow key={course.id} course={course} />)
            )}
          </TabsContent>
          <TabsContent value="rejected" className="space-y-3">
            {coursesQuery.isError ? (
              <p className="text-destructive text-sm py-8 text-center">Failed to load courses.</p>
            ) : coursesQuery.isLoading ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Loading courses...</p>
            ) : rejected.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No rejected courses</p>
            ) : (
              rejected.map(course => <CourseRow key={course.id} course={course} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Full Review Dialog */}
        <Dialog open={!!reviewCourse} onOpenChange={() => setReviewCourseId(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Course Review</DialogTitle>
            </DialogHeader>
            {reviewCourse && (
              <div className="space-y-6">
                <img src={reviewCourse.thumbnail} alt="" className="w-full h-48 object-cover rounded-lg" />
                <div>
                  <h2 className="text-xl font-bold font-display">{reviewCourse.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Submitted by {getInstructorName(reviewCourse)}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Category</p><p className="font-medium">{reviewCourse.category?.name || '—'}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Level</p><p className="font-medium">{reviewCourse.level || '—'}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Price</p><p className="font-medium">ETB {reviewCourse.discountPrice || reviewCourse.price || 0}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Duration</p><p className="font-medium">{formatDuration(reviewCourse.totalDuration || 0)}</p></div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{reviewCourse.description || '—'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Curriculum</h3>
                  <div className="border border-border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Sections and lessons will appear once the curriculum API is connected.
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              {reviewCourse?.status === 'PENDING' && (
                <>
                  <Button variant="destructive" onClick={() => { setRejectDialogId(reviewCourse.id); }} disabled={updateMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button variant="accent" onClick={() => handleApprove(reviewCourse.id)} disabled={updateMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setReviewCourseId(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Dialog */}
        <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialogId(null); setRejectionReason(''); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Course</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Provide a reason for rejection. The instructor will receive this feedback.</p>
            <Textarea placeholder="e.g., Video quality is too low, missing lesson content in Section 3..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectionReason(''); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Submit Rejection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminApprovals;
