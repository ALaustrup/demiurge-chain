#!/usr/bin/env python3
"""Claim starter bonus for a test account."""
import requests
import sys

RPC_URL = 'http://localhost:9944'
TEST_ACCOUNT = '0000000000000000000000000000000000000000000000000000000000000001'

def main():
    # Check current balance
    r = requests.post(RPC_URL, json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': 'balances_getBalance',
        'params': [TEST_ACCOUNT]
    })
    print(f"Balance before: {r.json().get('result', 'error')}")
    
    # Claim starter bonus
    r = requests.post(RPC_URL, json={
        'jsonrpc': '2.0',
        'id': 2,
        'method': 'balances_claimStarter',
        'params': [TEST_ACCOUNT]
    })
    result = r.json()
    print(f"Claim result: {result}")
    
    # Check balance after
    r = requests.post(RPC_URL, json={
        'jsonrpc': '2.0',
        'id': 3,
        'method': 'balances_getBalance',
        'params': [TEST_ACCOUNT]
    })
    print(f"Balance after: {r.json().get('result', 'error')}")

if __name__ == '__main__':
    main()
