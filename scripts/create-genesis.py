#!/usr/bin/env python3
"""Create genesis configuration for Demiurge blockchain."""

import json

genesis = {
    "chain_id": "demiurge-mainnet",
    "validators": [
        {
            "account": "1b5aea9d204ae016f0aca9a5d3495cb153014842c69aac0154ef656d56502b5b",
            "stake": "1000000000000",
            "name": "Genesis Validator 1"
        }
    ],
    "balances": {
        "1b5aea9d204ae016f0aca9a5d3495cb153014842c69aac0154ef656d56502b5b": "10000000000000",
        "treasury": "100000000000000000"
    },
    "parameters": {
        "block_time_ms": 2000,
        "min_validator_stake": "1000000000",
        "max_validators": 100,
        "era_length": 14400
    }
}

with open("/data/demiurge-chain/genesis.json", "w") as f:
    json.dump(genesis, f, indent=2)

print("Genesis file created at /data/demiurge-chain/genesis.json")
print(f"Chain ID: {genesis['chain_id']}")
print(f"Validators: {len(genesis['validators'])}")
