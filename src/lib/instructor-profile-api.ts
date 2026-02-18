import { apiFetch } from '@/lib/api';
import { InstructorProfile, User } from '@/types';

type ApiInstructorProfile = {
  id?: string;
  user?: User;
  headline?: string;
  headlineAm?: string;
  headlineOm?: string;
  headlineGz?: string;
  biography?: string;
  biographyAm?: string;
  biographyOm?: string;
  biographyGz?: string;
  expertise?: string;
  socialLinks?: string;
  totalStudents?: number | string;
  totalCourses?: number | string;
  totalRevenue?: number | string;
  averageRating?: number | string;
  isVerified?: boolean;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InstructorApplicationPayload = {
  headline: string;
  biography: string;
  expertise?: string;
  socialLinks?: string;
};

const toNumber = (value: unknown, fallback: number = 0) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toInstructorProfile = (profile: ApiInstructorProfile): InstructorProfile => {
  const expertise = profile.expertise
    ? profile.expertise.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return {
    id: profile.id || '',
    userId: profile.user?.id || '',
    user: profile.user,
    headline: profile.headline || '',
    headlineAm: profile.headlineAm || undefined,
    headlineOm: profile.headlineOm || undefined,
    headlineGz: profile.headlineGz || undefined,
    biography: profile.biography || '',
    biographyAm: profile.biographyAm || undefined,
    biographyOm: profile.biographyOm || undefined,
    biographyGz: profile.biographyGz || undefined,
    expertise,
    socialLinks: profile.socialLinks ? { raw: profile.socialLinks } : undefined,
    totalStudents: toNumber(profile.totalStudents, 0),
    totalCourses: toNumber(profile.totalCourses, 0),
    totalRevenue: toNumber(profile.totalRevenue, 0),
    averageRating: toNumber(profile.averageRating, 0),
    isVerified: Boolean(profile.isVerified),
    verifiedAt: profile.verifiedAt || undefined,
  };
};

export const getMyInstructorProfile = async (): Promise<InstructorProfile | null> => {
  try {
    const data = await apiFetch<ApiInstructorProfile | null>('/api/instructor-profiles/me');
    if (!data) {
      return null;
    }
    return toInstructorProfile(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const applyInstructorProfile = async (payload: InstructorApplicationPayload): Promise<InstructorProfile> => {
  const data = await apiFetch<ApiInstructorProfile>('/api/instructor-profiles/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return toInstructorProfile(data);
};

export const getPendingInstructorProfiles = async (): Promise<InstructorProfile[]> => {
  const data = await apiFetch<ApiInstructorProfile[]>('/api/instructor-profiles/pending');
  return data.map((item) => toInstructorProfile(item));
};

export const verifyInstructorProfile = async (id: string, verified: boolean): Promise<InstructorProfile> => {
  const data = await apiFetch<ApiInstructorProfile>(`/api/instructor-profiles/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ verified }),
  });
  return toInstructorProfile(data);
};
