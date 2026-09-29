#!/usr/bin/env python3
"""
Fix all sc-network enum encoding indices
Patches sc-network 0.38.0, 0.39.0, 0.40.0, 0.41.0
"""
import glob
import os
import re

versions = ['0.38.0', '0.39.0', '0.40.0', '0.41.0']
base_path = os.path.expanduser('~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f')

for version in versions:
    # Try to find the file
    pattern = f"{base_path}/sc-network-{version}/src/protocol/message.rs"
    
    # Handle glob patterns for the registry hash
    all_files = glob.glob(os.path.expanduser(f"~/.cargo/registry/src/*/sc-network-{version}/src/protocol/message.rs"))
    
    if all_files:
        file_path = all_files[0]
        print(f"Patching {file_path}")
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if already patched
        if '#[codec(index = 7)]' in content and 'RemoteCallRequest' in content:
            print(f"  Already patched")
            continue
        
        # Add codec indices before each variant
        patches = [
            (r'(\n\s+)RemoteCallRequest\(RemoteCallRequest<Hash>\),', r'\1#[codec(index = 7)]\n\1RemoteCallRequest(RemoteCallRequest<Hash>),'),
            (r'(\n\s+)RemoteCallResponse\(RemoteCallResponse\),', r'\1#[codec(index = 8)]\n\1RemoteCallResponse(RemoteCallResponse),'),
            (r'(\n\s+)RemoteReadRequest\(RemoteReadRequest<Hash>\),', r'\1#[codec(index = 2)]\n\1RemoteReadRequest(RemoteReadRequest<Hash>),'),
            (r'(\n\s+)RemoteReadResponse\(RemoteReadResponse\),', r'\1#[codec(index = 3)]\n\1RemoteReadResponse(RemoteReadResponse),'),
            (r'(\n\s+)RemoteExecRequest\(RemoteExecRequest<Hash>\),', r'\1#[codec(index = 4)]\n\1RemoteExecRequest(RemoteExecRequest<Hash>),'),
            (r'(\n\s+)RemoteExecResponse\(RemoteExecResponse\),', r'\1#[codec(index = 5)]\n\1RemoteExecResponse(RemoteExecResponse),'),
        ]
        
        for pattern, replacement in patches:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                print(f"  Added codec indices")
        
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"  Success!")
    else:
        print(f"sc-network-{version} not found")

print("\nAll patches complete")
