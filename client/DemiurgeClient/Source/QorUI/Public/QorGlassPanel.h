// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "Components/BackgroundBlur.h"
#include "Components/Image.h"
#include "Components/EditableTextBox.h"
#include "Components/TextBlock.h"
#include "QorGlassPanel.generated.h"

class UDemiurgeNetworkManager;

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATES
// ═══════════════════════════════════════════════════════════════════════════════

/** Delegate fired when username availability is checked */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAvailabilityChecked, bool, bIsAvailable);

/** Delegate fired when Qor ID registration completes */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnQorIDRegistered, const FString&, Username, const FString&, QorKey);

/** Delegate fired when panel animation completes */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPanelAnimationComplete, bool, bAnimatedIn);

/**
 * UQorGlassPanel - Cyber Glass Design System Base Widget
 * 
 * This is the foundational UI component for all Demiurge interfaces.
 * Implements the "Cyber Glass" design language with:
 * - Frosted glass blur effect (BackgroundBlur widget)
 * - Gradient overlays with "Dark Void" (#0A0A0F) aesthetic
 * - Animated edge highlighting (cyan/purple)
 * - Real-time username availability checking via Substrate RPC
 * - Qor Key visualization (Q[hex]:[hex] format)
 * 
 * All Demiurge UI panels inherit from this class.
 * 
 * @see UDemiurgeNetworkManager for blockchain RPC bridge
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Qor Glass Panel"))
class QORUI_API UQorGlassPanel : public UUserWidget
{
	GENERATED_BODY()

public:
	UQorGlassPanel(const FObjectInitializer& ObjectInitializer);

	virtual void NativeConstruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;
	virtual void NativeDestruct() override;

	// ═══════════════════════════════════════════════════════════════════════════
	// GLASS EFFECTS - Visual Properties
	// ═══════════════════════════════════════════════════════════════════════════

	/** Set the blur strength for the frosted glass effect (0.0 - 100.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetBlurStrength(float NewStrength);

	/** Get the current blur strength */
	UFUNCTION(BlueprintPure, Category = "Qor|Glass")
	float GetBlurStrength() const { return BlurStrength; }

	/** Set the glass tint color */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetGlassColor(FLinearColor NewColor);

	/** Get the current glass color */
	UFUNCTION(BlueprintPure, Category = "Qor|Glass")
	FLinearColor GetGlassColor() const { return GlassTint; }

	/** Set the glass opacity (0.0 - 1.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetGlassOpacity(float Opacity);

	/** Enable/disable the animated edge glow */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowEnabled(bool bEnabled);

	/** Set the edge glow color (typically cyan/purple gradient) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowColor(FLinearColor Color);

	/** Set the edge glow intensity (0.0 - 2.0) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Glass")
	void SetEdgeGlowIntensity(float Intensity);

	// ═══════════════════════════════════════════════════════════════════════════
	// ANIMATION - Panel Transitions
	// ═══════════════════════════════════════════════════════════════════════════

	/** Animate the panel appearing (slide + fade + blur intensify) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void AnimateIn(float Duration = 0.3f);

	/** Animate the panel disappearing (reverse) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void AnimateOut(float Duration = 0.2f);

	/** Pulse the edge glow (for notifications/highlights) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void PulseEdgeGlow(float Duration = 0.5f, float PeakIntensity = 1.5f);

	/** Animate blur strength change (e.g., thicken when typing) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Animation")
	void AnimateBlurStrength(float TargetStrength, float Duration = 0.2f);

	// ═══════════════════════════════════════════════════════════════════════════
	// STYLE PRESETS - Demiurge Design System
	// ═══════════════════════════════════════════════════════════════════════════

	/** Apply default Demiurge glass style (Dark Void #0A0A0F, cyan accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyDefaultStyle();

	/** Apply "Pleroma" style (light, golden accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyPleromaStyle();

	/** Apply "Archon" style (dark, purple accents) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyArchonStyle();

	/** Apply "Warning" style (red tint, urgent) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplyWarningStyle();

	/** Apply "Success" style (green glow) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Presets")
	void ApplySuccessStyle();

	// ═══════════════════════════════════════════════════════════════════════════
	// IDENTITY LOGIC - Username & Qor Key
	// ═══════════════════════════════════════════════════════════════════════════

	/** Set the network manager reference for RPC calls */
	UFUNCTION(BlueprintCallable, Category = "Qor|Identity")
	void SetNetworkManager(UDemiurgeNetworkManager* Manager);

	/** Called when username text changes - triggers availability check */
	UFUNCTION(BlueprintCallable, Category = "Qor|Identity")
	void OnUsernameTextChanged(const FText& NewText);

	/** Check if a username is available (calls RPC) */
	UFUNCTION(BlueprintCallable, Category = "Qor|Identity")
	void CheckUsernameAvailability(const FString& Username);

	/** Register a new Qor ID with the given username */
	UFUNCTION(BlueprintCallable, Category = "Qor|Identity")
	void RegisterQorID(const FString& Username);

	/** Get the visual Qor Key format from a public key: "Q[3hex]:[3hex]" */
	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Qor|Identity")
	static FString GetVisualQorKey(const FString& PublicKey);

	/** Format a Qor Key for display with styling */
	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Qor|Identity")
	static FString FormatQorKeyDisplay(const FString& QorKey);

	/** Validate username format (3-20 chars, alphanumeric + underscore) */
	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Qor|Identity")
	static bool IsValidUsername(const FString& Username, FString& OutError);

	// ═══════════════════════════════════════════════════════════════════════════
	// EVENTS - Blueprint Assignable Delegates
	// ═══════════════════════════════════════════════════════════════════════════

	/** Fired when username availability check completes */
	UPROPERTY(BlueprintAssignable, Category = "Qor|Events")
	FOnAvailabilityChecked OnAvailabilityChecked;

	/** Fired when Qor ID registration completes */
	UPROPERTY(BlueprintAssignable, Category = "Qor|Events")
	FOnQorIDRegistered OnQorIDRegistered;

	/** Fired when panel animation completes */
	UPROPERTY(BlueprintAssignable, Category = "Qor|Events")
	FOnPanelAnimationComplete OnPanelAnimationComplete;

protected:
	// ═══════════════════════════════════════════════════════════════════════════
	// BOUND WIDGETS - Set in UMG Designer
	// ═══════════════════════════════════════════════════════════════════════════

	/** Background blur widget for frosted glass effect */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidget), Category = "Qor|Widgets")
	UBackgroundBlur* BackgroundBlur;

	/** Glass tint overlay image */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidgetOptional), Category = "Qor|Widgets")
	UImage* GlassTintOverlay;

	/** Edge glow border image */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidgetOptional), Category = "Qor|Widgets")
	UImage* EdgeGlowBorder;

	/** Username input field (optional - for login panels) */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidgetOptional), Category = "Qor|Widgets")
	UEditableTextBox* UsernameInput;

	/** Availability status text (optional - for login panels) */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidgetOptional), Category = "Qor|Widgets")
	UTextBlock* AvailabilityText;

	/** Qor Key display text (optional - for profile panels) */
	UPROPERTY(BlueprintReadWrite, meta = (BindWidgetOptional), Category = "Qor|Widgets")
	UTextBlock* QorKeyDisplay;

	// ═══════════════════════════════════════════════════════════════════════════
	// DESIGN PROPERTIES - Editable in Blueprint
	// ═══════════════════════════════════════════════════════════════════════════

	/** Blur strength for frosted glass (0.0 = clear, 100.0 = fully frosted) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design", meta = (ClampMin = "0.0", ClampMax = "100.0"))
	float BlurStrength;

	/** Base glass tint color - Default: Dark Void #0A0A0F */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design")
	FLinearColor GlassTint;

	/** Glass opacity (0.0 = transparent, 1.0 = opaque) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float GlassOpacity;

	/** Enable animated edge glow */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design")
	bool bEdgeGlowEnabled;

	/** Edge glow color - Default: Cyan #00CCFF */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design")
	FLinearColor EdgeGlowColor;

	/** Edge glow intensity multiplier */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design", meta = (ClampMin = "0.0", ClampMax = "2.0"))
	float EdgeGlowIntensity;

	/** Availability check debounce time in seconds */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design", meta = (ClampMin = "0.1", ClampMax = "2.0"))
	float AvailabilityCheckDebounce;

	/** Color for "Available" state - Green */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design")
	FLinearColor AvailableColor;

	/** Color for "Unavailable" state - Red */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge Design")
	FLinearColor UnavailableColor;

	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL STATE
	// ═══════════════════════════════════════════════════════════════════════════

	/** Reference to network manager for RPC calls */
	UPROPERTY()
	UDemiurgeNetworkManager* NetworkManager;

	/** Timer handle for debounced availability check */
	FTimerHandle AvailabilityCheckTimerHandle;

	/** Last checked username (for debouncing) */
	FString LastCheckedUsername;

	/** Is panel currently animating? */
	bool bIsAnimating;

	/** Animation direction (in = true, out = false) */
	bool bAnimatingIn;

	/** Animation elapsed time */
	float AnimationElapsedTime;

	/** Animation total duration */
	float AnimationDuration;

	/** Blur animation state */
	bool bIsAnimatingBlur;
	float BlurAnimationStart;
	float BlurAnimationTarget;
	float BlurAnimationElapsed;
	float BlurAnimationDuration;

	/** Pulse animation state */
	bool bIsPulsing;
	float PulseElapsedTime;
	float PulseDuration;
	float PulsePeakIntensity;
	float PulseOriginalIntensity;

	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Apply visual updates to bound widgets */
	void UpdateVisuals();

	/** Update blur widget with current strength */
	void UpdateBlurWidget();

	/** Update tint overlay with current color */
	void UpdateTintOverlay();

	/** Update edge glow visuals */
	void UpdateEdgeGlow();

	/** Internal: Execute the availability RPC call */
	void ExecuteAvailabilityCheck();

	/** Internal: Handle RPC response for availability */
	UFUNCTION()
	void OnAvailabilityRPCResponse(bool bIsAvailable);

	/** Internal: Handle RPC response for registration */
	UFUNCTION()
	void OnRegistrationRPCResponse(const FString& Username, const FString& QorKey);
};
