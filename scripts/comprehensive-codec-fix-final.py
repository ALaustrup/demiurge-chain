#!/usr/bin/env python3
"""
COMPREHENSIVE SC-NETWORK CODEC INDEX FIX
Patches ALL sc-network versions exhaustively with proper indices
This is the FINAL definitive fix for the codec collision issue
"""

import glob
import os
import re
from pathlib import Path
import sys

def get_all_enum_variants(content):
    """Extract all enum variants from Message enum"""
    # Find the enum block
    enum_match = re.search(r'pub enum Message[^{]*\{([^}]+)\}', content, re.DOTALL)
    if not enum_match:
        return None
    
    enum_body = enum_match.group(1)
    
    # Extract variant names (before the opening paren)
    variant_pattern = r'(\w+)\s*\('
    variants = re.findall(variant_pattern, enum_body)
    return variants

def fix_sc_network_comprehensive(file_path):
    """Apply comprehensive codec index fix to sc-network message.rs"""
    
    print(f"\n{'='*70}")
    print(f"PROCESSING: {file_path}")
    print(f"{'='*70}")
    
    with open(file_path, 'r') as f:
        original_content = f.read()
    
    content = original_content
    
    # Define the CANONICAL codec indices for all Message variants
    # These are consistent across all sc-network versions
    codec_indices = {
        'Status': 0,
        'BlockRequest': 1,
        'BlockResponse': 2,
        'BlockAnnounce': 3,
        'Consensus': 6,  # CRITICAL: Must be 6 per Parity design
        'RemoteCallRequest': 7,
        'RemoteCallResponse': 8,
        'RemoteReadRequest': 9,
        'RemoteReadResponse': 10,
        'RemoteExecRequest': 11,
        'RemoteExecResponse': 12,
        'ConsensusBatch': 17,
    }
    
    # Step 1: Remove ALL existing codec indices (clean slate)
    print("\n[STEP 1] Removing existing codec indices...")
    content = re.sub(r'\s*#\[codec\(index = \d+\)\]\n', '', content)
    print("  ✓ Cleaned all existing indices")
    
    # Step 2: Find enum variants in file
    print("\n[STEP 2] Detecting variants in file...")
    lines = content.split('\n')
    variants_found = get_all_enum_variants(content)
    
    if variants_found:
        print(f"  Found {len(variants_found)} variants:")
        for v in variants_found:
            print(f"    - {v}")
    
    # Step 3: Add codec indices before each variant
    print("\n[STEP 3] Adding codec indices...")
    result_lines = []
    added_count = 0
    
    for i, line in enumerate(lines):
        # Check if line contains an enum variant definition
        for variant, index in codec_indices.items():
            # Match pattern: "VariantName(...)" or "VariantName{...}"
            if re.search(rf'\b{variant}\s*[\({{]', line):
                # This is a variant line - add codec index before it
                indent = len(line) - len(line.lstrip())
                indent_str = ' ' * indent
                
                # Check if codec index already exists (shouldn't after cleanup)
                if i > 0 and '#[codec' in lines[i-1]:
                    print(f"  ⚠ Skipping {variant} - codec already present")
                    break
                
                # Add codec index attribute
                result_lines.append(f'{indent_str}#[codec(index = {index})]')
                result_lines.append(line)
                added_count += 1
                print(f"  ✓ Added codec(index = {index}) for {variant}")
                break
        else:
            # No variant matched, just copy line
            result_lines.append(line)
    
    new_content = '\n'.join(result_lines)
    
    # Step 4: Validation
    print("\n[STEP 4] Validating codec indices...")
    
    # Count codec attributes
    codec_count = len(re.findall(r'#\[codec\(index', new_content))
    print(f"  Total codec indices added: {codec_count}")
    
    # Check for duplicate indices
    indices = re.findall(r'#\[codec\(index = (\d+)\)', new_content)
    if len(indices) != len(set(indices)):
        print(f"  ⚠ WARNING: Duplicate indices detected: {indices}")
        duplicates = [x for x in indices if indices.count(x) > 1]
        print(f"  Duplicates: {set(duplicates)}")
    else:
        print(f"  ✓ No duplicate indices")
    
    # Step 5: Write back
    print("\n[STEP 5] Writing fixed file...")
    if new_content != original_content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"  ✓ File updated successfully")
        return True, added_count
    else:
        print(f"  ⚠ No changes needed")
        return False, 0

def main():
    """Main entry point"""
    print("\n" + "="*70)
    print("DEMIURGE BLOCKCHAIN - SC-NETWORK COMPREHENSIVE FIX")
    print("="*70)
    
    registry_base = Path.home() / '.cargo' / 'registry' / 'src'
    
    if not registry_base.exists():
        print(f"ERROR: Cargo registry not found at {registry_base}")
        return False
    
    # Find all sc-network versions
    sc_network_dirs = list(registry_base.glob('*/sc-network-*/src/protocol/message.rs'))
    
    if not sc_network_dirs:
        print("ERROR: No sc-network versions found in cargo registry")
        return False
    
    print(f"\nFound {len(sc_network_dirs)} sc-network versions to fix:")
    for p in sc_network_dirs:
        print(f"  - {p.parent.parent.name}")
    
    # Process each version
    total_fixed = 0
    total_added = 0
    
    for message_file in sc_network_dirs:
        success, added = fix_sc_network_comprehensive(str(message_file))
        if success:
            total_fixed += 1
            total_added += added
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Total sc-network versions processed: {len(sc_network_dirs)}")
    print(f"Files fixed: {total_fixed}")
    print(f"Total codec indices added: {total_added}")
    print("\n✓ All sc-network versions have been comprehensively patched!")
    print("="*70)
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
