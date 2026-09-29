// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeGameMode.h"
#include "DemiurgeNetworkManager.h"
#include "DemiurgeEnvironmentManager.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

ADemiurgeGameMode::ADemiurgeGameMode()
{
	// Default configuration - Monad (Pleroma) server
	DefaultNodeURL = TEXT("ws://51.210.209.112:9944");
	bAutoConnectOnStart = true;
	
	// Default classes
	EnvironmentManagerClass = ADemiurgeEnvironmentManager::StaticClass();
	
	// Network manager will be created in InitGame
	NetworkManager = nullptr;
	EnvironmentManager = nullptr;
}

void ADemiurgeGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
	Super::InitGame(MapName, Options, ErrorMessage);
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] InitGame - Map: %s"), *MapName);
	
	// Create network manager (UObject, not Actor)
	NetworkManager = NewObject<UDemiurgeNetworkManager>(this, TEXT("NetworkManager"));
	
	if (NetworkManager)
	{
		// Bind to connection events
		NetworkManager->OnConnected.AddDynamic(this, &ADemiurgeGameMode::OnBlockchainConnected);
	}
}

void ADemiurgeGameMode::BeginPlay()
{
	Super::BeginPlay();
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] BeginPlay - Initializing Demiurge systems"));
	
	InitializeSystems();
}

void ADemiurgeGameMode::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	// Disconnect from blockchain
	if (NetworkManager)
	{
		NetworkManager->Disconnect();
	}
	
	Super::EndPlay(EndPlayReason);
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] EndPlay - Demiurge systems shut down"));
}

void ADemiurgeGameMode::InitializeSystems()
{
	// Spawn environment manager
	SpawnEnvironmentManager();
	
	// Auto-connect to blockchain if configured
	if (bAutoConnectOnStart)
	{
		ConnectToBlockchain(DefaultNodeURL);
	}
}

void ADemiurgeGameMode::SpawnEnvironmentManager()
{
	if (!EnvironmentManagerClass)
	{
		EnvironmentManagerClass = ADemiurgeEnvironmentManager::StaticClass();
	}
	
	UWorld* World = GetWorld();
	if (!World)
	{
		return;
	}
	
	// Check if one already exists
	TArray<AActor*> ExistingManagers;
	UGameplayStatics::GetAllActorsOfClass(World, ADemiurgeEnvironmentManager::StaticClass(), ExistingManagers);
	
	if (ExistingManagers.Num() > 0)
	{
		EnvironmentManager = Cast<ADemiurgeEnvironmentManager>(ExistingManagers[0]);
		UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] Found existing EnvironmentManager"));
		return;
	}
	
	// Spawn new environment manager
	FActorSpawnParameters SpawnParams;
	SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
	
	EnvironmentManager = World->SpawnActor<ADemiurgeEnvironmentManager>(
		EnvironmentManagerClass,
		FVector::ZeroVector,
		FRotator::ZeroRotator,
		SpawnParams
	);
	
	if (EnvironmentManager)
	{
		UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] Spawned EnvironmentManager"));
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgeGameMode] Failed to spawn EnvironmentManager!"));
	}
}

bool ADemiurgeGameMode::IsConnectedToBlockchain() const
{
	return NetworkManager && NetworkManager->IsConnected();
}

void ADemiurgeGameMode::ConnectToBlockchain(const FString& NodeURL)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgeGameMode] NetworkManager not initialized!"));
		return;
	}
	
	FString URL = NodeURL.IsEmpty() ? DefaultNodeURL : NodeURL;
	UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] Connecting to blockchain: %s"), *URL);
	
	NetworkManager->Connect(URL);
}

void ADemiurgeGameMode::DisconnectFromBlockchain()
{
	if (NetworkManager)
	{
		NetworkManager->Disconnect();
		UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] Disconnected from blockchain"));
	}
}

void ADemiurgeGameMode::OnBlockchainConnected(bool bSuccess)
{
	if (bSuccess)
	{
		UE_LOG(LogTemp, Log, TEXT("[DemiurgeGameMode] ✓ Connected to Substrate node!"));
		
		// Could trigger UI updates, enable gameplay systems, etc.
		if (EnvironmentManager)
		{
			// Flash green to indicate successful connection
			EnvironmentManager->FlashEnvironment(FLinearColor(0.2f, 1.0f, 0.4f), 0.5f);
		}
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgeGameMode] ✗ Failed to connect to Substrate node"));
		
		if (EnvironmentManager)
		{
			// Flash red for connection failure
			EnvironmentManager->FlashEnvironment(FLinearColor(1.0f, 0.2f, 0.2f), 0.5f);
		}
	}
}
