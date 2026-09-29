#!/usr/bin/env python3
"""Test a single RPC method with verbose output"""

import urllib.request
import json
import sys

RPC_URL = 'http://localhost:9944'

def rpc(method, params=None):
    req = {
        'jsonrpc': '2.0',
        'method': method,
        'params': params or [],
        'id': 1
    }
    print(f"REQUEST: {json.dumps(req, indent=2)}")
    data = json.dumps(req).encode()
    try:
        request = urllib.request.Request(RPC_URL, data=data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(request, timeout=10)
        result = json.loads(resp.read().decode())
        print(f"RESPONSE: {json.dumps(result, indent=2)}")
        return result
    except Exception as e:
        print(f"ERROR: {e}")
        return {'error': str(e)}

# Test the failing methods
print("=" * 70)
print("Testing sessionKeys_getActiveKeys")
print("=" * 70)
rpc('sessionKeys_getActiveKeys', ['0' * 64])

print()
print("=" * 70)
print("Testing consensus_getValidator")
print("=" * 70)
rpc('consensus_getValidator', ['0' * 64])

print()
print("=" * 70)
print("Testing consensus_getStakingPool")
print("=" * 70)
rpc('consensus_getStakingPool', ['0' * 64])
