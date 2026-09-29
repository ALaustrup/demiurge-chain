/**
 * Sophia Agent DID Registration & Coordination
 *
 * Registers Sophia as a first-class Agent DID on-chain and provides
 * enhanced agent coordination capabilities including bidirectional
 * communication and on-chain agent resolution.
 */

import type { AgentDID, AgentAutonomy } from '@/lib/agents/types';

// ═══════════════════════════════════════════════════════════════════════════════
// SOPHIA'S AGENT DID CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const SOPHIA_AGENT_DID: AgentDID = {
  did: 'did:demiurge:agent:mainnet:sophia',
  walletAddress: undefined, // Set during on-chain registration
  autonomy: 'bounded',
  capabilities: [
    'read',          // Can read chain data freely
    'analyze',       // Can analyze data and provide insights
    'create',        // Can mint DRC-369 NFTs (with user confirmation)
    'external_api',  // Can call external APIs (LLM providers, etc.)
  ],
  spendingLimit: 1000, // Daily CGT limit for minting operations
  registeredAt: new Date().toISOString(),
  authEndpoint: '/api/agents/register',
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DID RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve an Agent DID to its registration data.
 * First checks local registry, then attempts on-chain resolution.
 */
export async function resolveAgentDID(
  did: string,
  rpcEndpoint: string
): Promise<AgentDID | null> {
  // Quick check for Sophia herself
  if (did === SOPHIA_AGENT_DID.did || did === 'sophia') {
    return SOPHIA_AGENT_DID;
  }

  // Attempt on-chain resolution via agentic module
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'agentic_resolveAgent',
        params: [did],
      }),
    });

    const data = await response.json();
    if (data.result) {
      return {
        did: data.result.did,
        walletAddress: data.result.wallet_address,
        autonomy: data.result.autonomy as AgentAutonomy,
        capabilities: data.result.capabilities || [],
        spendingLimit: data.result.spending_limit,
        registeredAt: data.result.registered_at,
      };
    }
  } catch (err) {
    console.warn('On-chain agent resolution failed:', err);
  }

  return null;
}

/**
 * Register Sophia (or any agent) on-chain via the QOR Auth system.
 */
export async function registerAgentOnChain(
  agent: AgentDID,
  rpcEndpoint: string,
  authEndpoint?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const endpoint = authEndpoint || '/api/agents/register';

  try {
    // Register with QOR Auth
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did: agent.did,
        autonomy: agent.autonomy,
        capabilities: agent.capabilities,
        spendingLimit: agent.spendingLimit,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `Registration failed: ${response.status}` };
    }

    const result = await response.json();

    return {
      success: true,
      txHash: result.txHash || result.tx_hash,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a message from Sophia to another agent via on-chain resolution.
 * Falls back to the in-memory registry if on-chain resolution fails.
 */
export async function sendAgentMessage(
  targetDID: string,
  message: string,
  action: 'query' | 'command' | 'notify',
  rpcEndpoint: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  // Try to resolve the agent
  const agent = await resolveAgentDID(targetDID, rpcEndpoint);

  if (!agent) {
    return { success: false, error: `Agent ${targetDID} not found on-chain or in registry` };
  }

  // If the agent has an external endpoint, call it directly
  if (agent.authEndpoint) {
    try {
      const response = await fetch(agent.authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: SOPHIA_AGENT_DID.did,
          action,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, response: data.response || data.text };
      }
    } catch (err) {
      console.warn('Direct agent communication failed, falling back to registry:', err);
    }
  }

  // Fall back to in-memory registry
  try {
    const { getAgent, sendMessage: registrySendMessage, createConversation, simulateAgentResponse } = await import('@/lib/agents');

    // Extract simple ID from DID if needed
    const simpleId = targetDID.includes(':')
      ? targetDID.split(':').pop() || targetDID
      : targetDID;

    const registryAgent = getAgent(simpleId);
    if (!registryAgent) {
      return { success: false, error: `Agent ${targetDID} not found` };
    }

    const conversation = createConversation(['sophia', simpleId]);
    const result = registrySendMessage({
      conversationId: conversation.id,
      from: 'sophia',
      to: simpleId,
      action,
      priority: 'normal',
      content: { text: message },
    });

    if (!result.success || !result.message) {
      return { success: false, error: result.error?.message || 'Send failed' };
    }

    const agentResponse = await simulateAgentResponse(result.message);
    return {
      success: true,
      response: agentResponse?.content.text || 'No response from agent',
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Receive and process a message sent TO Sophia from another agent.
 * This enables bidirectional agent communication.
 */
export async function receiveAgentMessage(
  fromDID: string,
  message: string,
  action: string,
  hubChatEndpoint: string = '/api/sophia/chat'
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    // Forward the agent's message to Sophia's chat API
    const response = await fetch(hubChatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are receiving a message from agent ${fromDID}. Action type: ${action}. Respond as Sophia.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Sophia API returned ${response.status}` };
    }

    const data = await response.json();
    return { success: true, response: data.text };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * List all known agents (on-chain + in-memory registry)
 */
export async function listAllAgents(
  rpcEndpoint: string
): Promise<{ id: string; name: string; status: string; did?: string }[]> {
  const agents: { id: string; name: string; status: string; did?: string }[] = [];

  // Get from in-memory registry
  try {
    const { getAllAgents } = await import('@/lib/agents');
    const registryAgents = getAllAgents();
    for (const agent of registryAgents) {
      agents.push({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        did: agent.metadata?.did,
      });
    }
  } catch {
    // Registry not available
  }

  // Also try on-chain
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'agentic_listAgents',
        params: [],
      }),
    });

    const data = await response.json();
    if (data.result && Array.isArray(data.result)) {
      for (const onChainAgent of data.result) {
        // Avoid duplicates
        if (!agents.some((a) => a.did === onChainAgent.did)) {
          agents.push({
            id: onChainAgent.did.split(':').pop() || onChainAgent.did,
            name: onChainAgent.name || onChainAgent.did,
            status: 'on-chain',
            did: onChainAgent.did,
          });
        }
      }
    }
  } catch {
    // On-chain query not available
  }

  return agents;
}
