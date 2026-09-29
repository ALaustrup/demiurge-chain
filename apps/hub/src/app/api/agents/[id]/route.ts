/**
 * Individual Agent API
 * GET - Get agent details
 * PATCH - Update agent status
 * DELETE - Unregister agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgentStatus, unregisterAgent, AgentStatus } from '@/lib/agents';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(agent);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      const validStatuses: AgentStatus[] = ['online', 'offline', 'busy', 'maintenance'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      const updated = updateAgentStatus(id, body.status);
      if (!updated) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
    }

    const agent = getAgent(id);
    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Prevent deletion of built-in agents
  const builtInIds = ['sophia', 'guardian', 'oracle-price', 'nft-curator'];
  if (builtInIds.includes(id)) {
    return NextResponse.json(
      { error: 'Cannot delete built-in agent' },
      { status: 403 }
    );
  }

  const deleted = unregisterAgent(id);
  
  if (!deleted) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
