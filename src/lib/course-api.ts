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
