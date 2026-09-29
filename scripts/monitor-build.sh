#!/bin/bash
# Demiurge-Cloud Build Monitoring Script

set -e

echo "📊 Demiurge-Cloud Build Monitor"
echo "========================================"
echo ""

# Check build status
echo "🔍 Checking build status on server..."
echo ""

# 1. Build process
echo "1️⃣  Build Process:"
if ssh pleroma "ps aux | grep -q '[b]uild-on-server.sh'" 2>/dev/null; then
    echo "   ✅ Build script running"
else
    echo "   ⚠️  Build script not currently running"
fi

# 2. Latest build log entries
echo ""
echo "2️⃣  Latest Build Output (last 20 lines):"
ssh pleroma "tail -20 ~/demiurge/build.log 2>/dev/null || echo 'Build log not yet created'"

# 3. Check if binary has been created
echo ""
echo "3️⃣  Build Artifacts:"
if ssh pleroma "[ -f ~/demiurge/blockchain/target/release/demiurge-node ]" 2>/dev/null; then
    BINARY_SIZE=$(ssh pleroma "du -h ~/demiurge/blockchain/target/release/demiurge-node | cut -f1")
    echo "   ✅ Binary created: $BINARY_SIZE"
else
    echo "   ⏳ Binary not yet created (still compiling)"
fi

# 4. Check if genesis.hex exists
if ssh pleroma "[ -f ~/demiurge/genesis.hex ]" 2>/dev/null; then
    HEX_SIZE=$(ssh pleroma "du -h ~/demiurge/genesis.hex | cut -f1")
    echo "   ✅ Genesis WASM extracted: $HEX_SIZE"
else
    echo "   ⏳ Genesis WASM not yet generated"
fi

# 5. Check if Docker image created
echo ""
echo "4️⃣  Docker Image:"
if ssh pleroma "docker images | grep -q 'demiurge-node'" 2>/dev/null; then
    echo "   ✅ Docker image created"
    ssh pleroma "docker images | grep demiurge-node"
else
    echo "   ⏳ Docker image not yet created"
fi

# 6. Disk space
echo ""
echo "5️⃣  Disk Space:"
ssh pleroma "df -h | grep -E '(Mounted|demiurge|/home)'" 2>/dev/null || echo "   Unable to check"

# 7. Build completion percentage estimate
echo ""
echo "6️⃣  Build Duration:"
if ssh pleroma "[ -f ~/demiurge/build.log ]" 2>/dev/null; then
    FIRST_LINE=$(ssh pleroma "head -1 ~/demiurge/build.log")
    echo "   First log entry: $FIRST_LINE"
    
    # Count lines to estimate progress
    LOG_LINES=$(ssh pleroma "wc -l ~/demiurge/build.log | awk '{print $1}'")
    echo "   Log file size: $LOG_LINES lines"
    
    if [ "$LOG_LINES" -gt 1000 ]; then
        echo "   📈 Significant progress (1000+ log lines)"
    elif [ "$LOG_LINES" -gt 500 ]; then
        echo "   📈 Good progress (500+ log lines)"
    elif [ "$LOG_LINES" -gt 200 ]; then
        echo "   📝 Still early (~200 log lines, ~15-20 min in)"
    fi
fi

echo ""
echo "========================================"
echo "📋 To view full build log:"
echo "   ssh pleroma \"tail -f ~/demiurge/build.log\""
echo ""
echo "📋 To check specific errors:"
echo "   ssh pleroma \"grep -i error ~/demiurge/build.log\""
echo ""
echo "📋 Expected build completion: 09:15-09:45 UTC"
echo "========================================"
