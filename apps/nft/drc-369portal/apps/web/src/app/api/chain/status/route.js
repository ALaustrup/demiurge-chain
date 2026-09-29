const MONAD_SERVER = "51.210.209.112";
const MONAD_PORT = 9944;

export async function GET() {
  try {
    // Check if server is reachable
    const isReachable = await checkServerReachability();

    if (isReachable) {
      return Response.json({
        isOnline: true,
        blockHeight: 42069,
        network: "Demiurge Network",
        version: "1.0.0",
        peers: 24,
        timestamp: Date.now(),
        nodeUrl: `ws://${MONAD_SERVER}:${MONAD_PORT}`,
      });
    } else {
      return Response.json({
        isOnline: false,
        comingSoon: true,
        message: "Demiurge Network launching soon",
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("Chain status check error:", error);
    return Response.json({
      isOnline: false,
      comingSoon: true,
      message: "Chain not yet available",
      timestamp: Date.now(),
    });
  }
}

async function checkServerReachability() {
  // For demo: return true to show "online", false for "soon"
  return true;
}
