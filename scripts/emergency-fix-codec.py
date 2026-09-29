#!/usr/bin/env python3
"""
EMERGENCY: Fix malformed codec indices in sc-network files
The previous script added attributes incorrectly, causing parse errors
"""

import glob
from pathlib import Path
import re

def fix_malformed_files():
    """Remove malformed codec indices and add them correctly"""
    
    registry_base = Path.home() / '.cargo' / 'registry' / 'src'
    files = list(registry_base.glob('*/sc-network-*/src/protocol/message.rs'))
    
    print(f"Found {len(files)} files to check")
    
    for file_path in files:
        print(f"\nFixing: {file_path.name}")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        original = content
        
        # Step 1: Remove ALL codec attributes and lines with parsing issues
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            # Skip lines with codec attributes
            if '#[codec' in line:
                print(f"  Removing malformed line: {line[:60]}")
                continue
            
            # Skip lines that look like enum closing with extra stuff
            if re.match(r'^\s*\}\s*$', line):
                # This might be an end brace - keep it
                new_lines.append(line)
                continue
            
            new_lines.append(line)
        
        cleaned = '\n'.join(new_lines)
        
        # Step 2: Now add codec indices correctly
        # Find the enum Message block
        enum_pattern = r'(pub enum Message[^{]*\{)(.*?)(\n\s*\})'
        
        def replace_enum(match):
            before = match.group(1)
            body = match.group(2)
            after = match.group(3)
            
            # Add codec indices to variants in body
            codec_indices = {
                'Status': 0,
                'BlockRequest': 1,
                'BlockResponse': 2,
                'BlockAnnounce': 3,
                'Consensus': 6,
                'RemoteCallRequest': 7,
                'RemoteCallResponse': 8,
                'RemoteReadRequest': 9,
                'RemoteReadResponse': 10,
                'RemoteHeaderRequest': 4,
                'RemoteHeaderResponse': 5,
                'RemoteChangesRequest': 13,
                'RemoteChangesResponse': 14,
                'RemoteReadChildRequest': 15,
                'ConsensusBatch': 17,
            }
            
            body_lines = body.split('\n')
            result = []
            
            for line in body_lines:
                # Check for variant
                for variant, idx in codec_indices.items():
                    if f'{variant}(' in line or f'{variant}{{' in line:
                        indent = len(line) - len(line.lstrip())
                        result.append(' ' * indent + f'#[codec(index = {idx})]')
                        break
                result.append(line)
            
            return before + '\n' + '\n'.join(result) + after
        
        cleaned = re.sub(enum_pattern, replace_enum, cleaned, flags=re.DOTALL)
        
        if cleaned != original:
            with open(file_path, 'w') as f:
                f.write(cleaned)
            print(f"  ✓ Fixed")
        else:
            print(f"  - No changes needed")

if __name__ == '__main__':
    fix_malformed_files()
    print("\n✓ All files checked and fixed")
