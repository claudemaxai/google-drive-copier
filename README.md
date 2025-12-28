# Google Drive Copier

A multi-threaded tool to copy files and folders from Google Drive, bypassing the 24-hour download quota limit.

## Features

- Copy files and folders from Google Drive
- Bypass 24-hour download quota limit
- Multi-threaded copying (1-10 concurrent operations)
- Copy speed: 4-5 GB/s
- Real-time progress tracking
- Dark theme UI

## Prerequisites

- Node.js 18 or higher
- Google Cloud Project with Drive API enabled
- OAuth 2.0 credentials

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/claudemaxai/google-drive-copier.git
cd google-drive-copier
```

### 2. Install dependencies

```bash
cd web
npm install
```

### 3. Setup Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Drive API**
4. Create **OAuth 2.0 Client ID** credentials (Desktop app type)
5. Download the credentials file

### 4. Configure credentials

Copy your downloaded credentials file to the root directory:

```bash
cp /path/to/your-credentials.json ../credentials.json
```

Or use the example template:

```bash
cp ../credentials.example.json ../credentials.json
# Edit credentials.json with your OAuth client details
```

### 5. Authenticate with Google Drive

From the root directory (not web/):

```bash
cd ..
node auth.js
```

Follow the instructions:
1. Open the URL in your browser
2. Authorize the application
3. Copy the authorization code
4. Paste it into the terminal

This will create a `token.json` file with your access token.

### 6. Run the application

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste Google Drive URLs (one per line):
   ```
   https://drive.google.com/file/d/FILE_ID/view
   https://drive.google.com/drive/folders/FOLDER_ID
   ```

2. (Optional) Set target folder name

3. (Optional) Adjust concurrency (1-10 threads, default: 3)

4. Click "Start Copying"

5. Wait for completion - files will be copied to your Google Drive

## How It Works

Instead of downloading files (which triggers Google's quota limit), this tool uses the Google Drive API to **copy** files directly within Google Drive. This bypasses the download quota entirely.

## Tech Stack

- Next.js 16.1
- TypeScript 5.x
- Google Drive API v3
- Tailwind CSS
- Framer Motion

## License

MIT License

## Disclaimer

This tool is for educational and personal use only. Use responsibly and respect copyright laws.
