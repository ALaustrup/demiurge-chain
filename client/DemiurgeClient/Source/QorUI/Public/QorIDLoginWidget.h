// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "QorGlassPanel.h"
#include "QorIDLoginWidget.generated.h"

/**
 * Qor ID Login Widget - Blueprint-ready login interface
 * 
 * This widget provides a complete login/registration UI using the Cyber Glass design.
 * It extends QorGlassPanel with login-specific functionality.
 * 
 * Blueprint Setup:
 * 1. Create a new Blueprint Widget class inheriting from this class
 * 2. In the Designer, add:
 *    - EditableTextBox for username input (bind to UsernameInput)
 *    - TextBlock for availability status (bind to AvailabilityText)
 *    - TextBlock for Qor Key display (bind to QorKeyDisplay)
 *    - Button for Register/Login action
 * 3. Bind the Register button to OnRegisterClicked
 * 4. Connect OnAvailabilityChecked delegate to update visual feedback
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Qor ID Login Widget"))
class QORUI_API UQorIDLoginWidget : public UQorGlassPanel
{
	GENERATED_BODY()

public:
	UQorIDLoginWidget(const FObjectInitializer& ObjectInitializer);

	virtual void NativeConstruct() override;

	/** Called when Register/Login button is clicked */
	UFUNCTION(BlueprintCallable, Category = "Qor|Login")
	void OnRegisterClicked();

	/** Called when Cancel button is clicked */
	UFUNCTION(BlueprintCallable, Category = "Qor|Login")
	void OnCancelClicked();

	/** Check if current username input is valid */
	UFUNCTION(BlueprintPure, Category = "Qor|Login")
	bool IsUsernameValid() const;

	/** Get the current username from input */
	UFUNCTION(BlueprintPure, Category = "Qor|Login")
	FString GetCurrentUsername() const;

protected:
	/** Handle successful Qor ID registration */
	UFUNCTION()
	void OnQorIDRegistered(const FString& Username, const FString& QorKey);

	/** Handle username availability check result */
	UFUNCTION()
	void OnAvailabilityChecked(bool bIsAvailable);

	/** Button widget for Register action */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UButton* RegisterButton;

	/** Button widget for Cancel action */
	UPROPERTY(BlueprintReadOnly, meta = (BindWidget), Category = "Qor|Widgets")
	class UButton* CancelButton;
};
