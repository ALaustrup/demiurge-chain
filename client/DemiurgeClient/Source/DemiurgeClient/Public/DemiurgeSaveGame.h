// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "DemiurgeTypes.h"
#include "DemiurgeSaveGame.generated.h"

/**
 * UDemiurgeSaveGame - Local Persistence for Demiurge Sessions
 * 
 * Stores local session data that doesn't need to be on-chain:
 * - Last used wallet address (for auto-login)
 * - Preferred node URL
 * - UI preferences (glass opacity, color theme)
 * - Cached Qor ID for offline display
 * - Recent transaction history (local cache)
 * 
 * NOTE: This does NOT store private keys or sensitive auth data.
 * All authentication is handled through wallet signing.
 */
UCLASS(BlueprintType, meta = (DisplayName = "Demiurge Save Game"))
class DEMIURGECLIENT_API UDemiurgeSaveGame : public USaveGame
{
	GENERATED_BODY()

public:
	UDemiurgeSaveGame();

	// ═══════════════════════════════════════════════════════════════════════════
	// STATIC HELPERS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Default save slot name */
	static const FString SaveSlotName;

	/** Load or create save game */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Save")
	static UDemiurgeSaveGame* LoadOrCreate();

	/** Save current data to disk */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Save")
	bool SaveToDisk();

	/** Delete all saved data */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Save")
	static bool DeleteSave();

	// ═══════════════════════════════════════════════════════════════════════════
	// SESSION DATA
	// ═══════════════════════════════════════════════════════════════════════════

	/** Last used wallet address (SS58 format) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Session")
	FString LastWalletAddress;

	/** Cached Qor Identity for offline display */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Session")
	FQorIdentity CachedIdentity;

	/** Has the user completed the onboarding tutorial? */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Session")
	bool bCompletedOnboarding;

	/** Last successful login timestamp (UTC) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Session")
	FDateTime LastLoginTime;

	// ═══════════════════════════════════════════════════════════════════════════
	// CONNECTION PREFERENCES
	// ═══════════════════════════════════════════════════════════════════════════

	/** Preferred Substrate node URL */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Connection")
	FString PreferredNodeURL;

	/** Auto-connect on game start? */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Connection")
	bool bAutoConnect;

	/** Custom node URLs added by user */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Connection")
	TArray<FString> CustomNodeURLs;

	// ═══════════════════════════════════════════════════════════════════════════
	// UI PREFERENCES
	// ═══════════════════════════════════════════════════════════════════════════

	/** Preferred glass panel opacity (0.0 - 1.0) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float GlassOpacity;

	/** Preferred blur strength */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI", meta = (ClampMin = "0.0", ClampMax = "100.0"))
	float BlurStrength;

	/** Edge glow enabled? */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
	bool bEdgeGlowEnabled;

	/** Custom accent color (overrides default cyan) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
	FLinearColor AccentColor;

	/** Use custom accent color? */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI")
	bool bUseCustomAccentColor;

	/** UI scale multiplier */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "UI", meta = (ClampMin = "0.5", ClampMax = "2.0"))
	float UIScale;

	// ═══════════════════════════════════════════════════════════════════════════
	// CACHED DATA (Local Performance Optimization)
	// ═══════════════════════════════════════════════════════════════════════════

	/** Cached CGT balance (for offline display) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Cache")
	int64 CachedCGTBalance;

	/** Cached inventory (for offline display) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Cache")
	TArray<FDRC369Item> CachedInventory;

	/** Last cache update time */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Cache")
	FDateTime CacheTimestamp;

	// ═══════════════════════════════════════════════════════════════════════════
	// RECENT ACTIVITY (Local History)
	// ═══════════════════════════════════════════════════════════════════════════

	/** Recent CGT transactions (local cache, max 50) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "History")
	TArray<FCGTTransaction> RecentTransactions;

	/** Maximum transactions to cache */
	static constexpr int32 MaxCachedTransactions = 50;

	/** Add a transaction to history (auto-trims old entries) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|History")
	void AddTransaction(const FCGTTransaction& Transaction);

	// ═══════════════════════════════════════════════════════════════════════════
	// HELPER METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Check if we have a cached identity */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Save")
	bool HasCachedIdentity() const;

	/** Check if cache is stale (older than specified minutes) */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Save")
	bool IsCacheStale(int32 MaxAgeMinutes = 5) const;

	/** Reset all preferences to defaults */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Save")
	void ResetToDefaults();
};
