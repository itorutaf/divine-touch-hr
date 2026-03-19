import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuroraFlow } from "@/components/ui/aurora-flow";
import {
  ArrowRight, Check, Star, Phone, Mail, MapPin,
  Shield, Users, TrendingUp, GraduationCap, FileCheck,
  ClipboardCheck, Heart, Zap, Lock, BarChart3,
  ChevronRight, Play, Clock,
} from "lucide-react";

/* keyframes are in index.css (ticker, float, fadeInUp, aurora-glow) */

const TICKER_ITEMS = [
  "Employee Onboarding",
  "Clearance Tracking",
  "EVV Monitoring",
  "Client Profitability",
  "Training Management",
  "Billing Analytics",
  "Authorization Tracking",
  "Incident Reporting",
  "LEIE/SAM Screening",
  "Audit Readiness",
];

const SERVICES = [
  { title: "Employee Onboarding", description: "8-gate workflow from application to active", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80" },
  { title: "Compliance Tracking", description: "Clearances, EVV, LEIE/SAM — automated", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80" },
  { title: "Training Management", description: "PA-specific curriculum by track", image: "https://images.unsplash.com/photo-1551190822-a9ce113ac100?w=600&q=80" },
  { title: "Client Profitability", description: "Per-client P&L — an industry first", image: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&q=80" },
  { title: "Authorization Tracker", description: "Prevent revenue leakage in real-time", image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&q=80" },
];

const TEAM = [
  { name: "Dr. Sarah Mitchell", role: "Clinical Director", exp: "10+ Years", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80" },
  { name: "Michael Adams", role: "Operations Lead", exp: "6+ Years", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80" },
  { name: "Grace Lewis", role: "Compliance Officer", exp: "8+ Years", image: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=400&q=80" },
];

const PRICING = [
  { name: "Starter", price: 199, description: "Up to 15 employees", features: ["Employee onboarding", "Clearance tracking", "Document vault", "Basic reporting"] },
  { name: "Growth", price: 299, description: "Up to 50 employees", features: ["Everything in Starter", "Client profitability", "Authorization tracker", "Training management", "EVV monitoring", "Priority support"], popular: true },
  { name: "Enterprise", price: 499, description: "Unlimited + white-label", features: ["Everything in Growth", "Unlimited employees", "White-label branding", "Custom integrations", "Dedicated support", "Multi-location"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════════════════ */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-extrabold text-sm tracking-tight">CB</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">CareBase</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Platform", "Pricing", "About", "Contact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => (window.location.href = "/login")}>
              Sign In
            </Button>
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 rounded-full px-6">
              Request Demo
            </Button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Dark, photo-rich, floating stats
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: "#1B3A4B" }}>
        {/* Aurora 3D Background — full bleed edge to edge */}
        <div className="absolute inset-0 w-full h-full">
          <AuroraFlow />
        </div>
        {/* Subtle gradient overlays for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A4B]/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A4B]/60 via-transparent to-[#1B3A4B]/10 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-semibold tracking-wide uppercase">Built for Pennsylvania Home Care</span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
              Run Your Agency
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent" style={{ animation: "aurora-glow 3s ease-in-out infinite" }}>From One Screen</span>
            </h1>

            <p className="text-lg text-white/60 max-w-lg mb-10 leading-relaxed">
              The only platform built for OLTL, ODP, and Skilled agencies. Client profitability,
              employee onboarding, compliance — unified in one system.
            </p>

            <div className="flex items-center gap-4 mb-12">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-13 text-base shadow-xl shadow-emerald-500/30">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-13 text-base border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                <Play className="mr-2 h-4 w-4" /> Watch Video
              </Button>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-[#1B3A4B] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{["JM", "KL", "AP", "DT"][i - 1]}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Trusted by 50+ agencies</p>
                <p className="text-white/40 text-xs">across Pennsylvania</p>
              </div>
            </div>
          </div>

          {/* Right — floating stat badges */}
          <div className="hidden lg:block relative h-[500px]">
            {/* Stat badges */}
            {[
              { value: "10+", label: "Years of Experience", top: "10%", right: "5%", delay: "0s" },
              { value: "250+", label: "Caregivers Managed", top: "45%", right: "0%", delay: "0.3s" },
              { value: "100%", label: "HIPAA Compliant", top: "75%", right: "15%", delay: "0.6s" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="absolute"
                style={{ top: stat.top, right: stat.right, animation: `float 4s ease-in-out infinite`, animationDelay: stat.delay }}
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-3xl font-extrabold text-white">{stat.value}</span>
                  </div>
                  <p className="text-white/60 text-xs font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SCROLLING TICKER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
        <div className="py-4 relative">
          <div className="flex whitespace-nowrap" style={{ animation: "ticker 30s linear infinite" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-3 mx-6 text-white/90 text-sm font-semibold tracking-wide">
                <Zap className="h-4 w-4 text-white/60" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES — Photo cards
      ═══════════════════════════════════════════════════════════════ */}
      <section id="platform" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-1.5 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">Our Platform</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Everything Your Agency <span className="text-emerald-600">Needs</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Six operational domains, one unified platform. Built specifically for Pennsylvania OLTL, ODP, and Skilled agencies.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SERVICES.map((service, i) => (
              <div
                key={service.title}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer ${i === SERVICES.length - 1 ? "col-span-2 md:col-span-1" : ""}`}
                style={{ height: i === SERVICES.length - 1 ? "380px" : "320px" }}
              >
                <img src={service.image} alt={service.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-bold text-sm leading-snug mb-1">{service.title}</h3>
                  <p className="text-white/60 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {service.description}
                  </p>
                </div>
                {/* Emerald accent line */}
                <div className="absolute top-0 left-0 w-1 h-0 bg-emerald-500 group-hover:h-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHY CHOOSE US — Dark section
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: "#1B3A4B" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-4 border border-white/10">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-300 text-xs font-semibold uppercase tracking-wide">Why CareBase</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Your <span className="text-emerald-400">Trusted</span> Operations Partner
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left features */}
            <div className="space-y-6">
              {[
                { icon: Shield, title: "Built for PA Agencies", desc: "Multi-waiver compliance: OLTL, ODP, and Skilled in one platform", accent: "#10B981" },
                { icon: TrendingUp, title: "Per-Client Profitability", desc: "Know which clients make money — an industry first", accent: "#F59E0B" },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 items-start p-5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.accent}20` }}>
                    <f.icon className="h-5 w-5" style={{ color: f.accent }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&q=80"
                  alt="Home care"
                  className="w-full h-[360px] object-cover"
                />
              </div>
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 cursor-pointer hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-white ml-1" />
                </div>
              </div>
            </div>

            {/* Right features */}
            <div className="space-y-6">
              {[
                { icon: ClipboardCheck, title: "Compliance Automation", desc: "Clearances, EVV monitoring, LEIE/SAM screening — all automated", accent: "#8B5CF6" },
                { icon: Lock, title: "HIPAA Secure", desc: "SSE-KMS encryption, pre-signed URLs, PHI-safe architecture", accent: "#EF4444" },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 items-start p-5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.accent}20` }}>
                    <f.icon className="h-5 w-5" style={{ color: f.accent }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 Steps
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Get Started in <span className="text-emerald-600">3 Steps</span>
            </h2>
            <p className="text-slate-500 text-lg">From demo to daily operations in under two weeks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, icon: Phone, title: "Request a Demo", desc: "Schedule a 30-minute walkthrough. We'll show you CareBase with your agency's data." },
              { step: 2, icon: Users, title: "We Set You Up", desc: "Our team migrates your data, configures your service lines, and trains your staff." },
              { step: 3, icon: Zap, title: "Run Your Agency", desc: "Open CareBase every morning. Every task, every metric, every compliance check — one screen." },
            ].map((s) => (
              <div key={s.step} className="relative group">
                <div className="rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-xl" style={{ background: `linear-gradient(135deg, #1B3A4B, #1B3A4B 60%, #10B981)` }}>
                  <div className="inline-flex items-center gap-1.5 bg-amber-400 rounded-full px-3 py-1 mb-6">
                    <span className="text-[10px] font-extrabold text-[#1B3A4B] uppercase tracking-wide">Step {s.step}</span>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                    <s.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TEAM
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-4 py-1.5 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">Our Team</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Built by <span className="text-emerald-600">Operators</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="group relative">
                <div className="rounded-2xl overflow-hidden h-[400px] relative">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Experience badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-[10px] font-bold text-slate-700">{member.exp}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-lg">{member.name}</h3>
                    <p className="text-white/60 text-sm">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-1.5 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Client Reviews</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              What Agencies Say <span className="text-emerald-600">About Us</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: "Jessica Williams", role: "HR Director, Comfort Care PA", quote: "CareBase cut our onboarding time from 21 days to 9. The clearance tracking alone saved us from a compliance disaster.", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80", stars: 5 },
              { name: "Marcus Johnson", role: "COO, Keystone Home Health", quote: "For the first time, I can see per-client profitability in real time. We dropped two unprofitable cases and margin went up 15% in a month.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80", stars: 5 },
            ].map((t) => (
              <Card key={t.name} className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                    <img src={t.image} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <p className="text-slate-900 font-bold text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                    <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 2 days ago
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              Simple, <span className="text-emerald-600">Transparent</span> Pricing
            </h2>
            <p className="text-slate-500 text-lg">No hidden fees. Cancel anytime. Start with a free demo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl overflow-hidden ${plan.popular ? "ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10" : "border border-slate-200"}`}
              >
                {plan.popular && (
                  <div className="bg-emerald-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className="p-8 bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight">${plan.price}</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-slate-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-full h-12 text-sm font-semibold ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA — Dark
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden" style={{ background: "#1B3A4B" }}>
        {/* Aurora background for CTA section */}
        <div className="absolute inset-0 w-full h-full opacity-70">
          <AuroraFlow />
        </div>
        <div className="absolute inset-0 bg-[#1B3A4B]/30 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
            Ready to Simplify<br />Your Operations?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Schedule a demo and see how CareBase can save your agency 20+ hours per week.
          </p>
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <Input
              placeholder="your@agency.com"
              className="h-13 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full px-6 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8 h-13 shrink-0 shadow-lg shadow-emerald-500/25">
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-extrabold text-xs">CB</span>
                </div>
                <span className="font-extrabold text-lg">CareBase</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                The unified operations platform for Pennsylvania home care agencies.
              </p>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <Shield className="h-3.5 w-3.5" /> HIPAA Compliant
              </div>
            </div>
            {[
              { title: "Platform", links: ["Employee Onboarding", "Compliance", "Billing", "Training", "Profitability"] },
              { title: "Company", links: ["About Us", "Careers", "Contact", "Blog", "Press"] },
              { title: "Contact", links: [] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{col.title}</h4>
                {col.links.length > 0 ? (
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-white/40 text-sm hover:text-white transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 text-sm text-white/40">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> (215) 555-0100</div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@carebase.io</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Philadelphia, PA</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex items-center justify-between">
            <p className="text-white/20 text-xs">Faturoti Supply LLC / Divine Touch Home Care Services</p>
            <p className="text-white/20 text-xs">Philadelphia, Pennsylvania</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
