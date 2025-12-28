/**
 * Copy API Route
 * Handles copy job creation and listing
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/services';
import { getErrorMessage, logError } from '@/lib/utils';
import { COPY_CONFIG, ERROR_MESSAGES } from '@/config/constants';

/**
 * POST /api/copy
 * Creates a new copy job
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      urls,
      targetFolderId,
      targetFolderName,
      concurrency = COPY_CONFIG.DEFAULT_CONCURRENCY,
    } = body;

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_URLS },
        { status: 400 }
      );
    }

    // Validate concurrency
    const safeConcurrency = Math.max(
      COPY_CONFIG.MIN_CONCURRENCY,
      Math.min(concurrency, COPY_CONFIG.MAX_CONCURRENCY)
    );

    // Create job
    const jobId = await jobService.createJob(
      urls,
      targetFolderId,
      targetFolderName,
      safeConcurrency
    );

    const job = jobService.getJob(jobId);
    if (!job) {
      throw new Error('Failed to create job');
    }

    return NextResponse.json({
      jobId,
      status: 'processing',
      targetFolderId: job.targetFolderId,
    });
  } catch (error) {
    logError(error, { context: 'POST /api/copy' });

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/copy
 * Lists all copy jobs
 */
export async function GET() {
  try {
    const jobs = jobService.getAllJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    logError(error, { context: 'GET /api/copy' });

    return NextResponse.json(
      { error: ERROR_MESSAGES.NETWORK_ERROR },
      { status: 500 }
    );
  }
}
