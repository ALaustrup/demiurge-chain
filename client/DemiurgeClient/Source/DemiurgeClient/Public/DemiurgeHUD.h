// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "DemiurgeHUD.generated.h"

class UQorGlassPanel;
class UDemiurgeNetworkManager;

/**
 * Demiurge HUD - Master UI Controller
 * 
 * The primary HUD class for the Demiurge Client. This orchestrates
 * all UI elements using the Cyber Glass Design System.
 * 
 * Features:
 * - Manages all Qor Glass panels (Wallet, Inventory, Social, etc.)
 * - Displays real-time CGT balance
 * - Shows Qor ID status (username, Qor Key)
 * - Handles item visualization (DRC-369)
 * - Manages trade UI (initiate/accept)
 * 
 * Usage:
 *   Set this as the HUD class in your GameMode Blueprint.
 */
UCLASS()
class DEMIURGECLIENT_API ADemiurgeHUD : public AHUD
{
	GENERATED_BODY()

public:
	ADemiurgeHUD();

	virtual void BeginPlay() override;
	virtual void DrawHUD() override;

	/** Show the Qor ID panel (username, Qor Key, profile) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowQorIDPanel();

	/** Show the wallet panel (CGT balance, transaction history) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowWalletPanel();

	/** Show the inventory panel (DRC-369 items) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowInventoryPanel();

	/** Show the social panel (friends, guilds, Archon leaderboard) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowSocialPanel();

	/** Hide all panels */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void HideAllPanels();

	/** Update CGT balance display */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void UpdateCGTBalance(int64 NewBalance);

	/** Update Qor ID display */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void UpdateQorID(const FString& Username, const FString& QorKey);

	/** Display notification (trade received, item minted, etc.) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowNotification(const FString& Message, float Duration = 3.0f);

	/** Spawn DRC-369 item in 3D world */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void SpawnItemInWorld(const FString& ItemUUID, FVector Location);

	/** Highlight item in inventory (when hovering) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void HighlightItem(const FString& ItemUUID);

	/** Show trade offer UI (when receiving a trade) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void ShowTradeOffer(const FString& OfferID, const FString& SenderUsername, const FString& ItemUUID);

	/** Accept trade offer (triggered by user) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void AcceptTradeOffer(const FString& OfferID);

	/** Reject trade offer */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|HUD")
	void RejectTradeOffer(const FString& OfferID);

	/** Widget class for Qor ID panel */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|HUD")
	TSubclassOf<UUserWidget> QorIDPanelClass;

	/** Widget class for wallet panel */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|HUD")
	TSubclassOf<UUserWidget> WalletPanelClass;

	/** Widget class for inventory panel */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|HUD")
	TSubclassOf<UUserWidget> InventoryPanelClass;

	/** Widget class for social panel */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|HUD")
	TSubclassOf<UUserWidget> SocialPanelClass;

	/** Widget class for notifications */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|HUD")
	TSubclassOf<UUserWidget> NotificationClass;

protected:
	UPROPERTY()
	UUserWidget* CurrentQorIDPanel;

	UPROPERTY()
	UUserWidget* CurrentWalletPanel;

	UPROPERTY()
	UUserWidget* CurrentInventoryPanel;

	UPROPERTY()
	UUserWidget* CurrentSocialPanel;

	UPROPERTY()
	UDemiurgeNetworkManager* NetworkManager;

	int64 CachedCGTBalance;
	FString CachedUsername;
	FString CachedQorKey;

	UUserWidget* CreatePanelWidget(TSubclassOf<UUserWidget> WidgetClass);
	void AnimatePanelEntrance(UUserWidget* Panel);
};
