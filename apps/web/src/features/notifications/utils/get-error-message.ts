import { isAxiosError } from 'axios';

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'object' && data !== null && 'message' in data) {
      const message = (data as { message: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join(', ');
      }
    }
  }

  return fallback;
}
