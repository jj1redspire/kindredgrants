import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KindredGrants — AI Grant Writing From Your Own Data',
  description:
    "KindredGrants drafts grant narratives using your organization's real 990s, outcomes data, and program descriptions. Not templates — your story.",
  keywords: 'grant writing, nonprofit AI, grant applications, 990, grant narrative',
  openGraph: {
    title: 'KindredGrants — AI Grant Writing From Your Own Data',
    description: "Upload your documents once. Write every grant from your organization's real story.",
    url: 'https://kindredgrants.co',
    siteName: 'KindredGrants',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
