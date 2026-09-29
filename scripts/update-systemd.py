#!/usr/bin/env python3
"""Update the demiurge-node systemd service with genesis and validator config."""

service_content = """[Unit]
Description=Demiurge-Cloud Node
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/data/Demiurge-Blockchain/framework
ExecStart=/data/Demiurge-Blockchain/framework/target/release/demiurge-node \\
    --data-dir /data/demiurge-chain \\
    --rpc-addr 0.0.0.0:9944 \\
    --p2p-addr 0.0.0.0:30333 \\
    --block-time 2000 \\
    --rpc \\
    --p2p \\
    --genesis /data/demiurge-chain/genesis.json \\
    --validator-key /data/demiurge-chain/validator-key.json
Restart=on-failure
RestartSec=10
LimitNOFILE=65535
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
"""

with open("/etc/systemd/system/demiurge-node.service", "w") as f:
    f.write(service_content)

print("Updated /etc/systemd/system/demiurge-node.service")
print("Added --genesis and --validator-key arguments")
