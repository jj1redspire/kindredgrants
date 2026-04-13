'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Document, type DocumentType, DOCUMENT_TYPE_LABELS } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  complete: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

const TYPE_COLORS: Record<DocumentType, string> = {
  '990': 'bg-purple-100 text-purple-700',
  financial: 'bg-blue-100 text-blue-700',
  board_bios: 'bg-orange-100 text-orange-700',
  past_grant: 'bg-green-100 text-green-700',
  program: 'bg-teal-100 text-teal-700',
  outcomes: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function VaultPage() {
  const supabase = createClient()

  const [docs, setDocs] = useState<Document[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState('')
  const [querying, setQuerying] = useState(false)
  const [chunkCount, setChunkCount] = useState(0)

  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: org } = await supabase
      .from('kg_organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org) { setLoading(false); return }
    setOrgId(org.id)

    const { data: documents } = await supabase
      .from('kg_documents')
      .select('*')
      .eq('org_id', org.id)
      .order('uploaded_at', { ascending: false })

    const { count } = await supabase
      .from('kg_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)

    setDocs(documents || [])
    setChunkCount(count || 0)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function uploadFile(file: File, type: DocumentType = 'other') {
    if (!orgId) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('org_id', orgId)
    formData.append('document_type', type)
    await fetch('/api/upload', { method: 'POST', body: formData })
    await loadData()
    setUploading(false)
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Array.from(e.dataTransfer.files).forEach((f) => uploadFile(f))
    },
    // uploadFile depends on orgId; listing orgId is sufficient
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orgId]
  )

  async function runQuery(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !orgId) return
    setQuerying(true)
    setQueryResult('')
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query, org_id: orgId }),
    })
    const data = await res.json()
    setQueryResult(data.answer || data.error || 'No result')
    setQuerying(false)
  }

  const yearsRange = docs.length > 0
    ? `${new Date(docs[docs.length - 1].uploaded_at).getFullYear()}–${new Date(docs[0].uploaded_at).getFullYear()}`
    : '—'

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Knowledge Vault</h1>
        <p className="text-gray-500 text-sm">All indexed documents powering your grant narratives.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Documents Indexed', value: docs.filter((d) => d.processing_status === 'complete').length },
          { label: 'Knowledge Chunks', value: chunkCount.toLocaleString() },
          { label: 'Years of Data', value: yearsRange },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="font-serif text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Query */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">Ask Your Knowledge Base</h2>
        <form onSubmit={runQuery} className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field flex-1"
            placeholder="What were our total expenses in FY2024?"
          />
          <button type="submit" disabled={querying} className="btn-gold px-5 py-2 whitespace-nowrap">
            {querying ? 'Searching...' : 'Ask'}
          </button>
        </form>
        {queryResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {queryResult}
          </div>
        )}
      </div>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('vault-file-input')?.click()}
        className={`drop-zone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer mb-6 ${
          dragging ? 'border-green-600 bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {uploading
          ? <p className="text-gray-600 writing-animation">Processing document...</p>
          : <>
              <p className="text-gray-700 font-medium">Add Documents</p>
              <p className="text-gray-400 text-sm">Drag & drop or click — PDF, DOCX, TXT</p>
            </>
        }
        <input
          id="vault-file-input"
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files && Array.from(e.target.files).forEach((f) => uploadFile(f))}
        />
      </div>

      {/* Document list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No documents yet</p>
          <p className="text-sm">Upload your 990s, financials, and program descriptions to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-900 font-medium truncate max-w-xs">{doc.filename}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[doc.document_type]}`}>
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[doc.processing_status]}`}>
                      {doc.processing_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
