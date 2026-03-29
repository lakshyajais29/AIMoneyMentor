"use client";

import { useState } from "react";

interface Scores {
  emergency: number;
  insurance: number;
  diversity: number;
  debt: number;
  tax: number;
  retirement: number;
}

interface HealthScoreFormProps {
  onResult: (scores: Scores) => void;
}

const SLIDERS = [
  {
    key: "emergency" as keyof Scores,
    label: "Emergency Fund",
    icon: "🛡️",
    question: "Do you have 6 months of expenses saved in a liquid account?",
    low: "No savings",
    high: "6+ months saved",
    accent: "#6366f1",
  },
  {
    key: "insurance" as keyof Scores,
    label: "Insurance Coverage",
    icon: "🏥",
    question: "Do you have adequate health and life insurance coverage?",
    low: "No insurance",
    high: "Fully covered",
    accent: "#ec4899",
  },
  {
    key: "diversity" as keyof Scores,
    label: "Investment Diversity",
    icon: "📊",
    question: "Are you investing across equity, debt, and gold?",
    low: "Only FD/savings",
    high: "Equity + debt + gold",
    accent: "#8b5cf6",
  },
  {
    key: "debt" as keyof Scores,
    label: "Debt Health",
    icon: "💳",
    question: "Is your total EMI less than 40% of your monthly income?",
    low: "EMI > 50% income",
    high: "Zero / very low debt",
    accent: "#f59e0b",
  },
  {
    key: "tax" as keyof Scores,
    label: "Tax Efficiency",
    icon: "🧾",
    question: "Are you using all available tax deductions (80C, 80D, NPS)?",
    low: "No deductions claimed",
    high: "All limits fully used",
    accent: "#10b981",
  },
  {
    key: "retirement" as keyof Scores,
    label: "Retirement Readiness",
    icon: "🎯",
    question: "Are you on track for your retirement corpus goal?",
    low: "No plan / no investments",
    high: "On track or ahead",
    accent: "#3b82f6",
  },
];

function getScoreColor(value: number): string {
  if (value >= 70) return "#22c55e";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

function getScoreLabel(value: number): string {
  if (value >= 70) return "Good";
  if (value >= 40) return "Fair";
  return "Needs Work";
}

export default function HealthScoreForm({ onResult }: HealthScoreFormProps) {
  const [scores, setScores] = useState<Scores>({
    emergency: 50,
    insurance: 50,
    diversity: 50,
    debt: 50,
    tax: 50,
    retirement: 50,
  });

  function setScore(key: keyof Scores, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      {SLIDERS.map((slider) => {
        const value = scores[slider.key];
        const scoreColor = getScoreColor(value);
        const scoreLabel = getScoreLabel(value);

        return (
          <div
            key={slider.key}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            style={{ borderLeftWidth: "4px", borderLeftColor: slider.accent }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{slider.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800 leading-snug">{slider.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{slider.question}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right min-w-[52px]">
                <div className="text-xl font-bold leading-none" style={{ color: scoreColor }}>
                  {value}
                </div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: scoreColor }}>
                  {scoreLabel}
                </div>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setScore(slider.key, parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                accentColor: scoreColor,
                background: `linear-gradient(to right, ${scoreColor} ${value}%, #e2e8f0 ${value}%)`,
              }}
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>{slider.low}</span>
              <span>{slider.high}</span>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => onResult(scores)}
        className="w-full py-4 rounded-2xl font-display font-bold text-white text-base tracking-wide transition-all hover:opacity-90 active:scale-[0.98] mt-2"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e40af 100%)",
          boxShadow: "0 4px 20px rgba(30, 64, 175, 0.25)",
        }}
      >
        Calculate My Health Score →
      </button>
    </div>
  );
}
