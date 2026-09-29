#!/bin/bash
# Test RPC health endpoint
curl -s http://localhost:9944 -X POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"chain_getHealth","params":[],"id":1}'
