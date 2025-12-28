/**
 * Application Constants
 * Centralized configuration and magic numbers
 */

/**
 * Google Drive API Configuration
 */
export const GOOGLE_DRIVE_CONFIG = {
  SCOPES: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
  ],
  API_VERSION: 'v3',
} as const;

/**
 * Copy Operation Configuration
 */
export const COPY_CONFIG = {
  DEFAULT_CONCURRENCY: 3,
  MIN_CONCURRENCY: 1,
  MAX_CONCURRENCY: 10,
  POLL_INTERVAL_MS: 500,
  POLL_ERROR_RETRY_MS: 2000,
} as const;

/**
 * File Size Limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  WARN_FILE_SIZE: 1 * 1024 * 1024 * 1024, // 1GB
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  COPY: '/api/copy',
  COPY_STATUS: (jobId: string) => `/api/copy/status/${jobId}`,
  GOOGLE_DRIVE_FOLDER: (folderId: string) =>
    `https://drive.google.com/drive/folders/${folderId}`,
} as const;

/**
 * Regular Expressions for URL Parsing
 */
export const URL_PATTERNS = {
  DRIVE_FILE: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  DRIVE_FILE_OPEN: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  DRIVE_FILE_UC: /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  DRIVE_FOLDER: /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
  DRIVE_ID_ONLY: /^[a-zA-Z0-9_-]{25,}$/,
} as const;

/**
 * MIME Types
 */
export const MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
  MAX_ITEMS_DISPLAY: 1000,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  INVALID_URL: 'Invalid Google Drive URL',
  NO_URLS: 'Please enter at least one Google Drive link',
  COPY_FAILED: 'Failed to copy files',
  NETWORK_ERROR: 'Network error occurred',
  UNAUTHORIZED: 'Authentication required',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
} as const;
