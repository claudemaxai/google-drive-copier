/**
 * URL Parser Utility
 * Handles parsing and validation of Google Drive URLs
 */

import { ParsedDriveUrl } from '@/types';
import { URL_PATTERNS, ERROR_MESSAGES } from '@/config/constants';

/**
 * Parses a Google Drive URL and extracts the file/folder ID and type
 *
 * @param url - The Google Drive URL to parse
 * @returns Parsed URL information or null if invalid
 *
 * @example
 * ```ts
 * const result = parseGoogleDriveUrl('https://drive.google.com/file/d/ABC123/view');
 * // Returns: { id: 'ABC123', type: 'file' }
 * ```
 */
export function parseGoogleDriveUrl(url: string): ParsedDriveUrl | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Try each pattern in order
  const patterns = [
    { regex: URL_PATTERNS.DRIVE_FILE, type: 'file' as const },
    { regex: URL_PATTERNS.DRIVE_FILE_OPEN, type: 'file' as const },
    { regex: URL_PATTERNS.DRIVE_FILE_UC, type: 'file' as const },
    { regex: URL_PATTERNS.DRIVE_FOLDER, type: 'folder' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = trimmedUrl.match(regex);
    if (match && match[1]) {
      return { id: match[1], type };
    }
  }

  // Check if it's a direct ID
  if (URL_PATTERNS.DRIVE_ID_ONLY.test(trimmedUrl)) {
    return { id: trimmedUrl, type: 'file' };
  }

  return null;
}

/**
 * Validates a Google Drive URL
 *
 * @param url - The URL to validate
 * @returns True if valid, false otherwise
 */
export function isValidDriveUrl(url: string): boolean {
  return parseGoogleDriveUrl(url) !== null;
}

/**
 * Extracts all valid URLs from a multiline string
 *
 * @param text - Multiline text containing URLs
 * @returns Array of valid URLs
 */
export function extractValidUrls(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && isValidDriveUrl(line));
}

/**
 * Validates and parses multiple URLs
 *
 * @param urls - Array of URLs to parse
 * @returns Object with valid and invalid URLs
 */
export function validateUrls(urls: string[]): {
  valid: ParsedDriveUrl[];
  invalid: string[];
} {
  const valid: ParsedDriveUrl[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    const parsed = parseGoogleDriveUrl(url);
    if (parsed) {
      valid.push(parsed);
    } else {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}
