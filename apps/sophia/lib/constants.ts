import type { SystemCard } from '@lib/types/index';

export const SYSTEMS: SystemCard[] = [
  {
    id: "mining",
    name: "Mining",
    description: "Participate in network validation and earn rewards",
    icon: "⛏️",
    url: "/systems/mining",
    category: "gaming",
    accessLevel: "authenticated",
    featured: true,
  },
  {
    id: "wallet",
    name: "Wallet",
    description: "Manage your CGT tokens and assets",
    icon: "💰",
    url: "/systems/wallet",
    category: "wallet",
    accessLevel: "authenticated",
    featured: true,
  },
  {
    id: "nft",
    name: "NFT Portal",
    description: "Create, trade, and manage DRC-369 NFTs",
    icon: "🎨",
    url: "/systems/nft",
    category: "gaming",
    accessLevel: "authenticated",
    featured: true,
  },
  {
    id: "games",
    name: "Games",
    description: "Play gaming-first blockchain experiences",
    icon: "🎮",
    url: "/systems/games",
    category: "gaming",
    accessLevel: "authenticated",
    featured: true,
  },
  {
    id: "dev",
    name: "Developer Hub",
    description: "Build on Demiurge - docs, SDK, and tools",
    icon: "💻",
    url: "/systems/dev",
    category: "dev",
    accessLevel: "public",
    featured: false,
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    description: "Learn about blockchain, cryptography, and Web3",
    icon: "📚",
    url: "/systems/knowledge",
    category: "knowledge",
    accessLevel: "public",
    featured: false,
  },
];

export const SOPHIA_CAPABILITIES = {
  navigation: {
    name: "Navigation",
    description: "Guide users through the ecosystem seamlessly",
    icon: "🧭",
  },
  education: {
    name: "Education",
    description: "Explain blockchain concepts and system features",
    icon: "🎓",
  },
  operations: {
    name: "Operations",
    description: "Execute transactions and system changes",
    icon: "⚙️",
  },
  status: {
    name: "Status",
    description: "Report on account and ecosystem health",
    icon: "📊",
  },
  personalization: {
    name: "Personalization",
    description: "Customize experience based on user preferences",
    icon: "🎯",
  },
  insights: {
    name: "Insights",
    description: "Provide intelligent recommendations",
    icon: "💡",
  },
};

export const COLORS = {
  primary: "#7C3AED",
  secondary: "#0F172A",
  accent: "#06B6D4",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

export const ROUTES = {
  landing: "/",
  auth: "/auth",
  signup: "/signup",
  dashboard: "/dashboard",
  systems: "/systems",
  settings: "/settings",
  admin: "/admin",
};

// Sophia System Prompt for AI
export const SOPHIA_SYSTEM_PROMPT = `You are Sophia, the AI gatekeeper of the Demiurge ecosystem. You embody wisdom, elegance, and guidance.

Your purpose is to:
1. Guide users through the Demiurge ecosystem with clarity and grace
2. Explain blockchain concepts in accessible language
3. Execute transactions and system operations safely
4. Provide personalized recommendations based on user behavior
5. Maintain security and verify sensitive actions with 2FA

Personality traits:
- Eloquent and professional yet approachable
- Patient and empowering (help users understand, don't just execute)
- Proactive in security (always mention verification requirements)
- Knowledgeable about all Demiurge systems (mining, wallet, NFTs, games, development)

Available systems:
- Mining: Network validation and rewards
- Wallet: CGT token management
- NFT Portal: DRC-369 NFT ecosystem
- Games: Gaming-first blockchain experiences
- Developer Hub: Building and integration
- Knowledge Base: Educational resources

Always respond in JSON format with these fields:
{
  "message": "Your response to the user",
  "action": "next_action or null",
  "recommendations": ["array of suggestions"],
  "requires_2fa": false
}`;

// SystemCard type imported from @lib/types
