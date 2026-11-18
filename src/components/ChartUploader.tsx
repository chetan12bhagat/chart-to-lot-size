"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, X, Loader2, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { AIChartExtraction, ApiResponse } from "@/lib/types";

interface ChartUploaderProps {
  onExtracted: (data: AIChartExtraction) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ChartUploader({ onExtracted, onClear, disabled = false }: ChartUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "ok" | "error" | "info" } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore password from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("chart_app_password");
      if (saved) {
        setPassword(saved);
      }
    } catch {
      // ignore storage access restrictions
    }
  }, []);

  const cleanupPreview = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => cleanupPreview();
  }, [cleanupPreview]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    const validMimes = ["image/png", "image/jpeg", "image/jpg", "image/pjpeg", "image/webp", "image/gif"];
    const isImageMime = selectedFile.type && validMimes.includes(selectedFile.type.toLowerCase());
    const isImageExt = /\.(png|jpe?g|webp|gif)$/i.test(selectedFile.name || "");

    if (!isImageMime && !isImageExt) {
      setStatus({ message: "Please choose a PNG, JPEG, WebP or GIF image.", type: "error" });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setStatus({ message: "Image is too large (max 5 MB).", type: "error" });
      return;
    }

    cleanupPreview();
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    setStatus({ message: "Chart loaded. Click “Read chart with Claude”.", type: "info" });
  }, [cleanupPreview]);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      let pastedFile: File | null = null;
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type && item.type.includes("image")) {
            pastedFile = item.getAsFile();
            if (pastedFile) break;
          }
        }
      }

      if (!pastedFile && clipboardData.files && clipboardData.files.length) {
        pastedFile = clipboardData.files[0];
      }

      if (pastedFile) {
        e.preventDefault();
        handleFileSelect(pastedFile);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileSelect]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleReset = () => {
    cleanupPreview();
    setFile(null);
    setPreviewUrl(null);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  };

  const handleReadChart = async () => {
    if (!file) return;

    if (password) {
      try {
        sessionStorage.setItem("chart_app_password", password);
      } catch {
        // ignore
      }
    }

    setIsLoading(true);
    setStatus({ message: "Reading chart with Claude Vision…", type: "info" });

    const form = new FormData();
    form.append("image", file);

    const headers: Record<string, string> = {};
    if (password) {
      headers["X-App-Password"] = password;
    }

    try {
      const res = await fetch("/api/read-chart", {
        method: "POST",
        headers,
        body: form,
      });

      let data: ApiResponse | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.status === 401) {
        setShowPassword(true);
        setStatus({
          message: "This server requires an app password. Enter it below and click read again, or type prices manually.",
          type: "error",
        });
        return;
      }

      if (res.status === 429) {
        setStatus({
          message: "Rate limit reached. Please wait a bit before analyzing another chart, or enter prices manually.",
          type: "error",
        });
        return;
      }

      if (!res.ok) {
        const errorMsg = data && "error" in data ? data.error : "Server error processing chart.";
        setStatus({
          message: `${errorMsg} You can enter prices manually.`,
          type: "error",
        });
        return;
      }

      if (data && "instrument" in data) {
        onExtracted(data);
        const dir = data.direction ? ` (${data.direction.toUpperCase()})` : "";
        setStatus({
          message: `Levels extracted successfully${dir}! Check prices below.`,
          type: "ok",
        });
      }
    } catch {
      setStatus({
        message: "Network error. Please check your internet connection, or enter prices manually.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="chart-section" aria-labelledby="chart-section-title" className="space-y-4">
      <h2 id="chart-section-title" className="sr-only">
        Chart Screenshot Upload
      </h2>

      {/* Drag & Drop Area */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Upload chart image: Click to choose an image, drag and drop, or press Ctrl+V to paste"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center p-6 text-center rounded-xl border-2 border-dashed transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10"
            : "border-slate-300 dark:border-slate-700 hover:border-emerald-500/70 bg-white/50 dark:bg-slate-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="chart-file-input"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 mb-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Tap to choose a chart, drag & drop, or paste screenshot
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          PNG, JPEG, WebP or GIF (up to 5 MB) • Paste with <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-800 rounded">⌘+V</kbd>
        </p>
      </div>

      {/* Image Preview */}
      {previewUrl && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2">
          <div className="flex items-center justify-between pb-2 px-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              {file?.name || "Pasted screenshot"}
            </span>
            <span>{file ? `${(file.size / 1024).toFixed(0)} KB` : ""}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Chart preview"
            className="w-full max-h-72 object-contain rounded-lg bg-black"
          />
        </div>
      )}

      {/* Password Wrap if Required */}
      {showPassword && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
          <label htmlFor="app-password-input" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" />
            Server App Password
          </label>
          <input
            type="password"
            id="app-password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleReadChart();
              }
            }}
            placeholder="Enter app password"
            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          disabled={!file || isLoading || disabled}
          onClick={handleReadChart}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading chart with Claude…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Read chart with Claude
            </>
          )}
        </button>

        {file && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Status Feedback */}
      {status && (
        <div
          role="status"
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            status.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
              : status.type === "ok"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
              : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50"
          }`}
        >
          {status.type === "error" ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </section>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
