/**
 * Core Type Definitions
 * Central source of truth for all application types
 */

/**
 * Status types for copy operations
 */
export type CopyItemStatus = 'pending' | 'processing' | 'success' | 'error';
export type JobStatus = 'processing' | 'complete' | 'error';

/**
 * Google Drive resource types
 */
export type DriveResourceType = 'file' | 'folder';

/**
 * Represents a single item in a copy operation
 */
export interface CopyItem {
  readonly index: number;
  readonly url: string;
  status: CopyItemStatus;
  progress: number;
  message: string;
  result?: CopyItemResult;
  error?: string;
}

/**
 * Result of a successful copy operation
 */
export interface CopyItemResult {
  readonly id: string;
  readonly name: string;
  readonly size?: string;
}

/**
 * Complete job status including all items
 */
export interface CopyJobStatus {
  readonly id: string;
  status: JobStatus;
  readonly totalItems: number;
  completedItems: number;
  readonly items: CopyItem[];
  readonly targetFolderId: string;
  readonly createdAt: string;
}

/**
 * Parsed Google Drive URL information
 */
export interface ParsedDriveUrl {
  readonly id: string;
  readonly type: DriveResourceType;
}

/**
 * Google Drive file metadata
 */
export interface DriveFileMetadata {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly size?: string;
  readonly parents?: string[];
}

/**
 * Configuration for batch copy operations
 */
export interface BatchCopyConfig {
  readonly urls: string[];
  readonly targetFolderId: string;
  readonly concurrency?: number;
  readonly targetFolderName?: string;
}

/**
 * Progress callback for copy operations
 */
export type ProgressCallback = (
  index: number,
  status: CopyItemStatus,
  progress: number,
  message: string
) => void;

/**
 * Result of batch copy operation
 */
export interface BatchCopyResult {
  readonly url: string;
  readonly success: boolean;
  readonly id?: string;
  readonly name?: string;
  readonly error?: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StartCopyResponse {
  readonly jobId: string;
  readonly status: string;
  readonly targetFolderId: string;
}
