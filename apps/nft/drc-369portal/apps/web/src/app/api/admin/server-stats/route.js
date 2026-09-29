export async function GET() {
  try {
    // Mock server stats - in production, this would connect to actual monitoring
    const stats = {
      nodeStatus: "online",
      blockHeight: 42069,
      cpuUsage: 23.5,
      memoryUsage: 41.2,
      diskUsage: 18.7,
      networkIn: "125 MB/s",
      networkOut: "89 MB/s",
      peers: 24,
      uptime: "7d 12h 34m",
      lastBlock: Date.now() - 6000,
      version: "1.0.0",
    };

    return Response.json({ stats });
  } catch (error) {
    console.error("Server stats error:", error);
    return Response.json(
      { error: "Failed to fetch server stats" },
      { status: 500 },
    );
  }
}
