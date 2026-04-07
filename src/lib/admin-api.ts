import { apiFetch, apiFetchBlob } from '@/lib/api';
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

export interface CertificateTemplate {
  id: string;
  name?: string;
  description?: string;
  templateHtml?: string;
  templateCss?: string;
  backgroundUrl?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RbacRole {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RbacPermission {
  id: string;
  name?: string;
  displayName?: string;
  module?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RbacRolePermission {
  id: string;
  role?: { id?: string };
  permission?: { id?: string };
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

export const getCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  const data = await apiFetch<CertificateTemplate[]>('/api/certificate-templates');
  return Array.isArray(data) ? data : [];
};

export const getRoles = async (): Promise<RbacRole[]> => {
  const data = await apiFetch<RbacRole[]>('/api/roles');
  return Array.isArray(data) ? data : [];
};

export const createRole = async (payload: Partial<RbacRole>): Promise<RbacRole> => {
  return apiFetch<RbacRole>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateRole = async (id: string, payload: Partial<RbacRole>): Promise<RbacRole> => {
  return apiFetch<RbacRole>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteRole = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/roles/${id}`, { method: 'DELETE' });
};

export const getPermissions = async (): Promise<RbacPermission[]> => {
  const data = await apiFetch<RbacPermission[]>('/api/permissions');
  return Array.isArray(data) ? data : [];
};

export const createPermission = async (payload: Partial<RbacPermission>): Promise<RbacPermission> => {
  return apiFetch<RbacPermission>('/api/permissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updatePermission = async (id: string, payload: Partial<RbacPermission>): Promise<RbacPermission> => {
  return apiFetch<RbacPermission>(`/api/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deletePermission = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/permissions/${id}`, { method: 'DELETE' });
};

export const getRolePermissions = async (): Promise<RbacRolePermission[]> => {
  const data = await apiFetch<RbacRolePermission[]>('/api/role-permissions');
  return Array.isArray(data) ? data : [];
};

export const createRolePermission = async (payload: { roleId: string; permissionId: string }): Promise<RbacRolePermission> => {
  return apiFetch<RbacRolePermission>('/api/role-permissions', {
    method: 'POST',
    body: JSON.stringify({
      role: { id: payload.roleId },
      permission: { id: payload.permissionId },
    }),
  });
};

export const deleteRolePermission = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/role-permissions/${id}`, { method: 'DELETE' });
};

export const createCertificateTemplate = async (payload: Partial<CertificateTemplate>): Promise<CertificateTemplate> => {
  return apiFetch<CertificateTemplate>('/api/certificate-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateCertificateTemplate = async (id: string, payload: Partial<CertificateTemplate>): Promise<CertificateTemplate> => {
  return apiFetch<CertificateTemplate>(`/api/certificate-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteCertificateTemplate = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/certificate-templates/${id}`, { method: 'DELETE' });
};

export interface AdminPayment {
  id: string;
  transactionId?: string;
  student?: { id?: string; firstName?: string; lastName?: string; email?: string };
  course?: { id?: string; title?: string };
  order?: { id?: string };
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

export interface PaymentAccount {
  id: string;
  providerName: string;
  type: string;
  accountName?: string;
  accountNumber?: string;
  ussdCode?: string;
  instructions?: string;
  isActive?: boolean;
}

export const getPaymentAccounts = async (): Promise<PaymentAccount[]> => {
  const data = await apiFetch<PaymentAccount[]>('/api/payment-accounts');
  return Array.isArray(data) ? data : [];
};

export const createPaymentAccount = async (payload: Partial<PaymentAccount>): Promise<PaymentAccount> => {
  return apiFetch<PaymentAccount>('/api/payment-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updatePaymentAccount = async (id: string, payload: Partial<PaymentAccount>): Promise<PaymentAccount> => {
  return apiFetch<PaymentAccount>(`/api/payment-accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deletePaymentAccount = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/payment-accounts/${id}`, { method: 'DELETE' });
};

export interface PaymentProof {
  id: string;
  status?: string;
  currency?: string;
  amount?: number;
  receiptUrl?: string;
  originalFileName?: string;
  note?: string;
  createdAt?: string;
  student?: { id?: string; firstName?: string; lastName?: string; email?: string };
  order?: { id?: string; items?: { course?: { id?: string; title?: string } }[] };
  course?: { id?: string; title?: string };
  paymentAccount?: { id?: string };
}

export const getPendingPaymentProofs = async (): Promise<PaymentProof[]> => {
  const data = await apiFetch<PaymentProof[]>('/api/payment-proofs/pending');
  return Array.isArray(data) ? data : [];
};

export const approvePaymentProof = async (proofId: string): Promise<PaymentProof> => {
  return apiFetch<PaymentProof>(`/api/payment-proofs/${proofId}/approve`, { method: 'POST' });
};

export const rejectPaymentProof = async (proofId: string, reason?: string): Promise<PaymentProof> => {
  return apiFetch<PaymentProof>(`/api/payment-proofs/${proofId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

/** Fetch receipt image as blob (for preview with auth). */
export const getPaymentProofReceiptBlob = async (proofId: string): Promise<Blob> => {
  return apiFetchBlob(`/api/payment-proofs/${proofId}/receipt`);
};

/** Admin: feature/unfeature a course for the homepage. */
export const setCourseFeatured = async (courseId: string, isFeatured: boolean) => {
  return apiFetch(`/api/courses/${courseId}/featured`, {
    method: 'PATCH',
    body: JSON.stringify({ isFeatured }),
  });
};

export type AdminPayoutRequest = {
  id: string;
  amount: number;
  status?: string;
  payoutDetailsJson?: string;
  instructorProfileId?: string;
  instructorName?: string;
  instructorEmail?: string;
  methodName?: string;
  methodType?: string;
  hasReceipt?: boolean;
  createdAt?: string;
};

export type AdminReferralWithdrawalRequest = {
  id: string;
  amount: number;
  status?: string;
  payoutDetailsJson?: string;
  receiptUrl?: string;
  receiptOriginalFileName?: string;
  receiptIssueMessage?: string;
  methodOption?: { id?: string; name?: string; type?: string; fieldsJson?: string };
  student?: { id?: string; firstName?: string; lastName?: string; email?: string };
  createdAt?: string;
};

export const getPendingReferralWithdrawals = async (): Promise<AdminReferralWithdrawalRequest[]> => {
  const data = await apiFetch<
    Array<{
      id?: string;
      amount?: number | string;
      status?: string;
      payoutDetailsJson?: string;
      receiptUrl?: string;
      receiptOriginalFileName?: string;
      receiptIssueMessage?: string;
      methodOption?: { id?: string; name?: string; type?: string; fieldsJson?: string };
      student?: { id?: string; firstName?: string; lastName?: string; email?: string };
      createdAt?: string;
    }>
  >('/api/referral-balance/admin/pending-withdrawals');
  return (Array.isArray(data) ? data : []).map((r) => ({
    id: r.id ?? '',
    amount: Number(r.amount ?? 0),
    status: r.status,
    payoutDetailsJson: r.payoutDetailsJson,
    receiptUrl: r.receiptUrl ?? undefined,
    receiptOriginalFileName: r.receiptOriginalFileName ?? undefined,
    receiptIssueMessage: r.receiptIssueMessage ?? undefined,
    methodOption: r.methodOption,
    student: r.student,
    createdAt: r.createdAt,
  }));
};

export const approveReferralWithdrawal = async (payload: { requestId: string; file?: File | null }): Promise<void> => {
  const form = new FormData();
  if (payload.file) form.append('file', payload.file);
  await apiFetch<void>(`/api/referral-balance/admin/withdrawals/${payload.requestId}/approve`, { method: 'POST', body: form });
};

export const rejectReferralWithdrawal = async (payload: { requestId: string; reason?: string }): Promise<void> => {
  await apiFetch<void>(`/api/referral-balance/admin/withdrawals/${payload.requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: payload.reason }),
  });
};

export const getPendingInstructorPayoutRequests = async (): Promise<AdminPayoutRequest[]> => {
  const data = await apiFetch<Array<{
    id?: string;
    amount?: number;
    status?: string;
    payoutDetailsJson?: string;
    instructorProfile?: { id?: string; user?: { firstName?: string; lastName?: string; email?: string } };
    methodOption?: { name?: string; type?: string };
    receiptUrl?: string;
    createdAt?: string;
  }>>('/api/instructor-payouts/pending');
  return (Array.isArray(data) ? data : []).map((r) => ({
    id: r.id ?? '',
    amount: Number(r.amount ?? 0),
    status: r.status,
    payoutDetailsJson: r.payoutDetailsJson ?? undefined,
    instructorProfileId: r.instructorProfile?.id ?? undefined,
    instructorName: [r.instructorProfile?.user?.firstName, r.instructorProfile?.user?.lastName].filter(Boolean).join(' ') || undefined,
    instructorEmail: r.instructorProfile?.user?.email ?? undefined,
    methodName: r.methodOption?.name ?? undefined,
    methodType: r.methodOption?.type ?? undefined,
    hasReceipt: Boolean(r.receiptUrl),
    createdAt: r.createdAt ?? undefined,
  }));
};

export const approveInstructorPayoutRequest = async (payload: { requestId: string; file: File }): Promise<void> => {
  const form = new FormData();
  form.append('file', payload.file);
  await apiFetch<void>(`/api/instructor-payouts/approve/${payload.requestId}`, { method: 'POST', body: form });
};

export const rejectInstructorPayoutRequest = async (payload: { requestId: string; reason?: string }): Promise<void> => {
  await apiFetch<void>(`/api/instructor-payouts/reject/${payload.requestId}`, {
    method: 'POST',
    body: JSON.stringify({ reason: payload.reason }),
  });
};

export type PayoutMethodOption = {
  id: string;
  name: string;
  type: string;
  fieldsJson?: string;
  isActive?: boolean;
};

export const getPayoutMethodOptions = async (): Promise<PayoutMethodOption[]> => {
  const data = await apiFetch<PayoutMethodOption[]>('/api/payout-method-options');
  return Array.isArray(data) ? data : [];
};

export const createPayoutMethodOption = async (payload: Partial<PayoutMethodOption>): Promise<PayoutMethodOption> => {
  return apiFetch<PayoutMethodOption>('/api/payout-method-options', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updatePayoutMethodOption = async (id: string, payload: Partial<PayoutMethodOption>): Promise<PayoutMethodOption> => {
  return apiFetch<PayoutMethodOption>(`/api/payout-method-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deletePayoutMethodOption = async (id: string): Promise<void> => {
  await apiFetch<void>(`/api/payout-method-options/${id}`, { method: 'DELETE' });
};

export type SystemSetting = {
  id?: string;
  key?: string;
  value?: string;
  description?: string;
  isPublic?: boolean;
  updatedBy?: string;
};

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
  const data = await apiFetch<SystemSetting[]>('/api/system-settings');
  return Array.isArray(data) ? data : [];
};

export const createSystemSetting = async (payload: Partial<SystemSetting>): Promise<SystemSetting> => {
  return apiFetch<SystemSetting>('/api/system-settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateSystemSetting = async (id: string, payload: Partial<SystemSetting>): Promise<SystemSetting> => {
  return apiFetch<SystemSetting>(`/api/system-settings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};
