// User & Auth Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  language: Language;
  referralCode?: string;
  referredBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'GUEST' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type Language = 'en' | 'am' | 'om' | 'gz';

// Course Types
export interface Course {
  id: string;
  instructorId: string;
  instructor?: InstructorProfile;
  categoryId: string;
  category?: CourseCategory;
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
  level: CourseLevel;
  status: CourseStatus;
  totalDuration: number;
  totalLessons: number;
  enrollmentCount: number;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  isPopular: boolean;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type CourseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

export interface CourseCategory {
  id: string;
  name: string;
  nameAm?: string;
  nameOm?: string;
  nameGz?: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  orderIndex: number;
  isActive: boolean;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  type: LessonType;
  videoUrl?: string;
  duration: number;
  documentUrl?: string;
  documentType?: string;
  content?: string;
  orderIndex: number;
  isFree: boolean;
  isDownloadable: boolean;
  isPublished: boolean;
}

export type LessonType = 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';

// Instructor Types
export interface InstructorProfile {
  id: string;
  userId: string;
  user?: User;
  headline: string;
  headlineAm?: string;
  headlineOm?: string;
  headlineGz?: string;
  biography: string;
  biographyAm?: string;
  biographyOm?: string;
  biographyGz?: string;
  expertise?: string[];
  socialLinks?: Record<string, string>;
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  averageRating: number;
  isVerified: boolean;
  verifiedAt?: string;
}

// Enrollment & Progress Types
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course?: Course;
  paymentId?: string;
  progress: number;
  completedLessonsCount: number;
  lastAccessedLessonId?: string;
  isCompleted: boolean;
  completedAt?: string;
  enrolledAt: string;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  studentId: string;
  status: ProgressStatus;
  completedAt?: string;
}

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Review Types
export interface Review {
  id: string;
  courseId: string;
  studentId: string;
  student?: User;
  rating: number;
  title?: string;
  content: string;
  visible: boolean;
  helpfulCount: number;
  createdAt: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  description?: string;
  quizType: QuizType;
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  isActive: boolean;
  questions: Question[];
}

export type QuizType = 'GRADED' | 'PRACTICE' | 'SURVEY';

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionTextAm?: string;
  questionTextOm?: string;
  questionTextGz?: string;
  type: QuestionType;
  explanation?: string;
  points: number;
  orderIndex: number;
  imageUrl?: string;
  options: QuestionOption[];
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  optionTextAm?: string;
  optionTextOm?: string;
  optionTextGz?: string;
  isCorrect: boolean;
  orderIndex: number;
}

// Payment Types
export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  transactionId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  netAmount: number;
  platformShare: number;
  instructorShare: number;
  discountAmount?: number;
  referralCode?: string;
  referralDiscount?: number;
  paidAt?: string;
  createdAt: string;
}

export type PaymentGateway = 'STRIPE' | 'PAYPAL' | 'TELEBIRR' | 'CHAPA';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAm?: string;
  titleOm?: string;
  titleGz?: string;
  message: string;
  messageAm?: string;
  messageOm?: string;
  messageGz?: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType = 
  | 'ENROLLMENT'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'PAYMENT_RECEIVED'
  | 'COURSE_APPROVED'
  | 'COURSE_REJECTED'
  | 'NEW_REVIEW'
  | 'PAYOUT_PROCESSED'
  | 'SYSTEM';

// Certificate Types
export interface Certificate {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  templateId: string;
  certificateNumber: string;
  certificateUrl: string;
  verificationCode: string;
  issuedAt: string;
  expiresAt?: string;
}
