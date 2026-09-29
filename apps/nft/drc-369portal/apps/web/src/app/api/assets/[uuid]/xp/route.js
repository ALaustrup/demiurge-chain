import sql from "@/app/api/utils/sql";

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
  const levels = [
    { level: 1, cumXp: 0 },
    { level: 2, cumXp: 100 },
    { level: 3, cumXp: 300 },
    { level: 4, cumXp: 700 },
    { level: 5, cumXp: 1500 },
    { level: 6, cumXp: 3100 },
    { level: 7, cumXp: 6300 },
    { level: 8, cumXp: 12700 },
    { level: 9, cumXp: 25500 },
    { level: 10, cumXp: 51100 },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].cumXp) {
      return levels[i].level;
    }
  }
  return 1;
}

// POST add XP to asset
export async function POST(request, { params }) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return Response.json(
        { error: "Invalid XP amount" },
        { status: 400 }
      );
    }

    // Get current asset
    const [asset] = await sql(
      "SELECT uuid, xp FROM nft_assets WHERE uuid = $1",
      [uuid]
    );

    if (!asset) {
      return Response.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    const currentXp = asset.xp || 0;
    const currentLevel = calculateLevel(currentXp);
    const newXp = currentXp + amount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > currentLevel;

    // Update XP
    await sql(
      "UPDATE nft_assets SET xp = $1, updated_at = NOW() WHERE uuid = $2",
      [newXp, uuid]
    );

    // Log XP history (if table exists)
    try {
      await sql(
        `INSERT INTO xp_history (nft_uuid, amount, reason, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [uuid, amount, reason || null]
      );
    } catch (e) {
      // Table might not exist, that's ok
      console.log("XP history table not available:", e.message);
    }

    return Response.json({
      success: true,
      previousXp: currentXp,
      newXp,
      previousLevel: currentLevel,
      newLevel,
      leveledUp,
      xpAdded: amount,
    });
  } catch (error) {
    console.error("Error adding XP:", error);
    return Response.json(
      { error: "Failed to add XP" },
      { status: 500 }
    );
  }
}

// GET XP history for asset
export async function GET(request, { params }) {
  try {
    const { uuid } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    const history = await sql(
      `SELECT amount, reason, created_at 
       FROM xp_history 
       WHERE nft_uuid = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [uuid, limit]
    );

    return Response.json({ history });
  } catch (error) {
    // Table might not exist
    return Response.json({ history: [] });
  }
}
