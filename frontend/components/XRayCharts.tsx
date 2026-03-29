"use client";

import ResultCard from "./ResultCard";
import { formatINR, formatCrore, formatPercent } from "@/lib/formatters";

interface FundXirr {
  name: string;
  xirr: number;
  current_value: number;
  expense_ratio: number;
}

interface OverlapItem {
  category_label: string;
  funds: string[];
  overlap_level: "high" | "medium";
}

interface XRayData {
  xirr: number;
  fund_xirrs: FundXirr[];
  overlap: OverlapItem[];
  avg_expense_ratio: number;
  fund_count: number;
  total_invested: number;
  total_current_value: number;
  ai_advice: string;
  parse_errors?: string[];
}

interface XRayChartsProps {
  data: XRayData;
}

function xirrHeroBg(xirr: number): string {
  if (xirr >= 12) return "linear-gradient(135deg, #0f172a 0%, #14532d 100%)";
  if (xirr >= 8)  return "linear-gradient(135deg, #0f172a 0%, #78350f 100%)";
  return              "linear-gradient(135deg, #0f172a 0%, #7f1d1d 100%)";
}

function xirrColor(xirr: number): string {
  if (xirr >= 12) return "#4ade80";
  if (xirr >= 8)  return "#fbbf24";
  return "#f87171";
}

function xirrLabel(xirr: number): string {
  if (xirr >= 12) return "Above Benchmark";
  if (xirr >= 8)  return "Near Benchmark";
  return "Below Benchmark";
}

function xirrTextColor(xirr: number): string {
  if (xirr >= 12) return "text-green-500";
  if (xirr >= 8)  return "text-yellow-500";
  return "text-red-400";
}

export default function XRayCharts({ data }: XRayChartsProps) {
  const gain = data.total_current_value - data.total_invested;
  const gainPct = data.total_invested > 0 ? (gain / data.total_invested) * 100 : 0;
  const erBarWidth = Math.min((data.avg_expense_ratio / 2.5) * 100, 100);
  const benchmarkWidth = (1.0 / 2.5) * 100;

  return (
    <div className="space-y-5">

      {/* Parse warnings */}
      {data.parse_errors && data.parse_errors.length > 0 && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <span className="flex-shrink-0">⚠️</span>
          <span>{data.parse_errors[0]}</span>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Invested" value={formatCrore(data.total_invested)} accent="#6366f1" />
        <StatCard label="Current Value" value={formatCrore(data.total_current_value)} accent="#3b82f6" />
        <StatCard
          label="Total Gain / Loss"
          value={formatCrore(Math.abs(gain))}
          sub={`${gain >= 0 ? "+" : "−"}${formatPercent(Math.abs(gainPct))}`}
          accent={gain >= 0 ? "#22c55e" : "#ef4444"}
          valueColor={gain >= 0 ? "text-green-600" : "text-red-600"}
        />
        <StatCard label="No. of Funds" value={String(data.fund_count)} accent="#f59e0b" />
      </div>

      {/* XIRR hero — dark gradient */}
      <div className="rounded-2xl p-8 text-center" style={{ background: xirrHeroBg(data.xirr) }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">
          Portfolio XIRR
        </p>
        <div
          className="text-7xl font-extrabold mb-2 leading-none"
          style={{ color: xirrColor(data.xirr), fontFamily: "var(--font-syne, sans-serif)" }}
        >
          {formatPercent(data.xirr)}
        </div>
        <div
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full mb-3"
          style={{ background: `${xirrColor(data.xirr)}20`, color: xirrColor(data.xirr) }}
        >
          {xirrLabel(data.xirr)}
        </div>
        <p className="text-white/40 text-xs">Nifty 50 benchmark: 14.2% · XIRR = annualised return on your actual cashflows</p>
      </div>

      {/* Per-fund XIRR table */}
      {data.fund_xirrs && data.fund_xirrs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3
              className="font-bold text-slate-800"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              Fund-wise XIRR
            </h3>
            <span className="text-xs text-slate-400">{data.fund_xirrs.length} funds</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Fund</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Value</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">XIRR</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Exp. Ratio</th>
                </tr>
              </thead>
              <tbody>
                {data.fund_xirrs.map((f, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-800 font-medium max-w-xs truncate">{f.name}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{formatCrore(f.current_value)}</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${xirrTextColor(f.xirr)}`}>
                      {formatPercent(f.xirr)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{f.expense_ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overlap warnings */}
      {data.overlap && data.overlap.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3
            className="font-bold text-slate-800 mb-4"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            Portfolio Overlap Detected
          </h3>
          {data.overlap.map((o, i) => {
            const isHigh = o.overlap_level === "high";
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl border"
                style={{
                  background: isHigh ? "#fff1f2" : "#fffbeb",
                  borderColor: isHigh ? "#fecdd3" : "#fde68a",
                  borderLeftWidth: "4px",
                  borderLeftColor: isHigh ? "#ef4444" : "#f59e0b",
                }}
              >
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    background: isHigh ? "#ef444420" : "#f59e0b20",
                    color: isHigh ? "#ef4444" : "#f59e0b",
                  }}
                >
                  {o.overlap_level.toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{o.category_label} Overlap</p>
                  <p className="text-xs text-slate-500 mt-0.5">{o.funds.join(" · ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense ratio */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-bold text-slate-800"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            Expense Ratio Analysis
          </h3>
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{
              background: data.avg_expense_ratio > 1 ? "#fee2e2" : "#dcfce7",
              color: data.avg_expense_ratio > 1 ? "#ef4444" : "#16a34a",
            }}
          >
            {data.avg_expense_ratio}%
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Your average expense ratio</span>
            <span>Benchmark: 1.0%</span>
          </div>
          <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${erBarWidth}%`,
                background: data.avg_expense_ratio > 1
                  ? "linear-gradient(90deg, #f87171, #ef4444)"
                  : "linear-gradient(90deg, #4ade80, #22c55e)",
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-600/50"
              style={{ left: `${benchmarkWidth}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {data.avg_expense_ratio > 1
              ? `Your ratio is ${(data.avg_expense_ratio - 1).toFixed(2)}% above the 1% benchmark — consider switching to direct plans.`
              : "Your expense ratio is within the healthy range."}
          </p>
        </div>
      </div>

      {/* AI advice */}
      <ResultCard title="AI Rebalancing Advice" content={data.ai_advice} variant="info" />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "#6366f1",
  valueColor = "text-slate-900",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  valueColor?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
      style={{ borderTopWidth: "3px", borderTopColor: accent }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      <p className={`text-xl font-extrabold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs font-semibold text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
