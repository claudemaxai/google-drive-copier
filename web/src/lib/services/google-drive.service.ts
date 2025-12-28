/**
 * Google Drive Service
 * Handles all interactions with Google Drive API
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import type {
  DriveFileMetadata,
  ParsedDriveUrl,
  ProgressCallback,
} from '@/types';
import { GOOGLE_DRIVE_CONFIG, MIME_TYPES } from '@/config/constants';
import { AppError, logError } from '@/lib/utils';

/**
 * Google Drive Service Class
 * Singleton pattern for managing Google Drive API interactions
 */
class GoogleDriveService {
  private static instance: GoogleDriveService | null = null;
  private driveInstance: ReturnType<typeof google.drive> | null = null;

  private readonly ROOT_DIR: string;
  private readonly CREDENTIALS_PATH: string;
  private readonly TOKEN_PATH: string;

  private constructor() {
    this.ROOT_DIR = path.join(process.cwd(), '..');
    this.CREDENTIALS_PATH = path.join(this.ROOT_DIR, 'credentials.json');
    this.TOKEN_PATH = path.join(this.ROOT_DIR, 'token.json');
  }

  /**
   * Gets singleton instance
   */
  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Initializes Google Drive API client
   */
  public async initialize(): Promise<ReturnType<typeof google.drive>> {
    if (this.driveInstance) {
      return this.driveInstance;
    }

    try {
      if (!fs.existsSync(this.CREDENTIALS_PATH)) {
        throw new AppError(
          'credentials.json not found. Please setup Google OAuth first.',
          'MISSING_CREDENTIALS'
        );
      }

      const credentials = JSON.parse(
        fs.readFileSync(this.CREDENTIALS_PATH, 'utf-8')
      );
      const { client_secret, client_id, redirect_uris } =
        credentials.installed || credentials.web;

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      if (!fs.existsSync(this.TOKEN_PATH)) {
        throw new AppError(
          'token.json not found. Please run auth first: npm run auth',
          'MISSING_TOKEN'
        );
      }

      const token = JSON.parse(fs.readFileSync(this.TOKEN_PATH, 'utf-8'));
      oAuth2Client.setCredentials(token);

      this.driveInstance = google.drive({
        version: GOOGLE_DRIVE_CONFIG.API_VERSION,
        auth: oAuth2Client,
      });

      return this.driveInstance;
    } catch (error) {
      logError(error, { context: 'initialize' });
      throw error instanceof AppError ? error : new AppError('Failed to initialize Google Drive');
    }
  }

  /**
   * Creates a new folder on Google Drive
   */
  public async createFolder(
    name: string,
    parentId?: string
  ): Promise<string> {
    try {
      const drive = await this.initialize();

      const fileMetadata: {
        name: string;
        mimeType: string;
        parents?: string[];
      } = {
        name,
        mimeType: MIME_TYPES.FOLDER,
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      const folderId = response.data.id;
      if (!folderId) {
        throw new AppError('Failed to create folder: No ID returned');
      }

      // Make folder public
      await drive.permissions.create({
        fileId: folderId,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      return folderId;
    } catch (error) {
      logError(error, { context: 'createFolder', name, parentId });
      throw error instanceof AppError
        ? error
        : new AppError('Failed to create folder');
    }
  }

  /**
   * Gets metadata for a file
   */
  public async getFileMetadata(fileId: string): Promise<DriveFileMetadata> {
    try {
      const drive = await this.initialize();
      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, parents',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        size: response.data.size || undefined,
        parents: response.data.parents || undefined,
      };
    } catch (error) {
      logError(error, { context: 'getFileMetadata', fileId });
      throw new AppError('Failed to get file metadata');
    }
  }

  /**
   * Copies a single file
   */
  public async copyFile(
    sourceFileId: string,
    targetFolderId: string,
    newName?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; name: string; size: string }> {
    try {
      const drive = await this.initialize();

      // Get source file metadata
      const sourceFile = await this.getFileMetadata(sourceFileId);
      const fileName = newName || sourceFile.name;

      onProgress?.(10);

      // Copy file
      const response = await drive.files.copy({
        fileId: sourceFileId,
        requestBody: {
          name: fileName,
          parents: [targetFolderId],
        },
        fields: 'id, name, size',
      });

      onProgress?.(90);

      // Make file public
      await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      onProgress?.(100);

      return {
        id: response.data.id!,
        name: response.data.name || fileName,
        size: response.data.size || '0',
      };
    } catch (error) {
      logError(error, {
        context: 'copyFile',
        sourceFileId,
        targetFolderId,
      });
      throw new AppError('Failed to copy file');
    }
  }

  /**
   * Lists files in a folder
   */
  public async listFilesInFolder(
    folderId: string
  ): Promise<DriveFileMetadata[]> {
    try {
      const drive = await this.initialize();
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size)',
        pageSize: 1000,
      });

      const files = response.data.files || [];
      return files.map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size || undefined,
      }));
    } catch (error) {
      logError(error, { context: 'listFilesInFolder', folderId });
      throw new AppError('Failed to list files in folder');
    }
  }

  /**
   * Copies an entire folder recursively
   */
  public async copyFolder(
    sourceFolderId: string,
    targetParentId: string,
    newName?: string,
    onProgress?: (current: number, total: number, fileName: string) => void
  ): Promise<{ id: string; name: string; filesCopied: number }> {
    try {
      const drive = await this.initialize();

      // Get source folder metadata
      const sourceFolder = await this.getFileMetadata(sourceFolderId);
      const folderName = newName || sourceFolder.name;

      // Create new folder
      const newFolderId = await this.createFolder(folderName, targetParentId);

      // Get all files in source folder
      const files = await this.listFilesInFolder(sourceFolderId);
      let filesCopied = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i + 1, files.length, file.name);

        if (file.mimeType === MIME_TYPES.FOLDER) {
          // Recursively copy subfolder
          await this.copyFolder(file.id, newFolderId, file.name);
        } else {
          // Copy file
          await this.copyFile(file.id, newFolderId);
        }
        filesCopied++;
      }

      return { id: newFolderId, name: folderName, filesCopied };
    } catch (error) {
      logError(error, {
        context: 'copyFolder',
        sourceFolderId,
        targetParentId,
      });
      throw new AppError('Failed to copy folder');
    }
  }
}

// Export singleton instance
export const googleDriveService = GoogleDriveService.getInstance();
