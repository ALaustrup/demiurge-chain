export async function POST(request) {
  try {
    const { command } = await request.json();

    const mockOutputs = {
      "start-node": `Starting Demiurge node...
✓ Loading chain spec
✓ Initializing database
✓ Starting P2P network
✓ Node started successfully
Listening on: 0.0.0.0:9944
Node ID: 12D3KooWRfQ9MWqYPT2HzWQqYi7K3K6TZ4nD1d2K7xF8F9F0F1F2`,

      "stop-node": `Stopping Demiurge node...
✓ Closing RPC connections
✓ Flushing database
✓ Shutting down P2P network
✓ Node stopped successfully`,

      "restart-node": `Restarting Demiurge node...
✓ Stopping current instance
✓ Clearing cache
✓ Starting new instance
✓ Node restarted successfully
New block height: 42100`,

      "health-check": `Running system health check...

[CPU]
✓ Usage: 23.5% (16 cores)
✓ Temperature: 52°C
✓ Clock Speed: 3.4 GHz

[Memory]
✓ RAM: 26.4 GB / 64 GB (41.2%)
✓ Swap: 1.2 GB / 8 GB (15%)
✓ Cache: 8.7 GB

[Storage]
✓ /data: 318 GB / 1.7 TB (18.7%)
✓ RAID Status: OPTIMAL
✓ I/O Performance: 2.8 GB/s

[Network]
✓ Peers Connected: 24
✓ Bandwidth In: 125 MB/s
✓ Bandwidth Out: 89 MB/s
✓ Latency: 12ms avg

[Blockchain]
✓ Block Height: 42069
✓ Sync Status: SYNCED
✓ Database Size: 42.3 GB
✓ Last Block: 6s ago

All systems operational ✓`,
    };

    const output =
      mockOutputs[command] || `Command '${command}' executed successfully`;

    return Response.json({
      success: true,
      output,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Command execution error:", error);
    return Response.json(
      { error: "Failed to execute command" },
      { status: 500 },
    );
  }
}
