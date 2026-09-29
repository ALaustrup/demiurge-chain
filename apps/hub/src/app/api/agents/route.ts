/**
 * Agent Registry API
 * GET - List all agents or search
 * POST - Register a new agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, searchAgents, registerAgent, Agent } from '@/lib/agents';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const status = searchParams.get('status');

  let agents = query ? searchAgents(query) : getAllAgents();
  
  if (status) {
    agents = agents.filter(a => a.status === status);
  }

  return NextResponse.json({
    agents,
    total: agents.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.name || !body.description || !body.owner) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, description, owner' },
        { status: 400 }
      );
    }

    const agent: Omit<Agent, 'createdAt' | 'lastSeen'> = {
      id: body.id,
      name: body.name,
      description: body.description,
      owner: body.owner,
      capabilities: body.capabilities || [],
      status: body.status || 'online',
      endpoint: body.endpoint,
      model: body.model,
      metadata: body.metadata,
    };

    const registered = registerAgent(agent);

    return NextResponse.json({
      success: true,
      agent: registered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register agent' },
      { status: 500 }
    );
  }
}
