/**
 * Agent Registry
 * In-memory registry for development, can be replaced with database/chain storage
 */

import { 
  Agent, 
  AgentMessage, 
  AgentResponse, 
  Conversation,
  BUILT_IN_AGENTS,
  AgentStatus,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORAGE (Replace with DB in production)
// ═══════════════════════════════════════════════════════════════════════════════

const agents: Map<string, Agent> = new Map();
const messages: Map<string, AgentMessage> = new Map();
const conversations: Map<string, Conversation> = new Map();
const messageQueue: Map<string, AgentMessage[]> = new Map(); // agentId -> pending messages

// Initialize built-in agents
BUILT_IN_AGENTS.forEach(agent => {
  if (agent.id) {
    agents.set(agent.id, {
      ...agent,
      owner: 'system',
      status: 'online',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    } as Agent);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function getAgent(id: string): Agent | undefined {
  return agents.get(id);
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values());
}

export function getAgentsByStatus(status: AgentStatus): Agent[] {
  return getAllAgents().filter(a => a.status === status);
}

export function searchAgents(query: string): Agent[] {
  const lowerQuery = query.toLowerCase();
  return getAllAgents().filter(a => 
    a.name.toLowerCase().includes(lowerQuery) ||
    a.description.toLowerCase().includes(lowerQuery) ||
    a.capabilities.some(c => c.name.toLowerCase().includes(lowerQuery))
  );
}

export function registerAgent(agent: Omit<Agent, 'createdAt' | 'lastSeen'>): Agent {
  const now = new Date().toISOString();
  const fullAgent: Agent = {
    ...agent,
    createdAt: now,
    lastSeen: now,
  };
  agents.set(agent.id, fullAgent);
  messageQueue.set(agent.id, []);
  return fullAgent;
}

export function updateAgentStatus(id: string, status: AgentStatus): boolean {
  const agent = agents.get(id);
  if (!agent) return false;
  
  agent.status = status;
  agent.lastSeen = new Date().toISOString();
  agents.set(id, agent);
  return true;
}

export function unregisterAgent(id: string): boolean {
  const deleted = agents.delete(id);
  messageQueue.delete(id);
  return deleted;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentResponse {
  const targetAgent = agents.get(message.to);
  
  if (!targetAgent && message.to !== 'sophia') {
    return {
      success: false,
      error: {
        code: 'AGENT_NOT_FOUND',
        message: `Agent ${message.to} not found`,
      },
    };
  }

  if (targetAgent && targetAgent.status === 'offline') {
    return {
      success: false,
      error: {
        code: 'AGENT_OFFLINE',
        message: `Agent ${message.to} is currently offline`,
      },
    };
  }

  const fullMessage: AgentMessage = {
    ...message,
    id: generateMessageId(),
    timestamp: new Date().toISOString(),
  };

  // Store message
  messages.set(fullMessage.id, fullMessage);

  // Add to recipient's queue
  const queue = messageQueue.get(message.to) || [];
  queue.push(fullMessage);
  messageQueue.set(message.to, queue);

  // Update conversation
  if (message.conversationId) {
    updateConversation(message.conversationId, fullMessage);
  }

  return {
    success: true,
    message: fullMessage,
  };
}

export function getMessage(id: string): AgentMessage | undefined {
  return messages.get(id);
}

export function getMessagesForAgent(agentId: string, limit = 50): AgentMessage[] {
  return Array.from(messages.values())
    .filter(m => m.to === agentId || m.from === agentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getPendingMessages(agentId: string): AgentMessage[] {
  const queue = messageQueue.get(agentId) || [];
  messageQueue.set(agentId, []); // Clear queue after retrieval
  return queue;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function createConversation(participants: string[], topic?: string): Conversation {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: generateConversationId(),
    participants,
    createdAt: now,
    lastMessageAt: now,
    status: 'active',
    topic,
  };
  conversations.set(conversation.id, conversation);
  return conversation;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

function updateConversation(id: string, message: AgentMessage): void {
  const conversation = conversations.get(id);
  if (conversation) {
    conversation.lastMessageAt = message.timestamp;
    conversations.set(id, conversation);
  }
}

export function endConversation(id: string): boolean {
  const conversation = conversations.get(id);
  if (!conversation) return false;
  
  conversation.status = 'completed';
  conversations.set(id, conversation);
  return true;
}

export function getConversationMessages(conversationId: string): AgentMessage[] {
  return Array.from(messages.values())
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT SIMULATION (For demo/testing)
// ═══════════════════════════════════════════════════════════════════════════════

const agentResponses: Record<string, (message: AgentMessage) => string> = {
  'guardian': (msg) => {
    const text = msg.content.text?.toLowerCase() || '';
    if (text.includes('scan') || text.includes('check')) {
      return '🛡️ Security scan complete. No threats detected. Transaction appears safe.';
    }
    return '🛡️ Guardian here. I can scan transactions and validate contracts for security risks.';
  },
  'oracle-price': (msg) => {
    const text = msg.content.text?.toLowerCase() || '';
    if (text.includes('cgt') || text.includes('price')) {
      return '📊 Current CGT Price: $0.42 | 24h Change: +5.2% | Market Cap: $420M';
    }
    return '📊 Price Oracle ready. Ask me about token prices and market data.';
  },
  'nft-curator': (msg) => {
    const text = msg.content.text?.toLowerCase() || '';
    if (text.includes('physics') || text.includes('drc-369')) {
      return '🎨 For optimal DRC-369 physics, I recommend: mass=1.0, friction=0.5, restitution=0.3';
    }
    return '🎨 NFT Curator here. I can help with DRC-369 NFT analysis and metadata.';
  },
};

export async function simulateAgentResponse(message: AgentMessage): Promise<AgentMessage | null> {
  const handler = agentResponses[message.to];
  if (!handler) return null;

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const response: AgentMessage = {
    id: generateMessageId(),
    conversationId: message.conversationId,
    from: message.to,
    to: message.from,
    action: 'response',
    priority: 'normal',
    content: {
      text: handler(message),
    },
    timestamp: new Date().toISOString(),
  };

  messages.set(response.id, response);
  return response;
}
