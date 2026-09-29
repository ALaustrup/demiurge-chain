#!/usr/bin/env python3
"""Test the balances_transfer RPC method"""

import urllib.request
import json

RPC_URL = 'http://localhost:9944'

def rpc(method, params=None):
    req = {
        'jsonrpc': '2.0',
        'method': method,
        'params': params or [],
        'id': 1
    }
    print(f"REQUEST: {method}")
    print(f"  params: {json.dumps(params)}")
    data = json.dumps(req).encode()
    try:
        request = urllib.request.Request(RPC_URL, data=data, headers={'Content-Type': 'application/json'})
        resp = urllib.request.urlopen(request, timeout=10)
        result = json.loads(resp.read().decode())
        if 'error' in result:
            print(f"  ERROR: {result['error']}")
        else:
            print(f"  RESULT: {json.dumps(result['result'], indent=4)}")
        return result
    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return {'error': str(e)}

print("=" * 70)
print("TRANSFER TEST SUITE")
print("=" * 70)

# Test addresses
sender = '0' * 64  # Zero address (has 10000 from starter claim)
recipient = 'a' * 64  # Test recipient
fake_signature = 'b' * 128  # Dummy signature (128 hex chars = 64 bytes)

# 1. Check sender balance before
print("\n1. Checking sender balance before transfer...")
rpc('balances_getBalance', [sender])

# 2. Check recipient balance before
print("\n2. Checking recipient balance before transfer...")
rpc('balances_getBalance', [recipient])

# 3. Try to transfer 1000 Sparks (10 CGT)
print("\n3. Transferring 1000 Sparks from sender to recipient...")
rpc('balances_transfer', [sender, recipient, '1000', fake_signature])

# 4. Check sender balance after
print("\n4. Checking sender balance after transfer...")
rpc('balances_getBalance', [sender])

# 5. Check recipient balance after
print("\n5. Checking recipient balance after transfer...")
rpc('balances_getBalance', [recipient])

# 6. Try to transfer more than balance (should fail)
print("\n6. Trying to transfer more than balance (should fail)...")
rpc('balances_transfer', [sender, recipient, '999999999', fake_signature])

print("\n" + "=" * 70)
print("TRANSFER TEST COMPLETE")
print("=" * 70)
