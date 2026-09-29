// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "QorGlassPanel.h"
#include "QorWalletWidget.generated.h"

/**
 * Qor Wallet Widget - CGT Balance and Transfer Interface
 * 
 * Displays the player's CGT balance and provides transfer functionality.
 * 
 * Blueprint Setup:
 * 1. Create Blueprint Widget inheriting from this class
 * 2. Add widgets:
 *    - TextBlock for balance display (bind to BalanceText)
 *    - EditableTextBox for recipient address (bind to RecipientInput)
 *    - EditableTextBox for amount (bind to AmountInput)
 *    - Button for Send action (bind to SendButton)
 * 3. Connect OnBalanceUpdated delegate to refresh display
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Qor Wallet Widget"))
class QORUI_API UQorWalletWidget : public UQorGlassPanel
{
	GENERATED_BODY()

public:
	UQorWalletWidget(const FObjectInitializer& ObjectInitializer);

	virtual void NativeConstruct() override;

	/** Refresh CGT balance from blockchain */
	UFUNCTION(BlueprintCallable, Category = "Qor|Wallet")
	void RefreshBalance();

	/** Send CGT to another address */
	UFUNCTION(BlueprintCallable, Category = "Qor|Wallet")
	void SendCGT(const FString& Recipient, int64 Amount);

	/** Called when Send button is clicked */
	UFUNCTION(BlueprintCallable, Category = "Qor|Wallet")
	void OnSendClicked();

	/** Format balance for display (with 8 decimals) */
	UFUNCTION(BlueprintPure, Category = "Qor|Wallet")
	FString FormatBalance(int64 RawBalance) const;

	/** Get current balance */
	UFUNCTION(BlueprintPure, Category = "Qor|Wallet")
	int64 GetCurrentBalance() const { return CurrentBalance; }

protected:
	/** Handle balance update from network manager */
	UFUNCTION()
	void OnBalanceUpdated(int64 NewBalance);

	/** Text widget for balance display */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UTextBlock* BalanceText;

	/** Input for recipient address */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UEditableTextBox* RecipientInput;

	/** Input for transfer amount */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UEditableTextBox* AmountInput;

	/** Button for sending CGT */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UButton* SendButton;

	/** Current CGT balance (in smallest units) */
	UPROPERTY(BlueprintReadOnly, Category = "Qor|Wallet")
	int64 CurrentBalance;
};
