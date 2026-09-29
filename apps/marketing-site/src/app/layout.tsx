import type { Metadata } from 'next'
import { Inter, Orbitron, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ChainStatusProvider } from '@/contexts/ChainStatusContext'
import { SophiaProvider } from '@/contexts/SophiaContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'Demiurge-Cloud - The Web-First Metaverse Operating System',
  description: 'Build games, create NFTs, and mine Creator God Token (CGT) on Demiurge-Cloud. Complete documentation, guides, and community resources.',
  keywords: ['blockchain', 'gaming', 'NFT', 'CGT', 'Creator God Token', 'Demiurge', 'Web3', 'metaverse'],
  openGraph: {
    title: 'Demiurge-Cloud',
    description: 'The Web-First Metaverse Operating System',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} font-body antialiased`}>
        <ChainStatusProvider>
          <SophiaProvider>
            <div className="min-h-screen flex flex-col bg-blockchain-dark">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </SophiaProvider>
        </ChainStatusProvider>
      </body>
    </html>
  )
}
