import { apiFetch } from '@/lib/api';
import { User } from '@/types';

export interface AdminUser extends User {
  bio?: string;
  timezone?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
}

export interface AdminEnrollment {
  id: string;
  student?: { id?: string };
  course?: { id?: string };
}

export interface CourseApprovalInstructor {
  firstName?: string;
  lastName?: string;
  user?: User;
}

export interface UserRef {
  id: string;
}

export interface CourseApprovalCourse {
  id?: string;
  title?: string;
  category?: { name?: string };
  instructor?: CourseApprovalInstructor;
}

export interface CourseApproval {
  id: string;
  course?: CourseApprovalCourse;
  reviewer?: User | UserRef;
  status?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  admin?: User;
  action?: string;
  targetType?: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getUsers = async (): Promise<AdminUser[]> => {
  return apiFetch<AdminUser[]>('/api/users');
};

export const updateUser = async (id: string, payload: AdminUser): Promise<AdminUser> => {
  return apiFetch<AdminUser>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const getEnrollments = async (): Promise<AdminEnrollment[]> => {
  return apiFetch<AdminEnrollment[]>('/api/enrollments');
};

export const getCourseApprovals = async (): Promise<CourseApproval[]> => {
  return apiFetch<CourseApproval[]>('/api/course-approvals');
};

export const updateCourseApproval = async (id: string, payload: CourseApproval): Promise<CourseApproval> => {
  return apiFetch<CourseApproval>(`/api/course-approvals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return apiFetch<AuditLog[]>('/api/audit-logs');
};

export interface EmailLog {
  id: string;
  recipient?: { id?: string; email?: string };
  email?: string;
  subject?: string;
  type?: string;
  status?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getEmailLogs = async (): Promise<EmailLog[]> => {
  return apiFetch<EmailLog[]>('/api/email-logs');
};

export interface AdminPayment {
  id: string;
  transactionId?: string;
  student?: { id?: string };
  course?: { id?: string; title?: string };
  amount?: number;
  currency?: string;
  gateway?: string;
  status?: string;
  platformShare?: number;
  instructorShare?: number;
  paidAt?: string;
  createdAt?: string;
}

export const getPayments = async (): Promise<AdminPayment[]> => {
  const data = await apiFetch<AdminPayment[]>('/api/payments');
  return Array.isArray(data) ? data : [];
};
