import { apiFetch } from './api';

/**
 * Fetches a LiveKit access token from the backend for a specific course session.
 * The backend checks if the user is authorized (instructor or enrolled student).
 *
 * @param courseId The UUID of the course
 * @returns The LiveKit token string
 */
export const getLiveKitToken = async (courseId: string): Promise<string> => {
  const response = await apiFetch<{ token: string }>(`/api/livekit/token?courseId=${courseId}`);
  return response.token;
};
