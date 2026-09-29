import type { Metadata } from 'next'
import { Rajdhani, Barlow, JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { MusicProvider } from '@/contexts/MusicContext'
import { VYBProvider } from '@/contexts/VYBContext'
import { VoiceProvider } from '@/contexts/VoiceContext'
import { ContextMenuProvider } from '@/contexts/ContextMenuContext'
import { StarfieldBackground, HeaderBar } from '@/components/Launcher'
import { MusicPlayer } from '@/components/music/MusicPlayer'
import { AuthGate } from '@/components/auth/AuthGate'
import { TerminalButton } from '@/components/terminal'
import { SophiaChatButton } from '@/components/sophia'
import './globals.css'

// ═══════════════════════════════════════════════════════════════════════════
// DEMIURGE OS - Root Layout
// "The Architect" - Cyber-Industrial Command Center Aesthetic
// Typography: Rajdhani (Headings) + Barlow (Body) + JetBrains Mono (Data)
// ═══════════════════════════════════════════════════════════════════════════

// Display/Heading font - Sharp, tactical, uppercase-friendly
const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

// Body font - Humanist grotesque for perfect legibility
const barlow = Barlow({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-barlow',
  display: 'swap',
})

// Monospace font - For data, addresses, code
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Demiurge - The Metaverse Operating System',
  description: 'The central hub for the Demiurge ecosystem - games, social, music, and blockchain',
  keywords: ['blockchain', 'metaverse', 'games', 'music', 'social', 'NFT', 'crypto'],
  authors: [{ name: 'Demiurge Team' }],
  openGraph: {
    title: 'Demiurge - The Metaverse Operating System',
    description: 'Experience the future of digital interaction',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${rajdhani.variable} ${barlow.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`${barlow.className} font-body antialiased`}>
        {/* React Query for data fetching */}
        <QueryProvider>
          {/* Toast notifications */}
          <ToastProvider />
          
          {/* Global error boundary */}
          <ErrorBoundary>
            <AuthProvider>
              {/* AuthGate: Users MUST authenticate before accessing ANY chain features */}
              <AuthGate>
                <BlockchainProvider>
                  <VYBProvider>
                    <VoiceProvider>
                      <MusicProvider>
                        <ContextMenuProvider>
                          {/* Persistent 3D Starfield Background */}
                          <StarfieldBackground />
                          
                          {/* Header Navigation */}
                          <HeaderBar />
                          
                          {/* Main Content - pt-20 ensures content appears below fixed navbar */}
                          <main className="relative z-10 min-h-screen pt-20">
                            <ErrorBoundary>
                              {children}
                            </ErrorBoundary>
                          </main>
                          
                          {/* Global Music Player */}
                          <MusicPlayer />
                          
                          {/* Floating Terminal Button */}
                          <TerminalButton />
                          
                          {/* Sophia AI Chat Button */}
                          <SophiaChatButton />
                        </ContextMenuProvider>
                      </MusicProvider>
                    </VoiceProvider>
                  </VYBProvider>
                </BlockchainProvider>
              </AuthGate>
            </AuthProvider>
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  )
}
