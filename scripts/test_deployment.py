#!/usr/bin/env python3
"""
Comprehensive deployment test for Demiurge-Cloud.
Tests all RPC methods including new physics integration.
"""

import requests
import json
import sys

RPC_URL = 'http://localhost:9944'

def rpc_call(method, params=None):
    """Make an RPC call and return the result."""
    if params is None:
        params = []
    payload = {
        'jsonrpc': '2.0',
        'id': 1,
        'method': method,
        'params': params
    }
    try:
        response = requests.post(RPC_URL, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        return {'error': str(e)}

def test_section(name):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")

def main():
    print("DEMIURGE BLOCKCHAIN - DEPLOYMENT VERIFICATION")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    # === Chain Health ===
    test_section("CHAIN HEALTH")
    
    result = rpc_call('chain_getHealth')
    if 'result' in result:
        health = result['result']
        print(f"  Connected:     {health.get('connected', 'N/A')}")
        print(f"  Block Number:  {health.get('block_number', 'N/A')}")
        print(f"  Block Time:    {health.get('block_time_ms', 'N/A')}ms")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    result = rpc_call('chain_getBlockNumber')
    if 'result' in result:
        print(f"  Current Block: {result['result']}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === Consensus ===
    test_section("CONSENSUS ENGINE")
    
    result = rpc_call('consensus_getStatus')
    if 'result' in result:
        status = result['result']
        print(f"  Current Era:   {status.get('current_era', 'N/A')}")
        print(f"  Validators:    {status.get('total_validators', 'N/A')}")
        print(f"  Block Number:  {status.get('block_number', 'N/A')}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    result = rpc_call('consensus_getValidators')
    if 'result' in result:
        validators = result['result']
        print(f"  Active Validators: {len(validators)}")
        for v in validators[:3]:  # Show first 3
            print(f"    - {v.get('address', 'unknown')[:16]}...")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === Balances ===
    test_section("BALANCES MODULE")
    
    test_account = '0000000000000000000000000000000000000000000000000000000000000001'
    
    result = rpc_call('balances_getBalance', [test_account])
    if 'result' in result:
        print(f"  Test Account Balance: {result['result']} CGT")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    result = rpc_call('balances_hasClaimedStarter', [test_account])
    if 'result' in result:
        print(f"  Starter Claimed: {result['result']}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === Transfer Test ===
    test_section("BALANCE TRANSFER")
    
    sender = '0000000000000000000000000000000000000000000000000000000000000001'
    recipient = '0000000000000000000000000000000000000000000000000000000000000099'
    
    # Get balances before
    sender_before = rpc_call('balances_getBalance', [sender])
    recip_before = rpc_call('balances_getBalance', [recipient])
    
    print(f"  Before Transfer:")
    print(f"    Sender:    {sender_before.get('result', 'error')} CGT")
    print(f"    Recipient: {recip_before.get('result', 'error')} CGT")
    
    # Execute transfer
    dummy_sig = 'a' * 128
    transfer_result = rpc_call('balances_transfer', [sender, recipient, '100', dummy_sig])
    
    if 'result' in transfer_result:
        tr = transfer_result['result']
        print(f"  Transfer Result:")
        print(f"    Success:  {tr.get('success')}")
        print(f"    TX Hash:  {tr.get('tx_hash', 'N/A')[:32]}...")
        print(f"    Amount:   {tr.get('amount')} CGT")
        passed += 1
    else:
        print(f"  Transfer ERROR: {transfer_result.get('error')}")
        failed += 1
    
    # Get balances after
    sender_after = rpc_call('balances_getBalance', [sender])
    recip_after = rpc_call('balances_getBalance', [recipient])
    
    print(f"  After Transfer:")
    print(f"    Sender:    {sender_after.get('result', 'error')} CGT")
    print(f"    Recipient: {recip_after.get('result', 'error')} CGT")
    
    # === Energy Module ===
    test_section("ENERGY MODULE")
    
    result = rpc_call('energy_getEnergy', [test_account])
    if 'result' in result:
        energy = result['result']
        print(f"  Current Energy:  {energy.get('current', 'N/A')}")
        print(f"  Max Energy:      {energy.get('max', 'N/A')}")
        print(f"  Regen Rate:      {energy.get('regeneration_rate', 'N/A')}/block")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === DRC-369 NFT Module ===
    test_section("DRC-369 NFT MODULE")
    
    result = rpc_call('drc369_totalSupply')
    if 'result' in result:
        print(f"  Total Supply: {result['result']} NFTs")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    result = rpc_call('drc369_balanceOf', [test_account])
    if 'result' in result:
        print(f"  Test Account NFTs: {result['result']}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === NEW: Physics Integration ===
    test_section("DRC-369 PHYSICS INTEGRATION (NEW)")
    
    test_token = '0000000000000000000000000000000000000000000000000000000000000001'
    
    result = rpc_call('drc369_hasPhysics', [test_token])
    if 'result' in result:
        print(f"  Token has physics: {result['result']}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    result = rpc_call('drc369_getPhysics', [test_token])
    if 'result' in result:
        physics = result['result']
        if physics:
            print(f"  Physics data: {json.dumps(physics, indent=4)[:200]}...")
        else:
            print(f"  Physics data: None (token doesn't exist or no physics)")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === Session Keys ===
    test_section("SESSION KEYS MODULE")
    
    result = rpc_call('sessionKeys_getActiveKeys', [test_account])
    if 'result' in result:
        keys = result['result']
        print(f"  Active Session Keys: {len(keys)}")
        passed += 1
    else:
        print(f"  ERROR: {result.get('error')}")
        failed += 1
    
    # === Summary ===
    test_section("TEST SUMMARY")
    total = passed + failed
    print(f"  Passed: {passed}/{total}")
    print(f"  Failed: {failed}/{total}")
    
    if failed == 0:
        print("\n  ✓ ALL TESTS PASSED - DEPLOYMENT VERIFIED")
        return 0
    else:
        print(f"\n  ✗ {failed} TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(main())
