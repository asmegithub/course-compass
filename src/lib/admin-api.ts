import { apiFetch } from '@/lib/api';
import { User } from '@/types';

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

export const getUsers = async (): Promise<User[]> => {
  return apiFetch<User[]>('/api/users');
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
