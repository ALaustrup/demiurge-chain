/**
 * Agent Messages API
 * GET - Get messages for an agent
 * POST - Send a message to an agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAgent, 
  getMessagesForAgent, 
  sendMessage, 
  createConversation,
  simulateAgentResponse,
  AgentMessage,
  MessageAction,
  MessagePriority,
} from '@/lib/agents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');

  const agent = getAgent(id);
  if (!agent && id !== 'sophia') {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  const messages = getMessagesForAgent(id, limit);
  
  return NextResponse.json({
    messages,
    total: messages.length,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toAgentId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.from || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: from, message' },
        { status: 400 }
      );
    }

    const targetAgent = getAgent(toAgentId);
    if (!targetAgent && toAgentId !== 'sophia') {
      return NextResponse.json(
        { error: 'Target agent not found' },
        { status: 404 }
      );
    }

    // Create or use existing conversation
    const conversationId = body.conversationId || createConversation([body.from, toAgentId]).id;

    // Build message
    const message: Omit<AgentMessage, 'id' | 'timestamp'> = {
      conversationId,
      from: body.from,
      to: toAgentId,
      action: (body.action as MessageAction) || 'query',
      priority: (body.priority as MessagePriority) || 'normal',
      content: {
        text: body.message,
        data: body.data,
      },
      context: body.context,
    };

    // Send message
    const result = sendMessage(message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to send message' },
        { status: 400 }
      );
    }

    // For built-in agents (except sophia), simulate a response
    if (result.message && toAgentId !== 'sophia') {
      const response = await simulateAgentResponse(result.message);
      
      return NextResponse.json({
        success: true,
        message: result.message,
        response: response,
        conversationId,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      conversationId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
