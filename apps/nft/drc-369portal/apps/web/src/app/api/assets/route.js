import sql from "@/app/api/utils/sql";

// GET all assets with optional filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const search = searchParams.get("search");
    const hasParent = searchParams.get("hasParent");
    const isDelegated = searchParams.get("isDelegated");

    let query = `
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
        )) FILTER (WHERE c.id IS NOT NULL) as custom_state,
        (SELECT COUNT(*)::int FROM nft_assets WHERE parent_uuid = a.uuid) as children_count
      FROM nft_assets a
      LEFT JOIN nft_resources r ON a.uuid = r.nft_uuid
      LEFT JOIN equipment_slots e ON a.uuid = e.nft_uuid
      LEFT JOIN custom_state c ON a.uuid = c.nft_uuid
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (owner) {
      query += ` AND a.owner_account = $${paramCount}`;
      params.push(owner);
      paramCount++;
    }

    if (search) {
      query += ` AND (LOWER(a.name) LIKE LOWER($${paramCount}) OR LOWER(a.description) LIKE LOWER($${paramCount}))`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (hasParent === "true") {
      query += ` AND a.parent_uuid IS NOT NULL`;
    } else if (hasParent === "false") {
      query += ` AND a.parent_uuid IS NULL`;
    }

    if (isDelegated === "true") {
      query += ` AND a.delegated_user IS NOT NULL`;
    }

    query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

    const assets = await sql(query, params);

    return Response.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return Response.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

// POST create new asset
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      uuid,
      name,
      creator_account,
      owner_account,
      description,
      class_id = 1,
      resources = [],
      equipment_slots = [],
      custom_state = {},
    } = body;

    if (!uuid || !name || !creator_account || !owner_account) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert main asset
    const assetQuery = `
      INSERT INTO nft_assets (
        uuid, name, creator_account, owner_account, description, class_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const [asset] = await sql(assetQuery, [
      uuid,
      name,
      creator_account,
      owner_account,
      description || null,
      class_id,
    ]);

    // Insert resources if provided
    if (resources.length > 0) {
      for (const resource of resources) {
        await sql(
          `INSERT INTO nft_resources (nft_uuid, resource_type, uri, priority, context_tags)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            uuid,
            resource.resource_type,
            resource.uri,
            resource.priority,
            resource.context_tags || [],
          ],
        );
      }
    }

    // Insert equipment slots if provided
    if (equipment_slots.length > 0) {
      for (const slot of equipment_slots) {
        await sql(
          `INSERT INTO equipment_slots (nft_uuid, slot_name, required_trait)
           VALUES ($1, $2, $3)`,
          [uuid, slot.slot_name, slot.required_trait || null],
        );
      }
    }

    // Insert custom state if provided
    const stateEntries = Object.entries(custom_state);
    if (stateEntries.length > 0) {
      for (const [key, value] of stateEntries) {
        await sql(
          `INSERT INTO custom_state (nft_uuid, state_key, state_value)
           VALUES ($1, $2, $3)`,
          [uuid, key, value],
        );
      }
    }

    return Response.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return Response.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
