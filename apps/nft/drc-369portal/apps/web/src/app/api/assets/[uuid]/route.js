import sql from "@/app/api/utils/sql";

// GET single asset by UUID with all related data
export async function GET(request, { params }) {
  try {
    const { uuid } = params;

    const query = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'id', r.id,
          'resource_type', r.resource_type,
          'uri', r.uri,
          'priority', r.priority,
          'context_tags', r.context_tags
        )) FILTER (WHERE r.id IS NOT NULL) as resources,
        json_agg(DISTINCT jsonb_build_object(
          'id', e.id,
          'slot_name', e.slot_name,
          'equipped_child_uuid', e.equipped_child_uuid,
          'required_trait', e.required_trait
        )) FILTER (WHERE e.id IS NOT NULL) as equipment_slots,
        json_agg(DISTINCT jsonb_build_object(
          'state_key', c.state_key,
          'state_value', c.state_value
        )) FILTER (WHERE c.id IS NOT NULL) as custom_state
      FROM nft_assets a
      LEFT JOIN nft_resources r ON a.uuid = r.nft_uuid
      LEFT JOIN equipment_slots e ON a.uuid = e.nft_uuid
      LEFT JOIN custom_state c ON a.uuid = c.nft_uuid
      WHERE a.uuid = $1
      GROUP BY a.id
    `;

    const [asset] = await sql(query, [uuid]);

    if (!asset) {
      return Response.json({ error: "Asset not found" }, { status: 404 });
    }

    // Get children assets
    const childrenQuery = `
      SELECT 
        a.*,
        json_agg(DISTINCT jsonb_build_object(
          'resource_type', r.resource_type,
          'uri', r.uri,
          'priority', r.priority
        )) FILTER (WHERE r.id IS NOT NULL) as resources
      FROM nft_assets a
      LEFT JOIN nft_resources r ON a.uuid = r.nft_uuid
      WHERE a.parent_uuid = $1
      GROUP BY a.id
    `;

    const children = await sql(childrenQuery, [uuid]);
    asset.children = children;

    return Response.json({ asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    return Response.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

// PATCH update asset
export async function PATCH(request, { params }) {
  try {
    const { uuid } = params;
    const body = await request.json();

    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    const allowedFields = [
      "name",
      "description",
      "owner_account",
      "experience_points",
      "level",
      "durability",
      "kill_count",
      "class_id",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(uuid);

    const query = `
      UPDATE nft_assets 
      SET ${updates.join(", ")}
      WHERE uuid = $${paramCount}
      RETURNING *
    `;

    const [asset] = await sql(query, values);

    if (!asset) {
      return Response.json({ error: "Asset not found" }, { status: 404 });
    }

    return Response.json({ asset });
  } catch (error) {
    console.error("Error updating asset:", error);
    return Response.json({ error: "Failed to update asset" }, { status: 500 });
  }
}
