import { apiFetch } from '@/lib/api';
import { Course, CourseCategory, CourseLevel, CourseStatus, InstructorProfile, User } from '@/types';

type ApiCourse = {
  id?: string;
  instructor?: User;
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

const toInstructorProfile = (user?: User): InstructorProfile | undefined => {
  if (!user) return undefined;
  return {
    id: user.id,
    userId: user.id,
    user,
    headline: '',
    biography: '',
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
    isVerified: Boolean(user.isVerified),
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

export const getCourseSections = async (): Promise<CourseSectionPayload[]> => {
  const data = await apiFetch<ApiCourseSection[]>('/api/course-sections');
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

export const getLessons = async (): Promise<LessonPayload[]> => {
  const data = await apiFetch<ApiLesson[]>('/api/lessons');
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
