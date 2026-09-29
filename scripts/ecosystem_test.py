#!/usr/bin/env python3
"""
Demiurge Ecosystem Test Suite
Tests all critical paths and APIs
"""

import urllib.request
import json
import time
import sys

RPC_URL = 'http://localhost:9948'
HUB_URL = 'http://localhost:3000'

def rpc_call(method, params=None):
    if params is None:
        params = []
    data = json.dumps({
        'jsonrpc': '2.0',
        'method': method,
        'params': params,
        'id': 1
    }).encode()
    req = urllib.request.Request(RPC_URL, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=10)
        return json.loads(response.read().decode())
    except Exception as e:
        return {'error': str(e)}

def http_get(url):
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=10)
        return {'status': response.status, 'ok': True}
    except urllib.error.HTTPError as e:
        return {'status': e.code, 'ok': False, 'error': str(e)}
    except Exception as e:
        return {'status': 0, 'ok': False, 'error': str(e)}

print('=' * 60)
print('DEMIURGE ECOSYSTEM TEST SUITE')
print('=' * 60)

passed = 0
failed = 0

# Test 1: Blockchain RPC Health
print('\n[1/8] Blockchain RPC Health...')
result = rpc_call('chain_getHealth')
if 'result' in result and result['result'].get('connected'):
    block = result['result'].get('block_number', 'N/A')
    print(f"  PASS: Connected | Block: {block}")
    passed += 1
else:
    print(f"  FAIL: {result}")
    failed += 1

# Test 2: Hub Homepage
print('\n[2/8] Hub Homepage (/)...')
result = http_get(f'{HUB_URL}/')
if result['ok']:
    print(f"  PASS: Status {result['status']}")
    passed += 1
else:
    print(f"  FAIL: Status {result['status']}")
    failed += 1

# Test 3: Hub Dashboard
print('\n[3/8] Hub Dashboard (/dashboard)...')
result = http_get(f'{HUB_URL}/dashboard')
if result['ok'] or result['status'] == 307:
    print(f"  PASS: Status {result['status']}")
    passed += 1
else:
    print(f"  FAIL: Status {result['status']}")
    failed += 1

# Test 4: Hub API Health
print('\n[4/8] Hub API Health...')
result = http_get(f'{HUB_URL}/api/health')
if result['ok']:
    print(f"  PASS: Status {result['status']}")
    passed += 1
else:
    print(f"  FAIL: Status {result['status']}")
    failed += 1

# Test 5: Hub Blockchain Data API
print('\n[5/8] Hub Blockchain Health API...')
result = http_get(f'{HUB_URL}/api/blockchain/health')
if result['ok']:
    print(f"  PASS: Status {result['status']}")
    passed += 1
else:
    print(f"  FAIL: Status {result['status']}")
    failed += 1

# Test 6: Spline Data API
print('\n[6/8] Spline Data API...')
result = http_get(f'{HUB_URL}/api/spline/data')
if result['ok']:
    print(f"  PASS: Status {result['status']}")
    passed += 1
else:
    print(f"  FAIL: Status {result['status']}")
    failed += 1

# Test 7: Various Hub Routes
print('\n[7/8] Hub Routes...')
routes = ['/games', '/social', '/music', '/nft-portal', '/staking', '/validators', '/settings']
route_pass = 0
for route in routes:
    result = http_get(f'{HUB_URL}{route}')
    ok = result['ok'] or result['status'] == 307
    status = 'PASS' if ok else 'FAIL'
    print(f"  {status}: {route} ({result['status']})")
    if ok:
        route_pass += 1

if route_pass == len(routes):
    passed += 1
else:
    failed += 1

# Test 8: RPC Methods
print('\n[8/8] RPC Methods...')
methods = [
    ('chain_getBlockNumber', []),
    ('consensus_getValidators', []),
]
rpc_pass = 0
for method, params in methods:
    result = rpc_call(method, params)
    ok = 'result' in result
    status = 'PASS' if ok else 'FAIL'
    print(f"  {status}: {method}")
    if ok:
        rpc_pass += 1

if rpc_pass == len(methods):
    passed += 1
else:
    failed += 1

print('\n' + '=' * 60)
print(f'TEST RESULTS: {passed} passed, {failed} failed')
print('=' * 60)

sys.exit(0 if failed == 0 else 1)
