import { apiFetch } from '@/lib/api';
import { Course, CourseCategory, CourseLevel, CourseStatus, InstructorProfile, User } from '@/types';

type ApiInstructorUser = {
  id?: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: User['role'] | null;
  isVerified?: boolean | null;
  isActive?: boolean | null;
  profileImage?: string | null;
  language?: User['language'] | null;
  referralCode?: string | null;
  referredBy?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ApiInstructorProfile = {
  id?: string;
  user?: ApiInstructorUser;
  headline?: string | null;
  headlineAm?: string | null;
  headlineOm?: string | null;
  headlineGz?: string | null;
  biography?: string | null;
  biographyAm?: string | null;
  biographyOm?: string | null;
  biographyGz?: string | null;
  expertise?: string | null;
  socialLinks?: string | null;
  totalStudents?: number | string | null;
  totalCourses?: number | string | null;
  totalRevenue?: number | string | null;
  averageRating?: number | string | null;
  isVerified?: boolean | null;
  verifiedAt?: string | null;
};

type ApiCourse = {
  id?: string;
  instructor?: ApiInstructorProfile;
  instructorId?: string;
  category?: CourseCategory;
  categoryId?: string;
  title?: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  slug?: string;
  description?: string;
  descriptionAm?: string;
  descriptionOm?: string;
  descriptionGz?: string;
  thumbnail?: string;
  previewVideo?: string;
  price?: number | string;
  discountPrice?: number | string;
  currency?: string;
  level?: string;
  status?: string;
  totalDuration?: number | string;
  totalLessons?: number | string;
  enrollmentCount?: number | string;
  averageRating?: number | string;
  totalReviews?: number | string;
  isFeatured?: boolean;
  isPopular?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CoursePayload = {
  instructorId?: string;
  categoryId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  slug: string;
  description: string;
  descriptionAm?: string;
  descriptionOm?: string;
  descriptionGz?: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  currency: string;
  level: string;
  status?: string;
  totalDuration?: number;
  totalLessons?: number;
  enrollmentCount?: number;
  averageRating?: number;
  totalReviews?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
};

type ApiCategory = {
  id?: string;
  name?: string;
  nameAm?: string;
  nameOm?: string;
  nameGz?: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string;
  orderIndex?: number | string;
  isActive?: boolean;
};

type ApiCourseSection = {
  id?: string;
  course?: { id?: string };
  title?: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  description?: string;
  orderIndex?: number | string;
};

type ApiLesson = {
  id?: string;
  section?: { id?: string };
  title?: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type?: string;
  videoUrl?: string;
  duration?: number | string;
  documentUrl?: string;
  documentType?: string;
  content?: string;
  orderIndex?: number | string;
  isFree?: boolean;
  isDownloadable?: boolean;
  isPublished?: boolean;
};

type ApiLessonResource = {
  id?: string;
  lesson?: { id?: string };
  title?: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type?: string;
  url?: string;
  fileSize?: number | string;
  orderIndex?: number | string;
};

type ApiQuiz = {
  id?: string;
  lesson?: { id?: string };
  title?: string;
  titleAm?: string;
  titleOm?: string;
  description?: string;
  quizType?: string;
  passingScore?: number | string;
  maxAttempts?: number | string;
  timeLimit?: number | string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: string;
  isActive?: boolean;
};

type ApiQuestion = {
  id?: string;
  quiz?: { id?: string };
  questionText?: string;
  questionTextAm?: string;
  questionTextOm?: string;
  questionTextGz?: string;
  type?: string;
  explanation?: string;
  explanationAm?: string;
  explanationOm?: string;
  explanationGz?: string;
  points?: number | string;
  orderIndex?: number | string;
  imageUrl?: string;
};

type ApiQuestionOption = {
  id?: string;
  question?: { id?: string };
  optionText?: string;
  optionTextAm?: string;
  optionTextOm?: string;
  optionTextGz?: string;
  isCorrect?: boolean;
  orderIndex?: number | string;
};

type ApiReview = {
  id?: string;
  course?: { id?: string };
  student?: { id?: string; firstName?: string; lastName?: string };
  rating?: number | string;
  title?: string;
  content?: string;
  visible?: boolean;
  helpfulCount?: number | string;
  createdAt?: string;
};

type ApiLessonDiscussion = {
  id?: string;
  lesson?: { id?: string };
  user?: { id?: string; firstName?: string; lastName?: string; role?: string };
  content?: string;
  isPinned?: boolean;
  createdAt?: string;
};

type ApiDiscussionReply = {
  id?: string;
  discussion?: { id?: string };
  user?: { id?: string; firstName?: string; lastName?: string; role?: string };
  content?: string;
  createdAt?: string;
};

type ApiCourseOutcome = {
  id?: string;
  course?: { id?: string };
  text?: string;
  textAm?: string;
  textOm?: string;
  textGz?: string;
  orderIndex?: number | string;
};

type ApiCourseRequirement = {
  id?: string;
  course?: { id?: string };
  text?: string;
  textAm?: string;
  textOm?: string;
  textGz?: string;
  orderIndex?: number | string;
};

export type CategoryPayload = {
  name: string;
  nameAm?: string;
  nameOm?: string;
  nameGz?: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  orderIndex?: number;
  isActive?: boolean;
};

type UploadMediaResponse = {
  url: string;
  fileName: string;
};

const toNumber = (value: unknown, fallback: number = 0) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toUser = (user?: ApiInstructorUser): User | undefined => {
  if (!user) return undefined;

  return {
    id: user.id || '',
    email: user.email || '',
    phone: user.phone || undefined,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role || 'INSTRUCTOR',
    isVerified: Boolean(user.isVerified),
    isActive: user.isActive ?? true,
    profileImage: user.profileImage || undefined,
    language: user.language || 'en',
    referralCode: user.referralCode || undefined,
    referredBy: user.referredBy || undefined,
    lastLoginAt: user.lastLoginAt || undefined,
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
  };
};

const toInstructorProfile = (profile?: ApiInstructorProfile): InstructorProfile | undefined => {
  if (!profile) return undefined;

  const normalizedUser = toUser(profile.user);

  return {
    id: profile.id || normalizedUser?.id || '',
    userId: normalizedUser?.id || '',
    user: normalizedUser,
    headline: profile.headline || '',
    headlineAm: profile.headlineAm || undefined,
    headlineOm: profile.headlineOm || undefined,
    headlineGz: profile.headlineGz || undefined,
    biography: profile.biography || '',
    biographyAm: profile.biographyAm || undefined,
    biographyOm: profile.biographyOm || undefined,
    biographyGz: profile.biographyGz || undefined,
    totalStudents: toNumber(profile.totalStudents, 0),
    totalCourses: toNumber(profile.totalCourses, 0),
    totalRevenue: toNumber(profile.totalRevenue, 0),
    averageRating: toNumber(profile.averageRating, 0),
    isVerified: Boolean(profile.isVerified ?? normalizedUser?.isVerified),
    verifiedAt: profile.verifiedAt || undefined,
  };
};

const toCategory = (category?: ApiCategory): CourseCategory | undefined => {
  if (!category) return undefined;
  return {
    id: category.id || '',
    name: category.name || '',
    nameAm: category.nameAm || undefined,
    nameOm: category.nameOm || undefined,
    nameGz: category.nameGz || undefined,
    slug: category.slug || '',
    description: category.description || undefined,
    icon: category.icon || undefined,
    parentId: category.parentId || undefined,
    orderIndex: toNumber(category.orderIndex, 0),
    isActive: Boolean(category.isActive),
  };
};

const toCourse = (course: ApiCourse): Course => {
  const normalizedCategory = toCategory(course.category);
  const normalizedInstructor = toInstructorProfile(course.instructor);
  const normalizedLevel = (course.level || 'BEGINNER') as CourseLevel;
  const normalizedStatus = (course.status || 'DRAFT') as CourseStatus;

  return {
    id: course.id || '',
    instructorId: course.instructorId || course.instructor?.id || '',
    instructor: normalizedInstructor,
    categoryId: course.categoryId || course.category?.id || '',
    category: normalizedCategory,
    title: course.title || '',
    titleAm: course.titleAm || undefined,
    titleOm: course.titleOm || undefined,
    titleGz: course.titleGz || undefined,
    slug: course.slug || '',
    description: course.description || '',
    descriptionAm: course.descriptionAm || undefined,
    descriptionOm: course.descriptionOm || undefined,
    descriptionGz: course.descriptionGz || undefined,
    thumbnail: course.thumbnail || undefined,
    previewVideo: course.previewVideo || undefined,
    price: toNumber(course.price, 0),
    discountPrice: course.discountPrice != null ? toNumber(course.discountPrice, 0) : undefined,
    currency: course.currency || 'ETB',
    level: normalizedLevel,
    status: normalizedStatus,
    totalDuration: toNumber(course.totalDuration, 0),
    totalLessons: toNumber(course.totalLessons, 0),
    enrollmentCount: toNumber(course.enrollmentCount, 0),
    averageRating: toNumber(course.averageRating, 0),
    totalReviews: toNumber(course.totalReviews, 0),
    isFeatured: Boolean(course.isFeatured),
    isPopular: Boolean(course.isPopular),
    isPublished: normalizedStatus === 'PUBLISHED',
    publishedAt: course.publishedAt || undefined,
    createdAt: course.createdAt || '',
    updatedAt: course.updatedAt || '',
  };
};

export const getCourses = async (): Promise<Course[]> => {
  const data = await apiFetch<ApiCourse[]>('/api/courses');
  return data.map((course) => toCourse(course));
};

export const getApprovedCourses = async (): Promise<Course[]> => {
  const data = await apiFetch<ApiCourse[]>('/api/courses?status=APPROVED');
  return data.map((course) => toCourse(course));
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  const data = await apiFetch<ApiCourse>(`/api/courses/${courseId}`);
  return toCourse(data);
};

export const createCourse = async (payload: CoursePayload): Promise<Course> => {
  const data = await apiFetch<ApiCourse>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return toCourse(data);
};

export const updateCourse = async (courseId: string, payload: CoursePayload): Promise<Course> => {
  const data = await apiFetch<ApiCourse>(`/api/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return toCourse(data);
};

export const getCategories = async (): Promise<CourseCategory[]> => {
  const data = await apiFetch<ApiCategory[]>('/api/course-categories');
  return data.map((category) => toCategory(category)).filter(Boolean) as CourseCategory[];
};

export const createCategory = async (payload: CategoryPayload): Promise<CourseCategory> => {
  const data = await apiFetch<ApiCategory>('/api/course-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return toCategory(data) as CourseCategory;
};

export const updateCategory = async (categoryId: string, payload: CategoryPayload): Promise<CourseCategory> => {
  const data = await apiFetch<ApiCategory>(`/api/course-categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return toCategory(data) as CourseCategory;
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await apiFetch<void>(`/api/course-categories/${categoryId}`, {
    method: 'DELETE',
  });
};

export const uploadCourseMedia = async (file: File): Promise<UploadMediaResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<UploadMediaResponse>('/api/media/upload', {
    method: 'POST',
    body: formData,
  });
};

export type CourseSectionPayload = {
  id: string;
  courseId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  description?: string;
  orderIndex: number;
};

export type CreateCourseSectionPayload = {
  courseId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  description?: string;
  orderIndex: number;
};

export type LessonPayload = {
  id: string;
  sectionId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';
  videoUrl?: string;
  duration: number;
  documentUrl?: string;
  documentType?: string;
  content?: string;
  orderIndex: number;
  isFree: boolean;
  isDownloadable: boolean;
  isPublished: boolean;
};

export type CreateLessonPayload = {
  sectionId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';
  videoUrl?: string;
  duration: number;
  documentUrl?: string;
  documentType?: string;
  content?: string;
  orderIndex: number;
  isFree: boolean;
  isDownloadable: boolean;
  isPublished: boolean;
};

export type LessonResourcePayload = {
  id: string;
  lessonId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type: string;
  url: string;
  fileSize: number;
  orderIndex: number;
};

export type CreateLessonResourcePayload = {
  lessonId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type: string;
  url: string;
  fileSize: number;
  orderIndex: number;
};

export type QuizPayload = {
  id: string;
  lessonId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  description?: string;
  quizType: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: string;
  isActive: boolean;
};

export type QuestionPayload = {
  id: string;
  quizId: string;
  questionText: string;
  questionTextAm?: string;
  questionTextOm?: string;
  questionTextGz?: string;
  type: string;
  explanation?: string;
  explanationAm?: string;
  explanationOm?: string;
  explanationGz?: string;
  points: number;
  orderIndex: number;
  imageUrl?: string;
};

export type QuestionOptionPayload = {
  id: string;
  questionId: string;
  optionText: string;
  optionTextAm?: string;
  optionTextOm?: string;
  optionTextGz?: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type ReviewPayload = {
  id: string;
  courseId: string;
  studentId: string;
  studentName?: string;
  rating: number;
  title?: string;
  content: string;
  visible: boolean;
  helpfulCount: number;
  createdAt?: string;
};

export type LessonDiscussionPayload = {
  id: string;
  lessonId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  content: string;
  createdAt?: string;
};

export type DiscussionReplyPayload = {
  id: string;
  discussionId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  content: string;
  createdAt?: string;
};

export type CourseOutcomePayload = {
  id: string;
  courseId: string;
  text: string;
  textAm?: string;
  textOm?: string;
  textGz?: string;
  orderIndex: number;
};

export type CourseRequirementPayload = {
  id: string;
  courseId: string;
  text: string;
  textAm?: string;
  textOm?: string;
  textGz?: string;
  orderIndex: number;
};

export type CreateCourseOutcomePayload = Omit<CourseOutcomePayload, 'id'>;
export type CreateCourseRequirementPayload = Omit<CourseRequirementPayload, 'id'>;
export type LessonResourceDeletePayload = { id: string };
export type CreateQuizPayload = Omit<QuizPayload, 'id'>;
export type CreateQuestionPayload = Omit<QuestionPayload, 'id'>;
export type CreateQuestionOptionPayload = Omit<QuestionOptionPayload, 'id'>;

type ApiEnrollment = {
  id?: string;
  student?: { id?: string };
  course?: { id?: string };
  payment?: { id?: string };
  progress?: number | string;
  completedLessonsCount?: number | string;
  lastAccessedLessonId?: string;
  isCompleted?: boolean;
  completedAt?: string;
  enrolledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EnrollmentPayload = {
  id: string;
  studentId: string;
  courseId: string;
  paymentId?: string;
  progress: number;
  completedLessonsCount: number;
  lastAccessedLessonId?: string;
  isCompleted: boolean;
  completedAt?: string;
  enrolledAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InstructorEnrollmentSummary = {
  totalEnrollments: number;
  totalStudents: number;
  totalCourses: number;
};

type ApiNotification = {
  id?: string;
  user?: { id?: string };
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  createdAt?: string;
};

type ApiCertificate = {
  id?: string;
  enrollment?: { id?: string };
  student?: { id?: string };
  course?: { id?: string };
  template?: { id?: string };
  certificateNumber?: string;
  certificateUrl?: string;
  verificationCode?: string;
  issuedAt?: string;
  expiresAt?: string;
};

const toEnrollment = (enrollment: ApiEnrollment): EnrollmentPayload => ({
  id: enrollment.id || '',
  studentId: enrollment.student?.id || '',
  courseId: enrollment.course?.id || '',
  paymentId: enrollment.payment?.id || undefined,
  progress: toNumber(enrollment.progress, 0),
  completedLessonsCount: toNumber(enrollment.completedLessonsCount, 0),
  lastAccessedLessonId: enrollment.lastAccessedLessonId || undefined,
  isCompleted: Boolean(enrollment.isCompleted),
  completedAt: enrollment.completedAt || undefined,
  enrolledAt: enrollment.enrolledAt || undefined,
  createdAt: enrollment.createdAt || undefined,
  updatedAt: enrollment.updatedAt || undefined,
});

export const createEnrollment = async (payload: {
  courseId: string;
  paymentId?: string;
  referrerId?: string;
  useBalance?: boolean;
}): Promise<EnrollmentPayload> => {
  const data = await apiFetch<ApiEnrollment>('/api/enrollments', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      ...(payload.paymentId ? { payment: { id: payload.paymentId } } : {}),
      ...(payload.referrerId ? { referrerId: payload.referrerId } : {}),
      ...(payload.useBalance ? { useBalance: true } : {}),
    }),
  });

  return toEnrollment(data);
};

export const getMyCourseEnrollment = async (courseId: string): Promise<EnrollmentPayload | null> => {
  const data = await apiFetch<ApiEnrollment | null>(`/api/enrollments/me?courseId=${encodeURIComponent(courseId)}`);
  if (!data) {
    return null;
  }
  return toEnrollment(data);
};

export const deleteEnrollment = async (enrollmentId: string): Promise<void> => {
  await apiFetch<void>(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' });
};

// Referral balance (share course → friend enrolls → 5% credit; balance can be used for enrollment or withdrawn)
export type ReferralBalancePayload = {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalUsed: number;
};

export const getReferralBalance = async (): Promise<ReferralBalancePayload> => {
  const data = await apiFetch<{
    balance?: number | string;
    totalEarned?: number | string;
    totalWithdrawn?: number | string;
    totalUsed?: number | string;
  }>('/api/referral-balance/me');
  return {
    balance: Number(data.balance ?? 0),
    totalEarned: Number(data.totalEarned ?? 0),
    totalWithdrawn: Number(data.totalWithdrawn ?? 0),
    totalUsed: Number(data.totalUsed ?? 0),
  };
};

export type WithdrawalRequestPayload = {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
};

export const requestWithdrawal = async (amount: number): Promise<WithdrawalRequestPayload> => {
  const data = await apiFetch<{ id?: string; amount?: number; status?: string; createdAt?: string }>(
    '/api/referral-balance/withdraw',
    { method: 'POST', body: JSON.stringify({ amount }) }
  );
  return {
    id: data.id ?? '',
    amount: Number(data.amount ?? 0),
    status: data.status ?? 'PENDING',
    createdAt: data.createdAt,
  };
};

export const getMyWithdrawals = async (): Promise<WithdrawalRequestPayload[]> => {
  const data = await apiFetch<Array<{ id?: string; amount?: number; status?: string; createdAt?: string }>>(
    '/api/referral-balance/withdrawals'
  );
  return (Array.isArray(data) ? data : []).map((w) => ({
    id: w.id ?? '',
    amount: Number(w.amount ?? 0),
    status: w.status ?? 'PENDING',
    createdAt: w.createdAt,
  }));
};

export const getMyInstructorEnrollmentSummary = async (): Promise<InstructorEnrollmentSummary> => {
  const data = await apiFetch<Partial<InstructorEnrollmentSummary>>('/api/enrollments/me/instructor-summary');
  return {
    totalEnrollments: toNumber(data.totalEnrollments, 0),
    totalStudents: toNumber(data.totalStudents, 0),
    totalCourses: toNumber(data.totalCourses, 0),
  };
};

export const getMyEnrollments = async (): Promise<EnrollmentPayload[]> => {
  const data = await apiFetch<ApiEnrollment[]>('/api/enrollments/me');
  return data.map((enrollment) => toEnrollment(enrollment));
};

export type InstructorEnrollmentPayload = EnrollmentPayload & {
  studentName?: string;
  courseTitle?: string;
  studentEmail?: string;
};

export const getMyInstructorEnrollments = async (): Promise<InstructorEnrollmentPayload[]> => {
  const data = await apiFetch<Array<ApiEnrollment & { student?: { id?: string; firstName?: string; lastName?: string; email?: string }; course?: { id?: string; title?: string } }>>('/api/enrollments/me/instructor-enrollments');
  return (Array.isArray(data) ? data : []).map((e) => ({
    ...toEnrollment(e),
    studentName: e.student ? [e.student.firstName, e.student.lastName].filter(Boolean).join(' ') || undefined : undefined,
    studentEmail: e.student?.email,
    courseTitle: e.course?.title,
  }));
};

export type LessonProgressPayload = {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
};

export const getLessonProgresses = async (enrollmentId: string): Promise<LessonProgressPayload[]> => {
  const data = await apiFetch<Array<{ id?: string; enrollment?: { id?: string }; lesson?: { id?: string }; status?: string; completedAt?: string }>>(
    `/api/lesson-progresses?enrollmentId=${encodeURIComponent(enrollmentId)}`
  );
  return data.map((p) => ({
    id: p.id || '',
    enrollmentId: p.enrollment?.id || '',
    lessonId: p.lesson?.id || '',
    status: (p.status || 'NOT_STARTED') as LessonProgressPayload['status'],
    completedAt: p.completedAt,
  }));
};

export const recordLessonProgress = async (
  enrollmentId: string,
  lessonId: string,
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
): Promise<LessonProgressPayload> => {
  const data = await apiFetch<{ id?: string; enrollment?: { id?: string }; lesson?: { id?: string }; status?: string; completedAt?: string }>(
    '/api/lesson-progresses/record',
    {
      method: 'POST',
      body: JSON.stringify({ enrollmentId, lessonId, status }),
    }
  );
  return {
    id: data.id || '',
    enrollmentId: data.enrollment?.id || enrollmentId,
    lessonId: data.lesson?.id || lessonId,
    status: (data.status || status) as LessonProgressPayload['status'],
    completedAt: data.completedAt,
  };
};

export const getVideoProgress = async (
  enrollmentId: string,
  lessonId: string
): Promise<{ lastWatchedPosition?: number; watchedDuration?: number } | null> => {
  try {
    const data = await apiFetch<{ lastWatchedPosition?: number; watchedDuration?: number }>(
      `/api/video-progresses/by-enrollment-lesson?enrollmentId=${encodeURIComponent(enrollmentId)}&lessonId=${encodeURIComponent(lessonId)}`
    );
    return data;
  } catch {
    return null;
  }
};

export const getBookmarks = async (lessonId?: string): Promise<Array<{ id: string; lessonId?: string; timestamp?: number; note?: string; createdAt?: string }>> => {
  const url = lessonId
    ? `/api/bookmarks/me?lessonId=${encodeURIComponent(lessonId)}`
    : '/api/bookmarks/me';
  const data = await apiFetch<Array<{ id?: string; lesson?: { id?: string }; timestamp?: number; note?: string; createdAt?: string }>>(url);
  return (Array.isArray(data) ? data : []).map((b) => ({
    id: b.id ?? '',
    lessonId: b.lesson?.id,
    timestamp: b.timestamp,
    note: b.note,
    createdAt: b.createdAt,
  }));
};

export const createBookmark = async (payload: { courseId: string; lessonId: string; timestamp?: number; note?: string }): Promise<{ id: string }> => {
  const data = await apiFetch<{ id?: string }>('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      lesson: { id: payload.lessonId },
      timestamp: payload.timestamp ?? 0,
      note: payload.note ?? '',
    }),
  });
  return { id: data.id ?? '' };
};

export const deleteBookmark = async (bookmarkId: string): Promise<void> => {
  await apiFetch<void>(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' });
};

export const upsertVideoProgress = async (
  enrollmentId: string,
  lessonId: string,
  lastWatchedPosition: number,
  watchedDuration: number,
  totalDuration: number
): Promise<void> => {
  await apiFetch<void>('/api/video-progresses/upsert', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      lessonId,
      lastWatchedPosition,
      watchedDuration,
      totalDuration,
    }),
  });
};

export type MyPaymentPayload = {
  id: string;
  transactionId?: string;
  courseId?: string;
  courseTitle?: string;
  amount?: number;
  currency?: string;
  gateway?: string;
  status?: string;
  paidAt?: string;
  createdAt?: string;
};

export const getMyPayments = async (): Promise<MyPaymentPayload[]> => {
  const data = await apiFetch<Array<{ id?: string; transactionId?: string; course?: { id?: string; title?: string }; amount?: number; currency?: string; gateway?: string; status?: string; paidAt?: string; createdAt?: string }>>('/api/payments/me');
  return (Array.isArray(data) ? data : []).map((p) => ({
    id: p.id || '',
    transactionId: p.transactionId,
    courseId: p.course?.id,
    courseTitle: p.course?.title,
    amount: p.amount != null ? Number(p.amount) : undefined,
    currency: p.currency,
    gateway: p.gateway,
    status: p.status,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }));
};

/** Get a single payment by ID (e.g. to check status after Chapa redirect). */
export const getPayment = async (paymentId: string): Promise<{ id: string; status?: string; course?: { id?: string } }> => {
  const data = await apiFetch<{ id?: string; status?: string; course?: { id?: string } }>(`/api/payments/${paymentId}`);
  return { id: data.id ?? paymentId, status: data.status, course: data.course };
};

/** Create a payment (e.g. TEST gateway for checkout). Student is set by backend from auth. */
export const createPayment = async (payload: {
  courseId: string;
  amount: number;
  currency: string;
  gateway?: string;
  status?: string;
}): Promise<{ id: string }> => {
  const data = await apiFetch<{ id?: string }>('/api/payments', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      amount: payload.amount,
      currency: payload.currency,
      gateway: payload.gateway ?? 'TEST',
      status: payload.status ?? 'COMPLETED',
    }),
  });
  return { id: data.id ?? '' };
};

/** Instructor: get my earning (balance). */
export const getMyInstructorEarning = async (): Promise<{
  currentBalance?: number;
  totalEarnings?: number;
  totalWithdrawn?: number;
  lastMonthEarning?: number;
} | null> => {
  try {
    const data = await apiFetch<{ currentBalance?: number; totalEarnings?: number; totalWithdrawn?: number; lastMonthEarning?: number }>('/api/instructor-earnings/me');
    return data;
  } catch {
    return null;
  }
};

/** Instructor: get my bank details. */
export const getMyInstructorBankDetails = async (): Promise<Array<{ id: string; bankName?: string; accountName?: string; accountNumber?: string; isPrimary?: boolean }>> => {
  const data = await apiFetch<Array<{ id?: string; bankName?: string; accountName?: string; accountNumber?: string; isPrimary?: boolean }>>('/api/instructor-bank-details/me');
  return (Array.isArray(data) ? data : []).map((b) => ({
    id: b.id ?? '',
    bankName: b.bankName,
    accountName: b.accountName,
    accountNumber: b.accountNumber,
    isPrimary: b.isPrimary,
  }));
};

/** Instructor: get my payout requests. */
export const getMyInstructorPayoutRequests = async (): Promise<Array<{ id: string; amount: number; status: string; createdAt?: string; bankDetail?: { bankName?: string } }>> => {
  const data = await apiFetch<Array<{ id?: string; amount?: number; status?: string; createdAt?: string; bankDetail?: { bankName?: string } }>>('/api/instructor-payouts/me');
  return (Array.isArray(data) ? data : []).map((p) => ({
    id: p.id ?? '',
    amount: Number(p.amount ?? 0),
    status: p.status ?? 'PENDING',
    createdAt: p.createdAt,
    bankDetail: p.bankDetail,
  }));
};

/** Instructor: request payout. */
export const requestInstructorPayout = async (amount: number, bankDetailId?: string): Promise<{ id: string }> => {
  const data = await apiFetch<{ id?: string }>('/api/instructor-payouts/request', {
    method: 'POST',
    body: JSON.stringify({ amount, bankDetailId: bankDetailId ?? null }),
  });
  return { id: data.id ?? '' };
};

/** Initialize Chapa payment; returns checkout URL to redirect the user. */
export const initializeChapaPayment = async (payload: {
  courseId: string;
  slug: string;
  referrerId?: string;
}): Promise<{ checkoutUrl: string; paymentId: string; txRef: string }> => {
  const data = await apiFetch<{ checkoutUrl?: string; paymentId?: string; txRef?: string }>(
    '/api/payments/chapa/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        courseId: payload.courseId,
        slug: payload.slug,
        referrerId: payload.referrerId ?? undefined,
      }),
    }
  );
  return {
    checkoutUrl: data.checkoutUrl ?? '',
    paymentId: data.paymentId ?? '',
    txRef: data.txRef ?? '',
  };
};

export const getNotifications = async () => {
  const data = await apiFetch<ApiNotification[]>('/api/notifications/me');
  return (Array.isArray(data) ? data : []).map((notification) => ({
    id: notification.id || '',
    userId: notification.user?.id || '',
    type: notification.type || 'SYSTEM',
    title: notification.title || '',
    message: notification.message || '',
    isRead: Boolean(notification.isRead),
    relatedId: notification.relatedId || undefined,
    relatedType: notification.relatedType || undefined,
    actionUrl: notification.actionUrl || undefined,
    createdAt: notification.createdAt || undefined,
  }));
};

export const getNotificationUnreadCount = async (): Promise<number> => {
  const n = await apiFetch<number>('/api/notifications/me/unread-count');
  return typeof n === 'number' ? n : 0;
};

export type WishlistItemPayload = { id: string; courseId: string };

export const getMyWishlist = async (): Promise<WishlistItemPayload[]> => {
  const data = await apiFetch<Array<{ id?: string; course?: { id?: string } }>>('/api/wishlists/me');
  return (Array.isArray(data) ? data : []).map((w) => ({
    id: w.id || '',
    courseId: w.course?.id || '',
  }));
};

export const addToWishlist = async (courseId: string): Promise<WishlistItemPayload> => {
  const data = await apiFetch<{ id?: string; course?: { id?: string } }>(
    `/api/wishlists/add?courseId=${encodeURIComponent(courseId)}`,
    { method: 'POST' }
  );
  return { id: data.id || '', courseId: data.course?.id || courseId };
};

export const removeFromWishlist = async (courseId: string): Promise<void> => {
  await apiFetch<void>(`/api/wishlists/remove?courseId=${encodeURIComponent(courseId)}`, { method: 'DELETE' });
};

export const checkInWishlist = async (courseId: string): Promise<boolean> => {
  const result = await apiFetch<boolean>(`/api/wishlists/check?courseId=${encodeURIComponent(courseId)}`);
  return Boolean(result);
};

export const getCertificates = async () => {
  const data = await apiFetch<ApiCertificate[]>('/api/certificates');
  return data.map((certificate) => ({
    id: certificate.id || '',
    enrollmentId: certificate.enrollment?.id || '',
    studentId: certificate.student?.id || '',
    courseId: certificate.course?.id || '',
    templateId: certificate.template?.id || '',
    certificateNumber: certificate.certificateNumber || '',
    certificateUrl: certificate.certificateUrl || '',
    verificationCode: certificate.verificationCode || '',
    issuedAt: certificate.issuedAt || '',
    expiresAt: certificate.expiresAt || undefined,
  }));
};

export const getCourseSections = async (courseId?: string): Promise<CourseSectionPayload[]> => {
  const url = courseId ? `/api/course-sections?courseId=${encodeURIComponent(courseId)}` : '/api/course-sections';
  const data = await apiFetch<ApiCourseSection[]>(url);
  return data.map((section) => ({
    id: section.id || '',
    courseId: section.course?.id || '',
    title: section.title || '',
    titleAm: section.titleAm || undefined,
    titleOm: section.titleOm || undefined,
    titleGz: section.titleGz || undefined,
    description: section.description || undefined,
    orderIndex: toNumber(section.orderIndex, 0),
  }));
};

export const createCourseSection = async (payload: CreateCourseSectionPayload): Promise<CourseSectionPayload> => {
  const data = await apiFetch<ApiCourseSection>('/api/course-sections', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      title: payload.title,
      titleAm: payload.titleAm,
      titleOm: payload.titleOm,
      titleGz: payload.titleGz,
      description: payload.description,
      orderIndex: payload.orderIndex,
    }),
  });

  return {
    id: data.id || '',
    courseId: data.course?.id || '',
    title: data.title || '',
    titleAm: data.titleAm || undefined,
    titleOm: data.titleOm || undefined,
    titleGz: data.titleGz || undefined,
    description: data.description || undefined,
    orderIndex: toNumber(data.orderIndex, 0),
  };
};

export const getLessons = async (courseId?: string): Promise<LessonPayload[]> => {
  const url = courseId ? `/api/lessons?courseId=${encodeURIComponent(courseId)}` : '/api/lessons';
  const data = await apiFetch<ApiLesson[]>(url);
  return data.map((lesson) => ({
    id: lesson.id || '',
    sectionId: lesson.section?.id || '',
    title: lesson.title || '',
    titleAm: lesson.titleAm || undefined,
    titleOm: lesson.titleOm || undefined,
    titleGz: lesson.titleGz || undefined,
    type: (lesson.type || 'VIDEO') as LessonPayload['type'],
    videoUrl: lesson.videoUrl || undefined,
    duration: toNumber(lesson.duration, 0),
    documentUrl: lesson.documentUrl || undefined,
    documentType: lesson.documentType || undefined,
    content: lesson.content || undefined,
    orderIndex: toNumber(lesson.orderIndex, 0),
    isFree: Boolean(lesson.isFree),
    isDownloadable: Boolean(lesson.isDownloadable),
    isPublished: Boolean(lesson.isPublished),
  }));
};

export const getLessonResources = async (): Promise<LessonResourcePayload[]> => {
  const data = await apiFetch<ApiLessonResource[]>('/api/lesson-resources');
  return data.map((resource) => ({
    id: resource.id || '',
    lessonId: resource.lesson?.id || '',
    title: resource.title || '',
    titleAm: resource.titleAm || undefined,
    titleOm: resource.titleOm || undefined,
    titleGz: resource.titleGz || undefined,
    type: resource.type || 'FILE',
    url: resource.url || '',
    fileSize: toNumber(resource.fileSize, 0),
    orderIndex: toNumber(resource.orderIndex, 0),
  }));
};

export const createLesson = async (payload: CreateLessonPayload): Promise<LessonPayload> => {
  const data = await apiFetch<ApiLesson>('/api/lessons', {
    method: 'POST',
    body: JSON.stringify({
      section: { id: payload.sectionId },
      title: payload.title,
      titleAm: payload.titleAm,
      titleOm: payload.titleOm,
      titleGz: payload.titleGz,
      type: payload.type,
      videoUrl: payload.videoUrl,
      duration: payload.duration,
      documentUrl: payload.documentUrl,
      documentType: payload.documentType,
      content: payload.content,
      orderIndex: payload.orderIndex,
      isFree: payload.isFree,
      isDownloadable: payload.isDownloadable,
      isPublished: payload.isPublished,
    }),
  });

  return {
    id: data.id || '',
    sectionId: data.section?.id || '',
    title: data.title || '',
    titleAm: data.titleAm || undefined,
    titleOm: data.titleOm || undefined,
    titleGz: data.titleGz || undefined,
    type: (data.type || 'VIDEO') as LessonPayload['type'],
    videoUrl: data.videoUrl || undefined,
    duration: toNumber(data.duration, 0),
    documentUrl: data.documentUrl || undefined,
    documentType: data.documentType || undefined,
    content: data.content || undefined,
    orderIndex: toNumber(data.orderIndex, 0),
    isFree: Boolean(data.isFree),
    isDownloadable: Boolean(data.isDownloadable),
    isPublished: Boolean(data.isPublished),
  };
};

export const createLessonResource = async (payload: CreateLessonResourcePayload): Promise<LessonResourcePayload> => {
  const data = await apiFetch<ApiLessonResource>('/api/lesson-resources', {
    method: 'POST',
    body: JSON.stringify({
      lesson: { id: payload.lessonId },
      title: payload.title,
      titleAm: payload.titleAm,
      titleOm: payload.titleOm,
      titleGz: payload.titleGz,
      type: payload.type,
      url: payload.url,
      fileSize: payload.fileSize,
      orderIndex: payload.orderIndex,
    }),
  });

  return {
    id: data.id || '',
    lessonId: data.lesson?.id || '',
    title: data.title || '',
    titleAm: data.titleAm || undefined,
    titleOm: data.titleOm || undefined,
    titleGz: data.titleGz || undefined,
    type: data.type || 'FILE',
    url: data.url || '',
    fileSize: toNumber(data.fileSize, 0),
    orderIndex: toNumber(data.orderIndex, 0),
  };
};

export const deleteLessonResource = async (resourceId: string): Promise<void> => {
  await apiFetch<void>(`/api/lesson-resources/${resourceId}`, { method: 'DELETE' });
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  await apiFetch<void>(`/api/lessons/${lessonId}`, { method: 'DELETE' });
};

export const deleteCourseSection = async (sectionId: string): Promise<void> => {
  await apiFetch<void>(`/api/course-sections/${sectionId}`, { method: 'DELETE' });
};

export const getReviews = async (): Promise<ReviewPayload[]> => {
  const data = await apiFetch<ApiReview[]>('/api/reviews');
  return data.map((review) => ({
    id: review.id || '',
    courseId: review.course?.id || '',
    studentId: review.student?.id || '',
    studentName: [review.student?.firstName, review.student?.lastName].filter(Boolean).join(' ') || undefined,
    rating: toNumber(review.rating, 0),
    title: review.title || undefined,
    content: review.content || '',
    visible: Boolean(review.visible),
    helpfulCount: toNumber(review.helpfulCount, 0),
    createdAt: review.createdAt || undefined,
  }));
};

export const createReview = async (payload: { courseId: string; studentId: string; rating: number; title?: string; content: string }) => {
  return apiFetch<ApiReview>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      student: { id: payload.studentId },
      rating: payload.rating,
      title: payload.title,
      content: payload.content,
      visible: true,
      helpfulCount: 0,
    }),
  });
};

export const updateReview = async (reviewId: string, payload: { courseId: string; studentId: string; rating: number; title?: string; content: string }) => {
  return apiFetch<ApiReview>(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: reviewId,
      course: { id: payload.courseId },
      student: { id: payload.studentId },
      rating: payload.rating,
      title: payload.title,
      content: payload.content,
      visible: true,
      helpfulCount: 0,
    }),
  });
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await apiFetch<void>(`/api/reviews/${reviewId}`, { method: 'DELETE' });
};

export const getLessonDiscussions = async (): Promise<LessonDiscussionPayload[]> => {
  const data = await apiFetch<ApiLessonDiscussion[]>('/api/lesson-discussions');
  return data.map((discussion) => ({
    id: discussion.id || '',
    lessonId: discussion.lesson?.id || '',
    userId: discussion.user?.id || '',
    userName: [discussion.user?.firstName, discussion.user?.lastName].filter(Boolean).join(' ') || undefined,
    userRole: discussion.user?.role || undefined,
    content: discussion.content || '',
    createdAt: discussion.createdAt || undefined,
  }));
};

export const createLessonDiscussion = async (payload: { lessonId: string; userId: string; content: string }) => {
  return apiFetch<ApiLessonDiscussion>('/api/lesson-discussions', {
    method: 'POST',
    body: JSON.stringify({
      lesson: { id: payload.lessonId },
      user: { id: payload.userId },
      content: payload.content,
      isPinned: false,
    }),
  });
};

export const getDiscussionReplies = async (): Promise<DiscussionReplyPayload[]> => {
  const data = await apiFetch<ApiDiscussionReply[]>('/api/discussion-replies');
  return data.map((reply) => ({
    id: reply.id || '',
    discussionId: reply.discussion?.id || '',
    userId: reply.user?.id || '',
    userName: [reply.user?.firstName, reply.user?.lastName].filter(Boolean).join(' ') || undefined,
    userRole: reply.user?.role || undefined,
    content: reply.content || '',
    createdAt: reply.createdAt || undefined,
  }));
};

export const createDiscussionReply = async (payload: { discussionId: string; userId: string; content: string }) => {
  return apiFetch<ApiDiscussionReply>('/api/discussion-replies', {
    method: 'POST',
    body: JSON.stringify({
      discussion: { id: payload.discussionId },
      user: { id: payload.userId },
      content: payload.content,
    }),
  });
};

export const deleteLessonDiscussion = async (discussionId: string): Promise<void> => {
  await apiFetch<void>(`/api/lesson-discussions/${discussionId}`, { method: 'DELETE' });
};

export const deleteDiscussionReply = async (replyId: string): Promise<void> => {
  await apiFetch<void>(`/api/discussion-replies/${replyId}`, { method: 'DELETE' });
};

export const getCourseOutcomes = async (): Promise<CourseOutcomePayload[]> => {
  const data = await apiFetch<ApiCourseOutcome[]>('/api/course-outcomes');
  return data.map((outcome) => ({
    id: outcome.id || '',
    courseId: outcome.course?.id || '',
    text: outcome.text || '',
    textAm: outcome.textAm || undefined,
    textOm: outcome.textOm || undefined,
    textGz: outcome.textGz || undefined,
    orderIndex: toNumber(outcome.orderIndex, 0),
  }));
};

export const getCourseRequirements = async (): Promise<CourseRequirementPayload[]> => {
  const data = await apiFetch<ApiCourseRequirement[]>('/api/course-requirements');
  return data.map((requirement) => ({
    id: requirement.id || '',
    courseId: requirement.course?.id || '',
    text: requirement.text || '',
    textAm: requirement.textAm || undefined,
    textOm: requirement.textOm || undefined,
    textGz: requirement.textGz || undefined,
    orderIndex: toNumber(requirement.orderIndex, 0),
  }));
};

export const createCourseOutcome = async (payload: CreateCourseOutcomePayload): Promise<CourseOutcomePayload> => {
  const data = await apiFetch<ApiCourseOutcome>('/api/course-outcomes', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      text: payload.text,
      textAm: payload.textAm,
      textOm: payload.textOm,
      textGz: payload.textGz,
      orderIndex: payload.orderIndex,
    }),
  });

  return {
    id: data.id || '',
    courseId: data.course?.id || '',
    text: data.text || '',
    textAm: data.textAm || undefined,
    textOm: data.textOm || undefined,
    textGz: data.textGz || undefined,
    orderIndex: toNumber(data.orderIndex, 0),
  };
};

export const createCourseRequirement = async (payload: CreateCourseRequirementPayload): Promise<CourseRequirementPayload> => {
  const data = await apiFetch<ApiCourseRequirement>('/api/course-requirements', {
    method: 'POST',
    body: JSON.stringify({
      course: { id: payload.courseId },
      text: payload.text,
      textAm: payload.textAm,
      textOm: payload.textOm,
      textGz: payload.textGz,
      orderIndex: payload.orderIndex,
    }),
  });

  return {
    id: data.id || '',
    courseId: data.course?.id || '',
    text: data.text || '',
    textAm: data.textAm || undefined,
    textOm: data.textOm || undefined,
    textGz: data.textGz || undefined,
    orderIndex: toNumber(data.orderIndex, 0),
  };
};

export const deleteCourseOutcome = async (outcomeId: string): Promise<void> => {
  await apiFetch<void>(`/api/course-outcomes/${outcomeId}`, { method: 'DELETE' });
};

export const deleteCourseRequirement = async (requirementId: string): Promise<void> => {
  await apiFetch<void>(`/api/course-requirements/${requirementId}`, { method: 'DELETE' });
};

export const getQuizzes = async (): Promise<QuizPayload[]> => {
  const data = await apiFetch<ApiQuiz[]>('/api/quizzes');
  return data.map((quiz) => ({
    id: quiz.id || '',
    lessonId: quiz.lesson?.id || '',
    title: quiz.title || '',
    titleAm: quiz.titleAm || undefined,
    titleOm: quiz.titleOm || undefined,
    description: quiz.description || undefined,
    quizType: quiz.quizType || 'MULTIPLE_CHOICE',
    passingScore: toNumber(quiz.passingScore, 0),
    maxAttempts: toNumber(quiz.maxAttempts, 0),
    timeLimit: toNumber(quiz.timeLimit, 0),
    shuffleQuestions: Boolean(quiz.shuffleQuestions),
    shuffleOptions: Boolean(quiz.shuffleOptions),
    showCorrectAnswers: quiz.showCorrectAnswers || 'AFTER_SUBMIT',
    isActive: Boolean(quiz.isActive),
  }));
};

export const getQuestions = async (): Promise<QuestionPayload[]> => {
  const data = await apiFetch<ApiQuestion[]>('/api/questions');
  return data.map((question) => ({
    id: question.id || '',
    quizId: question.quiz?.id || '',
    questionText: question.questionText || '',
    questionTextAm: question.questionTextAm || undefined,
    questionTextOm: question.questionTextOm || undefined,
    questionTextGz: question.questionTextGz || undefined,
    type: question.type || 'MULTIPLE_CHOICE',
    explanation: question.explanation || undefined,
    explanationAm: question.explanationAm || undefined,
    explanationOm: question.explanationOm || undefined,
    explanationGz: question.explanationGz || undefined,
    points: toNumber(question.points, 1),
    orderIndex: toNumber(question.orderIndex, 0),
    imageUrl: question.imageUrl || undefined,
  }));
};

export const getQuestionOptions = async (): Promise<QuestionOptionPayload[]> => {
  const data = await apiFetch<ApiQuestionOption[]>('/api/question-options');
  return data.map((option) => ({
    id: option.id || '',
    questionId: option.question?.id || '',
    optionText: option.optionText || '',
    optionTextAm: option.optionTextAm || undefined,
    optionTextOm: option.optionTextOm || undefined,
    optionTextGz: option.optionTextGz || undefined,
    isCorrect: Boolean(option.isCorrect),
    orderIndex: toNumber(option.orderIndex, 0),
  }));
};

export const createQuiz = async (payload: CreateQuizPayload): Promise<QuizPayload> => {
  const data = await apiFetch<ApiQuiz>('/api/quizzes', {
    method: 'POST',
    body: JSON.stringify({
      lesson: { id: payload.lessonId },
      title: payload.title,
      titleAm: payload.titleAm,
      titleOm: payload.titleOm,
      description: payload.description,
      quizType: payload.quizType,
      passingScore: payload.passingScore,
      maxAttempts: payload.maxAttempts,
      timeLimit: payload.timeLimit,
      shuffleQuestions: payload.shuffleQuestions,
      shuffleOptions: payload.shuffleOptions,
      showCorrectAnswers: payload.showCorrectAnswers,
      isActive: payload.isActive,
    }),
  });

  return {
    id: data.id || '',
    lessonId: data.lesson?.id || '',
    title: data.title || '',
    titleAm: data.titleAm || undefined,
    titleOm: data.titleOm || undefined,
    description: data.description || undefined,
    quizType: data.quizType || 'MULTIPLE_CHOICE',
    passingScore: toNumber(data.passingScore, 0),
    maxAttempts: toNumber(data.maxAttempts, 0),
    timeLimit: toNumber(data.timeLimit, 0),
    shuffleQuestions: Boolean(data.shuffleQuestions),
    shuffleOptions: Boolean(data.shuffleOptions),
    showCorrectAnswers: data.showCorrectAnswers || 'AFTER_SUBMIT',
    isActive: Boolean(data.isActive),
  };
};

export const createQuestion = async (payload: CreateQuestionPayload): Promise<QuestionPayload> => {
  const data = await apiFetch<ApiQuestion>('/api/questions', {
    method: 'POST',
    body: JSON.stringify({
      quiz: { id: payload.quizId },
      questionText: payload.questionText,
      questionTextAm: payload.questionTextAm,
      questionTextOm: payload.questionTextOm,
      questionTextGz: payload.questionTextGz,
      type: payload.type,
      explanation: payload.explanation,
      explanationAm: payload.explanationAm,
      explanationOm: payload.explanationOm,
      explanationGz: payload.explanationGz,
      points: payload.points,
      orderIndex: payload.orderIndex,
      imageUrl: payload.imageUrl,
    }),
  });

  return {
    id: data.id || '',
    quizId: data.quiz?.id || '',
    questionText: data.questionText || '',
    questionTextAm: data.questionTextAm || undefined,
    questionTextOm: data.questionTextOm || undefined,
    questionTextGz: data.questionTextGz || undefined,
    type: data.type || 'MULTIPLE_CHOICE',
    explanation: data.explanation || undefined,
    explanationAm: data.explanationAm || undefined,
    explanationOm: data.explanationOm || undefined,
    explanationGz: data.explanationGz || undefined,
    points: toNumber(data.points, 1),
    orderIndex: toNumber(data.orderIndex, 0),
    imageUrl: data.imageUrl || undefined,
  };
};

export const createQuestionOption = async (payload: CreateQuestionOptionPayload): Promise<QuestionOptionPayload> => {
  const data = await apiFetch<ApiQuestionOption>('/api/question-options', {
    method: 'POST',
    body: JSON.stringify({
      question: { id: payload.questionId },
      optionText: payload.optionText,
      optionTextAm: payload.optionTextAm,
      optionTextOm: payload.optionTextOm,
      optionTextGz: payload.optionTextGz,
      isCorrect: payload.isCorrect,
      orderIndex: payload.orderIndex,
    }),
  });

  return {
    id: data.id || '',
    questionId: data.question?.id || '',
    optionText: data.optionText || '',
    optionTextAm: data.optionTextAm || undefined,
    optionTextOm: data.optionTextOm || undefined,
    optionTextGz: data.optionTextGz || undefined,
    isCorrect: Boolean(data.isCorrect),
    orderIndex: toNumber(data.orderIndex, 0),
  };
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  await apiFetch<void>(`/api/quizzes/${quizId}`, { method: 'DELETE' });
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  await apiFetch<void>(`/api/questions/${questionId}`, { method: 'DELETE' });
};

export const deleteQuestionOption = async (optionId: string): Promise<void> => {
  await apiFetch<void>(`/api/question-options/${optionId}`, { method: 'DELETE' });
};
