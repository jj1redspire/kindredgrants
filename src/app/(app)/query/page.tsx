'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface QueryResult {
  answer: string
  sources: string[]
}

export default function QueryPage() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [results, setResults] = useState<{ q: string; r: QueryResult }[]>([])
  const [loading, setLoading] = useState(false)

  const EXAMPLE_QUERIES = [
    'What were our total expenses in FY2024?',
    'Who is on our board of directors?',
    'How many participants did we serve last year?',
    'What is our staff retention rate?',
    'What funders have we received grants from?',
    'What is our primary program model?',
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('kg_organizations').select('id').eq('owner_id', user.id).single()
        .then(({ data }) => { if (data) setOrgId(data.id) })
    })
  }, [])

  async function ask(q?: string) {
    const qText = q || question.trim()
    if (!qText || !orgId) return
    setLoading(true)
    setQuestion('')

    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: qText, org_id: orgId }),
    })
    const data = await res.json()

    setResults((prev) => [
      { q: qText, r: { answer: data.answer || data.error || 'No answer found.', sources: data.sources || [] } },
      ...prev,
    ])
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Ask Your Data</h1>
        <p className="text-gray-500 text-sm">Ask any question about your organization and get answers grounded in your uploaded documents.</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            className="input-field flex-1"
            placeholder="What were our total program expenses in FY2024?"
            disabled={loading}
          />
          <button onClick={() => ask()} disabled={loading || !question.trim()} className="btn-gold px-5 py-3 whitespace-nowrap">
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Examples */}
      {results.length === 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="text-sm text-green-800 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 writing-animation mb-4">
          Searching your knowledge base...
        </div>
      )}

      {/* Results */}
      <div className="space-y-5">
        {results.map((result, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {result.q}
            </p>
            <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">{result.r.answer}</p>
            {result.r.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Sources:</p>
                <ul className="space-y-0.5">
                  {result.r.sources.map((src, j) => (
                    <li key={j} className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="text-green-500">↗</span> {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
