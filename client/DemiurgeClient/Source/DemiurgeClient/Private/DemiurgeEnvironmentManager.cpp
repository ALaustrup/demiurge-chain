// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeEnvironmentManager.h"
#include "Components/PostProcessComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

ADemiurgeEnvironmentManager* ADemiurgeEnvironmentManager::Instance = nullptr;

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════════

ADemiurgeEnvironmentManager::ADemiurgeEnvironmentManager()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = true;

	// ═══════════════════════════════════════════════════════════════════════════
	// CREATE COMPONENTS
	// ═══════════════════════════════════════════════════════════════════════════

	// Post-Process Component (Unbound = affects entire world)
	GlobalPostProcess = CreateDefaultSubobject<UPostProcessComponent>(TEXT("GlobalPostProcess"));
	RootComponent = GlobalPostProcess;
	GlobalPostProcess->bUnbound = true;  // CRITICAL: Affects entire world, not just a volume
	GlobalPostProcess->Priority = 100.0f; // High priority to override other volumes

	// Exponential Height Fog
	PleromaFog = CreateDefaultSubobject<UExponentialHeightFogComponent>(TEXT("PleromaFog"));
	PleromaFog->SetupAttachment(RootComponent);

	// ═══════════════════════════════════════════════════════════════════════════
	// EDEN SPEC DEFAULTS
	// ═══════════════════════════════════════════════════════════════════════════

	// Bloom (Bioluminescent Glow)
	DefaultBloomIntensity = 0.65f;		// Balanced for daylight eden + glowing flora
	DefaultBloomThreshold = 1.1f;		// Only hottest spots bleed

	// Color Grading (Gnostic Palette)
	DefaultWhiteBalanceTemp = 5800.0f;	// Slightly warm/divine
	DefaultSaturation = 1.25f;			// Enhances vibrant purples/cyans
	DefaultContrast = 1.15f;			// Deepens "Dark Void" shadows

	// Lens & Aberration (Cyber Integration)
	DefaultChromaticAberration = 0.35f;	// Subtle digital eye fringing
	DefaultVignetteIntensity = 0.4f;	// Draws focus to center

	// Fog (Atmospheric)
	DefaultFogDensity = 0.02f;			// Catches bioluminescent light
	DefaultFogColor = FLinearColor(0.05f, 0.15f, 0.2f, 1.0f); // Deep Teal/Void Blue

	// LUT
	GnosticLUT = nullptr;
	LUTIntensity = 1.0f;

	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL STATE
	// ═══════════════════════════════════════════════════════════════════════════

	CurrentWorldState = EDemiurgeWorldState::Eden;
	TargetWorldState = EDemiurgeWorldState::Eden;
	bIsTransitioning = false;
	TransitionElapsed = 0.0f;
	TransitionDuration = 2.0f;

	StartFogDensity = DefaultFogDensity;
	TargetFogDensity = DefaultFogDensity;
	StartFogColor = DefaultFogColor;
	TargetFogColor = DefaultFogColor;

	bIsPulsing = false;
	PulseElapsed = 0.0f;
	PulseDuration = 0.5f;
	PulsePeakIntensity = 1.5f;
	PulseOriginalIntensity = DefaultBloomIntensity;

	bIsFlashing = false;
	FlashElapsed = 0.0f;
	FlashDuration = 0.3f;
	FlashColor = FLinearColor::White;
}

void ADemiurgeEnvironmentManager::BeginPlay()
{
	Super::BeginPlay();

	// Set singleton reference
	Instance = this;

	// Initialize with Eden spec
	InitializeEdenSettings();

	UE_LOG(LogTemp, Log, TEXT("[DemiurgeEnvironment] Initialized with Eden Spec - Bloom: %.2f, Threshold: %.2f, Saturation: %.2f"),
		DefaultBloomIntensity, DefaultBloomThreshold, DefaultSaturation);
}

void ADemiurgeEnvironmentManager::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// ═══════════════════════════════════════════════════════════════════════════
	// WORLD STATE TRANSITION
	// ═══════════════════════════════════════════════════════════════════════════
	if (bIsTransitioning)
	{
		TransitionElapsed += DeltaTime;
		float Alpha = FMath::Clamp(TransitionElapsed / TransitionDuration, 0.0f, 1.0f);

		// Smooth step for natural easing
		float SmoothAlpha = FMath::SmoothStep(0.0f, 1.0f, Alpha);

		// Interpolate post-process settings
		InterpolateSettings(SmoothAlpha);

		// Interpolate fog
		float CurrentFogDensity = FMath::Lerp(StartFogDensity, TargetFogDensity, SmoothAlpha);
		FLinearColor CurrentFogColor = FMath::Lerp(StartFogColor, TargetFogColor, SmoothAlpha);
		
		if (PleromaFog)
		{
			PleromaFog->SetFogDensity(CurrentFogDensity);
			PleromaFog->SetFogInscatteringColor(CurrentFogColor);
		}

		// Broadcast progress
		OnWorldTransitionProgress.Broadcast(TargetWorldState, Alpha);

		// Check completion
		if (Alpha >= 1.0f)
		{
			bIsTransitioning = false;
			CurrentWorldState = TargetWorldState;
			OnWorldStateChanged.Broadcast(CurrentWorldState);

			UE_LOG(LogTemp, Log, TEXT("[DemiurgeEnvironment] Transition complete to: %s"),
				*UEnum::GetValueAsString(CurrentWorldState));
		}
	}

	// Update effects
	UpdatePulseEffect(DeltaTime);
	UpdateFlashEffect(DeltaTime);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON ACCESS
// ═══════════════════════════════════════════════════════════════════════════════

ADemiurgeEnvironmentManager* ADemiurgeEnvironmentManager::Get(const UObject* WorldContextObject)
{
	if (Instance)
	{
		return Instance;
	}

	// Try to find existing instance
	if (WorldContextObject)
	{
		UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::ReturnNull);
		if (World)
		{
			TArray<AActor*> FoundActors;
			UGameplayStatics::GetAllActorsOfClass(World, ADemiurgeEnvironmentManager::StaticClass(), FoundActors);
			
			if (FoundActors.Num() > 0)
			{
				Instance = Cast<ADemiurgeEnvironmentManager>(FoundActors[0]);
				return Instance;
			}
		}
	}

	UE_LOG(LogTemp, Warning, TEXT("[DemiurgeEnvironment] No instance found. Drag ADemiurgeEnvironmentManager into your level."));
	return nullptr;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD STATE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::TransitionToWorld(EDemiurgeWorldState NewState, float Duration)
{
	if (NewState == CurrentWorldState && !bIsTransitioning)
	{
		return; // Already in this state
	}

	// Cache start state
	StartSettings = GlobalPostProcess->Settings;
	StartFogDensity = PleromaFog ? PleromaFog->FogDensity : DefaultFogDensity;
	StartFogColor = PleromaFog ? PleromaFog->FogInscatteringColor : DefaultFogColor;

	// Get target state settings
	TargetSettings = GetSettingsForState(NewState);
	GetFogSettingsForState(NewState, TargetFogDensity, TargetFogColor);

	// Begin transition
	TargetWorldState = NewState;
	TransitionElapsed = 0.0f;
	TransitionDuration = Duration;
	bIsTransitioning = true;

	UE_LOG(LogTemp, Log, TEXT("[DemiurgeEnvironment] Transitioning from %s to %s over %.1fs"),
		*UEnum::GetValueAsString(CurrentWorldState),
		*UEnum::GetValueAsString(NewState),
		Duration);
}

void ADemiurgeEnvironmentManager::SetWorldStateImmediate(EDemiurgeWorldState NewState)
{
	bIsTransitioning = false;
	CurrentWorldState = NewState;
	TargetWorldState = NewState;

	// Apply settings immediately
	FPostProcessSettings NewSettings = GetSettingsForState(NewState);
	ApplySettings(NewSettings);

	// Apply fog immediately
	float FogDensity;
	FLinearColor FogColor;
	GetFogSettingsForState(NewState, FogDensity, FogColor);
	
	if (PleromaFog)
	{
		PleromaFog->SetFogDensity(FogDensity);
		PleromaFog->SetFogInscatteringColor(FogColor);
	}

	OnWorldStateChanged.Broadcast(CurrentWorldState);
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST-PROCESS CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::SetBloomIntensity(float Intensity)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_BloomIntensity = true;
		GlobalPostProcess->Settings.BloomIntensity = FMath::Clamp(Intensity, 0.0f, 2.0f);
	}
}

void ADemiurgeEnvironmentManager::SetBloomThreshold(float Threshold)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_BloomThreshold = true;
		GlobalPostProcess->Settings.BloomThreshold = FMath::Clamp(Threshold, 0.5f, 3.0f);
	}
}

void ADemiurgeEnvironmentManager::SetGlobalSaturation(float Saturation)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_ColorSaturation = true;
		GlobalPostProcess->Settings.ColorSaturation = FVector4(Saturation, Saturation, Saturation, 1.0f);
	}
}

void ADemiurgeEnvironmentManager::SetGlobalContrast(float Contrast)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_ColorContrast = true;
		GlobalPostProcess->Settings.ColorContrast = FVector4(Contrast, Contrast, Contrast, 1.0f);
	}
}

void ADemiurgeEnvironmentManager::SetChromaticAberration(float Intensity)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_SceneFringeIntensity = true;
		GlobalPostProcess->Settings.SceneFringeIntensity = FMath::Clamp(Intensity, 0.0f, 1.0f);
	}
}

void ADemiurgeEnvironmentManager::SetVignetteIntensity(float Intensity)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_VignetteIntensity = true;
		GlobalPostProcess->Settings.VignetteIntensity = FMath::Clamp(Intensity, 0.0f, 1.0f);
	}
}

void ADemiurgeEnvironmentManager::SetWhiteBalanceTemp(float Temperature)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings.bOverride_WhiteTemp = true;
		GlobalPostProcess->Settings.WhiteTemp = FMath::Clamp(Temperature, 1500.0f, 15000.0f);
	}
}

void ADemiurgeEnvironmentManager::SetGnosticLUT(UTexture2D* LUTTexture, float Intensity)
{
	GnosticLUT = LUTTexture;
	LUTIntensity = Intensity;

	if (GlobalPostProcess && LUTTexture)
	{
		GlobalPostProcess->Settings.bOverride_ColorGradingLUT = true;
		GlobalPostProcess->Settings.ColorGradingLUT = LUTTexture;
		GlobalPostProcess->Settings.bOverride_ColorGradingIntensity = true;
		GlobalPostProcess->Settings.ColorGradingIntensity = Intensity;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOG CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::SetPleromaFog(float Density, FLinearColor Color)
{
	if (PleromaFog)
	{
		PleromaFog->SetFogDensity(FMath::Clamp(Density, 0.0f, 0.5f));
		PleromaFog->SetFogInscatteringColor(Color);
	}
}

void ADemiurgeEnvironmentManager::SetFogHeightFalloff(float Falloff)
{
	if (PleromaFog)
	{
		PleromaFog->SetFogHeightFalloff(FMath::Clamp(Falloff, 0.001f, 2.0f));
	}
}

void ADemiurgeEnvironmentManager::SetFogStartDistance(float Distance)
{
	if (PleromaFog)
	{
		PleromaFog->SetStartDistance(FMath::Max(0.0f, Distance));
	}
}

void ADemiurgeEnvironmentManager::SetVolumetricFogEnabled(bool bEnabled)
{
	if (PleromaFog)
	{
		PleromaFog->SetVolumetricFog(bEnabled);
	}
}

void ADemiurgeEnvironmentManager::SetVolumetricFogScattering(float Scattering)
{
	if (PleromaFog)
	{
		PleromaFog->VolumetricFogScatteringDistribution = FMath::Clamp(Scattering, 0.0f, 1.0f);
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIOLUMINESCENCE EFFECTS
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::PulseBioluminescence(float PeakIntensity, float Duration)
{
	PulseOriginalIntensity = GlobalPostProcess ? GlobalPostProcess->Settings.BloomIntensity : DefaultBloomIntensity;
	PulsePeakIntensity = PeakIntensity;
	PulseDuration = Duration;
	PulseElapsed = 0.0f;
	bIsPulsing = true;

	UE_LOG(LogTemp, Verbose, TEXT("[DemiurgeEnvironment] Bioluminescence pulse: Peak %.2f over %.2fs"), PeakIntensity, Duration);
}

void ADemiurgeEnvironmentManager::FlashEnvironment(FLinearColor Color, float Duration)
{
	FlashColor = Color;
	FlashDuration = Duration;
	FlashElapsed = 0.0f;
	bIsFlashing = true;

	UE_LOG(LogTemp, Verbose, TEXT("[DemiurgeEnvironment] Environment flash over %.2fs"), Duration);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL: INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::InitializeEdenSettings()
{
	if (!GlobalPostProcess || !PleromaFog)
	{
		UE_LOG(LogTemp, Error, TEXT("[DemiurgeEnvironment] Components not initialized!"));
		return;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// BLOOM (Bioluminescent Glow)
	// ═══════════════════════════════════════════════════════════════════════════
	GlobalPostProcess->Settings.bOverride_BloomMethod = true;
	GlobalPostProcess->Settings.BloomMethod = EBloomMethod::BM_SOG; // Standard (Convolution is BM_FFT but heavier)
	
	GlobalPostProcess->Settings.bOverride_BloomIntensity = true;
	GlobalPostProcess->Settings.BloomIntensity = DefaultBloomIntensity;
	
	GlobalPostProcess->Settings.bOverride_BloomThreshold = true;
	GlobalPostProcess->Settings.BloomThreshold = DefaultBloomThreshold;

	// Bloom convolution for high-quality scattering (optional - expensive)
	// GlobalPostProcess->Settings.bOverride_BloomConvolutionSize = true;
	// GlobalPostProcess->Settings.BloomConvolutionSize = 1.0f;

	// ═══════════════════════════════════════════════════════════════════════════
	// COLOR GRADING (Gnostic Palette)
	// ═══════════════════════════════════════════════════════════════════════════
	GlobalPostProcess->Settings.bOverride_WhiteTemp = true;
	GlobalPostProcess->Settings.WhiteTemp = DefaultWhiteBalanceTemp;

	GlobalPostProcess->Settings.bOverride_ColorSaturation = true;
	GlobalPostProcess->Settings.ColorSaturation = FVector4(DefaultSaturation, DefaultSaturation, DefaultSaturation, 1.0f);

	GlobalPostProcess->Settings.bOverride_ColorContrast = true;
	GlobalPostProcess->Settings.ColorContrast = FVector4(DefaultContrast, DefaultContrast, DefaultContrast, 1.0f);

	// LUT if available
	if (GnosticLUT)
	{
		GlobalPostProcess->Settings.bOverride_ColorGradingLUT = true;
		GlobalPostProcess->Settings.ColorGradingLUT = GnosticLUT;
		GlobalPostProcess->Settings.bOverride_ColorGradingIntensity = true;
		GlobalPostProcess->Settings.ColorGradingIntensity = LUTIntensity;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// LENS & ABERRATION (Cyber Integration)
	// ═══════════════════════════════════════════════════════════════════════════
	GlobalPostProcess->Settings.bOverride_SceneFringeIntensity = true;
	GlobalPostProcess->Settings.SceneFringeIntensity = DefaultChromaticAberration;

	GlobalPostProcess->Settings.bOverride_VignetteIntensity = true;
	GlobalPostProcess->Settings.VignetteIntensity = DefaultVignetteIntensity;

	// ═══════════════════════════════════════════════════════════════════════════
	// AMBIENT OCCLUSION (Depth)
	// ═══════════════════════════════════════════════════════════════════════════
	GlobalPostProcess->Settings.bOverride_AmbientOcclusionIntensity = true;
	GlobalPostProcess->Settings.AmbientOcclusionIntensity = 0.5f;

	GlobalPostProcess->Settings.bOverride_AmbientOcclusionRadius = true;
	GlobalPostProcess->Settings.AmbientOcclusionRadius = 200.0f;

	// ═══════════════════════════════════════════════════════════════════════════
	// EXPONENTIAL HEIGHT FOG (Pleroma Atmosphere)
	// ═══════════════════════════════════════════════════════════════════════════
	PleromaFog->SetFogDensity(DefaultFogDensity);
	PleromaFog->SetFogInscatteringColor(DefaultFogColor);
	PleromaFog->SetFogHeightFalloff(0.2f);
	PleromaFog->SetStartDistance(0.0f);
	PleromaFog->SetFogMaxOpacity(0.9f);
	
	// Enable volumetric fog for bioluminescent light scattering
	PleromaFog->SetVolumetricFog(true);
	PleromaFog->VolumetricFogScatteringDistribution = 0.2f;
	PleromaFog->VolumetricFogAlbedo = FColor(180, 200, 220); // Slight blue tint
	PleromaFog->VolumetricFogEmissive = FLinearColor(0.01f, 0.02f, 0.03f); // Faint glow

	UE_LOG(LogTemp, Log, TEXT("[DemiurgeEnvironment] Eden settings applied - Fog: %.3f density, Color: (%.2f, %.2f, %.2f)"),
		DefaultFogDensity, DefaultFogColor.R, DefaultFogColor.G, DefaultFogColor.B);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL: STATE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

FPostProcessSettings ADemiurgeEnvironmentManager::GetSettingsForState(EDemiurgeWorldState State)
{
	FPostProcessSettings Settings;

	switch (State)
	{
	case EDemiurgeWorldState::Eden:
	default:
		// Default "Eden Spec" - balanced bioluminescent paradise
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 0.65f;
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 1.1f;
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 5800.0f;
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(1.25f, 1.25f, 1.25f, 1.0f);
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(1.15f, 1.15f, 1.15f, 1.0f);
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.35f;
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 0.4f;
		break;

	case EDemiurgeWorldState::CommandCenter:
		// Dark, high-tech, sharp - low bloom, high contrast
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 0.3f;
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 2.0f;
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 6500.0f; // Neutral/cool
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(0.9f, 0.9f, 0.9f, 1.0f); // Desaturated
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(1.3f, 1.3f, 1.3f, 1.0f); // High contrast
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.5f; // More digital
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 0.6f; // Heavy vignette
		break;

	case EDemiurgeWorldState::SophiasFall:
		// Deep fog, mystical, bioluminescent overload
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 1.2f; // HIGH bloom for glow
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 0.8f; // Lower threshold = more glow
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 5000.0f; // Cooler, mystical
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(1.5f, 1.5f, 1.5f, 1.0f); // Very saturated
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(1.0f, 1.0f, 1.0f, 1.0f); // Normal contrast
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.2f; // Subtle
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 0.3f; // Light vignette
		break;

	case EDemiurgeWorldState::Pleroma:
		// Divine, golden, ethereal
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 1.0f;
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 0.6f; // Everything glows
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 7500.0f; // Warm golden
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(1.1f, 1.1f, 1.1f, 1.0f);
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(0.9f, 0.9f, 0.9f, 1.0f); // Softer contrast
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.1f; // Minimal
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 0.2f;
		break;

	case EDemiurgeWorldState::ArchonDomain:
		// Oppressive, purple, threatening
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 0.5f;
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 1.5f;
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 4500.0f; // Cold
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(1.4f, 0.8f, 1.4f, 1.0f); // Purple tint
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(1.4f, 1.4f, 1.4f, 1.0f); // Very harsh
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.6f; // Heavy distortion
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 0.7f; // Oppressive
		break;

	case EDemiurgeWorldState::Void:
		// Pure darkness
		Settings.bOverride_BloomIntensity = true;
		Settings.BloomIntensity = 0.0f;
		Settings.bOverride_BloomThreshold = true;
		Settings.BloomThreshold = 10.0f; // Nothing blooms
		Settings.bOverride_WhiteTemp = true;
		Settings.WhiteTemp = 6500.0f;
		Settings.bOverride_ColorSaturation = true;
		Settings.ColorSaturation = FVector4(0.0f, 0.0f, 0.0f, 1.0f); // No color
		Settings.bOverride_ColorContrast = true;
		Settings.ColorContrast = FVector4(2.0f, 2.0f, 2.0f, 1.0f); // Maximum contrast
		Settings.bOverride_SceneFringeIntensity = true;
		Settings.SceneFringeIntensity = 0.0f;
		Settings.bOverride_VignetteIntensity = true;
		Settings.VignetteIntensity = 1.0f; // Total vignette
		break;
	}

	return Settings;
}

void ADemiurgeEnvironmentManager::GetFogSettingsForState(EDemiurgeWorldState State, float& OutDensity, FLinearColor& OutColor)
{
	switch (State)
	{
	case EDemiurgeWorldState::Eden:
	default:
		OutDensity = 0.02f;
		OutColor = FLinearColor(0.05f, 0.15f, 0.2f); // Deep Teal
		break;

	case EDemiurgeWorldState::CommandCenter:
		OutDensity = 0.005f; // Minimal fog
		OutColor = FLinearColor(0.05f, 0.05f, 0.08f); // Dark blue-black
		break;

	case EDemiurgeWorldState::SophiasFall:
		OutDensity = 0.08f; // Heavy fog
		OutColor = FLinearColor(0.02f, 0.08f, 0.12f); // Deep mysterious blue
		break;

	case EDemiurgeWorldState::Pleroma:
		OutDensity = 0.03f;
		OutColor = FLinearColor(0.2f, 0.18f, 0.1f); // Golden haze
		break;

	case EDemiurgeWorldState::ArchonDomain:
		OutDensity = 0.05f;
		OutColor = FLinearColor(0.1f, 0.02f, 0.12f); // Purple-black
		break;

	case EDemiurgeWorldState::Void:
		OutDensity = 0.0f; // No fog - pure black
		OutColor = FLinearColor(0.0f, 0.0f, 0.0f);
		break;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL: INTERPOLATION
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::InterpolateSettings(float Alpha)
{
	if (!GlobalPostProcess)
	{
		return;
	}

	FPostProcessSettings& Current = GlobalPostProcess->Settings;

	// Interpolate each setting
	Current.BloomIntensity = FMath::Lerp(StartSettings.BloomIntensity, TargetSettings.BloomIntensity, Alpha);
	Current.BloomThreshold = FMath::Lerp(StartSettings.BloomThreshold, TargetSettings.BloomThreshold, Alpha);
	Current.WhiteTemp = FMath::Lerp(StartSettings.WhiteTemp, TargetSettings.WhiteTemp, Alpha);
	Current.ColorSaturation = FMath::Lerp(StartSettings.ColorSaturation, TargetSettings.ColorSaturation, Alpha);
	Current.ColorContrast = FMath::Lerp(StartSettings.ColorContrast, TargetSettings.ColorContrast, Alpha);
	Current.SceneFringeIntensity = FMath::Lerp(StartSettings.SceneFringeIntensity, TargetSettings.SceneFringeIntensity, Alpha);
	Current.VignetteIntensity = FMath::Lerp(StartSettings.VignetteIntensity, TargetSettings.VignetteIntensity, Alpha);
}

void ADemiurgeEnvironmentManager::ApplySettings(const FPostProcessSettings& Settings)
{
	if (GlobalPostProcess)
	{
		GlobalPostProcess->Settings = Settings;
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL: EFFECT UPDATES
// ═══════════════════════════════════════════════════════════════════════════════

void ADemiurgeEnvironmentManager::UpdatePulseEffect(float DeltaTime)
{
	if (!bIsPulsing || !GlobalPostProcess)
	{
		return;
	}

	PulseElapsed += DeltaTime;
	float Alpha = FMath::Clamp(PulseElapsed / PulseDuration, 0.0f, 1.0f);

	// Sine wave pulse
	float PulseValue = FMath::Sin(Alpha * PI);
	float CurrentIntensity = FMath::Lerp(PulseOriginalIntensity, PulsePeakIntensity, PulseValue);

	GlobalPostProcess->Settings.BloomIntensity = CurrentIntensity;

	if (Alpha >= 1.0f)
	{
		bIsPulsing = false;
		GlobalPostProcess->Settings.BloomIntensity = PulseOriginalIntensity;
	}
}

void ADemiurgeEnvironmentManager::UpdateFlashEffect(float DeltaTime)
{
	if (!bIsFlashing || !GlobalPostProcess)
	{
		return;
	}

	FlashElapsed += DeltaTime;
	float Alpha = FMath::Clamp(FlashElapsed / FlashDuration, 0.0f, 1.0f);

	// Quick flash up, slow fade down
	float FlashIntensity;
	if (Alpha < 0.2f)
	{
		// Flash in (first 20%)
		FlashIntensity = Alpha / 0.2f;
	}
	else
	{
		// Fade out (remaining 80%)
		FlashIntensity = 1.0f - ((Alpha - 0.2f) / 0.8f);
	}

	// Apply flash via color grading
	GlobalPostProcess->Settings.bOverride_ColorGain = true;
	FLinearColor CurrentGain = FMath::Lerp(FLinearColor::White, FlashColor, FlashIntensity * 0.5f);
	GlobalPostProcess->Settings.ColorGain = FVector4(CurrentGain.R, CurrentGain.G, CurrentGain.B, 1.0f);

	if (Alpha >= 1.0f)
	{
		bIsFlashing = false;
		GlobalPostProcess->Settings.bOverride_ColorGain = false;
		GlobalPostProcess->Settings.ColorGain = FVector4(1.0f, 1.0f, 1.0f, 1.0f);
	}
}
