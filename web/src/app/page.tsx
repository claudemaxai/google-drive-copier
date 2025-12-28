"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  CloudUpload,
  Link2,
  Folder,
  Loader2,
  AlertCircle,
  ExternalLink,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
} from "lucide-react";

interface CopyItem {
  index: number;
  url: string;
  status: "pending" | "processing" | "success" | "error";
  progress: number;
  message: string;
  result?: {
    id: string;
    name: string;
  };
}

interface CopyJobStatus {
  id: string;
  status: "processing" | "complete" | "error";
  totalItems: number;
  completedItems: number;
  items: CopyItem[];
  targetFolderId: string;
}

type AppState = "idle" | "processing" | "complete";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [urlsText, setUrlsText] = useState("");
  const [folderName, setFolderName] = useState("");
  const [concurrency, setConcurrency] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [jobStatus, setJobStatus] = useState<CopyJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCopy = async () => {
    const urls = urlsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      setError("Please enter at least one Google Drive link");
      return;
    }

    setState("processing");
    setError(null);

    try {
      const response = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          targetFolderName: folderName || undefined,
          concurrency,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start copy");
      }

      const data = await response.json();
      pollStatus(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start copy");
      setState("idle");
    }
  };

  const pollStatus = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/copy/status/${jobId}`);
        if (!res.ok) throw new Error("Failed to get status");

        const data: CopyJobStatus = await res.json();
        setJobStatus(data);

        if (data.status === "complete") {
          setState("complete");
        } else if (data.status === "error") {
          setError("Copy job failed");
          setState("idle");
        } else {
          setTimeout(poll, 500);
        }
      } catch (err) {
        console.error("Poll error:", err);
        setTimeout(poll, 2000);
      }
    };
    poll();
  }, []);

  const reset = () => {
    setState("idle");
    setUrlsText("");
    setFolderName("");
    setJobStatus(null);
    setError(null);
  };

  const successCount = jobStatus?.items.filter((i) => i.status === "success").length || 0;
  const errorCount = jobStatus?.items.filter((i) => i.status === "error").length || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Drive Copier</h1>
                <p className="text-sm text-gray-500">Multi-threaded file copying</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
                Fast
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
                Secure
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <InputForm
              urlsText={urlsText}
              folderName={folderName}
              concurrency={concurrency}
              showSettings={showSettings}
              onUrlsChange={setUrlsText}
              onFolderNameChange={setFolderName}
              onConcurrencyChange={setConcurrency}
              onToggleSettings={() => setShowSettings(!showSettings)}
              onStart={startCopy}
              error={error}
            />
          )}

          {state === "processing" && jobStatus && (
            <ProcessingView jobStatus={jobStatus} />
          )}

          {state === "complete" && jobStatus && (
            <CompleteView
              jobStatus={jobStatus}
              successCount={successCount}
              errorCount={errorCount}
              onReset={reset}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function InputForm({
  urlsText,
  folderName,
  concurrency,
  showSettings,
  onUrlsChange,
  onFolderNameChange,
  onConcurrencyChange,
  onToggleSettings,
  onStart,
  error,
}: {
  urlsText: string;
  folderName: string;
  concurrency: number;
  showSettings: boolean;
  onUrlsChange: (val: string) => void;
  onFolderNameChange: (val: string) => void;
  onConcurrencyChange: (val: number) => void;
  onToggleSettings: () => void;
  onStart: () => void;
  error: string | null;
}) {
  const lineCount = urlsText.split("\n").filter((l) => l.trim()).length;

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero */}
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
          Copy Files in Bulk
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Paste multiple Google Drive links and copy them all at once with multi-threading
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Main Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl space-y-6">
        {/* URLs Input */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Link2 className="w-4 h-4 text-cyan-400" />
            Google Drive Links
          </label>
          <div className="relative">
            <textarea
              value={urlsText}
              onChange={(e) => onUrlsChange(e.target.value)}
              placeholder="Paste your links here, one per line...&#10;&#10;https://drive.google.com/file/d/...&#10;https://drive.google.com/folders/..."
              className="w-full h-56 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none font-mono text-sm"
            />
            {lineCount > 0 && (
              <div className="absolute top-4 right-4 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium">
                {lineCount} {lineCount === 1 ? 'link' : 'links'}
              </div>
            )}
          </div>
        </div>

        {/* Folder Name */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <Folder className="w-4 h-4 text-purple-400" />
            Destination Folder
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => onFolderNameChange(e.target.value)}
            placeholder="Auto-generated if empty"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Settings Toggle */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={onToggleSettings}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            {showSettings ? "Hide" : "Show"} Advanced Settings
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-5 bg-black/30 rounded-2xl border border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Concurrent Threads: <span className="text-cyan-400">{concurrency}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={concurrency}
                    onChange={(e) => onConcurrencyChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-cyan-500 [&::-webkit-slider-thumb]:to-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <button
          onClick={onStart}
          disabled={lineCount === 0}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none"
        >
          <CloudUpload className="w-5 h-5" />
          {lineCount > 0 ? `Copy ${lineCount} Items` : 'Start Copying'}
        </button>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <Zap className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="font-semibold mb-1">Lightning Fast</h3>
          <p className="text-sm text-gray-400">Multi-threaded copying for maximum speed</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <Layers className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="font-semibold mb-1">Bulk Operations</h3>
          <p className="text-sm text-gray-400">Copy multiple files & folders at once</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="font-semibold mb-1">Smart Tracking</h3>
          <p className="text-sm text-gray-400">Real-time progress for every item</p>
        </div>
      </div>
    </motion.div>
  );
}

function ProcessingView({ jobStatus }: { jobStatus: CopyJobStatus }) {
  const progress = Math.round((jobStatus.completedItems / jobStatus.totalItems) * 100);

  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
    >
      <div className="text-center mb-8 space-y-4">
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Processing...</h2>
          <p className="text-gray-400">
            {jobStatus.completedItems} of {jobStatus.totalItems} items
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}%</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {jobStatus.items.map((item) => (
          <CopyItemCard key={item.index} item={item} />
        ))}
      </div>
    </motion.div>
  );
}

function CopyItemCard({ item }: { item: CopyItem }) {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4 text-gray-500" />,
      bg: "bg-white/5",
      border: "border-white/10",
      text: "text-gray-400",
    },
    processing: {
      icon: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-300",
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-300",
    },
    error: {
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-300",
    },
  };

  const config = statusConfig[item.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`${config.bg} border ${config.border} rounded-xl p-4 transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text} truncate`}>
            {item.result?.name || "Processing..."}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{item.message}</p>

          {item.status === "processing" && item.progress > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CompleteView({
  jobStatus,
  successCount,
  errorCount,
  onReset,
}: {
  jobStatus: CopyJobStatus;
  successCount: number;
  errorCount: number;
  onReset: () => void;
}) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
    >
      <div className="text-center mb-8 space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold mb-2">All Done!</h2>
          <p className="text-gray-400">Your files have been copied successfully</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-3xl font-bold text-green-400">{successCount}</div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          {errorCount > 0 && (
            <div>
              <div className="text-3xl font-bold text-red-400">{errorCount}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          )}
          <div>
            <div className="text-3xl font-bold text-gray-400">{jobStatus.totalItems}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <a
          href={`https://drive.google.com/drive/folders/${jobStatus.targetFolderId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
        >
          <div className="flex items-center justify-center gap-2">
            <Folder className="w-5 h-5" />
            Open in Google Drive
            <ExternalLink className="w-4 h-4" />
          </div>
        </a>

        <button
          onClick={onReset}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <Copy className="w-4 h-4" />
          Copy More Files
        </button>
      </div>

      {/* Details */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 py-2">
          View all items ({jobStatus.items.length})
        </summary>
        <div className="space-y-2 mt-3 max-h-[300px] overflow-y-auto">
          {jobStatus.items.map((item) => (
            <CopyItemCard key={item.index} item={item} />
          ))}
        </div>
      </details>
    </motion.div>
  );
}
