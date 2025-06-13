import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MSC Cruise Manager',
  description: 'Find and compare your perfect MSC cruise vacation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
} 