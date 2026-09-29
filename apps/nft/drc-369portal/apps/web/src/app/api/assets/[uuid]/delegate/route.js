import sql from "@/app/api/utils/sql";

// POST delegate asset to another user
export async function POST(request, { params }) {
  try {
    const { uuid } = params;
    const { delegated_user, expires_at_block, current_block } =
      await request.json();

    if (!delegated_user) {
      return Response.json(
        { error: "delegated_user is required" },
        { status: 400 },
      );
    }

    const query = `
      UPDATE nft_assets 
      SET 
        delegated_user = $1,
        delegation_expires_at_block = $2,
        delegated_at_block = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $4
      RETURNING *
    `;

    const [asset] = await sql(query, [
      delegated_user,
      expires_at_block || null,
      current_block || null,
      uuid,
    ]);

    if (!asset) {
      return Response.json({ error: "Asset not found" }, { status: 404 });
    }

    return Response.json({ asset });
  } catch (error) {
    console.error("Error delegating asset:", error);
    return Response.json(
      { error: "Failed to delegate asset" },
      { status: 500 },
    );
  }
}

// DELETE revoke delegation
export async function DELETE(request, { params }) {
  try {
    const { uuid } = params;

    const query = `
      UPDATE nft_assets 
      SET 
        delegated_user = NULL,
        delegation_expires_at_block = NULL,
        delegated_at_block = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE uuid = $1
      RETURNING *
    `;

    const [asset] = await sql(query, [uuid]);

    if (!asset) {
      return Response.json({ error: "Asset not found" }, { status: 404 });
    }

    return Response.json({ asset });
  } catch (error) {
    console.error("Error revoking delegation:", error);
    return Response.json(
      { error: "Failed to revoke delegation" },
      { status: 500 },
    );
  }
}
