// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "QorUI/QorWalletWidget.h"
#include "Components/TextBlock.h"
#include "Components/EditableTextBox.h"
#include "Components/Button.h"
#include "DemiurgeWeb3/DemiurgeNetworkManager.h"
#include "DemiurgeClient/DemiurgeGameMode.h"
#include "DemiurgeClient/DemiurgePlayerController.h"
#include "Kismet/GameplayStatics.h"
#include "Internationalization/TextFormatter.h"

UQorWalletWidget::UQorWalletWidget(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
	, CurrentBalance(0)
{
}

void UQorWalletWidget::NativeConstruct()
{
	Super::NativeConstruct();

	// Apply wallet-specific style
	ApplyArchonStyle();

	// Bind send button (will be handled in Blueprint or via OnSendClicked)
	if (SendButton)
	{
		// Blueprint can bind this, or call OnSendClicked directly
	}

	// Get network manager and bind to balance updates
	ADemiurgeGameMode* GameMode = Cast<ADemiurgeGameMode>(UGameplayStatics::GetGameMode(this));
	if (GameMode)
	{
		UDemiurgeNetworkManager* NetworkManager = GameMode->GetNetworkManager();
		if (NetworkManager)
		{
			NetworkManager->OnBalanceUpdated.AddDynamic(this, &UQorWalletWidget::OnBalanceUpdated);
			RefreshBalance();
		}
	}
}

void UQorWalletWidget::RefreshBalance()
{
	ADemiurgeGameMode* GameMode = Cast<ADemiurgeGameMode>(UGameplayStatics::GetGameMode(this));
	if (!GameMode)
	{
		return;
	}

	UDemiurgeNetworkManager* NetworkManager = GameMode->GetNetworkManager();
	if (!NetworkManager)
	{
		return;
	}

	// Request balance update
	NetworkManager->GetCGTBalance();
}

void UQorWalletWidget::SendCGT(const FString& Recipient, int64 Amount)
{
	if (Amount <= 0)
	{
		// Show error
		return;
	}

	ADemiurgeGameMode* GameMode = Cast<ADemiurgeGameMode>(UGameplayStatics::GetGameMode(this));
	if (!GameMode)
	{
		return;
	}

	UDemiurgeNetworkManager* NetworkManager = GameMode->GetNetworkManager();
	if (!NetworkManager)
	{
		return;
	}

	// Transfer CGT
	NetworkManager->TransferCGT(Recipient, Amount);
}

FString UQorWalletWidget::FormatBalance(int64 RawBalance) const
{
	// CGT has 8 decimals
	double BalanceCGT = RawBalance / 100000000.0;
	return FString::Printf(TEXT("%.8f CGT"), BalanceCGT);
}

void UQorWalletWidget::OnBalanceUpdated(int64 NewBalance)
{
	CurrentBalance = NewBalance;

	if (BalanceText)
	{
		BalanceText->SetText(FText::FromString(FormatBalance(CurrentBalance)));
	}

	// Pulse edge glow on balance update
	PulseEdgeGlow(1.5f, 0.3f);
}

void UQorWalletWidget::OnSendClicked()
{
	if (!RecipientInput || !AmountInput)
	{
		return;
	}

	FString Recipient = RecipientInput->GetText().ToString();
	FString AmountStr = AmountInput->GetText().ToString();

	// Parse amount (expecting CGT units, convert to smallest units)
	int64 Amount = FCString::Atoi64(*AmountStr) * 100000000LL;

	if (Amount > 0 && !Recipient.IsEmpty())
	{
		SendCGT(Recipient, Amount);
	}
}
