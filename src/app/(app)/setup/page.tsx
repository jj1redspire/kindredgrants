'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/types'

const STEPS = ['Organization Info', 'Upload Documents']
const DOC_TYPES = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]

interface UploadFile {
  file: File
  type: DocumentType
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [orgName, setOrgName] = useState('')
  const [ein, setEin] = useState('')
  const [mission, setMission] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragging, setDragging] = useState(false)

  // ── Step 1: Save org ───────────────────────────────────────────────────────
  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error: err } = await supabase
      .from('kg_organizations')
      .insert({ owner_id: user.id, name: orgName, ein: ein || null, mission: mission || null })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }
    setOrgId(data.id)
    setSaving(false)
    setStep(1)
  }

  // ── Step 2: File handling ──────────────────────────────────────────────────
  function addFiles(newFiles: FileList) {
    const allowed = Array.from(newFiles).filter((f) =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type)
    )
    setFiles((prev) => [
      ...prev,
      ...allowed.map((f) => ({ file: f, type: 'other' as DocumentType, status: 'pending' as const })),
    ])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }, [])

  function setFileType(index: number, type: DocumentType) {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)))
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadAll() {
    if (!orgId) return
    setSaving(true)

    const updated = [...files]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'done') continue
      updated[i].status = 'uploading'
      setFiles([...updated])

      try {
        const formData = new FormData()
        formData.append('file', updated[i].file)
        formData.append('org_id', orgId)
        formData.append('document_type', updated[i].type)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(await res.text())

        updated[i].status = 'done'
      } catch (err) {
        updated[i].status = 'error'
        updated[i].errorMsg = err instanceof Error ? err.message : 'Upload failed'
      }
      setFiles([...updated])
    }

    setSaving(false)
  }

  async function finish() {
    router.push('/grants')
  }

  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const anyPending = files.some((f) => f.status === 'pending')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF5' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === step ? 'bg-green-800 text-white' : i < step ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Org Info */}
        {step === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Tell us about your organization</h1>
            <p className="text-gray-500 text-sm mb-8">This information helps KindredGrants personalize your grant narratives.</p>

            <form onSubmit={saveOrg} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                <input
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input-field"
                  placeholder="Horizon Youth Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EIN <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={ein}
                  onChange={(e) => setEin(e.target.value)}
                  className="input-field"
                  placeholder="12-3456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mission Statement <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Describe your organization's mission in one paragraph..."
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button type="submit" disabled={saving} className="btn-gold w-full py-3">
                {saving ? 'Saving...' : 'Continue to Upload Documents →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">Upload your documents</h1>
            <p className="text-gray-500 text-sm mb-8">
              Upload your 990s, financials, program descriptions, and past grants. KindredGrants will index everything.
              <br /><span className="text-gray-400">You can always add more documents later from the Knowledge Vault.</span>
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`drop-zone border-2 border-dashed rounded-xl p-10 text-center cursor-pointer mb-6 ${
                dragging ? 'border-green-600 bg-green-50 drag-over' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-700 font-medium">Drag & drop files here, or click to browse</p>
              <p className="text-gray-400 text-sm mt-1">PDF, DOCX, TXT — up to 20MB each</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-3 mb-6">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {f.status === 'done' && (
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</span>
                      )}
                      {f.status === 'error' && (
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">✗</span>
                      )}
                      {(f.status === 'pending' || f.status === 'uploading') && (
                        <span className={`w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs ${f.status === 'uploading' ? 'writing-animation' : ''}`}>
                          {f.status === 'uploading' ? '⋯' : '·'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                      {f.errorMsg && <p className="text-xs text-red-500">{f.errorMsg}</p>}
                    </div>
                    <select
                      value={f.type}
                      onChange={(e) => setFileType(i, e.target.value as DocumentType)}
                      disabled={f.status === 'done' || f.status === 'uploading'}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
                    >
                      {DOC_TYPES.map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeFile(i)}
                      disabled={f.status === 'uploading'}
                      className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {anyPending && (
                <button onClick={uploadAll} disabled={saving} className="btn-gold flex-1 py-3">
                  {saving ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} Document${files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}`}
                </button>
              )}
              <button
                onClick={finish}
                className={`py-3 px-6 rounded-lg font-semibold transition-colors ${
                  allDone || files.length === 0
                    ? 'btn-gold flex-1'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {allDone ? 'Go to Dashboard →' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
