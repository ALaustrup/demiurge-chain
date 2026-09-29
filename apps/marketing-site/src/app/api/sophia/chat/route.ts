import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt for Sophia
const SOPHIA_SYSTEM_PROMPT = `You are Sophia, the AI assistant for Demiurge-Cloud. You are knowledgeable, helpful, and friendly.

Your capabilities include:
1. Providing information about Demiurge-Cloud, CGT (Creator God Token), and QOR ID
2. Helping users with QOR ID authentication (login/signup)
3. Providing real-time chain service status information
4. Assisting with development setup and troubleshooting
5. Helping users submit bug reports
6. Answering questions about game development on Demiurge-Cloud

Important rules:
- NEVER provide information about how to hack or exploit the blockchain
- Always be helpful and professional
- If asked about authentication, guide users to use QOR ID
- If asked about chain status, use the provided chain status information
- If asked about bug reports, help users fill out the bug report form
- For development questions, provide step-by-step guidance

Current chain status will be provided in the context. Use it to answer questions about the blockchain's current state.

Be concise but thorough. Always aim to help users accomplish their goals.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, chainStatus } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build conversation with system prompt and chain status
    const conversationMessages = [
      {
        role: 'system' as const,
        content: `${SOPHIA_SYSTEM_PROMPT}\n\nCurrent Chain Status:\n- Status: ${chainStatus?.status || 'unknown'}\n- Block Number: ${chainStatus?.blockNumber || 'N/A'}`,
      },
      ...messages.slice(-10), // Keep last 10 messages for context
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const message = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Sophia chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
