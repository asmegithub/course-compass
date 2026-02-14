import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Eye, CheckCircle2, XCircle, Clock, BookOpen, Users, Star,
  Play, FileText, BarChart3,
} from 'lucide-react';

interface PendingCourse {
  id: string;
  title: string;
  instructor: string;
  instructorEmail: string;
  category: string;
  level: string;
  price: number;
  lessons: number;
  duration: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description: string;
  thumbnail: string;
  sections: { title: string; lessons: { title: string; duration: string; type: string }[] }[];
  rejectionReason?: string;
}

const initialCourses: PendingCourse[] = [
  {
    id: '1',
    title: 'Advanced React Patterns',
    instructor: 'Abebe Bekele',
    instructorEmail: 'abebe@example.com',
    category: 'Programming',
    level: 'ADVANCED',
    price: 1299,
    lessons: 42,
    duration: '18h 30m',
    submittedAt: '2026-02-08',
    status: 'PENDING',
    description: 'Master advanced React patterns including compound components, render props, custom hooks, and state machines. Build production-grade applications with scalable architecture.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop',
    sections: [
      { title: 'Introduction to Advanced Patterns', lessons: [
        { title: 'Course Overview', duration: '8m', type: 'VIDEO' },
        { title: 'Setting Up the Project', duration: '15m', type: 'VIDEO' },
        { title: 'Pattern Categories', duration: '12m', type: 'VIDEO' },
      ]},
      { title: 'Compound Components', lessons: [
        { title: 'Understanding Compound Components', duration: '20m', type: 'VIDEO' },
        { title: 'Building a Tabs Component', duration: '25m', type: 'VIDEO' },
        { title: 'Quiz: Compound Patterns', duration: '10m', type: 'QUIZ' },
      ]},
      { title: 'Custom Hooks Deep Dive', lessons: [
        { title: 'Hook Composition', duration: '18m', type: 'VIDEO' },
        { title: 'useReducer Patterns', duration: '22m', type: 'VIDEO' },
      ]},
    ],
  },
  {
    id: '2',
    title: 'Business Analytics with Excel',
    instructor: 'Meron Tadesse',
    instructorEmail: 'meron@example.com',
    category: 'Business',
    level: 'BEGINNER',
    price: 899,
    lessons: 36,
    duration: '12h 45m',
    submittedAt: '2026-02-07',
    status: 'PENDING',
    description: 'Learn to analyze business data using Microsoft Excel. From basic formulas to advanced pivot tables, charts, and dashboards.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    sections: [
      { title: 'Excel Fundamentals', lessons: [
        { title: 'Interface Overview', duration: '10m', type: 'VIDEO' },
        { title: 'Basic Formulas', duration: '20m', type: 'VIDEO' },
      ]},
      { title: 'Data Analysis', lessons: [
        { title: 'Pivot Tables', duration: '25m', type: 'VIDEO' },
        { title: 'Charts & Visualization', duration: '18m', type: 'VIDEO' },
      ]},
    ],
  },
  {
    id: '3',
    title: 'Mobile Photography Masterclass',
    instructor: 'Solomon Gebre',
    instructorEmail: 'solomon@example.com',
    category: 'Design',
    level: 'ALL_LEVELS',
    price: 599,
    lessons: 28,
    duration: '8h 20m',
    submittedAt: '2026-02-05',
    status: 'PENDING',
    description: 'Transform your smartphone photography skills. Learn composition, lighting, editing, and storytelling through your mobile camera.',
    thumbnail: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop',
    sections: [
      { title: 'Getting Started', lessons: [
        { title: 'Camera Settings', duration: '12m', type: 'VIDEO' },
        { title: 'Composition Rules', duration: '15m', type: 'VIDEO' },
      ]},
    ],
  },
];

const AdminApprovals = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [reviewCourse, setReviewCourse] = useState<PendingCourse | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PendingCourse | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const handleApprove = (courseId: string) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'APPROVED' as const } : c));
    setReviewCourse(null);
    toast({ title: 'Course Approved', description: 'The course is now live on the platform.' });
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectionReason.trim()) return;
    setCourses(prev => prev.map(c => c.id === rejectDialog.id ? { ...c, status: 'REJECTED' as const, rejectionReason } : c));
    setRejectDialog(null);
    setReviewCourse(null);
    setRejectionReason('');
    toast({ title: 'Course Rejected', description: 'The instructor has been notified with feedback.', variant: 'destructive' });
  };

  const pending = courses.filter(c => c.status === 'PENDING');
  const approved = courses.filter(c => c.status === 'APPROVED');
  const rejected = courses.filter(c => c.status === 'REJECTED');

  const CourseRow = ({ course }: { course: PendingCourse }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <img src={course.thumbnail} alt={course.title} className="w-full md:w-40 h-24 object-cover rounded-lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  by {course.instructor} · {course.category} · {course.level}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.lessons} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}</span>
                  <span className="font-medium text-foreground">ETB {course.price}</span>
                </div>
              </div>
              <Badge variant={course.status === 'APPROVED' ? 'default' : course.status === 'REJECTED' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                {course.status}
              </Badge>
            </div>
            {course.rejectionReason && (
              <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">Reason: {course.rejectionReason}</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setReviewCourse(course)}>
                <Eye className="h-3 w-3" /> Review
              </Button>
              {course.status === 'PENDING' && (
                <>
                  <Button size="sm" variant="accent" className="gap-1 text-xs" onClick={() => handleApprove(course.id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => setRejectDialog(course)}>
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
            {pending.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No pending courses</p> : pending.map(c => <CourseRow key={c.id} course={c} />)}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3">
            {approved.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No approved courses yet</p> : approved.map(c => <CourseRow key={c.id} course={c} />)}
          </TabsContent>
          <TabsContent value="rejected" className="space-y-3">
            {rejected.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No rejected courses</p> : rejected.map(c => <CourseRow key={c.id} course={c} />)}
          </TabsContent>
        </Tabs>

        {/* Full Review Dialog */}
        <Dialog open={!!reviewCourse} onOpenChange={() => setReviewCourse(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Course Review</DialogTitle>
            </DialogHeader>
            {reviewCourse && (
              <div className="space-y-6">
                <img src={reviewCourse.thumbnail} alt="" className="w-full h-48 object-cover rounded-lg" />
                <div>
                  <h2 className="text-xl font-bold font-display">{reviewCourse.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Submitted by {reviewCourse.instructor} ({reviewCourse.instructorEmail})</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Category</p><p className="font-medium">{reviewCourse.category}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Level</p><p className="font-medium">{reviewCourse.level}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Price</p><p className="font-medium">ETB {reviewCourse.price}</p></div>
                  <div className="bg-muted rounded-lg p-3"><p className="text-muted-foreground text-xs">Duration</p><p className="font-medium">{reviewCourse.duration}</p></div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{reviewCourse.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Curriculum ({reviewCourse.lessons} lessons)</h3>
                  <div className="space-y-3">
                    {reviewCourse.sections.map((section, i) => (
                      <div key={i} className="border border-border rounded-lg p-3">
                        <p className="font-medium text-sm mb-2">Section {i + 1}: {section.title}</p>
                        <div className="space-y-1">
                          {section.lessons.map((lesson, j) => (
                            <div key={j} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                              <div className="flex items-center gap-2">
                                {lesson.type === 'VIDEO' ? <Play className="h-3 w-3 text-muted-foreground" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                                <span>{lesson.title}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              {reviewCourse?.status === 'PENDING' && (
                <>
                  <Button variant="destructive" onClick={() => { setRejectDialog(reviewCourse); }}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button variant="accent" onClick={() => handleApprove(reviewCourse.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setReviewCourse(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Dialog */}
        <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectionReason(''); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Course</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Provide a reason for rejection. The instructor will receive this feedback.</p>
            <Textarea placeholder="e.g., Video quality is too low, missing lesson content in Section 3..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectionReason(''); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Submit Rejection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminApprovals;
