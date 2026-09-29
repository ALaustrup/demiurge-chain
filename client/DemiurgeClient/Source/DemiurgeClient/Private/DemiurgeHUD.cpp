// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeHUD.h"
#include "Blueprint/UserWidget.h"
#include "Kismet/GameplayStatics.h"
#include "DemiurgeNetworkManager.h"

ADemiurgeHUD::ADemiurgeHUD()
{
	CurrentQorIDPanel = nullptr;
	CurrentWalletPanel = nullptr;
	CurrentInventoryPanel = nullptr;
	CurrentSocialPanel = nullptr;
	NetworkManager = nullptr;
	CachedCGTBalance = 0;
}

void ADemiurgeHUD::BeginPlay()
{
	Super::BeginPlay();

	// Create and initialize network manager
	NetworkManager = NewObject<UDemiurgeNetworkManager>(this);
	if (NetworkManager)
	{
		// Bind events
		NetworkManager->OnBalanceUpdated.AddDynamic(this, &ADemiurgeHUD::UpdateCGTBalance);
		
		// Connect to node
		NetworkManager->Connect(TEXT("ws://127.0.0.1:9944"));
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] HUD initialized"));
}

void ADemiurgeHUD::DrawHUD()
{
	Super::DrawHUD();

	// Custom HUD drawing (debug info, etc.)
}

void ADemiurgeHUD::ShowQorIDPanel()
{
	if (!QorIDPanelClass)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] QorIDPanelClass not set"));
		return;
	}

	if (!CurrentQorIDPanel)
	{
		CurrentQorIDPanel = CreatePanelWidget(QorIDPanelClass);
	}

	if (CurrentQorIDPanel)
	{
		CurrentQorIDPanel->SetVisibility(ESlateVisibility::Visible);
		AnimatePanelEntrance(CurrentQorIDPanel);
	}
}

void ADemiurgeHUD::ShowWalletPanel()
{
	if (!WalletPanelClass)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] WalletPanelClass not set"));
		return;
	}

	if (!CurrentWalletPanel)
	{
		CurrentWalletPanel = CreatePanelWidget(WalletPanelClass);
	}

	if (CurrentWalletPanel)
	{
		CurrentWalletPanel->SetVisibility(ESlateVisibility::Visible);
		AnimatePanelEntrance(CurrentWalletPanel);
	}
}

void ADemiurgeHUD::ShowInventoryPanel()
{
	if (!InventoryPanelClass)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] InventoryPanelClass not set"));
		return;
	}

	if (!CurrentInventoryPanel)
	{
		CurrentInventoryPanel = CreatePanelWidget(InventoryPanelClass);
	}

	if (CurrentInventoryPanel)
	{
		CurrentInventoryPanel->SetVisibility(ESlateVisibility::Visible);
		AnimatePanelEntrance(CurrentInventoryPanel);
	}
}

void ADemiurgeHUD::ShowSocialPanel()
{
	if (!SocialPanelClass)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] SocialPanelClass not set"));
		return;
	}

	if (!CurrentSocialPanel)
	{
		CurrentSocialPanel = CreatePanelWidget(SocialPanelClass);
	}

	if (CurrentSocialPanel)
	{
		CurrentSocialPanel->SetVisibility(ESlateVisibility::Visible);
		AnimatePanelEntrance(CurrentSocialPanel);
	}
}

void ADemiurgeHUD::HideAllPanels()
{
	if (CurrentQorIDPanel) CurrentQorIDPanel->SetVisibility(ESlateVisibility::Collapsed);
	if (CurrentWalletPanel) CurrentWalletPanel->SetVisibility(ESlateVisibility::Collapsed);
	if (CurrentInventoryPanel) CurrentInventoryPanel->SetVisibility(ESlateVisibility::Collapsed);
	if (CurrentSocialPanel) CurrentSocialPanel->SetVisibility(ESlateVisibility::Collapsed);
}

void ADemiurgeHUD::UpdateCGTBalance(int64 NewBalance)
{
	CachedCGTBalance = NewBalance;
	
	// Format and log
	double CGT = static_cast<double>(NewBalance) / 100000000.0;
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Balance updated: %.8f CGT"), CGT);
	
	// Would update UI widget here
}

void ADemiurgeHUD::UpdateQorID(const FString& Username, const FString& QorKey)
{
	CachedUsername = Username;
	CachedQorKey = QorKey;
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Qor ID updated: %s (%s)"), *Username, *QorKey);
	
	// Would update UI widget here
}

void ADemiurgeHUD::ShowNotification(const FString& Message, float Duration)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Notification: %s"), *Message);
	
	// Would create and show notification widget here
}

void ADemiurgeHUD::SpawnItemInWorld(const FString& ItemUUID, FVector Location)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Spawning item %s at %s"), *ItemUUID, *Location.ToString());
	
	// Would load and spawn item actor here
}

void ADemiurgeHUD::HighlightItem(const FString& ItemUUID)
{
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Highlighting item: %s"), *ItemUUID);
	
	// Would trigger highlight VFX on item
}

void ADemiurgeHUD::ShowTradeOffer(const FString& OfferID, const FString& SenderUsername, const FString& ItemUUID)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Trade offer from %s for item %s"), *SenderUsername, *ItemUUID);
	
	// Would show trade confirmation dialog
	ShowNotification(FString::Printf(TEXT("Trade offer from %s"), *SenderUsername), 5.0f);
}

void ADemiurgeHUD::AcceptTradeOffer(const FString& OfferID)
{
	if (NetworkManager)
	{
		NetworkManager->AcceptTrade(OfferID);
		ShowNotification(TEXT("Trade accepted!"), 3.0f);
	}
}

void ADemiurgeHUD::RejectTradeOffer(const FString& OfferID)
{
	if (NetworkManager)
	{
		NetworkManager->CancelTrade(OfferID);
		ShowNotification(TEXT("Trade rejected"), 2.0f);
	}
}

UUserWidget* ADemiurgeHUD::CreatePanelWidget(TSubclassOf<UUserWidget> WidgetClass)
{
	if (!WidgetClass) return nullptr;

	APlayerController* PC = GetOwningPlayerController();
	if (!PC) return nullptr;

	UUserWidget* Widget = CreateWidget<UUserWidget>(PC, WidgetClass);
	if (Widget)
	{
		Widget->AddToViewport(10);
	}

	return Widget;
}

void ADemiurgeHUD::AnimatePanelEntrance(UUserWidget* Panel)
{
	if (!Panel) return;

	// Would trigger animation via UQorGlassPanel::AnimateIn()
	Panel->SetRenderOpacity(0.0f);
	// Animation would be handled in tick
}
