/**
 * Surfaces that are specified but not yet built.
 *
 * These screens state plainly what the surface will do, what it depends on, and
 * what is blocking it. That is more useful than a mock: a fake library full of
 * fake games would look finished in a screenshot and teach nobody anything about
 * what the work actually requires.
 */

import { Boxes, MessagesSquare, Share2 } from 'lucide-react';

import { Panel, ViewHeader } from './parts';
import type { Surface } from '../state/store';

interface Blueprint {
  eyebrow: string;
  title: string;
  body: string;
  icon: typeof Boxes;
  scope: string[];
  depends: { on: string; state: 'ready' | 'partial' | 'missing'; note: string }[];
}

const BLUEPRINTS: Partial<Record<Surface, Blueprint>> = {
  library: {
    eyebrow: 'Distribution',
    title: 'Library',
    icon: Boxes,
    body: 'Install, patch and launch Demiurge titles, with entitlements and in-game assets bound to your QOR ID.',
    scope: [
      'Catalogue of titles with per-title manifests and content hashes',
      'Delta patching, so an update downloads only what changed',
      'Launch with a short-lived session key, so gameplay needs no wallet prompts',
      'Entitlement checks against DRC-369 holdings at launch time',
      'Install location management across drives',
    ],
    depends: [
      {
        on: 'Session keys',
        state: 'partial',
        note: 'The module exists and its storage works, but the runtime never checks a session key during execution: the transaction type has no field for one.',
      },
      {
        on: 'DRC-369 asset queries',
        state: 'missing',
        note: 'DRC-369 does not exist yet. No pallet is written and none is mounted in the runtime; it is milestone M4.',
      },
      {
        on: 'Content addressing',
        state: 'missing',
        note: 'Token URIs are free-text strings with no integrity hash, so there is nothing to verify a download against yet.',
      },
    ],
  },

  social: {
    eyebrow: 'Community',
    title: 'Social',
    icon: MessagesSquare,
    body: 'Rooms, direct messages, presence and voice, carrying the same QOR ID you play under.',
    scope: [
      'Rooms with roles, moderation and history',
      'Direct messages between QOR IDs',
      'Presence: who is online, and what they are playing',
      'Voice channels alongside text',
      'Identity backed by the chain handle registry, not a separate account',
    ],
    depends: [
      {
        on: 'A social service',
        state: 'partial',
        note: 'Rooms, members, messages and a streaming endpoint already exist as web API routes in apps/hub. They are server-mediated and not reachable from the desktop app yet.',
      },
      {
        on: 'Handle registry',
        state: 'partial',
        note: 'The QOR identity module implements handles and DID export properly, but is not wired into the node or exposed over RPC.',
      },
      {
        on: 'Transport',
        state: 'missing',
        note: 'The launcher needs a persistent socket. The node defines five WebSocket subscriptions, but nothing in the workspace ever publishes to them.',
      },
    ],
  },

  mesh: {
    eyebrow: 'Peer to peer',
    title: 'Mesh',
    icon: Share2,
    body: 'Community-seeded distribution. Players host the content they own, and the network gets faster as it grows rather than more expensive.',
    scope: [
      'Torrent-style swarms per title and per patch',
      'Content-addressed chunks verified against an on-chain manifest hash',
      'Seeding budgets: caps on bandwidth, disk and hours',
      'Rewards for seeders, settled in CGT',
      'Fallback to an origin server when a swarm is cold',
    ],
    depends: [
      {
        on: 'Content manifests',
        state: 'missing',
        note: 'Nothing on chain records a content hash, so there is no trusted root to verify downloaded pieces against.',
      },
      {
        on: 'Peer discovery',
        state: 'partial',
        note: 'The node runs a libp2p Kademlia DHT, but only for finding peers. No records are ever published to it.',
      },
      {
        on: 'Seeder rewards',
        state: 'missing',
        note: 'Paying seeders needs a way to verify hosting and an issuance path to pay from. Transfers themselves do settle in blocks and are finalised by GRANDPA; what is missing is the work verification (U-6) and the payment mechanism (M8.1).',
      },
    ],
  },
};

export function Horizon({ surface }: { surface: Surface }) {
  const blueprint = BLUEPRINTS[surface];
  if (!blueprint) return null;

  const { icon: Icon } = blueprint;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ViewHeader
        eyebrow={blueprint.eyebrow}
        title={blueprint.title}
        body={blueprint.body}
      />

      <div className="grid grid-cols-2 gap-4 p-8">
        <Panel className="p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <Icon size={16} strokeWidth={1.5} className="text-accent" />
            <span className="eyebrow">What this surface will do</span>
          </div>
          <ul className="space-y-2.5">
            {blueprint.scope.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-ui text-ink-body">
                <span className="mt-[7px] h-[3px] w-[3px] flex-none bg-accent" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-6">
          <p className="eyebrow mb-5">What it depends on</p>
          <ul className="space-y-4">
            {blueprint.depends.map((dep) => (
              <li key={dep.on}>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`dot ${
                      dep.state === 'ready'
                        ? 'dot-ok'
                        : dep.state === 'partial'
                          ? 'dot-warn'
                          : 'dot-bad'
                    }`}
                  />
                  <span className="text-ui font-semibold text-ink">{dep.on}</span>
                  <span className="eyebrow text-micro text-ink-faint">{dep.state}</span>
                </div>
                <p className="pl-[14px] text-caption leading-relaxed text-ink-muted">
                  {dep.note}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
