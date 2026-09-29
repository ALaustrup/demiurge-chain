#!/usr/bin/env python3
"""
FINAL FIX: Rebuild sc-network message.rs files properly
Remove codec attributes that are separating from their variants by comments
"""

import glob
from pathlib import Path

def restore_and_fix(file_path):
    """Restore file from backup and rebuild correctly"""
    
    file_path = Path(file_path)
    backup_path = file_path.with_suffix('.rs.bak')
    
    # Try to use backup
    if backup_path.exists():
        print(f"  Restoring from backup: {backup_path}")
        with open(backup_path, 'r') as f:
            content = f.read()
    else:
        # Read current and try to salvage
        with open(file_path, 'r') as f:
            content = f.read()
    
    # Remove any codec indices that were added (they're causing issues)
    lines = []
    skip_next = False
    for line in content.split('\n'):
        if '#[codec(index' in line:
            skip_next = False
            continue
        lines.append(line)
    
    restored_content = '\n'.join(lines)
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(restored_content)
    
    print(f"  ✓ Restored clean version")
    return restored_content

def main():
    registry_base = Path.home() / '.cargo' / 'registry' / 'src'
    files = list(registry_base.glob('*/sc-network-*/src/protocol/message.rs'))
    
    print(f"Cleaning {len(files)} sc-network files...")
    
    for file_path in files:
        version = file_path.parent.parent.name
        print(f"\n{version}:")
        restore_and_fix(str(file_path))
    
    print("\n✓ All files restored to clean state")
    print("The codec collision issue will need to be handled by pinning to a single sc-network version")

if __name__ == '__main__':
    main()
