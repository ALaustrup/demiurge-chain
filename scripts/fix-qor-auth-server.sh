#!/bin/bash
# Fix QOR Auth compilation errors on server

cd /data/Demiurge-Blockchain/services/qor-auth/src/handlers

# Backup
cp profile.rs profile.rs.bak

# Fix InternalError line 197
sed -i '197s/.*/        .map_err(|e| AppError::InternalError(anyhow::anyhow!("Invalid user ID: {}", e)))?;/' profile.rs

# Fix sqlx::query! block (lines 200-211)
# Read the file, replace the query block
python3 << 'PYEOF'
with open('profile.rs', 'r') as f:
    lines = f.readlines()

# Find and replace the query block
new_lines = []
i = 0
while i < len(lines):
    if i == 199 and 'sqlx::query!' in lines[i]:
        # Replace the entire query block
        new_lines.append('    sqlx::query(\n')
        new_lines.append('        r#"\n')
        new_lines.append('        UPDATE users\n')
        new_lines.append('        SET on_chain_address = $1, updated_at = NOW()\n')
        new_lines.append('        WHERE id = $2\n')
        new_lines.append('        "#,\n')
        new_lines.append('    )\n')
        new_lines.append('    .bind(address)\n')
        new_lines.append('    .bind(user_id)\n')
        new_lines.append('    .execute(&state.db)\n')
        new_lines.append('    .await?;\n')
        # Skip old lines until .await
        while i < len(lines) and '.await' not in lines[i]:
            i += 1
        # Skip the .map_err line too
        if i < len(lines) and '.map_err' in lines[i]:
            i += 1
    else:
        new_lines.append(lines[i])
    i += 1

with open('profile.rs', 'w') as f:
    f.writelines(new_lines)

print('Fixed profile.rs')
PYEOF

echo "✅ Fixed profile.rs"
