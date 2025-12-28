/**
 * Copy Service
 * Handles batch copy operations with concurrency control
 */

import type {
  BatchCopyConfig,
  BatchCopyResult,
  ProgressCallback,
} from '@/types';
import { COPY_CONFIG } from '@/config/constants';
import { parseGoogleDriveUrl, AppError, logError } from '@/lib/utils';
import { googleDriveService } from './google-drive.service';

/**
 * Copy Service Class
 * Manages parallel copy operations with concurrency control
 */
class CopyService {
  /**
   * Executes batch copy operation with concurrency control
   */
  public async batchCopy(
    config: BatchCopyConfig,
    onProgress?: ProgressCallback
  ): Promise<BatchCopyResult[]> {
    const {
      urls,
      targetFolderId,
      concurrency = COPY_CONFIG.DEFAULT_CONCURRENCY,
    } = config;

    // Validate concurrency
    const safeConcurrency = Math.max(
      COPY_CONFIG.MIN_CONCURRENCY,
      Math.min(concurrency, COPY_CONFIG.MAX_CONCURRENCY)
    );

    const results: BatchCopyResult[] = new Array(urls.length);

    // Parse all URLs first
    const items = urls.map((url, index) => ({
      url,
      index,
      parsed: parseGoogleDriveUrl(url),
    }));

    // Worker function to process items
    let currentIndex = 0;

    const processItem = async (): Promise<void> => {
      while (currentIndex < items.length) {
        const itemIndex = currentIndex++;
        const item = items[itemIndex];

        try {
          // Validate URL
          if (!item.parsed) {
            throw new AppError('Invalid Google Drive URL');
          }

          onProgress?.(item.index, 'processing', 0, 'Starting...');

          // Copy based on type
          if (item.parsed.type === 'file') {
            const result = await googleDriveService.copyFile(
              item.parsed.id,
              targetFolderId,
              undefined,
              (progress) => {
                onProgress?.(
                  item.index,
                  'processing',
                  progress,
                  'Copying file...'
                );
              }
            );

            results[item.index] = {
              url: item.url,
              success: true,
              id: result.id,
              name: result.name,
            };

            onProgress?.(
              item.index,
              'success',
              100,
              `Copied: ${result.name}`
            );
          } else {
            const result = await googleDriveService.copyFolder(
              item.parsed.id,
              targetFolderId,
              undefined,
              (current, total, fileName) => {
                const progress = Math.floor((current / total) * 100);
                onProgress?.(
                  item.index,
                  'processing',
                  progress,
                  `Copying: ${fileName} (${current}/${total})`
                );
              }
            );

            results[item.index] = {
              url: item.url,
              success: true,
              id: result.id,
              name: result.name,
            };

            onProgress?.(
              item.index,
              'success',
              100,
              `Copied folder: ${result.name} (${result.filesCopied} files)`
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          logError(error, {
            context: 'batchCopy',
            url: item.url,
            index: item.index,
          });

          results[item.index] = {
            url: item.url,
            success: false,
            error: message,
          };

          onProgress?.(item.index, 'error', 0, `Error: ${message}`);
        }
      }
    };

    // Start concurrent workers
    const workers = Array.from(
      { length: Math.min(safeConcurrency, items.length) },
      () => processItem()
    );

    await Promise.all(workers);

    return results;
  }

  /**
   * Validates URLs before starting copy operation
   */
  public validateUrls(urls: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const url of urls) {
      const parsed = parseGoogleDriveUrl(url);
      if (parsed) {
        valid.push(url);
      } else {
        invalid.push(url);
      }
    }

    return { valid, invalid };
  }
}

// Export singleton instance
export const copyService = new CopyService();
