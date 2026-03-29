"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import axios from "axios";

interface FileUploadProps {
  endpoint: string;
  buttonText?: string;
  onResult: (data: unknown) => void;
  onError: (msg: string) => void;
}

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 .001 11.095H6.75z" />
    </svg>
  );
}

export default function FileUpload({
  endpoint,
  buttonText = "Upload & Analyse",
  onResult,
  onError,
}: FileUploadProps) {
  const [file, setFile]       = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string | null {
    if (!f.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are accepted.";
    if (f.size > MAX_BYTES) return `File is too large. Maximum size is ${MAX_MB} MB.`;
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) { onError(err); return; }
    setFile(f);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }

  async function handleSubmit() {
    if (!file) { onError("Please select a PDF file first."); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.error) onError(res.data.error);
      else onResult(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.response?.data?.error || err.message
        : "Upload failed. Please try again.";
      onError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : file
            ? "border-green-400 bg-green-50/50"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              dragging ? "bg-blue-100 text-blue-500" : file ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            {file ? (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            ) : (
              <UploadIcon className="w-7 h-7" />
            )}
          </div>

          {file ? (
            <div>
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700">
                {dragging ? "Drop your PDF here" : "Drag & drop your PDF here"}
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                or click to browse · PDF only · max {MAX_MB} MB
              </p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm tracking-wide"
        style={
          !file || loading
            ? { background: "#cbd5e1", cursor: "not-allowed" }
            : {
                background: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
                boxShadow: "0 4px 16px rgba(30, 64, 175, 0.25)",
              }
        }
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analysing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
