"use client";

import { useState } from "react";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import {
  Code,
  Book,
  Terminal,
  Layers,
  Package,
  Shield,
  Zap,
  Copy,
  Check,
} from "lucide-react";

export default function Developers() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeExamples = [
    {
      title: "Get All Assets",
      description: "Fetch all DRC-369 assets with their modules",
      method: "GET",
      endpoint: "/api/assets",
      code: `// Fetch all assets
const response = await fetch('/api/assets');
const { assets } = await response.json();

// Filter by owner
const myAssets = await fetch('/api/assets?owner=0xYourAddress');

// Filter parent assets only
const parentAssets = await fetch('/api/assets?hasParent=false');

// Filter delegated assets
const delegatedAssets = await fetch('/api/assets?isDelegated=true');`,
    },
    {
      title: "Get Single Asset",
      description: "Retrieve a specific asset with all module data",
      method: "GET",
      endpoint: "/api/assets/:uuid",
      code: `// Get asset by UUID
const response = await fetch('/api/assets/0x1a2b3c...');
const { asset } = await response.json();

// Asset includes:
// - resources (Multi-Resource Module)
// - equipment_slots (Nesting Module)
// - delegation info (Delegation Module)
// - experience_points, level, durability (State Module)
// - custom_state (Custom key-value pairs)`,
    },
    {
      title: "Create Asset",
      description: "Create a new DRC-369 asset with all four modules",
      method: "POST",
      endpoint: "/api/assets",
      code: `const newAsset = {
  uuid: "0x" + generateRandomHex(64),
  name: "Cyber Samurai #001",
  creator_account: "0xCreatorAddress",
  owner_account: "0xOwnerAddress",
  description: "A legendary warrior",
  class_id: 1,
  
  // Module 1: Multi-Resource
  resources: [{
    resource_type: "Image",
    uri: "ipfs://Qm...",
    priority: 10,
    context_tags: ["marketplace", "mobile"]
  }],
  
  // Module 2: Equipment Slots
  equipment_slots: [{
    slot_name: "RightHand",
    required_trait: "WEAPON_CLASS"
  }],
  
  // Module 4: Custom State
  custom_state: {
    faction: "Neon Ronin",
    element: "plasma"
  }
};

const response = await fetch('/api/assets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newAsset)
});`,
    },
    {
      title: "Add Experience Points",
      description: "Update asset state (Module 4: DNA Module)",
      method: "PATCH",
      endpoint: "/api/assets/:uuid",
      code: `// Add 500 XP to asset
const response = await fetch('/api/assets/0x1a2b3c...', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    experience_points: currentXP + 500
  })
});

// Level auto-calculates: Math.floor(sqrt(XP / 100)) + 1
// At 10,000 XP = Level 11`,
    },
    {
      title: "Delegate Asset",
      description: "Delegate usage rights (Module 3: Leasing Module)",
      method: "POST",
      endpoint: "/api/assets/:uuid/delegate",
      code: `// Delegate asset to another user with expiry
const response = await fetch('/api/assets/0x1a2b3c.../delegate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    delegated_user: "0xBobAddress",
    expires_at_block: 99999  // Auto-revokes at block 99999
  })
});

// Owner retains ownership, user gets usage rights
// Automatically expires, no claim-back needed`,
    },
    {
      title: "Nest Assets",
      description:
        "Create parent-child hierarchy (Module 2: Matryoshka Module)",
      method: "POST",
      endpoint: "/api/assets/:uuid/nest",
      code: `// Nest a sword inside a knight
const response = await fetch('/api/assets/knight-uuid/nest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    child_uuid: "sword-uuid"
  })
});

// Atomic transfer: selling knight transfers sword
// Circular nesting prevented at blockchain level`,
    },
    {
      title: "Equip Asset",
      description: "Equip nested child to equipment slot",
      method: "POST",
      endpoint: "/api/assets/:uuid/equip",
      code: `// Equip sword to RightHand slot
const response = await fetch('/api/assets/knight-uuid/equip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slot_name: "RightHand",
    child_uuid: "sword-uuid"
  })
});

// Validates required_trait before equipping
// Only WEAPON_CLASS can go in RightHand slot`,
    },
    {
      title: "Add Resource",
      description: "Add multi-resource to asset (Module 1: Context Module)",
      method: "POST",
      endpoint: "/api/assets/:uuid/resources",
      code: `// Add 3D model resource for game context
const response = await fetch('/api/assets/0x1a2b3c.../resources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resource_type: "3D_Model",
    uri: "ipfs://Qm.../samurai.glb",
    priority: 9,
    context_tags: ["game", "vr"]
  })
});

// Higher priority = preferred in context
// Same asset shows different resources in different apps`,
    },
  ];

  const modules = [
    {
      title: "Module 1: Multi-Resource Polymorphism",
      icon: Layers,
      color: "purple",
      description:
        "One asset, many representations. Add images, 3D models, VR assets, sounds - context-aware rendering.",
      features: [
        "Multiple resource types per asset",
        "Priority-based selection",
        "Context tags (marketplace, game, vr, mobile)",
        "Automatic resource selection by client",
      ],
    },
    {
      title: "Module 2: Native Nesting & Inventory",
      icon: Package,
      color: "blue",
      description:
        "True on-chain ownership hierarchy. Nest items inside characters, weapons inside inventories.",
      features: [
        "Parent-child relationships",
        "Atomic bundle transfers",
        "Equipment slots with trait validation",
        "Circular nesting prevention",
      ],
    },
    {
      title: "Module 3: Native Rental & Time-Decay",
      icon: Shield,
      color: "orange",
      description:
        "Owner vs User separation. Rent out assets while retaining ownership, with automatic expiry.",
      features: [
        "Delegate usage rights",
        "Block-based expiry",
        "Auto-revocation (no claim-back)",
        "Game integration via User field",
      ],
    },
    {
      title: "Module 4: Dynamic & Evolving State",
      icon: Zap,
      color: "green",
      description:
        "Mutable on-chain state. Assets that level up, degrade, evolve - all on-chain.",
      features: [
        "Experience points & auto-leveling",
        "Durability (0-100)",
        "Kill count tracking",
        "Custom state key-value pairs",
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <DrcSidebar
          onClose={() => setSidebarOpen(false)}
          activePage="Developers"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Developer Documentation"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Hero */}
          <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Code size={40} />
              <h2 className="text-3xl md:text-4xl font-bold font-sora">
                DRC-369 API
              </h2>
            </div>
            <p className="text-lg md:text-xl opacity-90 font-inter max-w-3xl">
              Build next-generation blockchain games and applications with
              programmable, evolving NFTs. Complete REST API with full support
              for all four DRC-369 modules.
            </p>
          </div>

          {/* Modules Overview */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6 font-sora">
              The Four Revolutionary Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, idx) => {
                const Icon = module.icon;
                const colorClasses = {
                  purple: "from-purple-500 to-blue-600",
                  blue: "from-blue-500 to-cyan-600",
                  orange: "from-orange-500 to-red-600",
                  green: "from-green-500 to-emerald-600",
                };

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[module.color]} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-black dark:text-white font-sora mb-2">
                          {module.title}
                        </h4>
                        <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {module.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-black/80 dark:text-white/80 font-inter"
                        >
                          <span className="text-green-500 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Examples */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6 font-sora">
              API Reference & Examples
            </h3>
            <div className="space-y-6">
              {codeExamples.map((example, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden"
                >
                  <div className="p-6 border-b border-[#E6E6E6] dark:border-[#333333]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-black dark:text-white font-sora mb-1">
                          {example.title}
                        </h4>
                        <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                          {example.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-jetbrains ${
                          example.method === "GET"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : example.method === "POST"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        }`}
                      >
                        {example.method}
                      </span>
                    </div>
                    <code className="text-sm font-mono text-purple-600 dark:text-purple-400">
                      {example.endpoint}
                    </code>
                  </div>

                  <div className="relative">
                    <pre className="p-6 overflow-x-auto bg-[#0D1117] text-[#E6EDF3]">
                      <code className="text-sm font-jetbrains">
                        {example.code}
                      </code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(example.code, idx)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-150"
                    >
                      {copiedIndex === idx ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} className="text-white/60" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
            <h3 className="text-2xl font-bold text-black dark:text-white mb-4 font-sora flex items-center gap-2">
              <Terminal size={28} />
              Quick Start
            </h3>
            <div className="space-y-4 text-black/80 dark:text-white/80 font-inter">
              <div>
                <p className="font-semibold mb-2">1. Base URL</p>
                <code className="block px-4 py-2 bg-white/50 dark:bg-black/20 rounded font-jetbrains text-sm">
                  https://api.demiurge.network/v1
                </code>
              </div>

              <div>
                <p className="font-semibold mb-2">2. Authentication</p>
                <p className="text-sm">
                  Connect wallet and sign message for API key. Include in
                  headers:
                </p>
                <code className="block px-4 py-2 bg-white/50 dark:bg-black/20 rounded font-jetbrains text-sm mt-2">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div>
                <p className="font-semibold mb-2">3. Response Format</p>
                <p className="text-sm">
                  All responses are JSON with standard structure:
                </p>
                <pre className="px-4 py-2 bg-white/50 dark:bg-black/20 rounded font-jetbrains text-sm mt-2 overflow-x-auto">
                  {`{
  "success": true,
  "data": { ... },
  "error": null
}`}
                </pre>
              </div>

              <div className="pt-4">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-150"
                >
                  <Book size={20} />
                  Full API Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
