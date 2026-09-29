# Missing binary assets

These 26 files were tracked with Git LFS in the previous repository. The source
archive this repo was imported from contained only their LFS **pointer stubs**
(128-132 bytes each) - the actual binary objects were never present, and GitHub
rejects a push carrying pointers whose objects are missing.

They have therefore been left out of this import rather than committed as
broken pointers. Restore them from the original LFS store (or regenerate them),
drop them into the paths below, re-enable the LFS rules in `.gitattributes`,
then `git add --renormalize .`.

## Files

- `apps/games/Phaser/assets/dino.png`
- `apps/games/Phaser/assets/guapen.png`
- `apps/games/Phaser/assets/ships.png`
- `apps/games/Phaser/assets/tiles.png`
- `apps/games/Phaser/thumbnail.png`
- `apps/hub/public/assets/badges/official/donor-tier-1-supporter.mp4`
- `apps/hub/public/assets/badges/official/donor-tier-1-supporter.png`
- `apps/hub/public/assets/badges/official/donor-tier-2-champion.png`
- `apps/hub/public/assets/badges/official/donor-tier-3-guardian.png`
- `apps/hub/public/assets/badges/official/donor-tier-4-architect.png`
- `apps/hub/public/assets/badges/official/donor-tier-5-godsent.png`
- `apps/hub/public/assets/badges/official/early-adopter-badge.png`
- `apps/hub/public/assets/badges/official/game-developer-badge.png`
- `apps/hub/public/assets/badges/official/music-artist-badge.mp4`
- `apps/hub/public/assets/badges/official/music-artist-badge.png`
- `apps/hub/public/assets/badges/official/validator-badge.png`
- `apps/nft/drc-369portal/apps/mobile/assets/images/adaptive-icon.png`
- `apps/nft/drc-369portal/apps/mobile/assets/images/favicon.png`
- `apps/nft/drc-369portal/apps/mobile/assets/images/icon.png`
- `apps/nft/drc-369portal/apps/mobile/assets/images/splash-icon.png`
- `apps/nft/drc-369portal/apps/web/src/__create/favicon.png`
- `apps/wallet-extension/icons/icon128.png`
- `apps/wallet-extension/icons/icon16.png`
- `apps/wallet-extension/icons/icon48.png`
- `packages/Construct-Addon-SDK-main.zip`
- `sdk/unreal/DemiurgeSDK/DemiurgeSDK.uplugin`
