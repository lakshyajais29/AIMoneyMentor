"use client";

import { useState } from "react";
import axios from "axios";
import FileUpload from "./FileUpload";

interface TaxFormProps {
  onResult: (data: unknown) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MANUAL_FIELDS = [
  {
    key: "gross_salary",
    label: "Gross Annual Salary (₹)",
    hint: "Total CTC before any deductions",
    max: undefined,
    important: true,
  },
  {
    key: "hra_received",
    label: "HRA Received (₹)",
    hint: "House Rent Allowance component of salary",
    max: undefined,
    important: false,
  },
  {
    key: "section_80c",
    label: "80C Investments (₹)",
    hint: "ELSS, PPF, LIC, EPF, NSC, 5-yr FD — max ₹1,50,000",
    max: 150000,
    important: false,
  },
  {
    key: "section_80d",
    label: "80D Health Insurance Premium (₹)",
    hint: "Mediclaim for self + family — max ₹25,000",
    max: 25000,
    important: false,
  },
  {
    key: "section_80ccd",
    label: "NPS 80CCD(1B) (₹)",
    hint: "Additional NPS contribution above 80C — max ₹50,000",
    max: 50000,
    important: false,
  },
];

const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all bg-white placeholder:text-slate-300";

export default function TaxForm({ onResult }: TaxFormProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [form, setForm]           = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileResult(data: unknown) { setError(""); onResult(data); }
  function handleFileError(msg: string)    { setError(msg); }

  async function handleManualSubmit() {
    setError("");
    const gross = parseFloat((form.gross_salary || "").replace(/,/g, ""));
    if (!form.gross_salary || isNaN(gross) || gross <= 0) {
      setError("Please enter a valid gross annual salary.");
      return;
    }
    for (const f of MANUAL_FIELDS) {
      if (f.max) {
        const val = parseFloat((form[f.key] || "0").replace(/,/g, "")) || 0;
        if (val > f.max) {
          setError(`${f.label} cannot exceed ₹${f.max.toLocaleString("en-IN")}.`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      const formData = new FormData();
      for (const f of MANUAL_FIELDS) {
        const val = (form[f.key] || "0").replace(/,/g, "");
        formData.append(f.key, val);
      }
      const res = await axios.post(`${API_URL}/api/tax`, formData);
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs — underline style */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {(["upload", "manual"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(""); }}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
              activeTab === tab ? "text-slate-900 bg-white" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab === "upload" ? "📄 Upload Form 16" : "✍️ Enter Manually"}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-8">
        {/* Upload tab */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-800">
              <span className="flex-shrink-0">💡</span>
              <span>
                Upload your Form 16 (Part A + B) PDF. We&apos;ll extract all salary and deduction details automatically.
              </span>
            </div>
            <FileUpload
              endpoint={`${API_URL}/api/tax`}
              buttonText="Analyse My Form 16"
              onResult={handleFileResult}
              onError={handleFileError}
            />
          </div>
        )}

        {/* Manual tab */}
        {activeTab === "manual" && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500">
              Enter your salary and investment details for FY 2025-26.
            </p>

            {/* Gross salary — prominent */}
            <div
              className="space-y-1.5 p-4 rounded-xl border border-slate-200 bg-slate-50"
              style={{ borderLeftWidth: "4px", borderLeftColor: "#10b981" }}
            >
              <label className="block text-sm font-bold text-slate-800">
                {MANUAL_FIELDS[0].label}
              </label>
              <input
                type="text"
                value={form.gross_salary || ""}
                onChange={(e) => setField("gross_salary", e.target.value)}
                placeholder="₹0"
                className={INPUT_CLS}
              />
              <p className="text-[11px] text-slate-400">{MANUAL_FIELDS[0].hint}</p>
            </div>

            {/* Remaining fields */}
            <div className="space-y-4">
              {MANUAL_FIELDS.slice(1).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.max ? `Max ₹${f.max.toLocaleString("en-IN")}` : "₹0"}
                    className={INPUT_CLS}
                  />
                  <p className="text-[11px] text-slate-400">{f.hint}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm text-white tracking-wide transition-all"
              style={
                loading
                  ? { background: "#cbd5e1", cursor: "not-allowed" }
                  : {
                      background: "linear-gradient(135deg, #0f172a 0%, #047857 100%)",
                      boxShadow: "0 4px 20px rgba(4, 120, 87, 0.25)",
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
                  Calculating...
                </span>
              ) : (
                "Calculate My Tax →"
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
