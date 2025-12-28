/**
 * Job Service
 * Manages copy job state and lifecycle
 */

import type { CopyJobStatus, CopyItem } from '@/types';
import { copyService } from './copy.service';
import { googleDriveService } from './google-drive.service';
import { logError } from '@/lib/utils';

// In-memory job storage (consider using Redis for production)
const jobs = new Map<string, CopyJob>();

/**
 * Job Service Class
 * Handles job creation, tracking, and status management
 */
class JobService {
  /**
   * Generates a unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `copy_${timestamp}_${random}`;
  }

  /**
   * Creates a new copy job
   */
  public async createJob(
    urls: string[],
    targetFolderId?: string,
    targetFolderName?: string,
    concurrency: number = 3
  ): Promise<string> {
    const jobId = this.generateJobId();

    // Create or use existing target folder
    let folderId = targetFolderId;
    if (!folderId) {
      const folderName =
        targetFolderName || `Copied_${new Date().toISOString().split('T')[0]}`;
      folderId = await googleDriveService.createFolder(folderName);
    }

    // Initialize job
    const job: CopyJob = {
      id: jobId,
      status: 'processing',
      totalItems: urls.length,
      completedItems: 0,
      items: urls.map((url, index) => ({
        index,
        url,
        status: 'pending',
        progress: 0,
        message: 'Waiting...',
      })),
      targetFolderId: folderId,
      createdAt: new Date().toISOString(),
    };

    jobs.set(jobId, job);

    // Start processing in background
    this.processJob(jobId, urls, folderId, concurrency);

    return jobId;
  }

  /**
   * Gets job status
   */
  public getJob(jobId: string): CopyJobStatus | null {
    const job = jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      status: job.status,
      totalItems: job.totalItems,
      completedItems: job.completedItems,
      items: job.items,
      targetFolderId: job.targetFolderId,
      createdAt: job.createdAt,
    };
  }

  /**
   * Gets all jobs
   */
  public getAllJobs(): CopyJobStatus[] {
    return Array.from(jobs.values())
      .map((job) => this.getJob(job.id)!)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Deletes a job
   */
  public deleteJob(jobId: string): boolean {
    return jobs.delete(jobId);
  }

  /**
   * Processes a copy job
   */
  private async processJob(
    jobId: string,
    urls: string[],
    targetFolderId: string,
    concurrency: number
  ): Promise<void> {
    try {
      await copyService.batchCopy(
        { urls, targetFolderId, concurrency },
        (index, status, progress, message) => {
          this.updateJobItem(jobId, index, {
            status,
            progress,
            message,
          });
        }
      );

      // Mark job as complete
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'complete';
      }
    } catch (error) {
      logError(error, { context: 'processJob', jobId });

      const job = jobs.get(jobId);
      if (job) {
        job.status = 'error';
      }
    }
  }

  /**
   * Updates a specific job item
   */
  private updateJobItem(
    jobId: string,
    itemIndex: number,
    updates: Partial<CopyItem>
  ): void {
    const job = jobs.get(jobId);
    if (!job || !job.items[itemIndex]) return;

    Object.assign(job.items[itemIndex], updates);

    // Update completed count
    if (updates.status === 'success' || updates.status === 'error') {
      job.completedItems = job.items.filter(
        (item) => item.status === 'success' || item.status === 'error'
      ).length;

      // Update job status if all items are done
      if (job.completedItems === job.totalItems) {
        job.status = 'complete';
      }
    }
  }

  /**
   * Clears old completed jobs (for memory management)
   */
  public clearOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [jobId, job] of jobs.entries()) {
      const jobAge = now - new Date(job.createdAt).getTime();
      if (job.status === 'complete' && jobAge > maxAgeMs) {
        jobs.delete(jobId);
        cleared++;
      }
    }

    return cleared;
  }
}

// Type definition for internal job storage
interface CopyJob extends CopyJobStatus {
  // Additional internal fields if needed
}

// Export singleton instance
export const jobService = new JobService();
