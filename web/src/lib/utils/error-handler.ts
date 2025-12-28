/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly messages
 */

import { ERROR_MESSAGES } from '@/config/constants';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Extracts a user-friendly error message from various error types
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return ERROR_MESSAGES.NETWORK_ERROR;
}

/**
 * Checks if an error is a network error
 *
 * @param error - The error object
 * @returns True if network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('connection')
    );
  }
  return false;
}

/**
 * Checks if an error is a rate limit error
 *
 * @param error - The error object
 * @returns True if rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes('rate limit') ||
      error.message.toLowerCase().includes('429') ||
      error.message.toLowerCase().includes('too many requests')
    );
  }
  return false;
}

/**
 * Logs error with context for debugging
 *
 * @param error - The error object
 * @param context - Additional context
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[Error]', {
    error: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Creates an API error from response
 *
 * @param response - Fetch response
 * @returns AppError instance
 */
export async function createApiError(response: Response): Promise<AppError> {
  let message: string = ERROR_MESSAGES.NETWORK_ERROR;

  try {
    const data = await response.json();
    message = data.error || data.message || ERROR_MESSAGES.NETWORK_ERROR;
  } catch {
    message = response.statusText || ERROR_MESSAGES.NETWORK_ERROR;
  }

  return new AppError(message, undefined, response.status);
}
