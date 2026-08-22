import axios from 'axios';
import type { AxiosError } from 'axios';

const baseURL: string | undefined = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.warn('VITE_API_URL is not set — every API call will fail. Check frontend/.env');
}

export const AUTH_TOKEN_KEY = 'two_souls_admin_token';
export const AUTH_USER_KEY = 'two_souls_admin_user';

/** Normalised failure shape. Every rejection out of `api` is one of these. */
export class ApiError extends Error {
  status?: number;
  detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export const api = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Attach the admin session token to mutating requests.
 *
 * The backend does not verify this token today (see the note in the repo plan), but sending it
 * costs nothing and means the client is already correct on the day it starts being checked.
 */
api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (method !== 'GET') {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

function messageFrom(error: AxiosError<{ message?: string }>): string {
  const serverMessage = error.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error.response) return 'Could not reach the server. Check your connection and try again.';

  switch (error.response.status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'That resource no longer exists.';
    default:
      return `Request failed (${error.response.status}).`;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return Promise.reject(
        new ApiError(messageFrom(axiosError), axiosError.response?.status, axiosError.response?.data),
      );
    }
    return Promise.reject(new ApiError('Something went wrong.', undefined, error));
  },
);

/** Pull a human-readable message out of anything thrown. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
