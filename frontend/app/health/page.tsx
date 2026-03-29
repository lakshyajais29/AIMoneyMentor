"use client";

import { useState } from "react";
import HealthScoreForm from "@/components/HealthScoreForm";
import HealthScoreResult from "@/components/HealthScoreResult";

interface Scores {
  emergency: number;
  insurance: number;
  diversity: number;
  debt: number;
  tax: number;
  retirement: number;
}

export default function HealthPage() {
  const [scores, setScores] = useState<Scores | null>(null);

  function handleResult(data: Scores) {
    setScores(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRetake() {
    setScores(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-widest uppercase">
            Financial Wellness Check
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
            Money Health Score
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            Know your complete financial wellness in 2 minutes. Rate yourself
            honestly across 6 dimensions and get a personalised score out of 100.
          </p>
        </div>

        {/* Form or Results */}
        {!scores ? (
          <HealthScoreForm onResult={handleResult} />
        ) : (
          <HealthScoreResult scores={scores} onRetake={handleRetake} />
        )}

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center mt-10">
          Scores are calculated locally — no data is sent to any server.
        </p>
      </div>
    </div>
  );
}
