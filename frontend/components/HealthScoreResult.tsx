"use client";

interface Scores {
  emergency: number;
  insurance: number;
  diversity: number;
  debt: number;
  tax: number;
  retirement: number;
}

interface HealthScoreResultProps {
  scores: Scores;
  onRetake: () => void;
}

const DIMENSIONS = [
  {
    key: "emergency" as keyof Scores,
    label: "Emergency Fund",
    icon: "🛡️",
    weight: 20,
    color: "#6366f1",
    tips: {
      low: "Start by saving 1 month of expenses in a liquid fund — even ₹5,000 is a start.",
      mid: "Aim for 6 months of expenses. Move to a sweep-in FD for better returns.",
      high: "Excellent! Consider moving half to a liquid mutual fund for higher yield.",
    },
  },
  {
    key: "insurance" as keyof Scores,
    label: "Insurance Coverage",
    icon: "🏥",
    weight: 20,
    color: "#ec4899",
    tips: {
      low: "Buy a ₹1 Cr term plan (costs ~₹800/month) and a ₹10L family mediclaim today.",
      mid: "Top up with a super top-up health plan for catastrophic coverage at low cost.",
      high: "Great coverage! Review sum assured every 5 years as income grows.",
    },
  },
  {
    key: "diversity" as keyof Scores,
    label: "Investment Diversity",
    icon: "📊",
    weight: 15,
    color: "#8b5cf6",
    tips: {
      low: "Start a ₹500/month Nifty 50 index fund SIP — lowest cost, best diversification.",
      mid: "Add Sovereign Gold Bonds (2.5% interest + gold price appreciation).",
      high: "Well diversified! Rebalance annually to maintain target allocation.",
    },
  },
  {
    key: "debt" as keyof Scores,
    label: "Debt Health",
    icon: "💳",
    weight: 20,
    color: "#f59e0b",
    tips: {
      low: "Use the avalanche method — pay highest-interest debt first. Avoid new credit.",
      mid: "Good! Try to reduce EMI below 30% of income. Make part-prepayments on home loan.",
      high: "Debt-free or near it — excellent! Focus on wealth building now.",
    },
  },
  {
    key: "tax" as keyof Scores,
    label: "Tax Efficiency",
    icon: "🧾",
    weight: 10,
    color: "#10b981",
    tips: {
      low: "Use our Tax Wizard to find deductions you're missing. Even ₹1.5L in 80C saves ₹46,800.",
      mid: "Check if you're fully utilising 80CCD(1B) NPS — extra ₹50K deduction.",
      high: "Tax-optimised! Review regime choice every year as income changes.",
    },
  },
  {
    key: "retirement" as keyof Scores,
    label: "Retirement Readiness",
    icon: "🎯",
    weight: 15,
    color: "#3b82f6",
    tips: {
      low: "Use our FIRE Planner to set a retirement target. Start a ₹1,000/month NPS today.",
      mid: "Increase SIP by 10% every April. Step-up SIPs dramatically accelerate FIRE.",
      high: "On track! Begin shifting 20% to debt as you approach retirement.",
    },
  },
];

function computeOverallScore(scores: Scores): number {
  let total = 0;
  let totalWeight = 0;
  for (const dim of DIMENSIONS) {
    total += (scores[dim.key] / 100) * dim.weight;
    totalWeight += dim.weight;
  }
  return Math.round((total / totalWeight) * 100);
}

function gradeInfo(score: number): { grade: string; label: string; color: string } {
  if (score >= 71) return { grade: "A", label: "Excellent", color: "#22c55e" };
  if (score >= 41) return { grade: "B", label: "Getting There", color: "#f59e0b" };
  return { grade: "C", label: "Needs Attention", color: "#ef4444" };
}

function tipTier(value: number): "low" | "mid" | "high" {
  if (value < 40) return "low";
  if (value < 70) return "mid";
  return "high";
}

function ProgressRing({ score, color }: { score: number; color: string }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={180} height={180} className="rotate-[-90deg]">
      <circle cx={90} cy={90} r={radius} strokeWidth={12} stroke="rgba(255,255,255,0.12)" fill="none" />
      <circle
        cx={90} cy={90} r={radius} strokeWidth={12}
        stroke={color} fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease" }}
      />
    </svg>
  );
}

function downloadHealthPDF(
  scores: Scores,
  overall: number,
  grade: string,
  gradeLabel: string
) {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rows = DIMENSIONS.map((dim) => {
    const val = scores[dim.key];
    const tier = tipTier(val);
    const statusColor = val >= 70 ? "#16a34a" : val >= 40 ? "#d97706" : "#dc2626";
    const statusLabel = val >= 70 ? "Good" : val >= 40 ? "Fair" : "Low";
    const barFilled = Math.round(val / 10);
    const bar = "█".repeat(barFilled) + "░".repeat(10 - barFilled);
    return `
      <tr>
        <td><span style="margin-right:6px;">${dim.icon}</span><strong>${dim.label}</strong><br><small style="color:#6b7280;font-weight:400;">${dim.weight}% weight</small></td>
        <td><span style="color:${statusColor};font-weight:700;">${val}/100</span><br><span style="color:${statusColor};font-size:11px;">${statusLabel}</span></td>
        <td style="font-family:monospace;color:${statusColor};letter-spacing:1px;">${bar}</td>
        <td>${dim.tips[tier]}</td>
      </tr>`;
  }).join("");

  const gradeColor = overall >= 71 ? "#16a34a" : overall >= 41 ? "#d97706" : "#dc2626";
  const heroMsg =
    overall >= 71
      ? "Excellent financial discipline! Keep optimising and stay the course."
      : overall >= 41
      ? "You're building good habits. Focus on your weakest areas for a big score boost."
      : "There's room to improve. Start with the priority tips below — small steps compound.";

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Money Health Score — AI Money Mentor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #111827; font-size: 13px; line-height: 1.65; background: #fff; }
    .page { max-width: 740px; margin: 0 auto; padding: 48px 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 18px; border-bottom: 2px solid #0f172a; margin-bottom: 32px; }
    .brand { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .brand span { color: #3b82f6; }
    .meta { font-size: 11px; color: #9ca3af; text-align: right; }
    .hero { display: flex; align-items: center; gap: 28px; border-radius: 16px; padding: 28px 32px; margin-bottom: 36px; }
    .hero-dark { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; }
    .score-ring { width: 110px; height: 110px; border-radius: 50%; border: 8px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .score-num { font-size: 38px; font-weight: 800; color: white; line-height: 1; }
    .score-denom { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .grade-chip { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: rgba(255,255,255,0.15); color: white; padding: 3px 10px; border-radius: 999px; margin-bottom: 8px; }
    .hero-title { font-size: 20px; font-weight: 800; color: white; margin-bottom: 6px; letter-spacing: -0.3px; }
    .hero-desc { font-size: 12px; color: rgba(255,255,255,0.65); max-width: 380px; }
    h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
    th { text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 12px; }
    tr:last-child td { border-bottom: none; }
    td:first-child { min-width: 130px; }
    td:nth-child(2) { white-space: nowrap; min-width: 80px; }
    td:nth-child(3) { white-space: nowrap; font-size: 11px; min-width: 110px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.6; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">AI Money <span>Mentor</span></div>
      <div class="meta">
        Money Health Score Report<br>
        Generated: ${date}
      </div>
    </div>

    <div class="hero hero-dark">
      <div class="score-ring">
        <div class="score-num">${overall}</div>
        <div class="score-denom">/ 100</div>
      </div>
      <div>
        <div class="grade-chip">Grade ${grade} &mdash; ${gradeLabel}</div>
        <div class="hero-title">Your Money Health Score</div>
        <div class="hero-desc">${heroMsg}</div>
      </div>
    </div>

    <h2>Dimension Breakdown &amp; Action Plan</h2>
    <table>
      <thead>
        <tr>
          <th>Dimension</th>
          <th>Score</th>
          <th>Progress</th>
          <th>Your Next Step</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <strong>Disclaimer:</strong> This health score is based on self-reported data and is for educational purposes only. It does not constitute financial advice. Scores are calculated locally — no personal data is stored or transmitted. Please consult a SEBI-registered financial advisor before making investment decisions.
    </div>
  </div>
</body>
</html>`);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 600);
}

export default function HealthScoreResult({ scores, onRetake }: HealthScoreResultProps) {
  const overall = computeOverallScore(scores);
  const { grade, label, color } = gradeInfo(overall);

  const sorted = [...DIMENSIONS].sort((a, b) => scores[a.key] - scores[b.key]);
  const weakTwo = sorted.slice(0, 2);

  return (
    <div className="space-y-5">
      {/* Hero — dark gradient */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}
      >
        <div className="px-8 py-10 flex flex-col md:flex-row items-center gap-8">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing score={overall} color={color} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-white leading-none" style={{ fontFamily: "var(--font-syne, sans-serif)" }}>
                {overall}
              </span>
              <span className="text-xs text-white/40 font-medium mt-1">/ 100</span>
            </div>
          </div>

          {/* Text */}
          <div className="text-center md:text-left">
            <div
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest"
              style={{ background: `${color}25`, color }}
            >
              Grade {grade} — {label}
            </div>
            <h2
              className="text-3xl font-extrabold text-white mb-2 leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              Your Money Health Score
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm">
              {overall >= 71
                ? "Excellent financial discipline! Keep optimising and stay the course."
                : overall >= 41
                ? "You're building good habits. Focus on your two weakest areas for a big score boost."
                : "There's significant room to improve. Start with the two priority tips below — small steps compound."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-5 justify-center md:justify-start">
              <button
                onClick={() => downloadHealthPDF(scores, overall, grade, label)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors"
              >
                ⬇ Download PDF Report
              </button>
              <button
                onClick={onRetake}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/75 border border-white/20 hover:bg-white/10 transition-colors"
              >
                ↩ Retake
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3
          className="font-bold text-slate-800 mb-5 text-base"
          style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
          Dimension Breakdown
        </h3>
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const val = scores[dim.key];
            const barColor = val >= 70 ? "#22c55e" : val >= 40 ? "#f59e0b" : "#ef4444";
            const statusLabel = val >= 70 ? "Good" : val >= 40 ? "Fair" : "Low";
            return (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <span>{dim.icon}</span>
                    {dim.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${barColor}18`, color: barColor }}
                    >
                      {statusLabel}
                    </span>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: barColor }}>
                      {val}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority tips */}
      <div>
        <h3
          className="font-bold text-slate-800 mb-3 text-base"
          style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
          Priority Actions for You
        </h3>
        <div className="space-y-3">
          {weakTwo.map((dim, i) => {
            const tier = tipTier(scores[dim.key]);
            return (
              <div
                key={dim.key}
                className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                style={{ borderLeftWidth: "4px", borderLeftColor: dim.color }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 mt-0.5"
                  style={{ background: dim.color }}
                >
                  #{i + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1 text-sm">
                    {dim.icon} {dim.label}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">{dim.tips[tier]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
