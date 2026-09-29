// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "QorGlassPanel.h"
#include "DemiurgeNetworkManager.h"
#include "Components/BackgroundBlur.h"
#include "Components/Image.h"
#include "Components/EditableTextBox.h"
#include "Components/TextBlock.h"
#include "TimerManager.h"
#include "Engine/World.h"
#include "Kismet/KismetMathLibrary.h"

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUCTION & LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

UQorGlassPanel::UQorGlassPanel(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	// Default Demiurge "Dark Void" glass style
	BlurStrength = 15.0f;
	GlassTint = FLinearColor(0.039f, 0.039f, 0.059f, 0.85f); // #0A0A0F with 85% opacity
	GlassOpacity = 0.85f;
	
	// Edge glow defaults - Cyan accent
	bEdgeGlowEnabled = true;
	EdgeGlowColor = FLinearColor(0.0f, 0.8f, 1.0f, 1.0f); // #00CCFF
	EdgeGlowIntensity = 1.0f;
	
	// Availability check settings
	AvailabilityCheckDebounce = 0.5f;
	AvailableColor = FLinearColor(0.2f, 1.0f, 0.4f, 1.0f);   // Green
	UnavailableColor = FLinearColor(1.0f, 0.2f, 0.2f, 1.0f); // Red
	
	// Animation state
	bIsAnimating = false;
	bAnimatingIn = true;
	AnimationElapsedTime = 0.0f;
	AnimationDuration = 0.3f;
	
	// Blur animation
	bIsAnimatingBlur = false;
	BlurAnimationStart = 0.0f;
	BlurAnimationTarget = 0.0f;
	BlurAnimationElapsed = 0.0f;
	BlurAnimationDuration = 0.2f;
	
	// Pulse animation
	bIsPulsing = false;
	PulseElapsedTime = 0.0f;
	PulseDuration = 0.5f;
	PulsePeakIntensity = 1.5f;
	PulseOriginalIntensity = 1.0f;
	
	// Widget references (set via BindWidget in UMG)
	BackgroundBlur = nullptr;
	GlassTintOverlay = nullptr;
	EdgeGlowBorder = nullptr;
	UsernameInput = nullptr;
	AvailabilityText = nullptr;
	QorKeyDisplay = nullptr;
	NetworkManager = nullptr;
}

void UQorGlassPanel::NativeConstruct()
{
	Super::NativeConstruct();
	
	// Apply default style
	ApplyDefaultStyle();
	
	// Bind username input events if available
	if (UsernameInput)
	{
		UsernameInput->OnTextChanged.AddDynamic(this, &UQorGlassPanel::OnUsernameTextChanged);
	}
	
	// Initial visual update
	UpdateVisuals();
	
	UE_LOG(LogTemp, Log, TEXT("[QorGlassPanel] Constructed with blur strength: %.1f"), BlurStrength);
}

void UQorGlassPanel::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);
	
	// ═══════════════════════════════════════════════════════════════════════════
	// PANEL ANIMATION (In/Out)
	// ═══════════════════════════════════════════════════════════════════════════
	if (bIsAnimating)
	{
		AnimationElapsedTime += InDeltaTime;
		float Alpha = FMath::Clamp(AnimationElapsedTime / AnimationDuration, 0.0f, 1.0f);
		
		if (bAnimatingIn)
		{
			// Ease out cubic for smooth deceleration
			float EasedAlpha = 1.0f - FMath::Pow(1.0f - Alpha, 3.0f);
			SetRenderOpacity(EasedAlpha);
			
			// Animate blur from 0 to target
			if (BackgroundBlur)
			{
				BackgroundBlur->SetBlurStrength(BlurStrength * EasedAlpha);
			}
		}
		else
		{
			// Ease in quadratic for accelerating exit
			float EasedAlpha = FMath::Pow(Alpha, 2.0f);
			SetRenderOpacity(1.0f - EasedAlpha);
			
			// Animate blur to 0
			if (BackgroundBlur)
			{
				BackgroundBlur->SetBlurStrength(BlurStrength * (1.0f - EasedAlpha));
			}
		}
		
		// Check completion
		if (Alpha >= 1.0f)
		{
			bIsAnimating = false;
			if (!bAnimatingIn)
			{
				SetVisibility(ESlateVisibility::Collapsed);
			}
			OnPanelAnimationComplete.Broadcast(bAnimatingIn);
		}
	}
	
	// ═══════════════════════════════════════════════════════════════════════════
	// BLUR STRENGTH ANIMATION
	// ═══════════════════════════════════════════════════════════════════════════
	if (bIsAnimatingBlur)
	{
		BlurAnimationElapsed += InDeltaTime;
		float Alpha = FMath::Clamp(BlurAnimationElapsed / BlurAnimationDuration, 0.0f, 1.0f);
		
		// Smooth step interpolation
		float SmoothAlpha = FMath::SmoothStep(0.0f, 1.0f, Alpha);
		BlurStrength = FMath::Lerp(BlurAnimationStart, BlurAnimationTarget, SmoothAlpha);
		
		UpdateBlurWidget();
		
		if (Alpha >= 1.0f)
		{
			bIsAnimatingBlur = false;
			BlurStrength = BlurAnimationTarget;
		}
	}
	
	// ═══════════════════════════════════════════════════════════════════════════
	// EDGE GLOW PULSE ANIMATION
	// ═══════════════════════════════════════════════════════════════════════════
	if (bIsPulsing)
	{
		PulseElapsedTime += InDeltaTime;
		float Alpha = FMath::Clamp(PulseElapsedTime / PulseDuration, 0.0f, 1.0f);
		
		// Sine wave for pulse (up and back down)
		float PulseValue = FMath::Sin(Alpha * PI);
		EdgeGlowIntensity = FMath::Lerp(PulseOriginalIntensity, PulsePeakIntensity, PulseValue);
		
		UpdateEdgeGlow();
		
		if (Alpha >= 1.0f)
		{
			bIsPulsing = false;
			EdgeGlowIntensity = PulseOriginalIntensity;
		}
	}
	
	// ═══════════════════════════════════════════════════════════════════════════
	// AMBIENT EDGE GLOW ANIMATION
	// ═══════════════════════════════════════════════════════════════════════════
	if (bEdgeGlowEnabled && EdgeGlowBorder && !bIsPulsing)
	{
		// Subtle breathing effect
		float Time = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0f;
		float BreathValue = (FMath::Sin(Time * 1.5f) + 1.0f) * 0.5f; // 0-1 range
		float AmbientIntensity = FMath::Lerp(0.8f, 1.0f, BreathValue) * EdgeGlowIntensity;
		
		FLinearColor CurrentGlow = EdgeGlowColor * AmbientIntensity;
		EdgeGlowBorder->SetColorAndOpacity(CurrentGlow);
	}
}

void UQorGlassPanel::NativeDestruct()
{
	// Clear any pending timers
	if (UWorld* World = GetWorld())
	{
		World->GetTimerManager().ClearTimer(AvailabilityCheckTimerHandle);
	}
	
	Super::NativeDestruct();
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASS EFFECTS IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

void UQorGlassPanel::SetBlurStrength(float NewStrength)
{
	BlurStrength = FMath::Clamp(NewStrength, 0.0f, 100.0f);
	UpdateBlurWidget();
}

void UQorGlassPanel::SetGlassColor(FLinearColor NewColor)
{
	GlassTint = NewColor;
	UpdateTintOverlay();
}

void UQorGlassPanel::SetGlassOpacity(float Opacity)
{
	GlassOpacity = FMath::Clamp(Opacity, 0.0f, 1.0f);
	GlassTint.A = GlassOpacity;
	UpdateTintOverlay();
}

void UQorGlassPanel::SetEdgeGlowEnabled(bool bEnabled)
{
	bEdgeGlowEnabled = bEnabled;
	UpdateEdgeGlow();
}

void UQorGlassPanel::SetEdgeGlowColor(FLinearColor Color)
{
	EdgeGlowColor = Color;
	UpdateEdgeGlow();
}

void UQorGlassPanel::SetEdgeGlowIntensity(float Intensity)
{
	EdgeGlowIntensity = FMath::Clamp(Intensity, 0.0f, 2.0f);
	UpdateEdgeGlow();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

void UQorGlassPanel::AnimateIn(float Duration)
{
	AnimationElapsedTime = 0.0f;
	AnimationDuration = Duration;
	bAnimatingIn = true;
	bIsAnimating = true;
	
	SetVisibility(ESlateVisibility::Visible);
	SetRenderOpacity(0.0f);
	
	if (BackgroundBlur)
	{
		BackgroundBlur->SetBlurStrength(0.0f);
	}
	
	UE_LOG(LogTemp, Verbose, TEXT("[QorGlassPanel] Animating in over %.2fs"), Duration);
}

void UQorGlassPanel::AnimateOut(float Duration)
{
	AnimationElapsedTime = 0.0f;
	AnimationDuration = Duration;
	bAnimatingIn = false;
	bIsAnimating = true;
	
	UE_LOG(LogTemp, Verbose, TEXT("[QorGlassPanel] Animating out over %.2fs"), Duration);
}

void UQorGlassPanel::PulseEdgeGlow(float Duration, float PeakIntensity)
{
	PulseElapsedTime = 0.0f;
	PulseDuration = Duration;
	PulsePeakIntensity = PeakIntensity;
	PulseOriginalIntensity = EdgeGlowIntensity;
	bIsPulsing = true;
}

void UQorGlassPanel::AnimateBlurStrength(float TargetStrength, float Duration)
{
	BlurAnimationStart = BlurStrength;
	BlurAnimationTarget = FMath::Clamp(TargetStrength, 0.0f, 100.0f);
	BlurAnimationElapsed = 0.0f;
	BlurAnimationDuration = Duration;
	bIsAnimatingBlur = true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

void UQorGlassPanel::ApplyDefaultStyle()
{
	BlurStrength = 15.0f;
	GlassTint = FLinearColor(0.039f, 0.039f, 0.059f, 0.85f); // Dark Void #0A0A0F
	GlassOpacity = 0.85f;
	EdgeGlowColor = FLinearColor(0.0f, 0.8f, 1.0f, 1.0f);    // Cyan #00CCFF
	EdgeGlowIntensity = 1.0f;
	bEdgeGlowEnabled = true;
	UpdateVisuals();
}

void UQorGlassPanel::ApplyPleromaStyle()
{
	BlurStrength = 10.0f;
	GlassTint = FLinearColor(0.15f, 0.12f, 0.08f, 0.75f);    // Warm light
	GlassOpacity = 0.75f;
	EdgeGlowColor = FLinearColor(1.0f, 0.85f, 0.3f, 1.0f);   // Gold
	EdgeGlowIntensity = 1.2f;
	bEdgeGlowEnabled = true;
	UpdateVisuals();
}

void UQorGlassPanel::ApplyArchonStyle()
{
	BlurStrength = 20.0f;
	GlassTint = FLinearColor(0.08f, 0.05f, 0.12f, 0.9f);     // Deep purple-black
	GlassOpacity = 0.9f;
	EdgeGlowColor = FLinearColor(0.6f, 0.2f, 1.0f, 1.0f);    // Purple
	EdgeGlowIntensity = 1.5f;
	bEdgeGlowEnabled = true;
	UpdateVisuals();
}

void UQorGlassPanel::ApplyWarningStyle()
{
	BlurStrength = 12.0f;
	GlassTint = FLinearColor(0.15f, 0.05f, 0.05f, 0.9f);     // Dark red
	GlassOpacity = 0.9f;
	EdgeGlowColor = FLinearColor(1.0f, 0.2f, 0.1f, 1.0f);    // Red
	EdgeGlowIntensity = 1.8f;
	bEdgeGlowEnabled = true;
	UpdateVisuals();
	PulseEdgeGlow(0.8f, 2.0f); // Urgent pulse
}

void UQorGlassPanel::ApplySuccessStyle()
{
	BlurStrength = 15.0f;
	GlassTint = FLinearColor(0.05f, 0.12f, 0.08f, 0.85f);    // Dark green tint
	GlassOpacity = 0.85f;
	EdgeGlowColor = FLinearColor(0.2f, 1.0f, 0.4f, 1.0f);    // Green
	EdgeGlowIntensity = 1.3f;
	bEdgeGlowEnabled = true;
	UpdateVisuals();
	PulseEdgeGlow(0.5f, 1.8f); // Success pulse
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY LOGIC - USERNAME & QOR KEY
// ═══════════════════════════════════════════════════════════════════════════════

void UQorGlassPanel::SetNetworkManager(UDemiurgeNetworkManager* Manager)
{
	NetworkManager = Manager;
}

void UQorGlassPanel::OnUsernameTextChanged(const FText& NewText)
{
	FString Username = NewText.ToString();
	
	// Animate blur thickening when typing
	if (!Username.IsEmpty())
	{
		AnimateBlurStrength(25.0f, 0.15f); // Thicken glass while typing
	}
	else
	{
		AnimateBlurStrength(15.0f, 0.15f); // Return to default
	}
	
	// Validate format first
	FString ValidationError;
	if (!Username.IsEmpty() && !IsValidUsername(Username, ValidationError))
	{
		// Show validation error
		if (AvailabilityText)
		{
			AvailabilityText->SetText(FText::FromString(ValidationError));
			AvailabilityText->SetColorAndOpacity(FSlateColor(UnavailableColor));
		}
		SetEdgeGlowColor(UnavailableColor);
		return;
	}
	
	// Debounce the availability check
	if (UWorld* World = GetWorld())
	{
		World->GetTimerManager().ClearTimer(AvailabilityCheckTimerHandle);
		
		if (!Username.IsEmpty() && Username.Len() >= 3)
		{
			LastCheckedUsername = Username;
			
			// Set timer for debounced check
			World->GetTimerManager().SetTimer(
				AvailabilityCheckTimerHandle,
				this,
				&UQorGlassPanel::ExecuteAvailabilityCheck,
				AvailabilityCheckDebounce,
				false
			);
			
			// Show "Checking..." status
			if (AvailabilityText)
			{
				AvailabilityText->SetText(FText::FromString(TEXT("Checking...")));
				AvailabilityText->SetColorAndOpacity(FSlateColor(EdgeGlowColor)); // Cyan while checking
			}
		}
		else if (Username.IsEmpty())
		{
			// Clear status
			if (AvailabilityText)
			{
				AvailabilityText->SetText(FText::GetEmpty());
			}
			SetEdgeGlowColor(FLinearColor(0.0f, 0.8f, 1.0f, 1.0f)); // Reset to cyan
		}
	}
}

void UQorGlassPanel::CheckUsernameAvailability(const FString& Username)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Warning, TEXT("[QorGlassPanel] NetworkManager not set, cannot check availability"));
		OnAvailabilityChecked.Broadcast(false);
		return;
	}
	
	// Call RPC via network manager
	NetworkManager->CheckUsernameAvailability(Username);
	
	// In a real implementation, we'd bind to the response
	// For now, simulate async response
	UE_LOG(LogTemp, Log, TEXT("[QorGlassPanel] Checking availability for: %s"), *Username);
}

void UQorGlassPanel::RegisterQorID(const FString& Username)
{
	if (!NetworkManager)
	{
		UE_LOG(LogTemp, Warning, TEXT("[QorGlassPanel] NetworkManager not set, cannot register"));
		return;
	}
	
	// Validate before submitting
	FString ValidationError;
	if (!IsValidUsername(Username, ValidationError))
	{
		UE_LOG(LogTemp, Warning, TEXT("[QorGlassPanel] Invalid username: %s"), *ValidationError);
		return;
	}
	
	// Call RPC to register
	NetworkManager->RegisterQorID(Username);
	
	UE_LOG(LogTemp, Log, TEXT("[QorGlassPanel] Registering Qor ID: %s"), *Username);
}

FString UQorGlassPanel::GetVisualQorKey(const FString& PublicKey)
{
	// Qor Key format: "Q[first3hex]:[last3hex]"
	// Example: "Q7A1:9F2"
	
	if (PublicKey.Len() < 6)
	{
		return TEXT("Q???:???");
	}
	
	// Remove "0x" prefix if present
	FString CleanKey = PublicKey;
	if (CleanKey.StartsWith(TEXT("0x")) || CleanKey.StartsWith(TEXT("0X")))
	{
		CleanKey = CleanKey.Mid(2);
	}
	
	if (CleanKey.Len() < 6)
	{
		return TEXT("Q???:???");
	}
	
	// Get first 3 and last 3 hex characters
	FString FirstPart = CleanKey.Left(3).ToUpper();
	FString LastPart = CleanKey.Right(3).ToUpper();
	
	return FString::Printf(TEXT("Q%s:%s"), *FirstPart, *LastPart);
}

FString UQorGlassPanel::FormatQorKeyDisplay(const FString& QorKey)
{
	// Add visual formatting for display
	// Could add RichText markup here for colored segments
	return QorKey;
}

bool UQorGlassPanel::IsValidUsername(const FString& Username, FString& OutError)
{
	// Length check: 3-20 characters
	if (Username.Len() < 3)
	{
		OutError = TEXT("Username must be at least 3 characters");
		return false;
	}
	
	if (Username.Len() > 20)
	{
		OutError = TEXT("Username cannot exceed 20 characters");
		return false;
	}
	
	// Character validation: alphanumeric + underscore only
	for (TCHAR Char : Username)
	{
		if (!FChar::IsAlnum(Char) && Char != '_')
		{
			OutError = TEXT("Only letters, numbers, and underscores allowed");
			return false;
		}
	}
	
	// Cannot start with underscore or number
	if (Username[0] == '_' || FChar::IsDigit(Username[0]))
	{
		OutError = TEXT("Username must start with a letter");
		return false;
	}
	
	OutError = TEXT("");
	return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPER METHODS
// ═══════════════════════════════════════════════════════════════════════════════

void UQorGlassPanel::UpdateVisuals()
{
	UpdateBlurWidget();
	UpdateTintOverlay();
	UpdateEdgeGlow();
}

void UQorGlassPanel::UpdateBlurWidget()
{
	if (BackgroundBlur)
	{
		BackgroundBlur->SetBlurStrength(BlurStrength);
		BackgroundBlur->SetLowQualityFallbackBrush(FSlateBrush()); // Clear fallback
	}
}

void UQorGlassPanel::UpdateTintOverlay()
{
	if (GlassTintOverlay)
	{
		GlassTintOverlay->SetColorAndOpacity(GlassTint);
	}
}

void UQorGlassPanel::UpdateEdgeGlow()
{
	if (EdgeGlowBorder)
	{
		if (bEdgeGlowEnabled)
		{
			FLinearColor GlowWithIntensity = EdgeGlowColor * EdgeGlowIntensity;
			EdgeGlowBorder->SetColorAndOpacity(GlowWithIntensity);
			EdgeGlowBorder->SetVisibility(ESlateVisibility::HitTestInvisible);
		}
		else
		{
			EdgeGlowBorder->SetVisibility(ESlateVisibility::Collapsed);
		}
	}
}

void UQorGlassPanel::ExecuteAvailabilityCheck()
{
	if (!LastCheckedUsername.IsEmpty())
	{
		CheckUsernameAvailability(LastCheckedUsername);
	}
}

void UQorGlassPanel::OnAvailabilityRPCResponse(bool bIsAvailable)
{
	// Update visuals based on availability
	if (bIsAvailable)
	{
		// GREEN - Available
		SetEdgeGlowColor(AvailableColor);
		PulseEdgeGlow(0.3f, 1.5f);
		
		if (AvailabilityText)
		{
			AvailabilityText->SetText(FText::FromString(TEXT("Available!")));
			AvailabilityText->SetColorAndOpacity(FSlateColor(AvailableColor));
		}
	}
	else
	{
		// RED - Unavailable
		SetEdgeGlowColor(UnavailableColor);
		PulseEdgeGlow(0.3f, 1.5f);
		
		if (AvailabilityText)
		{
			AvailabilityText->SetText(FText::FromString(TEXT("Username taken")));
			AvailabilityText->SetColorAndOpacity(FSlateColor(UnavailableColor));
		}
	}
	
	// Broadcast delegate for Blueprint handlers
	OnAvailabilityChecked.Broadcast(bIsAvailable);
	
	UE_LOG(LogTemp, Log, TEXT("[QorGlassPanel] Username '%s' is %s"), 
		*LastCheckedUsername, 
		bIsAvailable ? TEXT("AVAILABLE") : TEXT("TAKEN"));
}

void UQorGlassPanel::OnRegistrationRPCResponse(const FString& Username, const FString& QorKey)
{
	// Apply success style
	ApplySuccessStyle();
	
	// Update Qor Key display
	if (QorKeyDisplay)
	{
		FString VisualKey = GetVisualQorKey(QorKey);
		QorKeyDisplay->SetText(FText::FromString(VisualKey));
	}
	
	// Return blur to default (clear up on success)
	AnimateBlurStrength(10.0f, 0.3f);
	
	// Broadcast delegate
	OnQorIDRegistered.Broadcast(Username, QorKey);
	
	UE_LOG(LogTemp, Log, TEXT("[QorGlassPanel] Qor ID registered: %s with key %s"), *Username, *QorKey);
}
