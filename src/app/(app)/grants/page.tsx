'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type Grant } from '@/types'
import { daysUntil, formatDate } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  drafting: 'In Progress',
  review: 'In Review',
  complete: 'Complete',
  submitted: 'Submitted',
}

const STATUS_COLORS: Record<string, string> = {
  drafting: 'bg-blue-100 text-blue-700',
  review: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
}

export default function GrantsPage() {
  const supabase = createClient()
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  const loadGrants = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: org } = await supabase
      .from('kg_organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!org) { setLoading(false); return }
    setOrgId(org.id)

    const { data } = await supabase
      .from('kg_grants')
      .select('*')
      .eq('org_id', org.id)
      .order('updated_at', { ascending: false })

    setGrants(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadGrants() }, [loadGrants])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Grant Applications</h1>
          <p className="text-gray-500 text-sm">{grants.length} application{grants.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link href="/grant/new" className="btn-gold">
          + New Application
        </Link>
      </div>

      {grants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">No grant applications yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            {orgId
              ? 'Start your first grant application and KindredGrants will draft it using your uploaded documents.'
              : 'Complete your organization setup first, then start writing grants.'}
          </p>
          {orgId ? (
            <Link href="/grant/new" className="btn-gold">Start First Application</Link>
          ) : (
            <Link href="/setup" className="btn-gold">Complete Setup</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant) => {
            const days = grant.deadline ? daysUntil(grant.deadline) : null
            const urgency = days !== null && days <= 7

            return (
              <Link
                key={grant.id}
                href={`/grant/${grant.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-green-300 hover:shadow-sm transition-all block"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{grant.funder_name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[grant.status]}`}>
                      {STATUS_LABELS[grant.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{grant.program_name || 'General funding'}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  {grant.deadline && (
                    <p className={`text-sm font-medium ${urgency ? 'text-red-600' : 'text-gray-600'}`}>
                      {days === 0 ? 'Due today' : days! < 0 ? 'Overdue' : `${days}d left`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(grant.updated_at)}</p>
                </div>

                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
