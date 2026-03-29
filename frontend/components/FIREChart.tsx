"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import ResultCard from "./ResultCard";
import { formatCrore, formatINR, formatAge } from "@/lib/formatters";

interface YearlyPoint { year: number; age: number; corpus: number; }
interface GoalSip { goal_name: string; target_amount: number; years: number; monthly_sip: number; }
interface FireCalc {
  fire_age: number;
  fire_date: string;
  monthly_sip_total: number;
  monthly_sip_for_fire: number;
  monthly_surplus: number;
  retirement_corpus_needed: number;
  corpus_at_fire: number;
  existing_investments: number;
  yearly_projection: YearlyPoint[];
  goal_sips: GoalSip[];
  assumed_annual_return_pct: number;
}

interface FIREChartProps {
  data: { fire_calc: FireCalc; ai_roadmap: string; };
}

export default function FIREChart({ data }: FIREChartProps) {
  const { fire_calc, ai_roadmap } = data;
  const {
    fire_age, fire_date, monthly_sip_total, monthly_surplus,
    retirement_corpus_needed, corpus_at_fire, yearly_projection,
    goal_sips, assumed_annual_return_pct,
  } = fire_calc;

  const currentAge = yearly_projection.length > 0 ? yearly_projection[0].age - 1 : 30;
  const surplusUsedPct = monthly_surplus > 0
    ? Math.min(100, Math.round((monthly_sip_total / monthly_surplus) * 100))
    : 0;

  const chartData = yearly_projection.map((pt) => ({
    age: pt.age, year: pt.year, corpus: pt.corpus,
  }));

  return (
    <div className="space-y-5">

      {/* Hero — dark orange gradient */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #c2410c 100%)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">
          Your FIRE Date
        </p>
        <div
          className="text-5xl md:text-6xl font-extrabold text-white mb-2 leading-none"
          style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
          Age {fire_age} · {fire_date}
        </div>
        <p className="text-orange-300 text-base mt-3">
          {formatAge(fire_age, currentAge)} — you can retire financially free!
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Corpus Needed" value={formatCrore(retirement_corpus_needed)} accent="#ef4444" />
        <StatCard label="Corpus at FIRE" value={formatCrore(corpus_at_fire)} accent="#22c55e" />
        <StatCard label="Total Monthly SIP" value={formatINR(monthly_sip_total)} accent="#f59e0b" />
        <StatCard
          label="Surplus Used"
          value={`${surplusUsedPct}%`}
          accent={surplusUsedPct > 90 ? "#ef4444" : "#22c55e"}
          valueColor={surplusUsedPct > 90 ? "text-red-600" : "text-green-600"}
        />
      </div>

      {/* Corpus growth chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3
            className="font-bold text-slate-800"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            Corpus Growth Projection
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Assumes {assumed_annual_return_pct}% annual return · Red dashed = corpus needed to retire
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="age"
              label={{ value: "Age", position: "insideBottom", offset: -3, fontSize: 11 }}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCrore(v)}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => [formatCrore(value), "Corpus"]}
              labelFormatter={(label) => `Age ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                fontSize: "13px",
              }}
            />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: "12px", paddingBottom: "12px" }} />
            <Line
              type="monotone" dataKey="corpus" name="Your Corpus"
              stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }}
            />
            <ReferenceLine
              y={retirement_corpus_needed} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={2}
              label={{ value: "Goal", position: "right", fontSize: 11, fill: "#ef4444" }}
            />
            {fire_age && (
              <ReferenceLine
                x={fire_age} stroke="#22c55e" strokeWidth={2}
                label={{ value: "FIRE", position: "top", fontSize: 11, fill: "#22c55e" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Goal SIPs table */}
      {goal_sips && goal_sips.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3
              className="font-bold text-slate-800"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              SIP Breakdown by Goal
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Goal</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Target</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Years</th>
                  <th className="text-right px-6 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Monthly SIP</th>
                </tr>
              </thead>
              <tbody>
                {goal_sips.map((g, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{g.goal_name}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{formatCrore(g.target_amount)}</td>
                    <td className="px-4 py-3.5 text-right text-slate-500">{g.years} yrs</td>
                    <td className="px-6 py-3.5 text-right font-bold text-orange-600">{formatINR(g.monthly_sip)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="px-6 py-3.5 font-bold text-slate-800" colSpan={3}>Total Monthly SIP Required</td>
                  <td className="px-6 py-3.5 text-right font-extrabold text-orange-600 text-base">{formatINR(monthly_sip_total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI roadmap */}
      <ResultCard title="Your FIRE Roadmap" content={ai_roadmap} variant="success" />
    </div>
  );
}

function StatCard({
  label, value, accent = "#f97316", valueColor = "text-slate-900",
}: {
  label: string; value: string; accent?: string; valueColor?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
      style={{ borderTopWidth: "3px", borderTopColor: accent }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>
      <p className={`text-xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}
