"use client";

import { useState } from "react";
import TaxForm from "@/components/TaxForm";
import TaxComparison from "@/components/TaxComparison";

export default function TaxPage() {
  const [result, setResult] = useState<unknown>(null);

  function handleResult(data: unknown) {
    setResult(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRecalculate() { setResult(null); }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dark hero header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #14532d 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            Tax Optimisation · FY 2025-26
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            Tax Wizard
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Stop overpaying taxes. Find every deduction you&apos;re missing and pick the right
            regime for FY 2025-26.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {!result ? (
          <TaxForm onResult={handleResult} />
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2
                className="text-xl font-bold text-slate-800"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                Your Tax Analysis
              </h2>
              <button
                onClick={handleRecalculate}
                className="text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                ← Recalculate
              </button>
            </div>
            <TaxComparison data={result as Parameters<typeof TaxComparison>[0]["data"]} />
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-10">
          FY 2025-26 tax slabs applied. Consult a CA before filing your ITR.
        </p>
      </div>
    </div>
  );
}
