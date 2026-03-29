import Link from "next/link";

const FEATURES = [
  {
    icon: "📊",
    title: "MF Portfolio X-Ray",
    description:
      "Upload your CAMS statement and instantly get your true XIRR, portfolio overlap analysis, expense ratio drag, and AI-powered rebalancing plan.",
    href: "/xray",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: "🔥",
    title: "FIRE Path Planner",
    description:
      "Tell us your income, expenses, and goals. We calculate your exact FIRE date, how much SIP you need, and a month-by-month roadmap to retire early.",
    href: "/fire",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: "🧾",
    title: "Tax Wizard",
    description:
      "Upload Form 16 or enter manually. Find old vs new regime savings, every missed deduction, and AI-ranked tax-saving investments for FY 2025-26.",
    href: "/tax",
    color: "from-green-500 to-green-600",
  },
  {
    icon: "❤️",
    title: "Money Health Score",
    description:
      "Answer 6 quick questions about your financial life and get a personalised wellness score out of 100, with actionable tips for your weakest areas.",
    href: "/health",
    color: "from-purple-500 to-purple-600",
  },
];

const STATS = [
  { value: "4.5 Cr+", label: "Active MF investors in India" },
  { value: "₹28,000", label: "Average missed tax deductions" },
  { value: "95%", label: "Indians have no financial plan" },
];

const STEPS = [
  {
    step: "1",
    title: "Upload or Input",
    description: "Upload your CAMS PDF, Form 16, or simply fill a quick form. No data is stored.",
    icon: "⬆️",
  },
  {
    step: "2",
    title: "AI Analyses",
    description: "Mistral AI + financial algorithms crunch the numbers in seconds.",
    icon: "🤖",
  },
  {
    step: "3",
    title: "Get Actionable Advice",
    description: "Plain-English insights with specific ₹ amounts — not vague, generic advice.",
    icon: "✅",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero + Stats — together fill exactly the first viewport */}
      <div className="flex flex-col min-h-[calc(100vh-62px)]">

        {/* Hero */}
        <section className="bg-primary text-white flex-1 flex items-center px-4 py-12">
          <div className="max-w-4xl mx-auto text-center w-full">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Your Personal AI<br />
              <span className="text-yellow-400">Financial Advisor</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Stop guessing with your money. Get instant, AI-powered analysis of your mutual funds,
              tax situation, retirement plan, and financial health — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/xray"
                className="bg-yellow-400 text-primary font-bold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors text-lg"
              >
                Analyse My Portfolio →
              </Link>
              <Link
                href="/fire"
                className="bg-white/10 border border-white/30 text-white font-bold px-8 py-3 rounded-lg hover:bg-white/20 transition-colors text-lg"
              >
                Find My FIRE Date
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar — always visible at the bottom of the first screen */}
        <section className="bg-yellow-400 py-6 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm font-medium text-primary/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Feature cards */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary mb-3">
            Four Tools. One Goal.
          </h2>
          <p className="text-gray-500 text-center mb-12">
            Everything a retail investor needs — free, private, AI-powered.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.href}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-8 flex flex-col gap-4"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{feature.description}</p>
                <Link
                  href={feature.href}
                  className="mt-2 inline-block bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity w-fit"
                >
                  Try Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary mb-3">How It Works</h2>
          <p className="text-gray-500 text-center mb-14">Get answers in under 60 seconds</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map((step, i) => (
              <div key={step.step} className="text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.icon}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-yellow-500">Step {step.step}</div>
                <h3 className="text-lg font-bold text-primary">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-gray-400 py-8 text-center text-sm">
        <p className="font-semibold text-white mb-1">💰 AI Money Mentor</p>
        <p className="mt-2 text-xs">Not SEBI registered. For educational purposes only.</p>
      </footer>
    </div>
  );
}
