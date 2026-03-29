"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import XRayCharts from "@/components/XRayCharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function XRayPage() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError]   = useState<string>("");

  function handleResult(data: unknown) { setError(""); setResult(data); }
  function handleError(msg: string)    { setResult(null); setError(msg); }
  function handleRetry()               { setResult(null); setError(""); }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark hero header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            Portfolio Analysis
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            MF Portfolio X-Ray
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Upload your CAMS statement and get instant portfolio analysis — XIRR, overlap,
            expense drag, and AI rebalancing advice.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* CAMS instructions */}
        {!result && (
          <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-sm text-blue-800">
            <span className="text-blue-400 flex-shrink-0 mt-0.5">ℹ️</span>
            <div>
              <strong className="font-semibold">How to get your CAMS statement:</strong>{" "}
              Go to{" "}
              <span className="font-mono bg-blue-100 px-1 rounded text-xs">camsonline.com</span>
              {" "}→ Investor Services → Statement of Account → Detailed (All transactions).
              Download the PDF and upload it here.
            </div>
          </div>
        )}

        {/* Upload / Results */}
        {!result ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <FileUpload
              endpoint={`${API_URL}/api/xray`}
              buttonText="Analyse My Portfolio"
              onResult={handleResult}
              onError={handleError}
            />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-xl font-bold text-slate-800"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                Your Analysis Results
              </h2>
              <button
                onClick={handleRetry}
                className="text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                ← Upload Another
              </button>
            </div>
            <XRayCharts data={result as Parameters<typeof XRayCharts>[0]["data"]} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-red-700 font-semibold mb-1">Analysis Failed</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={handleRetry} className="mt-3 text-sm text-red-600 hover:underline font-medium">
              Try Again →
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-10">
          Your PDF is analysed in memory and never stored. For educational purposes only.
        </p>
      </div>
    </div>
  );
}
