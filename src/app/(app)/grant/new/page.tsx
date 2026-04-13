'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SECTIONS } from '@/types'

export default function NewGrantPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orgId, setOrgId] = useState<string | null>(null)
  const [funderName, setFunderName] = useState('')
  const [programName, setProgramName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [fundingAmount, setFundingAmount] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS)
  const [customSection, setCustomSection] = useState('')
  const [customSections, setCustomSections] = useState<string[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('kg_organizations').select('id').eq('owner_id', user.id).single()
        .then(({ data }) => { if (data) setOrgId(data.id) })
    })
  }, [])

  function toggleSection(section: string) {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )
  }

  function addCustomSection() {
    if (!customSection.trim()) return
    setCustomSections((prev) => [...prev, customSection.trim()])
    setSelectedSections((prev) => [...prev, customSection.trim()])
    setCustomSection('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) { setError('Organization not found. Complete setup first.'); return }
    setSaving(true)
    setError('')

    const allSections = [...selectedSections, ...customSections.filter((cs) => !selectedSections.includes(cs))]

    const { data: grant, error: err } = await supabase
      .from('kg_grants')
      .insert({
        org_id: orgId,
        funder_name: funderName,
        program_name: programName || null,
        deadline: deadline || null,
        funding_amount: fundingAmount ? parseFloat(fundingAmount) : null,
        required_sections: allSections,
        special_instructions: specialInstructions || null,
      })
      .select()
      .single()

    if (err) { setError(err.message); setSaving(false); return }

    // Create section rows
    if (allSections.length > 0) {
      await supabase.from('kg_sections').insert(
        allSections.map((name) => ({ grant_id: grant.id, section_name: name }))
      )
    }

    router.push(`/grant/${grant.id}`)
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">New Grant Application</h1>
        <p className="text-gray-500 text-sm">Fill in the funder details and KindredGrants will draft each section from your knowledge base.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Funder details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Funder Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Funder Name *</label>
              <input required value={funderName} onChange={(e) => setFunderName(e.target.value)} className="input-field" placeholder="Robert Wood Johnson Foundation" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Grant Program</label>
              <input value={programName} onChange={(e) => setProgramName(e.target.value)} className="input-field" placeholder="Youth Health Initiative 2026" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested ($)</label>
              <input type="number" min="0" step="1000" value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} className="input-field" placeholder="75000" />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Required Sections</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {DEFAULT_SECTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(s)}
                  onChange={() => toggleSection(s)}
                  className="rounded border-gray-300 text-green-700 focus:ring-green-700"
                />
                <span className="text-sm text-gray-700">{s}</span>
              </label>
            ))}
            {customSections.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(s)}
                  onChange={() => toggleSection(s)}
                  className="rounded border-gray-300 text-green-700 focus:ring-green-700"
                />
                <span className="text-sm text-gray-700">{s}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSection())}
              className="input-field flex-1 text-sm py-2"
              placeholder="Add custom section..."
            />
            <button type="button" onClick={addCustomSection} className="btn-outline-green py-2 text-sm">
              Add
            </button>
          </div>
        </div>

        {/* Special instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Special Instructions</h2>
          <p className="text-sm text-gray-500 mb-3">Guidance for the AI when generating this application. Examples: &ldquo;emphasize rural reach&rdquo;, &ldquo;highlight partnership with school district&rdquo;</p>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={3}
            className="input-field resize-none text-sm"
            placeholder="Any specific focus areas, tone preferences, or requirements from the funder's RFP..."
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-gold flex-1 py-3">
            {saving ? 'Creating...' : 'Create Grant Application →'}
          </button>
        </div>
      </form>
    </div>
  )
}
