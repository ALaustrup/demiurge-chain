// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "DemiurgeGameMode.generated.h"

class UDemiurgeNetworkManager;
class ADemiurgeEnvironmentManager;
class ADemiurgePlayerController;

/**
 * ADemiurgeGameMode - Core Game Mode for the Demiurge Universe
 * 
 * Responsibilities:
 * - Initialize connection to Substrate blockchain on game start
 * - Manage Qor ID authentication flow
 * - Spawn and configure the Environment Manager
 * - Handle world state transitions based on player location
 * 
 * This GameMode assumes all players must have a valid Qor ID to play.
 * Anonymous/guest sessions are not supported.
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Demiurge Game Mode"))
class DEMIURGECLIENT_API ADemiurgeGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	ADemiurgeGameMode();

	virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

	// ═══════════════════════════════════════════════════════════════════════════
	// BLOCKCHAIN CONNECTION
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get the network manager instance */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Network")
	UDemiurgeNetworkManager* GetNetworkManager() const { return NetworkManager; }

	/** Check if connected to Substrate node */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Network")
	bool IsConnectedToBlockchain() const;

	/** Attempt to connect to the blockchain */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Network")
	void ConnectToBlockchain(const FString& NodeURL = TEXT(""));

	/** Disconnect from blockchain */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Network")
	void DisconnectFromBlockchain();

	// ═══════════════════════════════════════════════════════════════════════════
	// ENVIRONMENT
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get the environment manager */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Environment")
	ADemiurgeEnvironmentManager* GetEnvironmentManager() const { return EnvironmentManager; }

	// ═══════════════════════════════════════════════════════════════════════════
	// CONFIGURATION
	// ═══════════════════════════════════════════════════════════════════════════

	/** Default Substrate node URL (Monad/Pleroma) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config")
	FString DefaultNodeURL;

	/** Auto-connect to blockchain on game start */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config")
	bool bAutoConnectOnStart;

	/** Environment Manager class to spawn */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config")
	TSubclassOf<ADemiurgeEnvironmentManager> EnvironmentManagerClass;

protected:
	/** Network manager instance */
	UPROPERTY()
	UDemiurgeNetworkManager* NetworkManager;

	/** Environment manager reference */
	UPROPERTY()
	ADemiurgeEnvironmentManager* EnvironmentManager;

	/** Initialize core systems */
	void InitializeSystems();

	/** Spawn and configure the environment manager */
	void SpawnEnvironmentManager();

	/** Called when blockchain connection succeeds */
	UFUNCTION()
	void OnBlockchainConnected(bool bSuccess);
};
