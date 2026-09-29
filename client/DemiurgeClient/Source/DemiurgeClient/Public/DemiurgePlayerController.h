// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "DemiurgeTypes.h"
#include "DemiurgePlayerController.generated.h"

class UDemiurgeNetworkManager;
class UQorGlassPanel;

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATES
// ═══════════════════════════════════════════════════════════════════════════════

/** Fired when Qor ID authentication completes */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnQorIDAuthenticated, bool, bSuccess, const FQorIdentity&, Identity);

/** Fired when CGT balance updates */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCGTBalanceUpdated, int64, NewBalance);

/** Fired when inventory updates */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnInventoryUpdated, const TArray<FDRC369Item>&, Items);

/**
 * ADemiurgePlayerController - Blockchain-Integrated Player Controller
 * 
 * Manages the player's session with the Demiurge blockchain:
 * - Qor ID authentication and session management
 * - CGT wallet balance tracking
 * - DRC-369 inventory management
 * - RPC request throttling
 * 
 * Each player has ONE Qor ID that persists across sessions.
 * The Qor Key (Q[hex]:[hex]) is derived from their on-chain public key.
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Demiurge Player Controller"))
class DEMIURGECLIENT_API ADemiurgePlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	ADemiurgePlayerController();

	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
	virtual void Tick(float DeltaTime) override;

	// ═══════════════════════════════════════════════════════════════════════════
	// QOR ID - IDENTITY
	// ═══════════════════════════════════════════════════════════════════════════

	/** Check if player has authenticated with a Qor ID */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	bool IsAuthenticated() const { return bIsAuthenticated; }

	/** Get the player's Qor Identity */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	const FQorIdentity& GetQorIdentity() const { return CurrentIdentity; }

	/** Get the player's formatted Qor Key (Q[hex]:[hex]) */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	FString GetQorKey() const { return CurrentIdentity.QorKey; }

	/** Get the player's username */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Identity")
	FString GetUsername() const { return CurrentIdentity.Username; }

	/** Authenticate with an existing Qor ID */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Identity")
	void AuthenticateQorID(const FString& AccountAddress);

	/** Register a new Qor ID (costs 5 CGT) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Identity")
	void RegisterQorID(const FString& Username);

	/** Log out (clear local session, does not affect blockchain) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Identity")
	void Logout();

	// ═══════════════════════════════════════════════════════════════════════════
	// CGT - WALLET
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get current CGT balance (in Sparks, 1 CGT = 100,000,000 Sparks) */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Wallet")
	int64 GetCGTBalance() const { return CGTBalance; }

	/** Get CGT balance formatted as string (e.g., "1,234.56 CGT") */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Wallet")
	FString GetCGTBalanceFormatted() const;

	/** Refresh CGT balance from blockchain */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Wallet")
	void RefreshCGTBalance();

	/** Transfer CGT to another account */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Wallet")
	void TransferCGT(const FString& ToAddress, int64 AmountInSparks);

	// ═══════════════════════════════════════════════════════════════════════════
	// DRC-369 - INVENTORY
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get player's DRC-369 inventory */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Inventory")
	const TArray<FDRC369Item>& GetInventory() const { return Inventory; }

	/** Refresh inventory from blockchain */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Inventory")
	void RefreshInventory();

	/** Get a specific item by UUID */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Inventory")
	bool GetItemByUUID(const FString& UUID, FDRC369Item& OutItem) const;

	/** Initiate trade of an item to another player */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Inventory")
	void InitiateItemTrade(const FString& ItemUUID, const FString& ReceiverAddress);

	// ═══════════════════════════════════════════════════════════════════════════
	// EVENTS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Fired when Qor ID authentication completes */
	UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
	FOnQorIDAuthenticated OnQorIDAuthenticated;

	/** Fired when CGT balance updates */
	UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
	FOnCGTBalanceUpdated OnCGTBalanceUpdated;

	/** Fired when inventory updates */
	UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
	FOnInventoryUpdated OnInventoryUpdated;

	// ═══════════════════════════════════════════════════════════════════════════
	// CONFIGURATION
	// ═══════════════════════════════════════════════════════════════════════════

	/** Auto-refresh balance interval (0 = disabled) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config", meta = (ClampMin = "0", ClampMax = "300"))
	float BalanceRefreshInterval;

	/** Auto-refresh inventory interval (0 = disabled) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config", meta = (ClampMin = "0", ClampMax = "300"))
	float InventoryRefreshInterval;

protected:
	// ═══════════════════════════════════════════════════════════════════════════
	// SESSION STATE
	// ═══════════════════════════════════════════════════════════════════════════

	/** Is the player authenticated with a Qor ID? */
	bool bIsAuthenticated;

	/** Current Qor Identity */
	FQorIdentity CurrentIdentity;

	/** Player's wallet address (SS58 format) */
	FString WalletAddress;

	/** Current CGT balance in Sparks */
	int64 CGTBalance;

	/** Cached DRC-369 inventory */
	TArray<FDRC369Item> Inventory;

	/** Network manager reference */
	UPROPERTY()
	UDemiurgeNetworkManager* NetworkManager;

	// ═══════════════════════════════════════════════════════════════════════════
	// REFRESH TIMERS
	// ═══════════════════════════════════════════════════════════════════════════

	float TimeSinceBalanceRefresh;
	float TimeSinceInventoryRefresh;

	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL HANDLERS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get network manager from GameMode */
	UDemiurgeNetworkManager* GetNetworkManager();

	/** Handle authentication response */
	void OnAuthenticationResponse(const FQorIdentity& Identity, bool bSuccess);

	/** Handle balance query response */
	void OnBalanceResponse(int64 Balance);

	/** Handle inventory query response */
	void OnInventoryResponse(const TArray<FDRC369Item>& Items);
};
