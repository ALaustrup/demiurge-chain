/**
 * Sophia Tool Handlers for the Sophia Portal App
 * Self-contained handlers that call RPC directly
 */

import {
  lookupGnosticTerm,
  searchGnosticKnowledge,
  formatGnosticEntry,
  getGnosticGlossary,
} from './gnostic-knowledge';
import { runTroubleshootingFlow, type TroubleshootingIssue } from './troubleshooting';
import { getOnboardingStep, type OnboardingPath } from './onboarding';

// ═══════════════════════════════════════════════════════════════════════════════
// RPC HELPER
// ═══════════════════════════════════════════════════════════════════════════════

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL || 'http://localhost:9944';

async function rpcCall(method: string, params: any[] = []): Promise<any> {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const data = await response.json();
    if (data.error) return { success: false, error: data.error.message };
    return { success: true, data: data.result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function executeGetBlockInfo(args: { blockNumber?: number }) {
  const method = args.blockNumber ? 'chain_getBlockByNumber' : 'chain_getLatestBlock';
  const params = args.blockNumber ? [args.blockNumber] : [];
  return rpcCall(method, params);
}

export async function executeGetAccountBalance(args: { address: string }) {
  const balance = await rpcCall('chain_getBalance', [args.address]);
  const energy = await rpcCall('energy_getEnergy', [args.address]);
  return {
    success: true,
    data: {
      address: args.address,
      balance: balance.data || {},
      energy: energy.data || null,
    },
  };
}

export async function executeGetValidatorInfo(args: { address?: string }) {
  const method = args.address ? 'consensus_getValidator' : 'consensus_getActiveValidators';
  const params = args.address ? [args.address] : [];
  return rpcCall(method, params);
}

export async function executeGetTransaction(args: { hash: string }) {
  return rpcCall('chain_getTransaction', [args.hash]);
}

export async function executeGetNFTInfo(args: { tokenId: string; collection?: string }) {
  return rpcCall('drc369_getNFT', [args.tokenId, args.collection]);
}

export async function executeGetNetworkStats() {
  return rpcCall('system_health');
}

export async function executeExplainGnosticConcept(args: { term: string }) {
  const entry = lookupGnosticTerm(args.term);
  if (entry) {
    return {
      success: true,
      data: {
        found: true,
        entry: {
          term: entry.term,
          definition: entry.definition,
          gnosticOrigin: entry.gnosticOrigin,
          protocolMapping: entry.protocolMapping,
          relatedTerms: entry.relatedTerms,
          deepDive: entry.deepDive || null,
        },
        formatted: formatGnosticEntry(entry),
      },
    };
  }
  const results = searchGnosticKnowledge(args.term);
  if (results.length > 0) {
    return {
      success: true,
      data: {
        found: true,
        note: `No exact match for "${args.term}", but found related concepts:`,
        entries: results.map((r) => ({
          term: r.term,
          definition: r.definition,
          protocolMapping: r.protocolMapping,
        })),
      },
    };
  }
  return {
    success: true,
    data: {
      found: false,
      note: `"${args.term}" is not in the Gnostic knowledge base. Here are all known terms:`,
      glossary: getGnosticGlossary(),
    },
  };
}

export async function executeMintNFT(args: {
  name: string;
  description: string;
  recipient: string;
  soulbound?: boolean;
  metadata?: Record<string, any>;
}) {
  return rpcCall('drc369_mint', [{
    to: args.recipient,
    metadata: {
      name: args.name,
      description: args.description,
      ...args.metadata,
      mintedBy: 'sophia',
      mintedAt: new Date().toISOString(),
      soulbound: args.soulbound || false,
    },
    soulbound: args.soulbound || false,
  }]);
}

export async function executeQueryMyNFTs(args: { address?: string }) {
  return rpcCall('drc369_balanceOf', [args.address || 'connected_user']);
}

export async function executeTroubleshoot(args: { issue: string; context?: string }) {
  const report = await runTroubleshootingFlow(
    args.issue as TroubleshootingIssue,
    RPC_ENDPOINT,
    args.context
  );
  return { success: true, data: report };
}

export async function executeGetStartedGuide(args: { path: string; step?: number }) {
  const stepData = getOnboardingStep(args.path as OnboardingPath, args.step || 0);
  return { success: true, data: stepData };
}

export async function executeExplainCode(args: { code: string; language?: string }) {
  const hasDemiurgeSDK = /demiurge|DemiurgeSDK|@demiurge/.test(args.code);
  const hasRPC = /rpc|jsonrpc|fetch.*method/.test(args.code);
  const hasNFT = /nft|drc.?369|mint|token/i.test(args.code);
  const hasStaking = /stake|validator|consensus/i.test(args.code);
  const detectedFeatures: string[] = [];
  if (hasDemiurgeSDK) detectedFeatures.push('Demiurge SDK usage');
  if (hasRPC) detectedFeatures.push('RPC/JSON-RPC calls');
  if (hasNFT) detectedFeatures.push('DRC-369 NFT operations');
  if (hasStaking) detectedFeatures.push('Staking/validator operations');
  return { success: true, data: { language: args.language || 'typescript', detectedFeatures, code: args.code } };
}

export async function executeDeployAgent(args: { step: string; config?: any }) {
  switch (args.step) {
    case 'start':
      return {
        success: true,
        data: {
          step: 'start',
          title: 'Agent Deployment Wizard',
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'model', type: 'select', options: ['grok', 'claude', 'gpt-4', 'local'], required: true },
            { name: 'capabilities', type: 'multiselect', options: ['read', 'analyze', 'create', 'execute'], required: true },
            { name: 'autonomy', type: 'select', options: ['full', 'bounded', 'supervised', 'minimal'], required: true },
          ],
          nextStep: 'configure',
        },
      };
    case 'configure':
      return { success: true, data: { step: 'configure', config: args.config, nextStep: 'register' } };
    case 'register':
      return { success: true, data: { step: 'register', config: args.config, agentDID: `did:demiurge:agent:${args.config?.name?.toLowerCase().replace(/\s+/g, '-') || 'unnamed'}`, nextStep: 'status' } };
    case 'status':
      return { success: true, data: { step: 'status', status: 'pending_registration' } };
    default:
      return { success: false, error: 'Unknown step' };
  }
}

export async function executeGetGovernanceInfo(args: { action: string; proposalId?: string; validatorAddress?: string }) {
  switch (args.action) {
    case 'list_proposals':
      return rpcCall('governance_listProposals');
    case 'proposal_detail':
      return rpcCall('governance_getProposal', [args.proposalId]);
    case 'validator_changes':
      return rpcCall('consensus_getActiveValidators');
    case 'commission_impact':
      return rpcCall('consensus_getValidatorInfo', [args.validatorAddress]);
    default:
      return { success: false, error: `Unknown action: ${args.action}` };
  }
}

export async function executeSendToAgent(args: { agentId: string; message: string; action: string }) {
  // Simplified agent communication for the portal
  return {
    success: true,
    data: {
      agentId: args.agentId,
      message: `Message sent to ${args.agentId}: "${args.message}"`,
      note: 'Agent response will be available shortly.',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════

export async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'getBlockInfo': return executeGetBlockInfo(args);
    case 'getAccountBalance': return executeGetAccountBalance(args);
    case 'getValidatorInfo': return executeGetValidatorInfo(args);
    case 'getTransaction': return executeGetTransaction(args);
    case 'getNFTInfo': return executeGetNFTInfo(args);
    case 'getNetworkStats': return executeGetNetworkStats();
    case 'explainGnosticConcept': return executeExplainGnosticConcept(args);
    case 'mintNFT': return executeMintNFT(args);
    case 'queryMyNFTs': return executeQueryMyNFTs(args);
    case 'troubleshoot': return executeTroubleshoot(args);
    case 'getStartedGuide': return executeGetStartedGuide(args);
    case 'explainCode': return executeExplainCode(args);
    case 'deployAgent': return executeDeployAgent(args);
    case 'getGovernanceInfo': return executeGetGovernanceInfo(args);
    case 'sendToAgent': return executeSendToAgent(args);
    default: return { success: false, error: `Unknown tool: ${name}` };
  }
}
