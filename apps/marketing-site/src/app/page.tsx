import Link from 'next/link'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { CGTShowcase } from '@/components/CGTShowcase'
import { QuickLinks } from '@/components/QuickLinks'
import { ChainStatusBanner } from '@/components/ChainStatusBanner'
import { SophiaChat } from '@/components/SophiaChat'

export default function Home() {
  return (
    <div className="min-h-screen">
      <ChainStatusBanner />
      <Hero />
      <Features />
      <CGTShowcase />
      <QuickLinks />
      <SophiaChat />
    </div>
  )
}
