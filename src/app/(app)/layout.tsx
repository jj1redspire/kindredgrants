import AppShell from '@/components/app/AppShell'

// All app pages are authenticated and runtime-only — never pre-render
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
