import sql from "@/app/api/utils/sql";

// POST nest a child NFT into parent
export async function POST(request, { params }) {
  try {
    const { uuid: parentUuid } = params;
    const { child_uuid } = await request.json();

    if (!child_uuid) {
      return Response.json(
        { error: "child_uuid is required" },
        { status: 400 },
      );
    }

    // Check if parent exists
    const [parent] = await sql("SELECT * FROM nft_assets WHERE uuid = $1", [
      parentUuid,
    ]);
    if (!parent) {
      return Response.json(
        { error: "Parent asset not found" },
        { status: 404 },
      );
    }

    // Check if child exists
    const [child] = await sql("SELECT * FROM nft_assets WHERE uuid = $1", [
      child_uuid,
    ]);
    if (!child) {
      return Response.json({ error: "Child asset not found" }, { status: 404 });
    }

    // Prevent circular nesting
    if (child_uuid === parentUuid) {
      return Response.json(
        { error: "Cannot nest asset into itself" },
        { status: 400 },
      );
    }

    // Check if child is already nested
    if (child.parent_uuid) {
      return Response.json(
        { error: "Child is already nested in another parent" },
        { status: 400 },
      );
    }

    // Update child to set parent
    const query = `
      UPDATE nft_assets 
      SET parent_uuid = $1, owner_account = $2, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $3
      RETURNING *
    `;

    const [updated] = await sql(query, [parentUuid, parentUuid, child_uuid]);

    return Response.json({ asset: updated });
  } catch (error) {
    console.error("Error nesting asset:", error);
    return Response.json({ error: "Failed to nest asset" }, { status: 500 });
  }
}

// DELETE unnest a child NFT from parent
export async function DELETE(request, { params }) {
  try {
    const { uuid: parentUuid } = params;
    const { searchParams } = new URL(request.url);
    const childUuid = searchParams.get("child_uuid");

    if (!childUuid) {
      return Response.json(
        { error: "child_uuid is required" },
        { status: 400 },
      );
    }

    // Verify the child belongs to this parent
    const [child] = await sql(
      "SELECT * FROM nft_assets WHERE uuid = $1 AND parent_uuid = $2",
      [childUuid, parentUuid],
    );

    if (!child) {
      return Response.json(
        { error: "Child not found or does not belong to this parent" },
        { status: 404 },
      );
    }

    // Remove parent relationship
    const query = `
      UPDATE nft_assets 
      SET parent_uuid = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $1
      RETURNING *
    `;

    const [updated] = await sql(query, [childUuid]);

    return Response.json({ asset: updated });
  } catch (error) {
    console.error("Error unnesting asset:", error);
    return Response.json({ error: "Failed to unnest asset" }, { status: 500 });
  }
}
