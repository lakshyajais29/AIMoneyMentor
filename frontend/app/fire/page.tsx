"use client";

import { useState } from "react";
import FIREForm from "@/components/FIREForm";
import FIREChart from "@/components/FIREChart";

export default function FIREPage() {
  const [result, setResult] = useState<unknown>(null);

  function handleResult(data: unknown) {
    setResult(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRecalculate() { setResult(null); }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark hero header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #7c2d12 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            Retirement Planning
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            FIRE Path Planner
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Find out exactly when you can retire and how much SIP you need to get there.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {!result ? (
          <FIREForm onResult={handleResult} />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-xl font-bold text-slate-800"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                Your FIRE Plan
              </h2>
              <button
                onClick={handleRecalculate}
                className="text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                ← Recalculate
              </button>
            </div>
            <FIREChart data={result as Parameters<typeof FIREChart>[0]["data"]} />
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-10">
          Assumes 12% annual return. Actual returns vary. For planning purposes only.
        </p>
      </div>
    </div>
  );
}
