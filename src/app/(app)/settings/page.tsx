'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Organization } from '@/types'

export default function SettingsPage() {
  const supabase = createClient()

  const [org, setOrg] = useState<Organization | null>(null)
  const [name, setName] = useState('')
  const [ein, setEin] = useState('')
  const [mission, setMission] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')
  const [subscription, setSubscription] = useState<{ status: string; current_period_end: string | null } | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setEmail(user.email || '')

      const { data: o } = await supabase
        .from('kg_organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (o) {
        setOrg(o)
        setName(o.name)
        setEin(o.ein || '')
        setMission(o.mission || '')
      }

      const { data: sub } = await supabase
        .from('kg_subscriptions')
        .select('status, current_period_end')
        .eq('org_id', o?.id)
        .single()

      if (sub) setSubscription(sub)
    })
  }, [])

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!org) return
    setSaving(true)
    await supabase
      .from('kg_organizations')
      .update({ name, ein: ein || null, mission: mission || null })
      .eq('id', org.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  async function startSubscription() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your organization profile and billing.</p>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Organization Profile</h2>
        <form onSubmit={saveOrg} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EIN</label>
            <input value={ein} onChange={(e) => setEin(e.target.value)} className="input-field" placeholder="12-3456789" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mission Statement</label>
            <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={3} className="input-field resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-gold py-2">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="text-green-600 text-sm">Saved ✓</span>}
          </div>
        </form>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Email:</span> {email}
        </p>
      </div>

      {/* Billing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Billing</h2>
        {subscription ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                subscription.status === 'active' || subscription.status === 'trialing'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {subscription.status}
              </span>
              <span className="text-sm text-gray-600">KindredGrants Pro · $49/month</span>
            </div>
            {subscription.current_period_end && (
              <p className="text-sm text-gray-500 mb-4">
                {subscription.status === 'trialing' ? 'Trial ends' : 'Renews'}{' '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            <button onClick={openBillingPortal} disabled={portalLoading} className="btn-outline-green text-sm py-2 px-4">
              {portalLoading ? 'Loading...' : 'Manage Billing →'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">You&apos;re on the free trial. Subscribe to continue after 14 days.</p>
            <button onClick={startSubscription} disabled={portalLoading} className="btn-gold">
              {portalLoading ? 'Loading...' : 'Subscribe — $49/month'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
