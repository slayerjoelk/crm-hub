import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/6 blur-[120px]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">CRM Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-zinc-800/50">Sign in</Link>
          <Link href="/register" className="text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/25">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-[13px] text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Now in public beta
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-3xl">
          The CRM that works
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent"> while you sleep</span>
        </h1>
        <p className="text-lg text-zinc-400 mt-6 max-w-2xl leading-relaxed">
          Capture leads, enroll them in sequences, score them automatically, and manage deals — all from one beautiful dashboard. Built for operators who want to move fast.
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Link href="/register" className="h-12 px-8 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white text-[15px] font-semibold transition-all shadow-xl shadow-violet-500/25 inline-flex items-center gap-2">
            Start free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
          <Link href="/login" className="h-12 px-8 rounded-xl border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[15px] font-medium transition-all inline-flex items-center">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
          <p className="text-zinc-400 mt-3 text-lg">Your entire business operations in one place.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Lead Capture", desc: "Embed a form on any website. Leads flow in, get scored, tagged, and enrolled in sequences automatically.", icon: "📥" },
            { title: "Smart Sequences", desc: "4-email welcome drip pre-configured. Auto-pauses when they reply. Add your own sequences anytime.", icon: "⚡" },
            { title: "Pipeline Management", desc: "7-stage deal pipeline. Drag cards between stages. See exactly where every deal stands.", icon: "📊" },
            { title: "Lead Scoring", desc: "5-dimensional scoring engine. Demographics, engagement, behavior, source, lifecycle. Always knows who's hot.", icon: "🎯" },
            { title: "Task Automation", desc: "Stale contact reminders, overdue escalations, welcome tasks. Your CRM never forgets to follow up.", icon: "🤖" },
            { title: "Beautiful Dashboard", desc: "KPI cards, revenue charts, pipeline funnel. See your business performance at a glance.", icon: "✨" },
          ].map((f, i) => (
            <div key={i} className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/60 p-6 transition-all hover:border-zinc-700/80">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-12">
          <h2 className="text-3xl font-bold tracking-tight">Ready to take control?</h2>
          <p className="text-zinc-400 mt-3 text-lg">Set up your workspace in 30 seconds. No credit card required.</p>
          <Link href="/register" className="mt-8 h-12 px-10 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white text-[15px] font-semibold transition-all shadow-xl shadow-violet-500/25 inline-flex items-center gap-2">
            Create your workspace
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 px-6 py-8 text-center">
        <p className="text-sm text-zinc-600">CRM Hub · Built for operators</p>
      </footer>
    </div>
  );
}
