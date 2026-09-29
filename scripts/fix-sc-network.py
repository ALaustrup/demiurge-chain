#!/usr/bin/env python3
"""
Fix sc-network enum encoding indices conflict
Adds explicit codec indices to prevent duplicate index errors
"""
import glob
import os

# Find the file
cargo_src = os.path.expanduser('~/.cargo/registry/src/index.crates.io-*/sc-network-0.40.0/src/protocol/message.rs')
files = glob.glob(cargo_src)

if not files:
    print("ERROR: message.rs not found")
    exit(1)

file_path = files[0]
print(f"Fixing: {file_path}")

with open(file_path, 'r') as f:
    content = f.read()

# Replace the problematic enum block
old_block = """#[derive(Debug, PartialEq, Eq, Clone, Encode, Decode)]
pub enum Message<Hash: Hasher> {
	/// Consensus message.
	Consensus(ConsensusMessage),
	/// Remote method call request.
	RemoteCallRequest(RemoteCallRequest<Hash>),
	/// Remote method call response.
	RemoteCallResponse(RemoteCallResponse),
	/// Remote storage read request.
	RemoteReadRequest(RemoteReadRequest<Hash>),
	/// Remote storage read response.
	RemoteReadResponse(RemoteReadResponse),
	/// Remote method call request.
	RemoteExecRequest(RemoteExecRequest<Hash>),
	/// Remote method call response.
	RemoteExecResponse(RemoteExecResponse),"""

new_block = """#[derive(Debug, PartialEq, Eq, Clone, Encode, Decode)]
pub enum Message<Hash: Hasher> {
	/// Consensus message.
	#[codec(index = 0)]
	Consensus(ConsensusMessage),
	/// Remote method call request.
	#[codec(index = 1)]
	RemoteCallRequest(RemoteCallRequest<Hash>),
	/// Remote method call response.
	#[codec(index = 6)]
	RemoteCallResponse(RemoteCallResponse),
	/// Remote storage read request.
	#[codec(index = 2)]
	RemoteReadRequest(RemoteReadRequest<Hash>),
	/// Remote storage read response.
	#[codec(index = 3)]
	RemoteReadResponse(RemoteReadResponse),
	/// Remote method call request.
	#[codec(index = 4)]
	RemoteExecRequest(RemoteExecRequest<Hash>),
	/// Remote method call response.
	#[codec(index = 5)]
	RemoteExecResponse(RemoteExecResponse),"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(file_path, 'w') as f:
        f.write(content)
    print("SUCCESS: Enum variants patched with explicit codec indices")
else:
    print("ERROR: Pattern not found - manual patching required")
    print("\nSearch for this enum and add these codec indices:")
    print("  Consensus: #[codec(index = 0)]")
    print("  RemoteCallRequest: #[codec(index = 1)]") 
    print("  RemoteCallResponse: #[codec(index = 6)]")
    print("  RemoteReadRequest: #[codec(index = 2)]")
    print("  RemoteReadResponse: #[codec(index = 3)]")
    print("  RemoteExecRequest: #[codec(index = 4)]")
    print("  RemoteExecResponse: #[codec(index = 5)]")
    exit(1)
