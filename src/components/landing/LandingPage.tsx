'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Logo ────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <span className="text-xl font-bold tracking-tight">
      <span className="font-serif text-gray-900">Kindred</span>
      <span className="font-serif text-green-800">Grants</span>
    </span>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 hidden md:inline">
            How It Works
          </a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 hidden md:inline">
            Pricing
          </a>
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/setup" className="btn-gold text-sm py-2 px-4">
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-block bg-green-50 text-green-800 text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-green-200">
          Built for nonprofit grant professionals
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Grant Applications Written With{' '}
          <span className="text-green-800">YOUR Data.</span>{' '}
          Not Generic Templates.
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-10">
          KindredGrants indexes your 990s, financials, outcomes data, and past grants. When a funding
          opportunity appears, AI drafts a complete narrative using your organization&apos;s real story
          — not boilerplate someone else wrote.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/setup" className="btn-gold-lg">
            Start Free Trial — No Credit Card
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Upload your documents once. Write grants forever.
        </p>
      </div>
    </section>
  )
}

// ─── Problem ──────────────────────────────────────────────────────────────────
function Problem() {
  const problems = [
    {
      title: 'Freelance grant writers charge $1,500–5,000 per application',
      body: 'And they still ask YOU for all the data. You spend hours compiling documents they use to write generic narratives that could be about any organization.',
    },
    {
      title: 'Your best grant writer is your institutional memory',
      body: 'The person who knows your history, your outcomes, your relationships with funders. When they leave, that knowledge walks out the door.',
    },
    {
      title: 'Templates don\'t win grants',
      body: 'Funders read thousands of applications. They can spot template language instantly. What wins is specificity — real numbers, real outcomes, real stories from YOUR organization.',
    },
  ]

  return (
    <section className="py-20" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">The Problem</p>
          <h2 className="section-heading">Grant Writing Shouldn&apos;t Cost $3,000 Per Application</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border-l-4 border-green-800 shadow-sm">
              <h3 className="font-serif font-bold text-gray-900 text-lg mb-3 leading-snug">{p.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Upload Your Documents',
      body: '990 tax returns, financial statements, board bios, program descriptions, past successful grants, outcomes data. KindredGrants indexes everything and builds your organization\'s knowledge base.',
    },
    {
      n: '2',
      title: 'Start a Grant Application',
      body: 'Enter the funder name, program, deadline, and requirements. KindredGrants generates each section — organizational background, statement of need, project description, budget narrative, evaluation plan — pulling directly from YOUR data.',
    },
    {
      n: '3',
      title: 'Review, Edit, Submit',
      body: 'Every section uses your real numbers, real outcomes, real team. Edit inline, regenerate any section with adjusted instructions, export as Word doc or PDF matching the funder\'s format.',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">How It Works</p>
          <h2 className="section-heading">Upload Once. Write Every Grant From Your Own Story.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-800 text-white font-serif font-bold text-2xl flex items-center justify-center mx-auto mb-5">
                {s.n}
              </div>
              <h3 className="font-serif font-bold text-gray-900 text-xl mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Before / After ──────────────────────────────────────────────────────────
function BeforeAfter() {
  return (
    <section className="py-20" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">See The Difference</p>
          <h2 className="section-heading">Generic Template vs. KindredGrants</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Generic */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="inline-block bg-gray-100 text-gray-500 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded mb-6">
              Generic Template
            </div>
            <p className="font-serif text-gray-400 leading-relaxed italic text-base">
              &ldquo;Our organization has served the community for over 20 years, providing vital services
              to underserved populations. We have a dedicated team of professionals committed to making
              a difference and delivering high-quality programs that meet community needs...&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-red-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Could describe any organization anywhere
            </div>
          </div>

          {/* KindredGrants */}
          <div className="bg-white rounded-xl border-2 border-green-700 p-8">
            <div className="inline-block bg-green-100 text-green-800 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded mb-6">
              KindredGrants
            </div>
            <p className="font-serif text-gray-800 leading-relaxed text-base">
              &ldquo;Since 2003, Horizon Youth Services has provided after-school programming to{' '}
              <strong>2,847 students</strong> across{' '}
              <strong>12 sites in Marion County</strong>. In FY2025,{' '}
              <strong>94% of enrolled students improved their reading scores by at least one grade level</strong>,
              and our staff retention rate of <strong>89%</strong> ensures continuity of relationships
              with the families we serve...&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-green-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Every number traced to your uploaded documents
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Data Sources ─────────────────────────────────────────────────────────────
function DataSources() {
  const flows = [
    { doc: '990 Tax Returns', output: 'Organizational budget, revenue sources, program expenses' },
    { doc: 'Financial Statements', output: 'Fiscal health, sustainability, cost-effectiveness ratios' },
    { doc: 'Board Bios', output: 'Leadership qualifications, community connections, governance' },
    { doc: 'Past Grants', output: 'Proven funder relationships, successful project models' },
    { doc: 'Outcomes Data', output: 'Measurable impact, participant numbers, success rates' },
    { doc: 'Program Descriptions', output: 'Service models, target populations, geographic reach' },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Your Data Becomes Your Narrative</p>
          <h2 className="section-heading">Every Claim Backed by Your Real Numbers</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {flows.map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-gray-900 text-sm">{f.doc}</span>
                <svg className="inline w-4 h-4 mx-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-gray-600 text-sm">{f.output}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Who It's For ─────────────────────────────────────────────────────────────
function WhoItsFor() {
  const groups = [
    {
      title: 'Small nonprofits without grant staff',
      body: 'You do everything yourself. KindredGrants gives you a grant writer that knows your organization as well as you do.',
    },
    {
      title: 'Grant consultants managing multiple clients',
      body: 'Upload each client\'s documents separately. Switch between organizations instantly. Write more grants in less time.',
    },
    {
      title: 'Community foundations',
      body: 'Help your grantees submit stronger applications with data-driven narratives grounded in their real work.',
    },
    {
      title: 'Programs applying for government funding',
      body: 'Federal, state, and local grants with strict formatting requirements. KindredGrants matches the format.',
    },
  ]

  return (
    <section className="py-20" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Built For</p>
          <h2 className="section-heading">Every Organization That Writes Grants</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map((g, i) => (
            <div key={i} className="bg-white rounded-xl p-7 shadow-sm border border-gray-100">
              <h3 className="font-serif font-bold text-gray-900 text-lg mb-3">{g.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{g.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const features = [
    'Unlimited grant applications',
    'Unlimited document uploads',
    'AI-powered narrative generation',
    'Section-by-section editing',
    'Word doc and PDF export',
    'Organization knowledge base',
    'Funder requirement matching',
    'Direct knowledge base queries',
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Pricing</p>
          <h2 className="section-heading">Less Than 3% of What a Freelance Grant Writer Charges</h2>
        </div>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-green-700 p-10 shadow-lg text-center">
            <div className="font-serif text-6xl font-bold text-gray-900 mb-1">$49</div>
            <div className="text-gray-500 mb-8 text-lg">/month</div>
            <ul className="text-left space-y-3 mb-10">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 text-sm">
                  <svg className="w-5 h-5 text-green-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/setup" className="btn-gold-lg w-full block text-center">
              Start Free Trial
            </Link>
            <p className="mt-4 text-xs text-gray-500">14-day free trial. No credit card required. Cancel anytime.</p>
          </div>
          <p className="text-center mt-6 text-sm text-gray-500">
            Managing multiple organizations?{' '}
            <a href="mailto:joel@ashwardgroup.com" className="text-green-800 hover:underline font-medium">
              Contact us for consultant pricing.
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    {
      q: 'How is this different from ChatGPT?',
      a: "ChatGPT doesn't know your organization. It generates generic content. KindredGrants is grounded in YOUR uploaded documents — your real 990s, your real outcomes, your real history. Every sentence it writes can be traced back to your data.",
    },
    {
      q: 'Will funders know AI helped write this?',
      a: 'KindredGrants generates drafts using your data. You review, edit, and finalize every section. The output reads like a knowledgeable human wrote it because it\'s based on real information, not templates.',
    },
    {
      q: 'How long does setup take?',
      a: 'Upload your documents in 10 minutes. The system indexes them in seconds. You can start generating grant sections immediately.',
    },
    {
      q: 'What document formats do you accept?',
      a: 'PDF, DOCX, and plain text. We handle the extraction.',
    },
    {
      q: 'Can I customize the writing style?',
      a: "Yes. Adjust tone, specify word limits per section, add instructions like 'emphasize our rural reach' or 'highlight the partnership with the school district.'",
    },
    {
      q: 'Is our data secure?',
      a: 'All documents are encrypted at rest and in transit. Your data is never shared with other organizations or used to train AI models.',
    },
  ]

  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="section-heading">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left p-6 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <span>{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24 bg-green-900 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-5 leading-tight">
          Your Next Grant Application Is Already Written
        </h2>
        <p className="text-green-200 text-lg mb-10 leading-relaxed">
          It&apos;s in your 990s, your outcomes reports, your program descriptions. KindredGrants just assembles it.
        </p>
        <Link href="/setup" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-10 py-5 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
          Start Your Free Trial
        </Link>
        <p className="mt-5 text-green-300 text-sm">No credit card required · Cancel anytime</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-xl font-bold">
          <span className="font-serif text-white">Kindred</span>
          <span className="font-serif text-green-400">Grants</span>
        </span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <a href="mailto:joel@ashwardgroup.com" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-xs text-gray-600">© 2026 KindredGrants. All rights reserved.</p>
      </div>
    </footer>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <BeforeAfter />
        <DataSources />
        <WhoItsFor />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
