// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "QorUI/QorIDLoginWidget.h"
#include "Components/Button.h"
#include "DemiurgeWeb3/DemiurgeNetworkManager.h"
#include "DemiurgeClient/DemiurgeGameMode.h"
#include "DemiurgeClient/DemiurgePlayerController.h"
#include "Kismet/GameplayStatics.h"

UQorIDLoginWidget::UQorIDLoginWidget(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
}

void UQorIDLoginWidget::NativeConstruct()
{
	Super::NativeConstruct();

	// Bind delegates
	OnQorIDRegistered.AddDynamic(this, &UQorIDLoginWidget::OnQorIDRegistered);
	OnAvailabilityChecked.AddDynamic(this, &UQorIDLoginWidget::OnAvailabilityChecked);

	// Bind button clicks if buttons exist
	if (RegisterButton)
	{
		RegisterButton->OnClicked.AddDynamic(this, &UQorIDLoginWidget::OnRegisterClicked);
	}

	if (CancelButton)
	{
		CancelButton->OnClicked.AddDynamic(this, &UQorIDLoginWidget::OnCancelClicked);
	}

	// Apply login-specific style
	ApplyPleromaStyle();
}

void UQorIDLoginWidget::OnRegisterClicked()
{
	FString Username = GetCurrentUsername();
	
	if (!IsUsernameValid())
	{
		// Show error feedback
		if (AvailabilityText)
		{
			AvailabilityText->SetText(FText::FromString(TEXT("Invalid username format")));
			AvailabilityText->SetColorAndOpacity(UnavailableColor);
		}
		return;
	}

	// Get network manager from game mode
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

	// Register Qor ID
	RegisterQorID(Username);
}

void UQorIDLoginWidget::OnCancelClicked()
{
	// Close the widget or return to main menu
	RemoveFromParent();
}

bool UQorIDLoginWidget::IsUsernameValid() const
{
	FString Username = GetCurrentUsername();
	return IsValidUsername(Username);
}

FString UQorIDLoginWidget::GetCurrentUsername() const
{
	if (UsernameInput)
	{
		return UsernameInput->GetText().ToString();
	}
	return FString();
}

void UQorIDLoginWidget::OnQorIDRegistered(const FString& Username, const FString& QorKey)
{
	// Update Qor Key display
	if (QorKeyDisplay)
	{
		QorKeyDisplay->SetText(FText::FromString(QorKey));
	}

	// Show success animation
	ApplySuccessStyle();
	PulseEdgeGlow(2.0f, 0.5f);

	// Broadcast to any listeners
	OnQorIDRegistered.Broadcast(Username, QorKey);
}

void UQorIDLoginWidget::OnAvailabilityChecked(bool bIsAvailable)
{
	if (!AvailabilityText)
	{
		return;
	}

	if (bIsAvailable)
	{
		AvailabilityText->SetText(FText::FromString(TEXT("✓ Available")));
		AvailabilityText->SetColorAndOpacity(AvailableColor);
		SetEdgeGlowColor(AvailableColor);
		SetEdgeGlowEnabled(true);
	}
	else
	{
		AvailabilityText->SetText(FText::FromString(TEXT("✗ Taken")));
		AvailabilityText->SetColorAndOpacity(UnavailableColor);
		SetEdgeGlowColor(UnavailableColor);
		SetEdgeGlowEnabled(true);
	}
}
