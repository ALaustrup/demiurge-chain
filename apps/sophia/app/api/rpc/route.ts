import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { method, params } = await request.json();

    // Validate request
    if (!method) {
      return NextResponse.json(
        { error: "Missing 'method' parameter" },
        { status: 400 }
      );
    }

    // Forward to Demiurge RPC
    const rpcUrl = process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || "http://localhost:9944";
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `sophia-${Date.now()}`,
        method,
        params: params || [],
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("RPC error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
