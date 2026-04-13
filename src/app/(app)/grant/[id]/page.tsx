'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Grant, type Section } from '@/types'
import { countWords, daysUntil, formatDate } from '@/lib/utils'

interface SectionState extends Section {
  localContent: string
  dirty: boolean
}

export default function GrantEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [grant, setGrant] = useState<Grant | null>(null)
  const [sections, setSections] = useState<SectionState[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  // Per-section generation state
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [regenInstruction, setRegenInstruction] = useState<Record<string, string>>({})
  const [showSources, setShowSources] = useState<Record<string, boolean>>({})

  // Export
  const [exporting, setExporting] = useState(false)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  const loadGrant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: org } = await supabase.from('kg_organizations').select('id').eq('owner_id', user.id).single()
    if (org) setOrgId(org.id)

    const { data: g } = await supabase.from('kg_grants').select('*').eq('id', id).single()
    if (!g) { router.push('/grants'); return }
    setGrant(g)

    const { data: secs } = await supabase
      .from('kg_sections')
      .select('*')
      .eq('grant_id', id)
      .order('created_at')

    const withLocal: SectionState[] = (secs || []).map((s) => ({
      ...s,
      localContent: s.user_edited || s.ai_draft || '',
      dirty: false,
    }))
    setSections(withLocal)
    if (withLocal.length > 0) setActiveSection(withLocal[0].id)
    setLoading(false)
  }, [id, router, supabase])

  useEffect(() => { loadGrant() }, [loadGrant])

  // Auto-save
  function markDirty(sectionId: string, content: string) {
    setSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, localContent: content, dirty: true, word_count: countWords(content) } : s)
    )
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveSection(sectionId, content), 30000)
  }

  async function saveSection(sectionId: string, content?: string) {
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec) return
    const toSave = content ?? sec.localContent
    await supabase
      .from('kg_sections')
      .update({ user_edited: toSave, word_count: countWords(toSave), updated_at: new Date().toISOString() })
      .eq('id', sectionId)
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, dirty: false } : s))
  }

  async function saveAllDirty() {
    const dirty = sections.filter((s) => s.dirty)
    for (const s of dirty) await saveSection(s.id)
  }

  async function generateSection(sectionId: string) {
    if (!orgId || !grant) return
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec) return

    setGenerating((prev) => ({ ...prev, [sectionId]: true }))

    const res = await fetch('/api/generate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_id: grant.id,
        section_id: sectionId,
        section_name: sec.section_name,
        funder_name: grant.funder_name,
        program_name: grant.program_name,
        special_instructions: grant.special_instructions,
        word_limit: sec.word_limit,
        regen_instruction: regenInstruction[sectionId] || undefined,
        org_id: orgId,
      }),
    })

    const data = await res.json()

    if (data.content) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                ai_draft: data.content,
                localContent: data.content,
                sources_used: data.sources_used || [],
                data_gaps: data.data_gaps || [],
                word_count: data.word_count || countWords(data.content),
                dirty: false,
              }
            : s
        )
      )
      // Update DB
      await supabase.from('kg_sections').update({
        ai_draft: data.content,
        sources_used: data.sources_used || [],
        data_gaps: data.data_gaps || [],
        word_count: data.word_count || countWords(data.content),
        version: (sec.version || 1) + 1,
      }).eq('id', sectionId)
    }

    setGenerating((prev) => ({ ...prev, [sectionId]: false }))
    setRegenInstruction((prev) => ({ ...prev, [sectionId]: '' }))
  }

  async function exportGrant(format: 'docx' | 'pdf') {
    if (!grant) return
    setExporting(true)
    await saveAllDirty()

    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_id: grant.id, format }),
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${grant.funder_name} - ${grant.program_name || 'Grant'}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="writing-animation text-2xl mb-2">✍</div>
          <p className="text-sm">Loading grant editor...</p>
        </div>
      </div>
    )
  }

  if (!grant) return null

  const activeSecData = sections.find((s) => s.id === activeSection)
  const completedCount = sections.filter((s) => s.localContent.length > 0).length
  const completionPct = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0
  const days = grant.deadline ? daysUntil(grant.deadline) : null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Section sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 text-sm truncate">{grant.funder_name}</h2>
          <p className="text-xs text-gray-400 truncate">{grant.program_name || 'Grant Application'}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Completion</span>
              <span>{completionPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-700 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map((sec) => {
            const hasContent = sec.localContent.length > 0
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                onClick={() => { setActiveSection(sec.id); saveAllDirty() }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasContent ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="truncate">{sec.section_name}</span>
                  {sec.dirty && <span className="text-amber-500 text-xs ml-auto">•</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Export */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Export</p>
          <button
            onClick={() => exportGrant('docx')}
            disabled={exporting}
            className="w-full text-sm py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            ↓ Word (.docx)
          </button>
          <button
            onClick={() => exportGrant('pdf')}
            disabled={exporting}
            className="w-full text-sm py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50"
          >
            ↓ PDF
          </button>
        </div>
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/grants')} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">{grant.funder_name}</h1>
              {days !== null && (
                <p className={`text-xs ${days <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {days <= 0 ? 'Past deadline' : `${days} days until deadline`}
                  {grant.deadline && ` · ${formatDate(grant.deadline)}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={saveAllDirty}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            Save
          </button>
        </div>

        {/* Active section editor */}
        {activeSecData ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-gray-900">{activeSecData.section_name}</h2>
                  {activeSecData.word_limit && (
                    <p className="text-sm text-gray-400 mt-1">
                      {activeSecData.word_count || 0} / {activeSecData.word_limit} words
                    </p>
                  )}
                  {!activeSecData.word_limit && activeSecData.word_count !== null && (
                    <p className="text-sm text-gray-400 mt-1">{activeSecData.word_count} words</p>
                  )}
                </div>

                {/* Generate button */}
                {!activeSecData.localContent ? (
                  <button
                    onClick={() => generateSection(activeSecData.id)}
                    disabled={generating[activeSecData.id]}
                    className="btn-gold text-sm py-2 px-4 flex items-center gap-2"
                  >
                    {generating[activeSecData.id] ? (
                      <>
                        <span className="writing-animation">✍</span>
                        Writing...
                      </>
                    ) : (
                      <>✨ Generate Section</>
                    )}
                  </button>
                ) : null}
              </div>

              {/* Loading state */}
              {generating[activeSecData.id] && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
                  <div className="writing-animation text-3xl mb-3">✍</div>
                  <p className="text-green-800 font-medium text-sm">Searching your documents...</p>
                  <p className="text-green-600 text-xs mt-1">Writing narrative grounded in your data</p>
                </div>
              )}

              {/* Text area */}
              <textarea
                value={activeSecData.localContent}
                onChange={(e) => markDirty(activeSecData.id, e.target.value)}
                placeholder="Click 'Generate Section' to draft this section from your knowledge base, or type directly..."
                className="w-full min-h-96 text-base leading-relaxed text-gray-800 border-0 resize-none focus:outline-none font-serif"
                style={{ fontFamily: 'Lora, Georgia, serif', lineHeight: '1.9', fontSize: '1rem' }}
              />

              {/* Data gaps */}
              {activeSecData.data_gaps && activeSecData.data_gaps.length > 0 && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">⚠ Data Needed</h3>
                  <p className="text-xs text-amber-600 mb-2">The AI flagged these items as missing from your uploaded documents:</p>
                  <ul className="space-y-1">
                    {activeSecData.data_gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-500 mt-3">
                    Upload the relevant documents to the{' '}
                    <a href="/vault" className="underline">Knowledge Vault</a>{' '}
                    and regenerate this section.
                  </p>
                </div>
              )}

              {/* Regenerate */}
              {activeSecData.localContent && !generating[activeSecData.id] && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Regenerate with instructions</h3>
                  <div className="flex gap-3">
                    <input
                      value={regenInstruction[activeSecData.id] || ''}
                      onChange={(e) => setRegenInstruction((prev) => ({ ...prev, [activeSecData.id]: e.target.value }))}
                      className="input-field flex-1 text-sm py-2"
                      placeholder="e.g. 'Make it shorter' or 'Emphasize our rural impact'"
                    />
                    <button
                      onClick={() => generateSection(activeSecData.id)}
                      className="btn-outline-green text-sm py-2 whitespace-nowrap"
                    >
                      ↻ Regenerate
                    </button>
                  </div>
                </div>
              )}

              {/* Sources */}
              {activeSecData.sources_used && activeSecData.sources_used.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowSources((prev) => ({ ...prev, [activeSecData.id]: !prev[activeSecData.id] }))}
                    className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showSources[activeSecData.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Sources used ({activeSecData.sources_used.length})
                  </button>
                  {showSources[activeSecData.id] && (
                    <ul className="mt-2 space-y-1">
                      {activeSecData.sources_used.map((src, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                          <span className="text-green-500">↗</span>
                          {src}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a section from the sidebar to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
