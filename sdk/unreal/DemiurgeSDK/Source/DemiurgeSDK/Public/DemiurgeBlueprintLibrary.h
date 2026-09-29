// Copyright Demiurge-Cloud. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "DemiurgeTypes.h"
#include "DemiurgeBlueprintLibrary.generated.h"

/**
 * Blueprint Function Library for Demiurge SDK
 * 
 * Provides static helper functions for working with Demiurge in Blueprints.
 */
UCLASS()
class DEMIURGESDK_API UDemiurgeBlueprintLibrary : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	// =========================================================================
	// CLIENT ACCESS
	// =========================================================================

	/**
	 * Get the Demiurge Client subsystem
	 * @param WorldContextObject World context
	 * @return The Demiurge Client (or nullptr if not available)
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge", meta = (WorldContext = "WorldContextObject"))
	static class UDemiurgeClient* GetDemiurgeClient(UObject* WorldContextObject);

	// =========================================================================
	// ASSET UTILITIES
	// =========================================================================

	/**
	 * Calculate XP required for a level
	 * @param Level The target level
	 * @return XP required to reach that level
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static int64 GetXPForLevel(int32 Level);

	/**
	 * Calculate level from XP
	 * @param XP Current XP
	 * @return Current level
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static int32 GetLevelFromXP(int64 XP);

	/**
	 * Get progress to next level (0-1)
	 * @param XP Current XP
	 * @return Progress percentage
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static float GetLevelProgress(int64 XP);

	/**
	 * Get the best resource for current platform
	 * @param Asset The asset to check
	 * @param OutResource The best resource (if found)
	 * @return True if a suitable resource was found
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static bool GetBestResource(const FDrc369Asset& Asset, FDrc369Resource& OutResource);

	/**
	 * Get resource by type
	 * @param Asset The asset to check
	 * @param ResourceType Type to find (e.g., "unreal_asset")
	 * @param OutResource The resource (if found)
	 * @return True if found
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static bool GetResourceByType(const FDrc369Asset& Asset, const FString& ResourceType, FDrc369Resource& OutResource);

	/**
	 * Get rarity display name
	 * @param Rarity The rarity enum
	 * @return Human-readable name
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static FString GetRarityDisplayName(EDrc369Rarity Rarity);

	/**
	 * Get rarity color
	 * @param Rarity The rarity enum
	 * @return Color for UI display
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Assets")
	static FLinearColor GetRarityColor(EDrc369Rarity Rarity);

	// =========================================================================
	// IDENTITY UTILITIES
	// =========================================================================

	/**
	 * Format address for display (truncated)
	 * @param Address Full 64-character hex address
	 * @param Length Characters to show at start/end
	 * @return Formatted address (e.g., "0x1234...abcd")
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	static FString FormatAddress(const FString& Address, int32 Length = 4);

	/**
	 * Format handle with @ prefix
	 * @param Handle The handle
	 * @return Formatted handle (e.g., "@alice.demiurge")
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	static FString FormatHandle(const FString& Handle);

	/**
	 * Check if signature scheme is quantum-safe
	 * @param Scheme The signature scheme
	 * @return True if quantum-safe
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	static bool IsQuantumSafe(EDemiurgeSignatureScheme Scheme);

	// =========================================================================
	// PHYSICS UTILITIES
	// =========================================================================

	/**
	 * Apply DRC-369 physics to a primitive component
	 * @param Component The component to configure
	 * @param Physics The physics properties
	 */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Physics")
	static void ApplyDrc369Physics(class UPrimitiveComponent* Component, const FDrc369Physics& Physics);

	/**
	 * Create physics instance from DRC-369 asset
	 * @param Asset The source asset
	 * @return Physics body instance setup
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Physics")
	static FBodyInstance CreatePhysicsBody(const FDrc369Asset& Asset);

	// =========================================================================
	// FORMATTING
	// =========================================================================

	/**
	 * Format CGT amount for display
	 * @param Amount Amount in smallest units
	 * @param Decimals Number of decimal places
	 * @return Formatted string (e.g., "1,234.56 CGT")
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Format")
	static FString FormatCGT(int64 Amount, int32 Decimals = 2);

	/**
	 * Format block number
	 * @param BlockNumber The block number
	 * @return Formatted string (e.g., "BLK#123,456")
	 */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Format")
	static FString FormatBlockNumber(int64 BlockNumber);
};
