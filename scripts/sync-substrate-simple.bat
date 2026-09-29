@echo off
echo Syncing substrate directory to server...
echo.

REM Check if substrate directory exists
if not exist "substrate" (
    echo ERROR: substrate directory not found!
    exit /b 1
)

echo Step 1: Creating archive...
tar --exclude=target --exclude=.git --exclude="*.lock" -czf "%TEMP%\substrate-sync.tar.gz" -C . substrate

if errorlevel 1 (
    echo ERROR: Failed to create archive
    echo Make sure tar is available (Windows 10+ or Git for Windows)
    exit /b 1
)

echo Step 2: Uploading to server...
scp "%TEMP%\substrate-sync.tar.gz" pleroma:/tmp/substrate-sync.tar.gz

if errorlevel 1 (
    echo ERROR: Failed to upload
    del "%TEMP%\substrate-sync.tar.gz"
    exit /b 1
)

echo Step 3: Extracting on server...
ssh pleroma "mkdir -p /opt/demiurge-blockchain/substrate && cd /opt/demiurge-blockchain/substrate && tar -xzf /tmp/substrate-sync.tar.gz --strip-components=1 && rm /tmp/substrate-sync.tar.gz && echo 'Extraction complete'"

if errorlevel 1 (
    echo ERROR: Failed to extract on server
    del "%TEMP%\substrate-sync.tar.gz"
    exit /b 1
)

echo Step 4: Cleaning up...
del "%TEMP%\substrate-sync.tar.gz"

echo.
echo SUCCESS: Substrate directory synced!
echo Verifying...
ssh pleroma "ls -lh /opt/demiurge-blockchain/substrate | head -10"
