import Link from 'next/link'
import { CheckCircle, ArrowRight, Code, Terminal, Package } from 'lucide-react'

const steps = [
  {
    title: 'Install Prerequisites',
    description: 'Set up Node.js, Rust, and development tools',
    icon: Package,
    details: [
      'Install Node.js 18+ and npm',
      'Install Rust and Cargo',
      'Install Git',
      'Install your preferred code editor',
    ],
  },
  {
    title: 'Clone the Repository',
    description: 'Get the Demiurge-Cloud codebase',
    icon: Code,
    details: [
      'Clone the repository: git clone https://github.com/ALaustrup/demiurge-cloud',
      'Navigate to the project directory',
      'Install dependencies: npm install',
    ],
  },
  {
    title: 'Set Up Development Environment',
    description: 'Configure your local development setup',
    icon: Terminal,
    details: [
      'Copy .env.example to .env',
      'Configure RPC endpoints',
      'Set up QOR ID authentication',
      'Build the blockchain node',
    ],
  },
  {
    title: 'Build Your First Game',
    description: 'Create and deploy your first on-chain game',
    icon: ArrowRight,
    details: [
      'Use the game template',
      'Integrate blockchain SDK',
      'Test locally',
      'Deploy to the chain',
    ],
  },
]

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link href="/docs" className="text-neon-cyan hover:text-neon-magenta transition-colors mb-4 inline-block">
            ← Back to Documentation
          </Link>
          <h1 className="text-5xl font-orbitron font-bold neon-text mb-6">
            Getting Started
          </h1>
          <p className="text-xl text-gray-400">
            Follow these steps to set up your development environment and start building on Demiurge-Cloud.
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="glass-panel p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-neon-cyan" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-bold text-neon-cyan">Step {index + 1}</span>
                      <h2 className="text-2xl font-orbitron font-bold text-white">{step.title}</h2>
                    </div>
                    <p className="text-gray-400 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 glass-panel p-8 text-center">
          <h3 className="text-2xl font-orbitron font-bold text-neon-cyan mb-4">
            Need Help?
          </h3>
          <p className="text-gray-400 mb-6">
            Ask Sophia for step-by-step assistance with setting up your development environment.
          </p>
          <Link
            href="/docs/game-development"
            className="neon-button inline-flex items-center space-x-2"
          >
            <span>Next: Game Development Guide</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
