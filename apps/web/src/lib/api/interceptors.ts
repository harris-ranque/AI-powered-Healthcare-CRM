'use client';

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from './client';

let interceptorsRegistered = false;

type FailedQueueItem = {
  resolve: (token: string | null) => void;
  reject: (reason: unknown) => void;
};

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const isAuthEndpoint = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }
  return (
    url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')
  );
};

export function setupApiInterceptors(): void {
  if (interceptorsRegistered) {
    return;
  }
  interceptorsRegistered = true;

  api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    async (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;

      if (isAuthEndpoint(originalRequest?.url)) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string | null>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err: unknown) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await api.post<{ access_token: string }>('/auth/refresh');
          const newToken = response.data.access_token;
          useAuthStore.getState().setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
