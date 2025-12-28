/**
 * Copy Status API Route
 * Handles job status retrieval and deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/services';
import { ERROR_MESSAGES } from '@/config/constants';
import { logError } from '@/lib/utils';

/**
 * GET /api/copy/status/[jobId]
 * Gets the status of a copy job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = jobService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    logError(error, { context: 'GET /api/copy/status/[jobId]' });

    return NextResponse.json(
      { error: ERROR_MESSAGES.NETWORK_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/copy/status/[jobId]
 * Deletes a copy job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const success = jobService.deleteJob(jobId);

    if (!success) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error, { context: 'DELETE /api/copy/status/[jobId]' });

    return NextResponse.json(
      { error: ERROR_MESSAGES.NETWORK_ERROR },
      { status: 500 }
    );
  }
}
