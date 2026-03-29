"use client";

import ResultCard from "./ResultCard";
import { formatINR } from "@/lib/formatters";

interface MissedDeduction {
  section: string;
  description?: string;
  max_limit: number;
  currently_invested: number;
  potential_tax_saving: number;
}

interface TaxCalc {
  old_regime_tax: number;
  new_regime_tax: number;
  recommended_regime: "old" | "new"; // from backend (used only for sanity check)
  savings_amount: number;            // from backend (not used — we derive it)
  taxable_income_old: number;
  taxable_income_new: number;
  tds_deducted: number;
  refund_or_due: number;             // from backend (not used — we derive it)
  missed_deductions: MissedDeduction[];
}

interface TaxComparisonProps {
  data: { tax_calc: TaxCalc; ai_advice: string };
}

export default function TaxComparison({ data }: TaxComparisonProps) {
  const { tax_calc, ai_advice } = data;
  const {
    old_regime_tax,
    new_regime_tax,
    recommended_regime: backendRecommended,
    taxable_income_old,
    taxable_income_new,
    tds_deducted,
    missed_deductions,
  } = tax_calc;

  // ── 1. Derive recommendation on the frontend ────────────────────────────
  // Recommend whichever has strictly lower tax. Tie → new (simpler compliance).
  const recommended: "old" | "new" = old_regime_tax < new_regime_tax ? "old" : "new";

  // ── 2. Sanity check ─────────────────────────────────────────────────────
  console.assert(
    recommended === backendRecommended,
    `[TaxComparison] Recommendation mismatch: backend=${backendRecommended}, frontend=${recommended}. ` +
      `old_tax=${old_regime_tax}, new_tax=${new_regime_tax}`
  );

  // ── 3. All derived values from the recommended regime ───────────────────
  const isOldBetter      = recommended === "old";
  const recommendedTax   = isOldBetter ? old_regime_tax : new_regime_tax;
  const savings          = Math.abs(old_regime_tax - new_regime_tax);
  // positive → tax still owed; negative → refund coming
  const taxDueOrRefund   = recommendedTax - tds_deducted;
  const recommendedLabel = isOldBetter ? "Old" : "New";

  return (
    <div className="space-y-5">

      {/* ── Regime cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RegimeCard
          regime="Old Regime"
          taxableIncome={taxable_income_old}
          taxPayable={old_regime_tax}
          isRecommended={isOldBetter}
          savings={savings}
          explanation="Better when total deductions > ₹3,75,000"
        />
        <RegimeCard
          regime="New Regime"
          taxableIncome={taxable_income_new}
          taxPayable={new_regime_tax}
          isRecommended={!isOldBetter}
          savings={savings}
          explanation="Better when total deductions < ₹3,75,000"
        />
      </div>

      {/* ── Stat cards — all from recommended regime ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* TDS — same for both regimes, from Form 16 Part A */}
        <StatCard
          label="TDS Deducted"
          value={formatINR(tds_deducted)}
          accent="#6366f1"
        />

        {/* Tax due / refund → derived from recommended regime tax */}
        <StatCard
          label={taxDueOrRefund > 0 ? "Tax Due" : "Refund Due"}
          value={formatINR(Math.abs(taxDueOrRefund))}
          accent={taxDueOrRefund > 0 ? "#ef4444" : "#22c55e"}
          valueColor={taxDueOrRefund > 0 ? "text-red-600" : "text-green-600"}
          sub={taxDueOrRefund > 0 ? "Pay before ITR filing" : "Claim in your ITR"}
        />

        {/* Saved vs other regime */}
        <StatCard
          label="Saved vs Other Regime"
          value={formatINR(savings)}
          accent="#3b82f6"
          valueColor="text-blue-600"
          sub={`by choosing ${recommendedLabel} Regime`}
        />
      </div>

      {/* ── Missed deductions ── */}
      {missed_deductions && missed_deductions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div
            className="px-6 py-4 border-b border-slate-100 flex items-center gap-3"
            style={{ borderLeftWidth: "4px", borderLeftColor: "#f59e0b" }}
          >
            <span className="text-lg">💡</span>
            <div>
              <h3
                className="font-bold text-slate-800"
                style={{ fontFamily: "var(--font-syne, sans-serif)" }}
              >
                Missed Deductions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Money you could be saving right now</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {missed_deductions.map((m, i) => {
              const pct = Math.min(100, Math.round((m.currently_invested / m.max_limit) * 100));
              const barColor = pct >= 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{m.section}</span>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-green-600">
                        Save {formatINR(m.potential_tax_saving)}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatINR(m.currently_invested)} / {formatINR(m.max_limit)}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{pct}% of limit used</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI advice ── */}
      <ResultCard title="AI Tax Advice" content={ai_advice} variant="success" />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RegimeCard({
  regime,
  taxableIncome,
  taxPayable,
  isRecommended,
  savings,
  explanation,
}: {
  regime: string;
  taxableIncome: number;
  taxPayable: number;
  isRecommended: boolean;
  savings: number;
  explanation: string;
}) {
  if (isRecommended) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #14532d 100%)" }}
      >
        <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
          ✓ Recommended · Save {formatINR(savings)}
        </div>
        <h3
          className="text-xl font-extrabold text-white mb-4"
          style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
          {regime}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Taxable Income</span>
            <span className="text-sm font-semibold text-white">{formatINR(taxableIncome)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-sm text-white/60">Tax Payable (incl. cess)</span>
            <span className="text-2xl font-extrabold text-emerald-400">{formatINR(taxPayable)}</span>
          </div>
        </div>
        <p className="text-xs text-emerald-900/60 bg-emerald-400/10 rounded-lg px-3 py-2 mt-4 leading-relaxed">
          {explanation}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200">
      <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
        Not Recommended · Costs {formatINR(savings)} More
      </div>
      <h3
        className="text-xl font-extrabold text-slate-400 mb-4"
        style={{ fontFamily: "var(--font-syne, sans-serif)" }}
      >
        {regime}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Taxable Income</span>
          <span className="text-sm font-semibold text-slate-600">{formatINR(taxableIncome)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-400">Tax Payable (incl. cess)</span>
          <span className="text-2xl font-extrabold text-red-400">{formatINR(taxPayable)}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2 mt-4 leading-relaxed">
        {explanation}
      </p>
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
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
