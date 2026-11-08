import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Wise Owl Westgate IGCSE Study Buddy',
  description: 'Free IGCSE revision for Wise Owl School Westgate: AI tutor, quizzes, flashcards and a focus timer. Ideas by Michael Makadzange, code by Jayden Ngwenya.',
  icons: { icon: '/logo.png', apple: '/icon-192.png' },
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#14183a' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
