import sql from "@/app/api/utils/sql";

// POST add resource to asset
export async function POST(request, { params }) {
  try {
    const { uuid } = params;
    const { resource_type, uri, priority, context_tags } = await request.json();

    if (!resource_type || !uri || priority === undefined) {
      return Response.json(
        { error: "resource_type, uri, and priority are required" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO nft_resources (nft_uuid, resource_type, uri, priority, context_tags)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const [resource] = await sql(query, [
      uuid,
      resource_type,
      uri,
      priority,
      context_tags || [],
    ]);

    return Response.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Error adding resource:", error);
    return Response.json({ error: "Failed to add resource" }, { status: 500 });
  }
}

// DELETE remove resource from asset
export async function DELETE(request, { params }) {
  try {
    const { uuid } = params;
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resource_id");

    if (!resourceId) {
      return Response.json(
        { error: "resource_id is required" },
        { status: 400 },
      );
    }

    const query = `
      DELETE FROM nft_resources 
      WHERE id = $1 AND nft_uuid = $2
      RETURNING *
    `;

    const [resource] = await sql(query, [resourceId, uuid]);

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    return Response.json({ resource });
  } catch (error) {
    console.error("Error removing resource:", error);
    return Response.json(
      { error: "Failed to remove resource" },
      { status: 500 },
    );
  }
}
