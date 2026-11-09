import type { Metadata } from 'next'
import About from '@/components/About'

export const metadata: Metadata = {
  title: 'The Team · Wise Owl Westgate IGCSE Study Buddy',
  description: 'Ideas by Michael Makadzange. Code by Jayden Ngwenya. The two people behind the Wise Owl Westgate IGCSE Study Buddy.',
}
export default function Page() { return <About /> }
