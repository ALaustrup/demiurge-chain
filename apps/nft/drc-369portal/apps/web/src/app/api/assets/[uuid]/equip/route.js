import sql from "@/app/api/utils/sql";

// POST equip a child NFT to a slot
export async function POST(request, { params }) {
  try {
    const { uuid } = params;
    const { slot_name, child_uuid } = await request.json();

    if (!slot_name || !child_uuid) {
      return Response.json(
        { error: "slot_name and child_uuid are required" },
        { status: 400 },
      );
    }

    // Verify child belongs to parent
    const [child] = await sql(
      "SELECT * FROM nft_assets WHERE uuid = $1 AND parent_uuid = $2",
      [child_uuid, uuid],
    );

    if (!child) {
      return Response.json(
        { error: "Child asset not found or not nested in this parent" },
        { status: 404 },
      );
    }

    // Update equipment slot
    const query = `
      UPDATE equipment_slots 
      SET equipped_child_uuid = $1
      WHERE nft_uuid = $2 AND slot_name = $3
      RETURNING *
    `;

    const [slot] = await sql(query, [child_uuid, uuid, slot_name]);

    if (!slot) {
      return Response.json(
        { error: "Equipment slot not found" },
        { status: 404 },
      );
    }

    return Response.json({ slot });
  } catch (error) {
    console.error("Error equipping asset:", error);
    return Response.json({ error: "Failed to equip asset" }, { status: 500 });
  }
}

// DELETE unequip from slot
export async function DELETE(request, { params }) {
  try {
    const { uuid } = params;
    const { searchParams } = new URL(request.url);
    const slotName = searchParams.get("slot_name");

    if (!slotName) {
      return Response.json({ error: "slot_name is required" }, { status: 400 });
    }

    const query = `
      UPDATE equipment_slots 
      SET equipped_child_uuid = NULL
      WHERE nft_uuid = $1 AND slot_name = $2
      RETURNING *
    `;

    const [slot] = await sql(query, [uuid, slotName]);

    if (!slot) {
      return Response.json(
        { error: "Equipment slot not found" },
        { status: 404 },
      );
    }

    return Response.json({ slot });
  } catch (error) {
    console.error("Error unequipping asset:", error);
    return Response.json({ error: "Failed to unequip asset" }, { status: 500 });
  }
}
