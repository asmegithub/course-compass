import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  Link,
  Navigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MessageSquare,
  Send,
  ThumbsUp,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { formatDuration, formatPrice } from "@/lib/formatters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  checkInWishlist,
  addToWishlist,
  removeFromWishlist,
  getReferralBalance,
  CourseOutcomePayload,
  CourseRequirementPayload,
  LessonPayload,
} from "@/lib/course-api";
import { cn } from "@/lib/utils";
import {
  getLocalizedTitle,
  getLocalizedDescription,
} from "@/lib/localized-content";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useContentProtection } from "@/hooks/use-content-protection";
import ContentProtectionOverlay from "@/components/security/ContentProtectionOverlay";
import SecureVideoPlayer from "@/components/security/SecureVideoPlayer";

const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
const ALLOWED_TABS = [
  "overview",
  "curriculum",
  "instructor",
  "reviews",
  "discussion",
] as const;
type CourseDetailTab = (typeof ALLOWED_TABS)[number];

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

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const REFERRAL_STORAGE_KEY = "referralRef";
const REFERRAL_COURSE_KEY = "referralCourseId";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatInlineMarkdown = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
};

// Lesson.duration is stored in minutes in this codebase.
const formatLessonTimeFromMinutes = (minutes?: number) =>
  formatDuration(Number(minutes ?? 0));

const renderLessonTextHtml = (rawContent: string) => {
  const content = rawContent.trim();
  if (!content) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(content)) return content;

  const lines = content.split(/\r?\n/);
  const htmlParts: string[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];
  const headingStyles: Record<number, string> = {
    1: "font-size:1.4rem;font-weight:800;line-height:1.3;margin:1rem 0 0.5rem;",
    2: "font-size:1.2rem;font-weight:700;line-height:1.35;margin:0.9rem 0 0.45rem;",
    3: "font-size:1.05rem;font-weight:700;line-height:1.4;margin:0.8rem 0 0.4rem;",
  };

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    htmlParts.push(`<p>${formatInlineMarkdown(paragraphBuffer.join(" "))}</p>`);
    paragraphBuffer = [];
  };
  const flushList = () => {
    if (listBuffer.length === 0) return;
    htmlParts.push(
      `<ul style="list-style:disc;padding-left:1.5rem;margin:0.75rem 0;">${listBuffer.map((item) => `<li style="margin:0.35rem 0;">${formatInlineMarkdown(item)}</li>`).join("")}</ul>`,
    );
    listBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const headingMatch = /^(#{1,3})\s*(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (text) {
        const style = headingStyles[level] || headingStyles[3];
        htmlParts.push(
          `<h${level} style="${style}">${formatInlineMarkdown(text)}</h${level}>`,
        );
        continue;
      }
    }
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h3>${formatInlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h2>${formatInlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h1>${formatInlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
      flushParagraph();
      listBuffer.push(trimmed.slice(2));
      continue;
    }
    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  return htmlParts.join("\n");
};

const CourseDetail = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoggedIn } = useAuth();
  const { isInCart, addToCart, removeFromCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const slugValue = slug || "";
  const isUuidSlug = isUuid(slugValue);
  const refFromUrl = searchParams.get("ref");
  const tabParam = searchParams.get("tab");
  const initialTab: CourseDetailTab = ALLOWED_TABS.includes(
    (tabParam ?? "") as CourseDetailTab,
  )
    ? (tabParam as CourseDetailTab)
    : "overview";
  const [activeTab, setActiveTab] = useState<CourseDetailTab>(initialTab);
  const isStudentUser =
    user?.role === "STUDENT" || user?.role === "ROLE_STUDENT";

  useEffect(() => {
    const nextTab: CourseDetailTab = ALLOWED_TABS.includes(
      (searchParams.get("tab") ?? "") as CourseDetailTab,
    )
      ? (searchParams.get("tab") as CourseDetailTab)
      : "overview";
    setActiveTab(nextTab);
  }, [searchParams]);

  const courseByIdQuery = useQuery({
    queryKey: ["course", slugValue],
    queryFn: () => getCourseById(slugValue),
    enabled: Boolean(slugValue) && isUuidSlug,
  });

  const coursesQuery = useQuery({
    queryKey: ["course-detail", slugValue],
    queryFn: getApprovedCourses,
    enabled: Boolean(slugValue) && !isUuidSlug,
    refetchOnMount: true,
  });

  const course = isUuidSlug
    ? courseByIdQuery.data
    : coursesQuery.data?.find((c) => c.slug === slugValue);

  const sectionsQuery = useQuery({
    queryKey: ["course-sections", course?.id],
    queryFn: () => getCourseSections(course!.id),
    enabled: Boolean(course?.id),
  });

  const lessonsQuery = useQuery({
    queryKey: ["lessons", course?.id],
    queryFn: () => getLessons(course!.id),
    enabled: Boolean(course?.id),
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", course?.id],
    queryFn: getReviews,
    enabled: Boolean(course?.id),
  });

  const outcomesQuery = useQuery({
    queryKey: ["course-outcomes", course?.id],
    queryFn: getCourseOutcomes,
    enabled: Boolean(course?.id),
  });

  const requirementsQuery = useQuery({
    queryKey: ["course-requirements", course?.id],
    queryFn: getCourseRequirements,
    enabled: Boolean(course?.id),
  });

  const discussionQuery = useQuery({
    queryKey: ["lesson-discussions", course?.id],
    queryFn: async () => {
      const [allDiscussions, allReplies, allSections, allLessons] =
        await Promise.all([
          getLessonDiscussions(),
          getDiscussionReplies(),
          getCourseSections(),
          getLessons(),
        ]);

      const lessonSectionIds = new Set(
        allLessons.map((lesson) => lesson.sectionId).filter(Boolean),
      );
      const courseSectionIdsFromCourse = new Set(
        allSections
          .filter((section) => section.courseId === course?.id)
          .map((section) => section.id),
      );
      const courseSectionIdsFromLessons = new Set(
        allSections
          .filter((section) => lessonSectionIds.has(section.id))
          .map((section) => section.id),
      );
      const courseSectionIds =
        courseSectionIdsFromCourse.size > 0
          ? courseSectionIdsFromCourse
          : courseSectionIdsFromLessons;

      const courseLessons = allLessons.filter((lesson) =>
        courseSectionIds.has(lesson.sectionId),
      );
      const courseLessonIds = new Set(courseLessons.map((lesson) => lesson.id));

      const courseDiscussions = allDiscussions.filter((discussion) =>
        courseLessonIds.has(discussion.lessonId),
      );
      const discussionIds = new Set(
        courseDiscussions.map((discussion) => discussion.id),
      );
      const courseReplies = allReplies.filter((reply) =>
        discussionIds.has(reply.discussionId),
      );

      return { courseLessons, courseDiscussions, courseReplies };
    },
    enabled: Boolean(course?.id),
  });

  const myEnrollmentQuery = useQuery({
    queryKey: ["my-course-enrollment", course?.id, user?.id],
    queryFn: () => getMyCourseEnrollment(course!.id),
    enabled: Boolean(course?.id) && isLoggedIn,
  });

  const curriculumSections = useMemo(() => {
    if (!course?.id) {
      return [] as Array<{
        id: string;
        title: string;
        lessons: LessonPayload[];
      }>;
    }

    const allSections = sectionsQuery.data || [];
    const allLessons = lessonsQuery.data || [];
    const lessonSectionIds = new Set(
      allLessons.map((lesson) => lesson.sectionId).filter(Boolean),
    );
    const courseSections = allSections.filter(
      (section) => section.courseId === course.id,
    );
    const inferredSections = allSections.filter((section) =>
      lessonSectionIds.has(section.id),
    );
    const sectionsToUse = (
      courseSections.length > 0 ? courseSections : inferredSections
    ).sort((a, b) => a.orderIndex - b.orderIndex);

    return sectionsToUse.map((section) => ({
      id: section.id,
      title: section.title || t("courseDetail.curriculum.sectionFallback"),
      lessons: allLessons
        .filter(
          (lesson) => lesson.sectionId === section.id && lesson.isPublished,
        )
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  }, [sectionsQuery.data, lessonsQuery.data, course?.id, t]);

  const reviews = useMemo(() => {
    return (reviewsQuery.data || []).filter(
      (review) => review.courseId === course?.id && review.visible,
    );
  }, [reviewsQuery.data, course?.id]);

  const whatYoullLearn = useMemo<string[]>(() => {
    const items = (outcomesQuery.data || [])
      .filter(
        (outcome: CourseOutcomePayload) => outcome.courseId === course?.id,
      )
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((outcome) => outcome.text)
      .filter(Boolean);
    return items;
  }, [outcomesQuery.data, course?.id]);

  const requirements = useMemo<string[]>(() => {
    const items = (requirementsQuery.data || [])
      .filter(
        (requirement: CourseRequirementPayload) =>
          requirement.courseId === course?.id,
      )
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((requirement) => requirement.text)
      .filter(Boolean);
    return items;
  }, [requirementsQuery.data, course?.id]);

  const discussions = useMemo<DiscussionView[]>(() => {
    const courseDiscussions = discussionQuery.data?.courseDiscussions || [];
    const courseReplies = discussionQuery.data?.courseReplies || [];

    return courseDiscussions.map((discussion) => {
      const userName =
        discussion.userName || t("courseDetail.discussion.learner");
      return {
        id: discussion.id,
        userId: discussion.userId,
        userName,
        userAvatar: userName[0]?.toUpperCase() || "L",
        question: discussion.content,
        createdAt: discussion.createdAt
          ? new Date(discussion.createdAt).toLocaleDateString()
          : "",
        likes: 0,
        lessonId: discussion.lessonId,
        replies: courseReplies
          .filter((reply) => reply.discussionId === discussion.id)
          .map((reply) => {
            const replyName =
              reply.userName || t("courseDetail.discussion.learner");
            return {
              id: reply.id,
              userId: reply.userId,
              userName: replyName,
              userAvatar: replyName[0]?.toUpperCase() || "L",
              isInstructor:
                reply.userRole === "INSTRUCTOR" ||
                reply.userId === course?.instructorId,
              content: reply.content,
              createdAt: reply.createdAt
                ? new Date(reply.createdAt).toLocaleDateString()
                : "",
              likes: 0,
            };
          }),
      };
    });
  }, [discussionQuery.data, course?.instructorId, t]);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedPreviewLessonId, setSelectedPreviewLessonId] = useState<
    string | null
  >(null);

  // Discussion state
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { isContentObscured, isDevtoolsOpen } = useContentProtection({
    enabled: true,
    detectDevtools: true,
    blockPrint: true,
    blockSelection: true,
  });

  const wishlistCheckQuery = useQuery({
    queryKey: ["wishlist-check", course?.id],
    queryFn: () => checkInWishlist(course!.id),
    enabled: Boolean(isLoggedIn && course?.id),
  });

  const referralBalanceQuery = useQuery({
    queryKey: ["referral-balance"],
    queryFn: getReferralBalance,
    enabled: Boolean(isLoggedIn && user?.role === "STUDENT"),
  });

  const referralBalance = referralBalanceQuery.data?.balance ?? 0;
  const coursePrice = course
    ? Number(course.discountPrice ?? course.price ?? 0)
    : 0;
  const canUseBalance =
    !isEnrolled &&
    isLoggedIn &&
    user?.role === "STUDENT" &&
    referralBalance >= coursePrice &&
    coursePrice > 0;

  useEffect(() => {
    if (refFromUrl && course?.id) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, refFromUrl);
        localStorage.setItem(REFERRAL_COURSE_KEY, course.id);
      } catch (error) {
        void error;
      }
    }
  }, [refFromUrl, course?.id]);

  const referrerIdForEnrollment = useMemo(() => {
    if (!course?.id) return null;
    const fromUrl = refFromUrl;
    const fromStorage = (() => {
      try {
        return localStorage.getItem(REFERRAL_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const storedCourse = (() => {
      try {
        return localStorage.getItem(REFERRAL_COURSE_KEY);
      } catch {
        return null;
      }
    })();
    const id = fromUrl || (storedCourse === course.id ? fromStorage : null);
    return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  }, [refFromUrl, course?.id]);

  const isWishlisted = Boolean(wishlistCheckQuery.data);

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!course?.id) return;
      if (isWishlisted) await removeFromWishlist(course.id);
      else await addToWishlist(course.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist-check", course?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist-me"] });
    },
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setIsEnrolled(false);
      return;
    }
    setIsEnrolled(Boolean(myEnrollmentQuery.data?.id));
  }, [isLoggedIn, myEnrollmentQuery.data?.id]);

  const myReview = useMemo(() => {
    if (!user?.id || !course?.id) return null;
    return (
      (reviewsQuery.data || []).find(
        (review) =>
          review.courseId === course.id && review.studentId === user.id,
      ) || null
    );
  }, [reviewsQuery.data, user?.id, course?.id]);

  useEffect(() => {
    if (!myReview) {
      setReviewRating(0);
      setReviewTitle("");
      setReviewContent("");
      return;
    }
    setReviewRating(myReview.rating || 0);
    setReviewTitle(myReview.title || "");
    setReviewContent(myReview.content || "");
  }, [myReview]);

  const enrollMutation = useMutation({
    mutationFn: () =>
      createEnrollment({
        courseId: course.id,
        referrerId: referrerIdForEnrollment ?? undefined,
        useBalance: canUseBalance ? true : undefined,
      }),
    onSuccess: () => {
      try {
        if (localStorage.getItem(REFERRAL_COURSE_KEY) === course?.id) {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
          localStorage.removeItem(REFERRAL_COURSE_KEY);
        }
      } catch (error) {
        void error;
      }
      queryClient.invalidateQueries({
        queryKey: ["my-course-enrollment", course?.id, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["course", slugValue] });
      queryClient.invalidateQueries({ queryKey: ["courses", "approved"] });
      queryClient.invalidateQueries({ queryKey: ["course-detail", slugValue] });
      queryClient.invalidateQueries({ queryKey: ["referral-balance"] });
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: string) => deleteEnrollment(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-course-enrollment", course?.id, user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["course", slugValue] });
      queryClient.invalidateQueries({ queryKey: ["courses", "approved"] });
      queryClient.invalidateQueries({ queryKey: ["course-detail", slugValue] });
    },
  });

  const postDiscussionMutation = useMutation({
    mutationFn: (payload: {
      lessonId: string;
      userId: string;
      content: string;
    }) => createLessonDiscussion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-discussions", course?.id],
      });
    },
  });

  const postReplyMutation = useMutation({
    mutationFn: (payload: {
      discussionId: string;
      userId: string;
      content: string;
    }) => createDiscussionReply(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-discussions", course?.id],
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !course?.id) {
        throw new Error(t("courseDetail.feedback.missingUserOrCourse"));
      }
      if (reviewRating < 1) {
        throw new Error(t("courseDetail.reviews.selectRating"));
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
      queryClient.invalidateQueries({ queryKey: ["reviews", course?.id] });
      setIsReviewDialogOpen(false);
      toast({
        title: myReview
          ? t("courseDetail.feedback.reviewUpdatedTitle")
          : t("courseDetail.feedback.reviewSubmittedTitle"),
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("courseDetail.feedback.submitReviewFailedDesc");
      toast({
        title: t("courseDetail.feedback.reviewFailedTitle"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      if (!myReview?.id) {
        throw new Error(t("courseDetail.feedback.reviewNotFound"));
      }
      return deleteReview(myReview.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", course?.id] });
      setReviewRating(0);
      setReviewTitle("");
      setReviewContent("");
      toast({ title: t("courseDetail.feedback.reviewDeletedTitle") });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("courseDetail.feedback.deleteReviewFailedDesc");
      toast({
        title: t("courseDetail.feedback.deleteFailedTitle"),
        description: message,
        variant: "destructive",
      });
    },
  });

  const isCourseLoading = isUuidSlug
    ? courseByIdQuery.isLoading
    : coursesQuery.isLoading;
  const isCourseError = isUuidSlug
    ? courseByIdQuery.isError
    : coursesQuery.isError;
  const isCourseFetched = isUuidSlug
    ? courseByIdQuery.isFetched
    : coursesQuery.isFetched;
  const showCourseLoading =
    isCourseLoading ||
    (Boolean(slugValue) && !isCourseFetched && !isCourseError);
  const isDetailsLoading = Boolean(course?.id && myEnrollmentQuery.isLoading);

  const LoadingScreen = () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {t("courseDetail.feedback.loadingCourse")}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (showCourseLoading) {
    return <LoadingScreen />;
  }

  if (isCourseError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="container flex flex-col items-center gap-4 text-center">
            <p className="text-destructive font-medium">
              {t("courseDetail.feedback.loadCourseFailed")}
            </p>
            <Button variant="outline" asChild>
              <Link to="/courses">
                {t("courseDetail.feedback.browseCourses")}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="container flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">
              {t("courseDetail.feedback.courseNotFound")}
            </p>
            <Button variant="outline" asChild>
              <Link to="/courses">
                {t("courseDetail.feedback.browseCourses")}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isDetailsLoading) {
    return <LoadingScreen />;
  }

  if (
    isLoggedIn &&
    user?.role === "STUDENT" &&
    myEnrollmentQuery.isSuccess &&
    myEnrollmentQuery.data?.id
  ) {
    const resumeLessonId = myEnrollmentQuery.data?.lastAccessedLessonId;
    const redirectTo = resumeLessonId
      ? `/courses/${slugValue}/learn?lesson=${encodeURIComponent(resumeLessonId)}`
      : `/courses/${slugValue}/learn`;
    return <Navigate to={redirectTo} replace />;
  }

  const discount =
    course.discountPrice != null && Number(course.price) > 0
      ? Math.round(
          (1 - Number(course.discountPrice) / Number(course.price)) * 100,
        )
      : 0;

  const firstPreviewLesson = curriculumSections
    .flatMap((section) => section.lessons)
    .find(
      (lesson) =>
        (lesson.type === "VIDEO" || lesson.type === "TEXT") &&
        (isEnrolled || lesson.isFree),
    );

  const allPreviewLessons = curriculumSections
    .flatMap((section) => section.lessons)
    .filter(
      (lesson) =>
        (lesson.type === "VIDEO" || lesson.type === "TEXT") &&
        (isEnrolled || lesson.isFree),
    );
  const selectedPreviewLesson =
    allPreviewLessons.find((lesson) => lesson.id === selectedPreviewLessonId) ||
    allPreviewLessons[0] ||
    null;

  const instructorFullName =
    `${course.instructor?.user?.firstName || ""} ${course.instructor?.user?.lastName || ""}`.trim() ||
    course.instructor?.user?.email?.split("@")[0] ||
    t("courseDetail.instructor.unknown");
  const instructorInitial = instructorFullName[0]?.toUpperCase() || "I";
  const instructorHeadline = course.instructor?.headline || instructorFullName;
  const instructorRating = Number(course.instructor?.averageRating ?? 0);
  const instructorTotalStudents = Number(course.instructor?.totalStudents ?? 0);
  const instructorTotalCourses = Number(course.instructor?.totalCourses ?? 0);
  const instructorAverageEarnings = Number(
    course.instructor?.totalRevenue ?? 0,
  );
  const instructorBiography =
    course.instructor?.biography || t("courseDetail.instructor.bioFallback");
  const canDisplayEnrollCta = !isLoggedIn || isStudentUser;
  const inCart = isInCart(slugValue);
  const resumeLessonId = myEnrollmentQuery.data?.lastAccessedLessonId;
  const learnHref = resumeLessonId
    ? `/courses/${slugValue}/learn?lesson=${encodeURIComponent(resumeLessonId)}`
    : `/courses/${slugValue}/learn`;

  const handleEnroll = () => {
    if (!isLoggedIn) {
      const redirectTo = `${location.pathname}/checkout${location.search}`;
      try {
        localStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo);
      } catch {
        // ignore storage errors
      }
      navigate(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    if (!isStudentUser) {
      toast({
        title: t("courseDetail.feedback.enrollmentNotAllowedTitle"),
        description: t("courseDetail.feedback.enrollmentNotAllowedDesc"),
        variant: "destructive",
      });
      return;
    }

    navigate(`/courses/${slugValue}/checkout${location.search}`);
  };

  const handleAddToCart = () => {
    if (!slugValue) return;
    if (!isLoggedIn) {
      const redirectTo = `${location.pathname}${location.search}`;
      try {
        localStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo);
      } catch {
        // ignore storage errors
      }
      navigate(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    if (inCart) {
      removeFromCart(slugValue);
      toast({
        title: t("courseDetail.feedback.removedFromCartTitle"),
        description: t("courseDetail.feedback.removedFromCartDesc"),
      });
    } else {
      addToCart(slugValue);
      toast({
        title: t("courseDetail.feedback.addedToCartTitle"),
        description: t("courseDetail.feedback.addedToCartDesc"),
      });
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
      toast({
        title: t("courseDetail.feedback.unenrolledTitle"),
        description: t("courseDetail.feedback.unenrolledDesc"),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("courseDetail.feedback.unenrollFailedDesc");
      toast({
        title: t("courseDetail.feedback.unenrollFailedTitle"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const base = window.location.origin + location.pathname;
    const sep = base.includes("?") ? "&" : "?";
    const url = user?.id ? `${base}${sep}ref=${user.id}` : base;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("courseDetail.feedback.linkCopiedTitle"),
        description: t("courseDetail.feedback.linkCopiedDesc"),
      });
    } catch {
      toast({
        title: t("courseDetail.feedback.copyFailedTitle"),
        variant: "destructive",
      });
    }
  };

  const handlePreview = (lessonId: string) => {
    setSelectedPreviewLessonId(lessonId);
    setActiveTab("curriculum");
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      params.set("tab", "curriculum");
      return params;
    });
  };

  const handlePostQuestion = async () => {
    if (!newQuestion.trim() || !user?.id) return;
    const firstLessonId = discussionQuery.data?.courseLessons?.[0]?.id;
    if (!firstLessonId) {
      toast({
        title: t("courseDetail.feedback.noLessonTitle"),
        description: t("courseDetail.feedback.noLessonDesc"),
        variant: "destructive",
      });
      return;
    }

    await postDiscussionMutation.mutateAsync({
      lessonId: firstLessonId,
      userId: user.id,
      content: newQuestion,
    });

    setNewQuestion("");
    toast({
      title: t("courseDetail.feedback.questionPostedTitle"),
      description: t("courseDetail.feedback.questionPostedDesc"),
    });
  };

  const handlePostReply = async (discussionId: string) => {
    if (!replyText.trim() || !user?.id) return;

    await postReplyMutation.mutateAsync({
      discussionId,
      userId: user.id,
      content: replyText,
    });

    setReplyText("");
    setReplyingTo(null);
    toast({ title: t("courseDetail.feedback.replyPostedTitle") });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isContentObscured && (
        <ContentProtectionOverlay isDevtoolsOpen={isDevtoolsOpen} />
      )}
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero text-primary-foreground py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2 text-sm">
                  <Link to="/courses" className="hover:text-accent">
                    {t("courseDetail.feedback.courses")}
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                  <Link
                    to={`/courses?category=${course.category?.slug}`}
                    className="hover:text-accent"
                  >
                    {course.category?.name}
                  </Link>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-bold">
                  {(getLocalizedTitle(course) || course.title) ??
                    t("courseDetail.feedback.course")}
                </h1>

                <p className="text-lg text-primary-foreground/80">
                  {(getLocalizedDescription(course) || course.description) ??
                    ""}
                </p>

                {isEnrolled && (
                  <div className="flex items-center gap-2 bg-success/20 text-success-foreground rounded-lg px-4 py-2 border border-success/30">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium text-sm">
                      {t("courseDetail.feedback.enrolledBadge")}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-warning text-warning" />
                    <span className="font-bold">
                      {Number(course.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-primary-foreground/70">
                      (
                      {t("courseDetail.reviews.reviewsCount", {
                        count: Number(
                          course.totalReviews ?? 0,
                        ).toLocaleString(),
                      })}
                      )
                    </span>
                  </div>
                  <span className="text-primary-foreground/50">•</span>
                  <span>
                    {t("courseDetail.instructor.studentsLabel", {
                      count: Number(
                        course.enrollmentCount ?? 0,
                      ).toLocaleString(),
                    })}
                  </span>
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
                    <span>
                      {formatDuration(Number(course.totalDuration ?? 0))}{" "}
                      {t("courseDetail.feedback.totalLabel")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {t("courseDetail.curriculum.lessonsCount", {
                        count: Number(course.totalLessons ?? 0),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span>{t("courseDetail.feedback.availableLanguages")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>
                      {t("courseDetail.feedback.certificateIncluded")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Card - Desktop */}
              <div className="hidden lg:block">
                <div className="bg-card text-card-foreground rounded-xl shadow-xl overflow-hidden sticky top-24">
                  {/* Preview thumbnail */}
                  <div
                    className={cn(
                      "relative aspect-video",
                      firstPreviewLesson
                        ? "cursor-pointer"
                        : "cursor-not-allowed",
                    )}
                    onClick={() => {
                      if (firstPreviewLesson) {
                        handlePreview(firstPreviewLesson.id);
                      } else {
                        toast({
                          title: t("courseDetail.feedback.unlockLessonsTitle"),
                          description: t(
                            "courseDetail.feedback.noFreePreviewDesc",
                          ),
                        });
                      }
                    }}
                  >
                    <img
                      src={course.thumbnail || ""}
                      alt={
                        getLocalizedTitle(course) ||
                        course.title ||
                        t("courseDetail.feedback.course")
                      }
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group">
                      <div className="h-16 w-16 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-8 w-8 text-accent-foreground" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {t("courseDetail.preview.previewCourse")}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Price */}
                    <div className="flex items-center gap-3">
                      <span className="font-display text-3xl font-bold">
                        {formatPrice(
                          Number(course.discountPrice ?? course.price) || 0,
                          course.currency ?? "ETB",
                        )}
                      </span>
                      {course.discountPrice != null &&
                        Number(course.discountPrice) > 0 && (
                          <>
                            <span className="text-lg text-muted-foreground line-through">
                              {formatPrice(
                                Number(course.price) || 0,
                                course.currency ?? "ETB",
                              )}
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
                        <Button
                          variant="accent"
                          className="w-full"
                          size="lg"
                          asChild
                        >
                          <Link to={learnHref}>
                            <Play className="h-4 w-4 mr-2" />
                            {resumeLessonId
                              ? t("courseDetail.actions.resumeLearning")
                              : t("courseDetail.actions.continueLearning")}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={handleUnenroll}
                          disabled={unenrollMutation.isPending}
                        >
                          {t("courseDetail.actions.unenroll")}
                        </Button>
                      </>
                    ) : (
                      <>
                        {canDisplayEnrollCta && (
                          <Button
                            variant="accent"
                            className="w-full"
                            size="lg"
                            onClick={handleEnroll}
                          >
                            {t("courseDetail.actions.enrollNow")}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleAddToCart}
                        >
                          {inCart
                            ? t("courseDetail.actions.inCart")
                            : t("courseDetail.actions.addToCart")}
                        </Button>
                      </>
                    )}

                    {/* <p className="text-xs text-center text-muted-foreground">
                      30-Day Money-Back Guarantee
                    </p> */}

                    {/* Quick Info */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-semibold">
                        {t("courseDetail.includes.title")}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          {t("courseDetail.includes.onDemandVideo", {
                            duration: formatDuration(
                              Number(course.totalDuration ?? 0),
                            ),
                          })}
                        </li>
                        <li className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {t("courseDetail.includes.downloadableResources")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          {t("courseDetail.includes.offlineAccess")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          {t("courseDetail.includes.certificate")}
                        </li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={!isLoggedIn || wishlistMutation.isPending}
                        onClick={() => wishlistMutation.mutate()}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 mr-2",
                            isWishlisted && "fill-destructive text-destructive",
                          )}
                        />
                        {t("courseDetail.actions.wishlist")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        {t("courseDetail.actions.share")}
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
                {formatPrice(
                  Number(course.discountPrice ?? course.price) || 0,
                  course.currency ?? "ETB",
                )}
              </span>
              {course.discountPrice != null &&
                Number(course.discountPrice) > 0 && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    {formatPrice(
                      Number(course.price) || 0,
                      course.currency ?? "ETB",
                    )}
                  </span>
                )}
            </div>
            {isEnrolled ? (
              <Button variant="accent" className="flex-1" asChild>
                <Link to={learnHref}>
                  <Play className="h-4 w-4 mr-2" />{" "}
                  {resumeLessonId
                    ? t("courseDetail.actions.resumeLearning")
                    : t("courseDetail.actions.continueLearning")}
                </Link>
              </Button>
            ) : canDisplayEnrollCta ? (
              <Button
                variant="accent"
                className="flex-1"
                onClick={handleEnroll}
              >
                {t("courseDetail.actions.enrollNow")}
              </Button>
            ) : (
              <div className="flex-1 text-right text-xs text-muted-foreground">
                {t("courseDetail.onlyStudents")}
              </div>
            )}
          </div>
        </div>

        {/* Course Content */}
        <section className="container py-12">
          <div className="w-full">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                const nextTab = ALLOWED_TABS.includes(value as CourseDetailTab)
                  ? (value as CourseDetailTab)
                  : "overview";
                setActiveTab(nextTab);
                const nextParams = new URLSearchParams(searchParams);
                if (nextTab === "overview") {
                  nextParams.delete("tab");
                } else {
                  nextParams.set("tab", nextTab);
                }
                setSearchParams(nextParams, { replace: true });
              }}
              className="space-y-8"
            >
              <TabsList className="w-full justify-start overflow-x-auto rounded-xl border bg-card p-1">
                <TabsTrigger value="overview">
                  {t("courseDetail.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger value="curriculum">
                  {t("courseDetail.tabs.curriculum")}
                </TabsTrigger>
                <TabsTrigger value="instructor">
                  {t("courseDetail.tabs.instructor")}
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  {t("courseDetail.tabs.reviews")}
                </TabsTrigger>
                <TabsTrigger value="discussion" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {t("courseDetail.tabs.discussion")}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                <div className="bg-card rounded-xl p-6 border">
                  <h2 className="font-display text-xl font-bold mb-4">
                    {t("courseDetail.sections.whatYouWillLearn")}
                  </h2>
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
                  <h2 className="font-display text-xl font-bold mb-4">
                    {t("courseDetail.sections.requirements")}
                  </h2>
                  <ul className="space-y-2">
                    {requirements.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold mb-4">
                    {t("courseDetail.sections.description")}
                  </h2>
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
                    {t("courseDetail.curriculum.summary", {
                      sections: curriculumSections.length,
                      lessons: Number(course.totalLessons ?? 0),
                      duration: formatDuration(
                        Number(course.totalDuration ?? 0),
                      ),
                    })}
                  </span>
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="rounded-xl border bg-card p-4 max-h-[75vh] overflow-auto space-y-4 lg:sticky lg:top-24">
                    {curriculumSections.map((section) => (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="font-semibold text-sm">
                            {section.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("courseDetail.curriculum.lessonsCount", {
                              count: section.lessons.length,
                            })}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {section.lessons.map((lesson) => {
                            const isPreviewable =
                              (isEnrolled || lesson.isFree) &&
                              (lesson.type === "VIDEO" ||
                                lesson.type === "TEXT");
                            const isActive =
                              selectedPreviewLesson?.id === lesson.id;
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  className={cn(
                                    "w-full text-left flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                                    isPreviewable
                                      ? "hover:bg-muted/70"
                                      : "opacity-70 cursor-not-allowed",
                                    isActive && "bg-muted",
                                  )}
                                  onClick={() => {
                                    if (!isPreviewable) return;
                                    handlePreview(lesson.id);
                                  }}
                                  disabled={!isPreviewable}
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    {lesson.type === "VIDEO" && (
                                      <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    {lesson.type === "DOCUMENT" && (
                                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    {lesson.type === "QUIZ" && (
                                      <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="text-sm truncate">
                                      {lesson.title}
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                      {formatLessonTimeFromMinutes(
                                        lesson.duration,
                                      )}
                                    </span>
                                    {!isEnrolled && !lesson.isFree && (
                                      <Lock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    {isPreviewable && (
                                      <PlayCircle className="h-3.5 w-3.5 text-accent" />
                                    )}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border bg-card overflow-hidden min-h-[75vh] flex flex-col">
                    <div className="p-5 border-b">
                      <h3 className="font-semibold">
                        {selectedPreviewLesson
                          ? t("courseDetail.preview.previewTitleWithLesson", {
                              lesson: selectedPreviewLesson.title,
                            })
                          : t("courseDetail.preview.coursePreview")}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isEnrolled
                          ? t("courseDetail.preview.freePreview")
                          : t("courseDetail.preview.enrollForAll")}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "relative flex-1 min-h-0 flex items-center justify-center",
                        selectedPreviewLesson?.type === "TEXT"
                          ? "overflow-auto bg-card"
                          : "bg-black",
                      )}
                    >
                      {selectedPreviewLesson?.type === "TEXT" ? (
                        <div className="w-full p-6">
                          {selectedPreviewLesson.content?.trim() ? (
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: renderLessonTextHtml(
                                  selectedPreviewLesson.content,
                                ),
                              }}
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {t("courseDetail.preview.noTextPreview")}
                            </div>
                          )}
                        </div>
                      ) : selectedPreviewLesson?.videoUrl ? (
                        <div className="w-full h-full aspect-video">
                          <SecureVideoPlayer
                            src={selectedPreviewLesson.videoUrl}
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <img
                            src={course.thumbnail || ""}
                            alt={t("courseDetail.preview.videoPreviewAlt")}
                            className="w-full h-full object-cover opacity-40"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                            <div className="h-20 w-20 rounded-full bg-accent/90 flex items-center justify-center animate-pulse">
                              <Play className="h-10 w-10 text-accent-foreground ml-1" />
                            </div>
                            <p className="text-sm text-white/80">
                              {t("courseDetail.preview.videoUnavailable")}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {!isEnrolled && canDisplayEnrollCta && (
                      <div className="p-5 border-t">
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={handleEnroll}
                        >
                          {t("courseDetail.actions.enrollNow")} —{" "}
                          {formatPrice(
                            Number(course.discountPrice ?? course.price) || 0,
                            course.currency ?? "ETB",
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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
                    <h3 className="font-display text-xl font-bold">
                      {instructorFullName}
                    </h3>
                    <p className="text-muted-foreground">
                      {instructorHeadline}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span>
                          {t("courseDetail.instructor.ratingLabel", {
                            value: instructorRating.toFixed(1),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {t("courseDetail.instructor.studentsLabel", {
                            count: instructorTotalStudents.toLocaleString(),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {t("courseDetail.instructor.coursesLabel", {
                            count: instructorTotalCourses.toLocaleString(),
                          })}
                        </span>
                      </div>
                      {/* <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{formatPrice(instructorAverageEarnings, course.currency ?? 'ETB')} earnings</span>
                      </div> */}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{instructorBiography}</p>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                {isEnrolled && user?.role === "STUDENT" && !myReview && (
                  <div className="bg-card rounded-xl border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {t("courseDetail.reviews.leaveReviewTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("courseDetail.reviews.leaveReviewDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                            reviewRating >= value
                              ? "bg-warning/15 text-warning"
                              : "bg-muted text-muted-foreground",
                          )}
                          aria-label={t("courseDetail.reviews.rateStarsAria", {
                            count: value,
                          })}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              reviewRating >= value && "fill-warning",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder={t("courseDetail.reviews.titleOptional")}
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder={t("courseDetail.reviews.writeReview")}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => reviewMutation.mutate()}
                        disabled={
                          !reviewContent.trim() || reviewMutation.isPending
                        }
                      >
                        {t("courseDetail.reviews.submitReview")}
                      </Button>
                    </div>
                  </div>
                )}

                {isEnrolled && user?.role === "STUDENT" && myReview && (
                  <div className="bg-card rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {t("courseDetail.reviews.yourReview")}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < myReview.rating
                                  ? "fill-warning text-warning"
                                  : "text-muted",
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
                          {t("courseDetail.actions.edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteReviewMutation.mutate()}
                          disabled={deleteReviewMutation.isPending}
                        >
                          {t("courseDetail.actions.delete")}
                        </Button>
                      </div>
                    </div>
                    {myReview.title && (
                      <p className="text-sm font-semibold">{myReview.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {myReview.content}
                    </p>
                  </div>
                )}

                {!isEnrolled && (
                  <div className="bg-muted/50 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {t("courseDetail.reviews.enrollToReview")}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-display text-5xl font-bold text-foreground">
                      {Number(course.averageRating ?? 0).toFixed(1)}
                    </div>
                    <div className="flex gap-1 justify-center my-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.round(Number(course.averageRating ?? 0))
                              ? "fill-warning text-warning"
                              : "text-muted",
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("courseDetail.reviews.reviewsCount", {
                        count: Number(
                          course.totalReviews ?? 0,
                        ).toLocaleString(),
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center font-semibold text-accent">
                          {(review.studentName || "L")[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">
                              {review.studentName ||
                                t("courseDetail.discussion.learner")}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {review.createdAt
                                ? new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()
                                : ""}
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
                                    : "text-muted",
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
                  <h2 className="font-display text-xl font-bold">
                    {t("courseDetail.sections.courseDiscussion")}
                  </h2>
                  <Badge variant="secondary">
                    {t("courseDetail.discussion.threadsCount", {
                      count: discussions.length,
                    })}
                  </Badge>
                </div>

                {/* Post a question */}
                {isEnrolled || user?.role === "INSTRUCTOR" ? (
                  <div className="bg-card rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-medium">
                      {t("courseDetail.discussion.askQuestion")}
                    </p>
                    <Textarea
                      placeholder={t(
                        "courseDetail.discussion.questionPlaceholder",
                      )}
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={handlePostQuestion}
                        disabled={!newQuestion.trim()}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {t("courseDetail.discussion.postQuestion")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-xl border border-dashed p-6 text-center space-y-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {isLoggedIn
                        ? t("courseDetail.discussion.enrollToDiscuss")
                        : t("courseDetail.discussion.loginToDiscuss")}
                    </p>
                    {!isEnrolled && isLoggedIn && user?.role === "STUDENT" && (
                      <Button size="sm" variant="accent" onClick={handleEnroll}>
                        {t("courseDetail.discussion.enrollToDiscussButton")}
                      </Button>
                    )}
                  </div>
                )}

                {/* Discussion threads */}
                <div className="space-y-4">
                  {discussions.map((disc) => (
                    <div
                      key={disc.id}
                      className="bg-card rounded-xl border overflow-hidden"
                    >
                      {/* Question */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                            {disc.userAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm">
                                {disc.userName}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {disc.createdAt}
                              </span>
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
                                  if (
                                    isEnrolled ||
                                    user?.role === "INSTRUCTOR"
                                  ) {
                                    setReplyingTo(
                                      replyingTo === disc.id ? null : disc.id,
                                    );
                                  }
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                {t("courseDetail.discussion.replyCount", {
                                  count: disc.replies.length,
                                })}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {disc.replies.length > 0 && (
                        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                          {disc.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex items-start gap-3 ml-4"
                            >
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                                  reply.isInstructor
                                    ? "bg-accent/20 text-accent ring-2 ring-accent/30"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {reply.userAvatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {reply.userName}
                                  </p>
                                  {reply.isInstructor && (
                                    <Badge
                                      variant="default"
                                      className="text-[10px] h-4 px-1.5 bg-accent text-accent-foreground"
                                    >
                                      {t("courseDetail.instructor.badge")}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {reply.createdAt}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {reply.content}
                                </p>
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
                            placeholder={t(
                              "courseDetail.discussion.replyPlaceholder",
                            )}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handlePostReply(disc.id);
                            }}
                            className="flex-1 h-9 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="accent"
                            className="h-9"
                            onClick={() => handlePostReply(disc.id)}
                            disabled={!replyText.trim()}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9"
                            onClick={() => setReplyingTo(null)}
                          >
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

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("courseDetail.reviews.updateReview")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    reviewRating >= value
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-label={t("courseDetail.reviews.rateStarsAria", {
                    count: value,
                  })}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      reviewRating >= value && "fill-warning",
                    )}
                  />
                </button>
              ))}
            </div>
            <Input
              placeholder={t("courseDetail.reviews.titleOptional")}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
            />
            <Textarea
              placeholder={t("courseDetail.reviews.writeReview")}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                {t("courseDetail.actions.cancel")}
              </Button>
              <Button
                size="sm"
                variant="accent"
                onClick={() => reviewMutation.mutate()}
                disabled={!reviewContent.trim() || reviewMutation.isPending}
              >
                {t("courseDetail.actions.saveChanges")}
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
