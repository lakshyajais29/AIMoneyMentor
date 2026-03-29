"use client";

import { useState } from "react";
import axios from "axios";

interface Goal {
  name: string;
  target_amount: string;
  years: string;
}

interface FIREFormProps {
  onResult: (data: unknown) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15 transition-all bg-white placeholder:text-slate-300";

export default function FIREForm({ onResult }: FIREFormProps) {
  const [age, setAge]                           = useState("");
  const [monthlyIncome, setMonthlyIncome]       = useState("");
  const [monthlyExpenses, setMonthlyExpenses]   = useState("");
  const [existingInvestments, setExistingInvestments] = useState("");
  const [goals, setGoals]                       = useState<Goal[]>([{ name: "", target_amount: "", years: "" }]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");

  function updateGoal(index: number, field: keyof Goal, value: string) {
    setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }
  function addGoal() { setGoals((prev) => [...prev, { name: "", target_amount: "", years: "" }]); }
  function removeGoal(index: number) { setGoals((prev) => prev.filter((_, i) => i !== index)); }

  function validate(): string | null {
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 60) return "Age must be between 18 and 60.";
    const income   = parseFloat(monthlyIncome.replace(/,/g, ""));
    const expenses = parseFloat(monthlyExpenses.replace(/,/g, ""));
    if (!monthlyIncome || isNaN(income) || income <= 0) return "Please enter a valid monthly income.";
    if (!monthlyExpenses || isNaN(expenses) || expenses <= 0) return "Please enter valid monthly expenses.";
    if (income <= expenses) return `Income (₹${income.toLocaleString("en-IN")}) must exceed expenses (₹${expenses.toLocaleString("en-IN")}).`;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      if (g.name || g.target_amount || g.years) {
        if (!g.name.trim()) return `Goal ${i + 1}: enter a goal name.`;
        if (!g.target_amount || isNaN(parseFloat(g.target_amount)) || parseFloat(g.target_amount) <= 0)
          return `Goal ${i + 1}: enter a valid target amount.`;
        if (!g.years || isNaN(parseFloat(g.years)) || parseFloat(g.years) <= 0)
          return `Goal ${i + 1}: enter valid years to achieve.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const filledGoals = goals
      .filter((g) => g.name && g.target_amount && g.years)
      .map((g) => ({
        name: g.name,
        target_amount: parseFloat(g.target_amount.replace(/,/g, "")),
        years: parseFloat(g.years),
      }));

    const payload = {
      age:                  parseInt(age),
      monthly_income:       parseFloat(monthlyIncome.replace(/,/g, "")),
      monthly_expenses:     parseFloat(monthlyExpenses.replace(/,/g, "")),
      existing_investments: parseFloat((existingInvestments || "0").replace(/,/g, "")) || 0,
      goals:                filledGoals,
    };

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/fire`, payload);
      if (res.data?.error) setError(res.data.error);
      else onResult(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.response?.data?.error || err.message
        : "Request failed. Please try again.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* Profile section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center gap-3"
          style={{ borderLeftWidth: "4px", borderLeftColor: "#ea580c" }}
        >
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm">👤</div>
          <h2
            className="font-bold text-slate-800"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
          >
            Your Profile
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Current Age" hint="Between 18 and 60">
            <input
              type="number" min={18} max={60}
              value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 30" className={INPUT_CLS}
            />
          </Field>
          <Field label="Monthly Income (₹)" hint="Your take-home salary per month">
            <input
              type="text" value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="e.g. 1,00,000" className={INPUT_CLS}
            />
          </Field>
          <Field label="Monthly Expenses (₹)" hint="Total household expenses per month">
            <input
              type="text" value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              placeholder="e.g. 60,000" className={INPUT_CLS}
            />
          </Field>
          <Field label="Existing Investments (₹)" hint="MF + FD + stocks + PF (total current value)">
            <input
              type="text" value={existingInvestments}
              onChange={(e) => setExistingInvestments(e.target.value)}
              placeholder="e.g. 5,00,000" className={INPUT_CLS}
            />
          </Field>
        </div>
      </div>

      {/* Goals section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ borderLeftWidth: "4px", borderLeftColor: "#f59e0b" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm">🎯</div>
            <h2
              className="font-bold text-slate-800"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              Financial Goals
            </h2>
          </div>
          <button
            type="button"
            onClick={addGoal}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Goal
          </button>
        </div>
        <div className="p-6 space-y-4">
          {goals.map((goal, i) => (
            <div
              key={i}
              className="relative grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="absolute top-3 left-4 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                {i + 1}
              </div>
              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors text-sm leading-none"
                  aria-label="Remove goal"
                >
                  ×
                </button>
              )}
              <div className="md:col-span-3 h-0" /> {/* spacer for badge */}
              <Field label="Goal Name" hint="">
                <input
                  type="text" value={goal.name}
                  onChange={(e) => updateGoal(i, "name", e.target.value)}
                  placeholder="e.g. Child Education" className={INPUT_CLS}
                />
              </Field>
              <Field label="Target Amount (₹)" hint="">
                <input
                  type="text" value={goal.target_amount}
                  onChange={(e) => updateGoal(i, "target_amount", e.target.value)}
                  placeholder="e.g. 20,00,000" className={INPUT_CLS}
                />
              </Field>
              <Field label="Years to Achieve" hint="">
                <input
                  type="number" min={1} max={50}
                  value={goal.years}
                  onChange={(e) => updateGoal(i, "years", e.target.value)}
                  placeholder="e.g. 15" className={INPUT_CLS}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-white text-sm tracking-wide transition-all"
        style={
          loading
            ? { background: "#cbd5e1", cursor: "not-allowed" }
            : {
                background: "linear-gradient(135deg, #0f172a 0%, #c2410c 100%)",
                boxShadow: "0 4px 20px rgba(194, 65, 12, 0.3)",
                fontFamily: "var(--font-syne, sans-serif)",
              }
        }
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Calculating Your FIRE Date...
          </span>
        ) : (
          "Calculate My FIRE Date →"
        )}
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
