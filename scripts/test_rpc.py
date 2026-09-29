#!/usr/bin/env python3
import json
import urllib.request

data = json.dumps({
    "jsonrpc": "2.0",
    "method": "chain_getHealth",
    "params": [],
    "id": 1
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:9944',
    data=data,
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print(result)
except Exception as e:
    print(f"Error: {e}")
