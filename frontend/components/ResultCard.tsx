"use client";

import { useState } from "react";

interface ResultCardProps {
  title: string;
  content: string;
  variant?: "success" | "warning" | "info";
}

const VARIANT_STYLES = {
  success: {
    headerBg:  "bg-green-600",
    bodyBg:    "bg-green-50",
    border:    "border-green-200",
    badge:     "bg-green-100 text-green-700 hover:bg-green-200",
    sectionBg: "bg-white border-green-100",
    h2Color:   "text-green-800",
  },
  warning: {
    headerBg:  "bg-yellow-500",
    bodyBg:    "bg-yellow-50",
    border:    "border-yellow-200",
    badge:     "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    sectionBg: "bg-white border-yellow-100",
    h2Color:   "text-yellow-800",
  },
  info: {
    headerBg:  "bg-blue-600",
    bodyBg:    "bg-blue-50",
    border:    "border-blue-200",
    badge:     "bg-blue-100 text-blue-700 hover:bg-blue-200",
    sectionBg: "bg-white border-blue-100",
    h2Color:   "text-blue-800",
  },
};

// ── Markdown-aware line renderer ────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Handle **bold** inline
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface ParsedBlock {
  type: "h2" | "bullet" | "bold-line" | "text";
  text: string;
  sub?: string;   // for bold-line: text after the colon
}

function parseMarkdown(content: string): ParsedBlock[] {
  const lines = content.split("\n");
  const blocks: ParsedBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip empty lines — we use spacing via layout
    if (!line.trim()) continue;

    // ## Heading
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "") });
      continue;
    }

    // - Bullet line (may start with **bold**)
    if (line.match(/^[-•]\s/)) {
      blocks.push({ type: "bullet", text: line.replace(/^[-•]\s+/, "") });
      continue;
    }

    // **Bold label:** rest of line
    const boldLabelMatch = line.match(/^\*\*(.+?)\*\*[:\s]*(.*)/);
    if (boldLabelMatch) {
      blocks.push({ type: "bold-line", text: boldLabelMatch[1], sub: boldLabelMatch[2] });
      continue;
    }

    // Plain text
    blocks.push({ type: "text", text: line });
  }

  return blocks;
}

function RenderBlocks({ blocks }: { blocks: ParsedBlock[] }) {
  // Group consecutive bullets into a list
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "h2") {
      elements.push(
        <h4 key={i} className="text-sm font-bold uppercase tracking-wider text-gray-500 pt-4 pb-1 border-b border-gray-200 mb-2">
          {block.text}
        </h4>
      );
      i++;
      continue;
    }

    if (block.type === "bullet") {
      // Collect all consecutive bullets
      const bullets: ParsedBlock[] = [];
      while (i < blocks.length && blocks[i].type === "bullet") {
        bullets.push(blocks[i]);
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-2">
          {bullets.map((b, bi) => (
            <li key={bi} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{renderInline(b.text)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (block.type === "bold-line") {
      elements.push(
        <div key={i} className="my-1.5 text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">{block.text}</span>
          {block.sub ? (
            <span className="text-gray-600"> — {renderInline(block.sub)}</span>
          ) : null}
        </div>
      );
      i++;
      continue;
    }

    // Plain text
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1">
        {renderInline(block.text)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

// ── PDF generation ──────────────────────────────────────────────────────────

function blocksToHTML(blocks: ParsedBlock[]): string {
  let html = "";
  let inList = false;

  for (const block of blocks) {
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const boldify = (s: string) =>
      escape(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    if (block.type === "h2") {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${escape(block.text)}</h2>`;
    } else if (block.type === "bullet") {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${boldify(block.text)}</li>`;
    } else if (block.type === "bold-line") {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p><strong>${escape(block.text)}</strong>${block.sub ? ` — ${boldify(block.sub)}` : ""}</p>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${boldify(block.text)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function downloadPDF(title: string, blocks: ParsedBlock[]) {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} — AI Money Mentor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #111827; font-size: 14px; line-height: 1.75; background: #fff; }
    .page { max-width: 680px; margin: 0 auto; padding: 48px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #0f172a; margin-bottom: 32px; }
    .brand { font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; }
    .brand span { color: #3b82f6; }
    .report-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 4px; }
    .report-meta { font-size: 12px; color: #9ca3af; }
    h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-top: 28px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    p { margin: 8px 0; color: #374151; }
    ul { padding-left: 20px; margin: 10px 0; }
    li { margin-bottom: 7px; color: #374151; }
    strong { font-weight: 600; color: #111827; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.6; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="report-title">${title}</div>
        <div class="report-meta">AI Money Mentor &mdash; ${date}</div>
      </div>
      <div class="brand">AI Money <span>Mentor</span></div>
    </div>
    ${blocksToHTML(blocks)}
    <div class="footer">
      <strong>Disclaimer:</strong> This report is generated by AI and is for educational purposes only. It does not constitute financial advice. Please consult a SEBI-registered financial advisor before making any investment decisions.
    </div>
  </div>
</body>
</html>`);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ResultCard({
  title,
  content,
  variant = "info",
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const styles = VARIANT_STYLES[variant];
  const blocks = parseMarkdown(content);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className={`rounded-2xl border ${styles.border} overflow-hidden shadow-sm`}>
      {/* Header bar */}
      <div className={`${styles.headerBg} px-5 py-3.5 flex items-center justify-between gap-3`}>
        <h3 className="text-white font-semibold text-sm tracking-wide">{title}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${styles.badge}`}
          >
            {copied ? "✅ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={() => downloadPDF(title, blocks)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${styles.badge}`}
          >
            ⬇ PDF
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`${styles.bodyBg} px-6 py-5`}>
        {blocks.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No response received.</p>
        ) : (
          <RenderBlocks blocks={blocks} />
        )}
      </div>
    </div>
  );
}
