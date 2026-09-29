// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgePlayerController.h"
#include "DemiurgeGameMode.h"
#include "DemiurgeNetworkManager.h"
#include "Kismet/GameplayStatics.h"

// CGT precision: 8 decimals, 1 CGT = 100,000,000 Sparks
static constexpr int64 CGT_PRECISION = 100000000;

ADemiurgePlayerController::ADemiurgePlayerController()
{
	PrimaryActorTick.bCanEverTick = true;
	
	// Session state
	bIsAuthenticated = false;
	CGTBalance = 0;
	WalletAddress = TEXT("");
	
	// Refresh configuration
	BalanceRefreshInterval = 30.0f;  // Every 30 seconds
	InventoryRefreshInterval = 60.0f; // Every minute
	
	TimeSinceBalanceRefresh = 0.0f;
	TimeSinceInventoryRefresh = 0.0f;
	
	NetworkManager = nullptr;
}

void ADemiurgePlayerController::BeginPlay()
{
	Super::BeginPlay();
	
	// Get network manager reference
	NetworkManager = GetNetworkManager();
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] BeginPlay - Awaiting Qor ID authentication"));
}

void ADemiurgePlayerController::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	// Clear session (don't logout from blockchain, just local)
	bIsAuthenticated = false;
	
	Super::EndPlay(EndPlayReason);
}

void ADemiurgePlayerController::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	
	// Only refresh if authenticated
	if (!bIsAuthenticated)
	{
		return;
	}
	
	// Auto-refresh balance
	if (BalanceRefreshInterval > 0.0f)
	{
		TimeSinceBalanceRefresh += DeltaTime;
		if (TimeSinceBalanceRefresh >= BalanceRefreshInterval)
		{
			TimeSinceBalanceRefresh = 0.0f;
			RefreshCGTBalance();
		}
	}
	
	// Auto-refresh inventory
	if (InventoryRefreshInterval > 0.0f)
	{
		TimeSinceInventoryRefresh += DeltaTime;
		if (TimeSinceInventoryRefresh >= InventoryRefreshInterval)
		{
			TimeSinceInventoryRefresh = 0.0f;
			RefreshInventory();
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// QOR ID - IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgePlayerController::AuthenticateQorID(const FString& AccountAddress)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgePC] Cannot authenticate - NetworkManager not available"));
		OnQorIDAuthenticated.Broadcast(false, FQorIdentity());
		return;
	}
	
	WalletAddress = AccountAddress;
	
	// Query the Qor ID for this account
	NetworkManager->LookupQorID(AccountAddress);
	
	// In a real implementation, we'd bind to a response delegate
	// For now, simulate success
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Authenticating Qor ID for: %s"), *AccountAddress);
	
	// Simulate async response (would come from RPC in production)
	FQorIdentity SimulatedIdentity;
	SimulatedIdentity.Username = TEXT("DemiurgeUser");
	SimulatedIdentity.QorKey = TEXT("Q7A1:9F2");
	SimulatedIdentity.AccountAddress = AccountAddress;
	SimulatedIdentity.RegistrationBlock = 1;
	SimulatedIdentity.Reputation = 100;
	
	OnAuthenticationResponse(SimulatedIdentity, true);
}

void ADemiurgePlayerController::RegisterQorID(const FString& Username)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgePC] Cannot register - NetworkManager not available"));
		return;
	}
	
	// This will cost 5 CGT (burn mechanism)
	NetworkManager->RegisterQorID(Username);
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Registering new Qor ID: %s (costs 5 CGT)"), *Username);
}

void ADemiurgePlayerController::Logout()
{
	bIsAuthenticated = false;
	CurrentIdentity = FQorIdentity();
	WalletAddress = TEXT("");
	CGTBalance = 0;
	Inventory.Empty();
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Logged out"));
}

void ADemiurgePlayerController::OnAuthenticationResponse(const FQorIdentity& Identity, bool bSuccess)
{
	if (bSuccess)
	{
		bIsAuthenticated = true;
		CurrentIdentity = Identity;
		
		UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] ✓ Authenticated as %s (%s)"), 
			*Identity.Username, *Identity.QorKey);
		
		// Immediately refresh balance and inventory
		RefreshCGTBalance();
		RefreshInventory();
	}
	else
	{
		bIsAuthenticated = false;
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] ✗ Authentication failed"));
	}
	
	OnQorIDAuthenticated.Broadcast(bSuccess, Identity);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CGT - WALLET
// ═══════════════════════════════════════════════════════════════════════════════

FString ADemiurgePlayerController::GetCGTBalanceFormatted() const
{
	// Convert Sparks to CGT with 8 decimal precision
	double CGTValue = static_cast<double>(CGTBalance) / static_cast<double>(CGT_PRECISION);
	
	// Format with thousands separators and 2 decimal places
	FString Formatted = FString::Printf(TEXT("%.2f CGT"), CGTValue);
	
	// Add thousands separators (simple implementation)
	int32 DecimalPos = Formatted.Find(TEXT("."));
	if (DecimalPos > 3)
	{
		for (int32 i = DecimalPos - 3; i > 0; i -= 3)
		{
			Formatted.InsertAt(i, TEXT(","));
		}
	}
	
	return Formatted;
}

void ADemiurgePlayerController::RefreshCGTBalance()
{
	if (!bIsAuthenticated || !NetworkManager)
	{
		return;
	}
	
	NetworkManager->GetCGTBalance(WalletAddress);
	
	// Simulate response (would come from RPC)
	// In production: bind to OnBalanceReceived delegate
	OnBalanceResponse(123456789000); // 1234.56789 CGT
}

void ADemiurgePlayerController::TransferCGT(const FString& ToAddress, int64 AmountInSparks)
{
	if (!bIsAuthenticated || !NetworkManager)
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] Cannot transfer - not authenticated"));
		return;
	}
	
	if (AmountInSparks > CGTBalance)
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] Insufficient balance for transfer"));
		return;
	}
	
	NetworkManager->TransferCGT(ToAddress, AmountInSparks);
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Initiating transfer of %lld Sparks to %s"), 
		AmountInSparks, *ToAddress);
}

void ADemiurgePlayerController::OnBalanceResponse(int64 Balance)
{
	int64 OldBalance = CGTBalance;
	CGTBalance = Balance;
	
	if (Balance != OldBalance)
	{
		UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Balance updated: %s"), *GetCGTBalanceFormatted());
		OnCGTBalanceUpdated.Broadcast(Balance);
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRC-369 - INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgePlayerController::RefreshInventory()
{
	if (!bIsAuthenticated || !NetworkManager)
	{
		return;
	}
	
	NetworkManager->GetInventory(WalletAddress);
	
	// Simulate response (would come from RPC)
	TArray<FDRC369Item> SimulatedItems;
	
	FDRC369Item TestItem;
	TestItem.UUID = TEXT("550e8400-e29b-41d4-a716-446655440000");
	TestItem.Name = TEXT("Divine Spark Harvester");
	TestItem.CreatorQorKey = TEXT("Q000:001");
	TestItem.UE5AssetPath = TEXT("/Game/Items/Tools/DivineSpark_Harvester");
	TestItem.GlassMaterial = TEXT("/Game/Materials/M_CyberGlass_Blue");
	TestItem.bIsSoulbound = false;
	TestItem.RoyaltyFeePercent = 5;
	TestItem.MintedAtBlock = 1;
	SimulatedItems.Add(TestItem);
	
	OnInventoryResponse(SimulatedItems);
}

bool ADemiurgePlayerController::GetItemByUUID(const FString& UUID, FDRC369Item& OutItem) const
{
	for (const FDRC369Item& Item : Inventory)
	{
		if (Item.UUID == UUID)
		{
			OutItem = Item;
			return true;
		}
	}
	return false;
}

void ADemiurgePlayerController::InitiateItemTrade(const FString& ItemUUID, const FString& ReceiverAddress)
{
	if (!bIsAuthenticated || !NetworkManager)
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] Cannot trade - not authenticated"));
		return;
	}
	
	// Verify we own the item
	FDRC369Item Item;
	if (!GetItemByUUID(ItemUUID, Item))
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] Cannot trade - item not in inventory"));
		return;
	}
	
	// Check if soulbound
	if (Item.bIsSoulbound)
	{
		UE_LOG(LogTemp, Warning, TEXT("[DemiurgePC] Cannot trade - item is soulbound"));
		return;
	}
	
	NetworkManager->InitiateTrade(ItemUUID, ReceiverAddress);
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Initiating trade: %s -> %s"), *ItemUUID, *ReceiverAddress);
}

void ADemiurgePlayerController::OnInventoryResponse(const TArray<FDRC369Item>& Items)
{
	Inventory = Items;
	
	UE_LOG(LogTemp, Log, TEXT("[DemiurgePC] Inventory updated: %d items"), Items.Num());
	OnInventoryUpdated.Broadcast(Items);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL
// ═══════════════════════════════════════════════════════════════════════════════

UDemiurgeNetworkManager* ADemiurgePlayerController::GetNetworkManager()
{
	if (NetworkManager)
	{
		return NetworkManager;
	}
	
	// Get from GameMode
	AGameModeBase* GameMode = UGameplayStatics::GetGameMode(this);
	ADemiurgeGameMode* DemiurgeGM = Cast<ADemiurgeGameMode>(GameMode);
	
	if (DemiurgeGM)
	{
		NetworkManager = DemiurgeGM->GetNetworkManager();
	}
	
	return NetworkManager;
}
