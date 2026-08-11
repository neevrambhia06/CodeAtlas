/**
 * Landing page for CodeAtlas — inspired by Facet's bold, editorial design language.
 * Palette: Navy (#2F4156), Teal (#567C8D), Sky Blue (#C8D9E6), Beige (#F5EFEB), White (#FFFFFF).
 */
'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { FileCode, Network, BrainCircuit, Activity, Eye, LayoutDashboard, ChevronRight, ArrowRight, Zap, Shield, GitBranch } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import DepthCarousel from '@/components/DepthCarousel';
import DepthText from '@/components/DepthText';
import { FooterReveal } from '@/components/FooterReveal';

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const pipelineSteps = [
    {
      icon: <FileCode size={22} />,
      label: 'Parse',
      desc: 'AST Extraction',
      detail: 'Every file is parsed into a typed Abstract Syntax Tree — functions, classes, imports, and control flow are captured with full fidelity.',
      highlights: ['Multi-language support', 'Incremental re-parsing', 'Type-aware resolution'],
    },
    {
      icon: <Network size={22} />,
      label: 'Graph',
      desc: 'Knowledge Graph',
      detail: 'AST nodes are woven into a unified knowledge graph that encodes call chains, data flows, and cross-module dependencies.',
      highlights: ['Cross-file linking', 'Dependency mapping', 'Dead code detection'],
    },
    {
      icon: <BrainCircuit size={22} />,
      label: 'Reason',
      desc: 'Domain Inference',
      detail: 'A domain-aware LLM walks the graph to infer business intent — labeling each node with the real-world concept it represents.',
      highlights: ['Business logic labeling', 'Intent classification', 'Pattern recognition'],
    },
    {
      icon: <Activity size={22} />,
      label: 'Detect',
      desc: 'Capability Mapping',
      detail: 'Inferred labels are clustered into product capabilities — features your software actually delivers, mapped to their code roots.',
      highlights: ['Feature clustering', 'Coverage scoring', 'Gap identification'],
    },
    {
      icon: <Eye size={22} />,
      label: 'Trace',
      desc: 'User Journey Tracking',
      detail: 'We trace end-to-end user journeys across your codebase — from UI triggers through API layers to database operations.',
      highlights: ['End-to-end flows', 'Critical path analysis', 'Touchpoint mapping'],
    },
    {
      icon: <LayoutDashboard size={22} />,
      label: 'Report',
      desc: 'Insights Dashboard',
      detail: 'Everything surfaces in an interactive dashboard — capabilities, gaps, journeys, and actionable recommendations at a glance.',
      highlights: ['Visual architecture map', 'Exportable reports', 'Priority scoring'],
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#F5EFEB] selection:bg-[#C8D9E6]/40 overflow-hidden">
      
      {/* ─── HERO: Deep Navy, Facet-style immersive ─── */}
      <section className="relative z-10 min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden bg-[#2F4156]">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#567C8D] opacity-[0.15] blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#C8D9E6] opacity-[0.12] blur-[100px]" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#567C8D] opacity-[0.08] blur-[140px]" />
        </div>

        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }} />

        <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full border border-[#C8D9E6]/30 bg-[#567C8D]/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8D9E6] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8D9E6]" />
            </span>
            <span className="text-[11px] font-semibold text-[#C8D9E6] uppercase tracking-[0.2em]">
              Software Reasoning Engine
            </span>
          </div>

          {/* Headline */}
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-heading font-bold text-[#FFFFFF] leading-[1.05] tracking-tight">
              Understand any
            </h1>
            <DepthText
              text="codebase"
              faceColor="#C8D9E6"
              depthColor="#567C8D"
              fontSize="clamp(3rem, 12vw, 5.5rem)"
              fontWeight={900}
              layers={30}
              depth={2}
              tilt={6}
              smoothing={0.12}
              autoOrbit={true}
              orbitSpeed={0.3}
              shadow={true}
              className="font-heading"
            />
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-heading font-bold text-[#FFFFFF] leading-[1.05] tracking-tight">
              instantly
            </h1>
          </div>

          {/* Sub */}
          <p className="text-lg md:text-xl text-[#C8D9E6]/85 max-w-2xl leading-relaxed font-light mb-12">
            CodeAtlas reconstructs the architecture, maps user journeys, and finds hidden logic gaps in any repository. In minutes, not weeks.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href={isLoggedIn ? '/dashboard/upload' : '/login'}
              className="group flex items-center gap-3 px-8 py-4 bg-[#C8D9E6] text-[#2F4156] rounded-xl font-bold text-sm tracking-wide hover:bg-[#FFFFFF] transition-all duration-300 shadow-[0_20px_40px_-12px_rgba(200,217,230,0.3)]"
            >
              Analyze a Repository
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <a
              href="https://github.com/neevrambhia06/CodeAtlas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 border border-[#C8D9E6]/30 text-[#C8D9E6] rounded-xl font-semibold text-sm tracking-wide hover:border-[#C8D9E6]/60 hover:bg-[#567C8D]/20 transition-all duration-300"
            >
              <GitBranch size={14} />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] text-[#C8D9E6] uppercase tracking-[0.3em] font-medium">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#C8D9E6] to-transparent" />
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="py-6 px-6 bg-[#FFFFFF] border-b border-[#C8D9E6]/60">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {[
            { value: 'AST-backed', label: 'Analysis' },
            { value: 'Graph-based', label: 'Reasoning' },
            { value: 'Domain-aware', label: 'LLM Intelligence' },
            { value: 'Real-time', label: 'Dashboard' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-sm font-bold text-[#2F4156] tracking-tight">{item.value}</div>
              <div className="text-[11px] text-[#567C8D] uppercase tracking-[0.15em] mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROBLEM → SOLUTION (Facet-style split) ─── */}
      <section className="py-28 px-6 bg-[#F5EFEB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[11px] font-bold text-[#567C8D] uppercase tracking-[0.2em]">The Problem</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#2F4156] mt-4 tracking-tight leading-tight">
              Codebases are black boxes.<br />
              <span className="text-[#567C8D] font-light">Understanding them shouldn&apos;t take weeks.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Old way */}
            <div className="relative p-8 md:p-10 rounded-2xl bg-[#FFFFFF] border border-[#C8D9E6] overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#E57373] to-[#E57373]/0" />
              <span className="text-[11px] font-bold text-[#E57373] uppercase tracking-[0.2em]">Without CodeAtlas</span>
              <h3 className="text-xl font-bold text-[#2F4156] mt-4 mb-3">Weeks of grepping through spaghetti code.</h3>
              <p className="text-[#567C8D] leading-relaxed">
                Tracing dead-end API routes. Hoping the outdated documentation is accurate. Onboarding takes forever. Critical bugs hide in the architecture.
              </p>
            </div>

            {/* New way */}
            <div className="relative p-8 md:p-10 rounded-2xl bg-[#2F4156] border border-[#567C8D]/40 overflow-hidden shadow-md">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#C8D9E6] to-[#C8D9E6]/0" />
              <span className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em]">With CodeAtlas</span>
              <h3 className="text-xl font-bold text-[#FFFFFF] mt-4 mb-3">An instant architectural blueprint.</h3>
              <p className="text-[#C8D9E6]/85 leading-relaxed">
                We extract an AST-backed Knowledge Graph, infer the business domain, and map exactly where payments, refunds, and user journeys happen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS: Pipeline ─── */}
      <section className="py-28 px-6 bg-[#FFFFFF] border-y border-[#C8D9E6]/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#567C8D] uppercase tracking-[0.2em]">How it works</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#2F4156] mt-4 tracking-tight">
              Six steps to full understanding
            </h2>
            <p className="text-[#567C8D] mt-4 max-w-xl mx-auto leading-relaxed">
              We don&apos;t rely on fuzzy embeddings. We parse the hard AST first, then apply domain-aware LLM reasoning to the graph.
            </p>
          </div>

          <div className="h-[520px]">
            <DepthCarousel
              items={pipelineSteps.map((step, idx) => ({
                content: (
                  <div className="relative flex flex-col w-full h-full justify-start items-start text-left p-7 pt-10">
                    {/* Step badge */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center bg-[#C8D9E6]/20 text-[#C8D9E6] border border-[#C8D9E6]/30">
                      {idx + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[#C8D9E6] text-[#2F4156]">
                      {step.icon}
                    </div>

                    {/* Title & subtitle */}
                    <h3 className="text-lg font-bold uppercase tracking-wider text-[#FFFFFF] mb-1">
                      {step.label}
                    </h3>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#C8D9E6]/70 mb-3">
                      {step.desc}
                    </span>

                    {/* Description */}
                    <p className="text-[13px] leading-relaxed text-[#C8D9E6]/90 mb-4">
                      {step.detail}
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-1.5 mt-auto">
                      {step.highlights.map((h, hi) => (
                        <li key={hi} className="flex items-center gap-2 text-[12px] text-[#C8D9E6]/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C8D9E6]/50 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
                label: step.label
              }))}
              cardWidth={300}
              cardHeight={420}
              radius={20}
              tint="#2F4156"
              depth={180}
              spread={100}
              tilt={18}
              tiltDirection="right"
              perspective={1200}
              visibleCards={3}
              falloff={0.25}
              blur={4}
              duration={600}
              ease="power3.out"
              autoplay
              autoplayDelay={2500}
              loop
              showControls
              showIndicators
            />
          </div>
        </div>
      </section>

      {/* ─── CAPABILITIES: Bento Grid (Facet-style) ─── */}
      <section className="py-28 px-6 bg-[#F5EFEB]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold text-[#567C8D] uppercase tracking-[0.2em]">Capabilities</span>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#2F4156] mt-4 tracking-tight">
              Business-level insight from code
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 — Capability Intelligence */}
            <div className="group p-8 rounded-2xl bg-[#FFFFFF] border border-[#C8D9E6] hover:border-[#567C8D] transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(47,65,86,0.1)]">
              <div className="w-10 h-10 rounded-xl bg-[#567C8D]/15 flex items-center justify-center mb-5 group-hover:bg-[#2F4156] group-hover:text-[#C8D9E6] text-[#567C8D] transition-all duration-300">
                <Zap size={18} />
              </div>
              <h3 className="text-lg font-bold text-[#2F4156] mb-2">Capability Intelligence</h3>
              <p className="text-[#567C8D] text-sm leading-relaxed mb-5">
                Identifies high-level features from low-level files automatically.
              </p>
              <div className="p-4 rounded-xl bg-[#F5EFEB] border border-[#C8D9E6]/60">
                <span className="text-[10px] font-bold text-[#567C8D] uppercase tracking-[0.15em]">Example</span>
                <p className="text-xs text-[#567C8D] mt-1">
                  Classifies <code className="text-[#2F4156] font-semibold bg-[#C8D9E6]/50 px-1 rounded">stripe.js</code> and <code className="text-[#2F4156] font-semibold bg-[#C8D9E6]/50 px-1 rounded">/charge</code> routes as a <span className="font-bold text-[#2F4156]">Payments</span> capability.
                </p>
              </div>
            </div>

            {/* Card 2 — Journey Reconstruction */}
            <div className="group p-8 rounded-2xl bg-[#FFFFFF] border border-[#C8D9E6] hover:border-[#567C8D] transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(47,65,86,0.1)]">
              <div className="w-10 h-10 rounded-xl bg-[#567C8D]/15 flex items-center justify-center mb-5 group-hover:bg-[#2F4156] group-hover:text-[#C8D9E6] text-[#567C8D] transition-all duration-300">
                <GitBranch size={18} />
              </div>
              <h3 className="text-lg font-bold text-[#2F4156] mb-2">Journey Reconstruction</h3>
              <p className="text-[#567C8D] text-sm leading-relaxed mb-5">
                Traces end-to-end execution paths deterministically through the graph.
              </p>
              <div className="p-4 rounded-xl bg-[#F5EFEB] border border-[#C8D9E6]/60">
                <span className="text-[10px] font-bold text-[#567C8D] uppercase tracking-[0.15em]">Example</span>
                <p className="text-xs text-[#567C8D] mt-1">
                  Maps <span className="font-bold text-[#2F4156]">Add to Cart</span> → POST <code className="bg-[#C8D9E6]/50 px-1 rounded text-[#2F4156]">/cart</code> → <code className="bg-[#C8D9E6]/50 px-1 rounded text-[#2F4156]">CartDB</code> table.
                </p>
              </div>
            </div>

            {/* Card 3 — Logic Gap Detection */}
            <div className="group p-8 rounded-2xl bg-[#FFFFFF] border border-[#C8D9E6] hover:border-[#567C8D] transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(47,65,86,0.1)]">
              <div className="w-10 h-10 rounded-xl bg-[#567C8D]/15 flex items-center justify-center mb-5 group-hover:bg-[#2F4156] group-hover:text-[#C8D9E6] text-[#567C8D] transition-all duration-300">
                <Shield size={18} />
              </div>
              <h3 className="text-lg font-bold text-[#2F4156] mb-2">Logic Gap Detection</h3>
              <p className="text-[#567C8D] text-sm leading-relaxed mb-5">
                Flags missing business flows based on the inferred domain model.
              </p>
              <div className="p-4 rounded-xl bg-[#F5EFEB] border border-[#C8D9E6]/60">
                <span className="text-[10px] font-bold text-[#E57373] uppercase tracking-[0.15em]">Gap Found</span>
                <p className="text-xs text-[#567C8D] mt-1">
                  Detects a <span className="font-bold text-[#E57373]">Missing Refund Flow</span> in an E-commerce repository.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY NOT COPILOT ─── */}
      <section className="py-28 px-6 bg-[#2F4156]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[11px] font-bold text-[#C8D9E6] uppercase tracking-[0.2em]">Different by design</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#FFFFFF] mt-4 tracking-tight leading-snug">
            Copilot writes the next 50 lines.<br />
            <span className="text-[#C8D9E6]">CodeAtlas understands the entire system.</span>
          </h2>
          <p className="text-[#C8D9E6]/80 mt-6 text-lg leading-relaxed max-w-2xl mx-auto">
            AI coding assistants lack the macro-level context to tell you if the refund architecture is missing, or how the payment service interacts with inventory. CodeAtlas operates at the business architecture level.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-28 px-6 bg-[#FFFFFF] border-y border-[#C8D9E6]/60">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-[#2F4156] tracking-tight leading-tight">
            Ready to understand<br />your software?
          </h2>
          <p className="text-[#567C8D] mt-5 text-lg leading-relaxed max-w-xl mx-auto">
            Upload any repository and discover its architecture, capabilities, user journeys, and hidden logic gaps.
          </p>
          <div className="flex justify-center gap-4 mt-10 flex-col sm:flex-row items-center">
            <Link
              href={isLoggedIn ? '/dashboard/upload' : '/login'}
              className="group flex items-center gap-3 px-8 py-4 bg-[#2F4156] text-[#FFFFFF] rounded-xl font-semibold text-sm tracking-wide hover:bg-[#1F2D3D] transition-all duration-300 shadow-[0_20px_40px_-12px_rgba(47,65,86,0.2)]"
            >
              Analyze Repository
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <a
              href="https://github.com/neevrambhia06/CodeAtlas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 border border-[#C8D9E6] text-[#2F4156] rounded-xl font-semibold text-sm tracking-wide hover:bg-[#C8D9E6]/30 transition-all duration-300"
            >
              <GitBranch size={14} />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER: Sticky Reveal (Motion UI) ─── */}
      <FooterReveal />

    </main>
  );
}
