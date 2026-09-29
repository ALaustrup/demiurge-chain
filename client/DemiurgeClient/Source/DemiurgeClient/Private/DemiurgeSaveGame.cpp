// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeSaveGame.h"
#include "Kismet/GameplayStatics.h"

// Static save slot name
const FString UDemiurgeSaveGame::SaveSlotName = TEXT("DemiurgeSave");

UDemiurgeSaveGame::UDemiurgeSaveGame()
{
	ResetToDefaults();
}

UDemiurgeSaveGame* UDemiurgeSaveGame::LoadOrCreate()
{
	UDemiurgeSaveGame* SaveGame = nullptr;
	
	// Try to load existing save
	if (UGameplayStatics::DoesSaveGameExist(SaveSlotName, 0))
	{
		SaveGame = Cast<UDemiurgeSaveGame>(UGameplayStatics::LoadGameFromSlot(SaveSlotName, 0));
		
		if (SaveGame)
		{
			UE_LOG(LogTemp, Log, TEXT("[DemiurgeSave] Loaded existing save"));
			return SaveGame;
		}
	}
	
	// Create new save
	SaveGame = Cast<UDemiurgeSaveGame>(UGameplayStatics::CreateSaveGameObject(UDemiurgeSaveGame::StaticClass()));
	
	if (SaveGame)
	{
		SaveGame->ResetToDefaults();
		SaveGame->SaveToDisk();
		UE_LOG(LogTemp, Log, TEXT("[DemiurgeSave] Created new save"));
	}
	
	return SaveGame;
}

bool UDemiurgeSaveGame::SaveToDisk()
{
	bool bSuccess = UGameplayStatics::SaveGameToSlot(this, SaveSlotName, 0);
	
	if (bSuccess)
	{
		UE_LOG(LogTemp, Verbose, TEXT("[DemiurgeSave] Saved to disk"));
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgeSave] Failed to save!"));
	}
	
	return bSuccess;
}

bool UDemiurgeSaveGame::DeleteSave()
{
	if (UGameplayStatics::DoesSaveGameExist(SaveSlotName, 0))
	{
		bool bSuccess = UGameplayStatics::DeleteGameInSlot(SaveSlotName, 0);
		
		if (bSuccess)
		{
			UE_LOG(LogTemp, Log, TEXT("[DemiurgeSave] Deleted save"));
		}
		
		return bSuccess;
	}
	
	return true; // No save to delete
}

void UDemiurgeSaveGame::AddTransaction(const FCGTTransaction& Transaction)
{
	// Add to front (most recent first)
	RecentTransactions.Insert(Transaction, 0);
	
	// Trim to max size
	while (RecentTransactions.Num() > MaxCachedTransactions)
	{
		RecentTransactions.RemoveAt(RecentTransactions.Num() - 1);
	}
}

bool UDemiurgeSaveGame::HasCachedIdentity() const
{
	return !CachedIdentity.Username.IsEmpty() && !CachedIdentity.QorKey.IsEmpty();
}

bool UDemiurgeSaveGame::IsCacheStale(int32 MaxAgeMinutes) const
{
	if (CacheTimestamp == FDateTime())
	{
		return true; // Never cached
	}
	
	FTimespan Age = FDateTime::UtcNow() - CacheTimestamp;
	return Age.GetTotalMinutes() > MaxAgeMinutes;
}

void UDemiurgeSaveGame::ResetToDefaults()
{
	// Session
	LastWalletAddress = TEXT("");
	CachedIdentity = FQorIdentity();
	bCompletedOnboarding = false;
	LastLoginTime = FDateTime();
	
	// Connection
	PreferredNodeURL = TEXT("ws://51.210.209.112:9944"); // Monad (Pleroma)
	bAutoConnect = true;
	CustomNodeURLs.Empty();
	
	// UI Preferences - Demiurge defaults
	GlassOpacity = 0.85f;
	BlurStrength = 15.0f;
	bEdgeGlowEnabled = true;
	AccentColor = FLinearColor(0.0f, 0.8f, 1.0f, 1.0f); // Cyan
	bUseCustomAccentColor = false;
	UIScale = 1.0f;
	
	// Cache
	CachedCGTBalance = 0;
	CachedInventory.Empty();
	CacheTimestamp = FDateTime();
	
	// History
	RecentTransactions.Empty();
	
	UE_LOG(LogTemp, Verbose, TEXT("[DemiurgeSave] Reset to defaults"));
}
