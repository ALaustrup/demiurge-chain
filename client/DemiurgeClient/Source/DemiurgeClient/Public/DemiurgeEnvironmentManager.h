// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Components/PostProcessComponent.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Engine/PostProcessVolume.h"
#include "DemiurgeEnvironmentManager.generated.h"

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD STATE ENUM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * World states for environment transitions
 * Each state has unique post-process and fog configurations
 */
UENUM(BlueprintType)
enum class EDemiurgeWorldState : uint8
{
	/** Default state - Balanced Eden environment */
	Eden			UMETA(DisplayName = "Eden (Default)"),
	
	/** Command Center - Dark, high-tech, sharp */
	CommandCenter	UMETA(DisplayName = "Command Center"),
	
	/** Sophia's Fall - Deep fog, bioluminescent, mystical */
	SophiasFall		UMETA(DisplayName = "Sophia's Fall"),
	
	/** Pleroma - Divine, golden, high bloom */
	Pleroma			UMETA(DisplayName = "Pleroma"),
	
	/** Archon Territory - Oppressive, purple, low visibility */
	ArchonDomain	UMETA(DisplayName = "Archon Domain"),
	
	/** Void - Pure darkness with only UI elements visible */
	Void			UMETA(DisplayName = "Void")
};

// ═══════════════════════════════════════════════════════════════════════════════
// DELEGATES
// ═══════════════════════════════════════════════════════════════════════════════

/** Delegate fired when world state transition completes */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWorldStateChanged, EDemiurgeWorldState, NewState);

/** Delegate fired during transition (for UI updates) */
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWorldTransitionProgress, EDemiurgeWorldState, TargetState, float, Progress);

/**
 * ADemiurgeEnvironmentManager - Global Post-Process & Atmosphere Controller
 * 
 * Singleton actor that manages the visual identity of the Demiurge world.
 * Implements the "Bioluminescent Eden" aesthetic with:
 * - High-contrast bloom for glowing flora and Divine Spark nodes
 * - Gnostic color grading (vibrant purples, cyans, warm divine light)
 * - Exponential height fog for depth and atmosphere
 * - Smooth transitions between world states
 * 
 * Drag this actor into your level to instantly apply the Demiurge aesthetic.
 * The PostProcessComponent is set to 'Unbound' to affect the entire world.
 * 
 * @see UQorGlassPanel for UI integration
 * @see EDemiurgeWorldState for available world states
 */
UCLASS(Blueprintable, BlueprintType, meta = (DisplayName = "Demiurge Environment Manager"))
class DEMIURGECLIENT_API ADemiurgeEnvironmentManager : public AActor
{
	GENERATED_BODY()

public:
	ADemiurgeEnvironmentManager();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

	// ═══════════════════════════════════════════════════════════════════════════
	// SINGLETON ACCESS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Get the singleton instance (spawns if not exists) */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Environment", meta = (WorldContext = "WorldContextObject"))
	static ADemiurgeEnvironmentManager* Get(const UObject* WorldContextObject);

	// ═══════════════════════════════════════════════════════════════════════════
	// WORLD STATE TRANSITIONS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Smoothly transition to a new world state */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Environment")
	void TransitionToWorld(EDemiurgeWorldState NewState, float TransitionDuration = 2.0f);

	/** Instantly set world state (no interpolation) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Environment")
	void SetWorldStateImmediate(EDemiurgeWorldState NewState);

	/** Get current world state */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Environment")
	EDemiurgeWorldState GetCurrentWorldState() const { return CurrentWorldState; }

	/** Check if currently transitioning */
	UFUNCTION(BlueprintPure, Category = "Demiurge|Environment")
	bool IsTransitioning() const { return bIsTransitioning; }

	// ═══════════════════════════════════════════════════════════════════════════
	// POST-PROCESS CONTROLS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Set bloom intensity (0.0 - 2.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetBloomIntensity(float Intensity);

	/** Set bloom threshold (0.5 - 3.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetBloomThreshold(float Threshold);

	/** Set global saturation (0.0 - 2.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetGlobalSaturation(float Saturation);

	/** Set global contrast (0.5 - 2.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetGlobalContrast(float Contrast);

	/** Set chromatic aberration intensity (0.0 - 1.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetChromaticAberration(float Intensity);

	/** Set vignette intensity (0.0 - 1.0) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetVignetteIntensity(float Intensity);

	/** Set white balance temperature (1500 - 15000 Kelvin) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetWhiteBalanceTemp(float Temperature);

	/** Apply a Look-Up Table texture for color grading */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|PostProcess")
	void SetGnosticLUT(UTexture2D* LUTTexture, float Intensity = 1.0f);

	// ═══════════════════════════════════════════════════════════════════════════
	// FOG CONTROLS (PLEROMA FOG)
	// ═══════════════════════════════════════════════════════════════════════════

	/** Set fog density and color */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Fog")
	void SetPleromaFog(float Density, FLinearColor Color);

	/** Set fog height falloff (lower = thicker near ground) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Fog")
	void SetFogHeightFalloff(float Falloff);

	/** Set fog start distance */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Fog")
	void SetFogStartDistance(float Distance);

	/** Enable/disable volumetric fog */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Fog")
	void SetVolumetricFogEnabled(bool bEnabled);

	/** Set volumetric fog scattering */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Fog")
	void SetVolumetricFogScattering(float Scattering);

	// ═══════════════════════════════════════════════════════════════════════════
	// BIOLUMINESCENCE EFFECTS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Pulse the bloom intensity (for Divine Spark mining events) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Effects")
	void PulseBioluminescence(float PeakIntensity = 1.5f, float Duration = 0.5f);

	/** Flash the environment (for major world events) */
	UFUNCTION(BlueprintCallable, Category = "Demiurge|Effects")
	void FlashEnvironment(FLinearColor FlashColor, float Duration = 0.3f);

	// ═══════════════════════════════════════════════════════════════════════════
	// EVENTS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Fired when world state transition completes */
	UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
	FOnWorldStateChanged OnWorldStateChanged;

	/** Fired during transition with progress (0-1) */
	UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
	FOnWorldTransitionProgress OnWorldTransitionProgress;

protected:
	// ═══════════════════════════════════════════════════════════════════════════
	// COMPONENTS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Global post-process component (Unbound - affects entire world) */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UPostProcessComponent* GlobalPostProcess;

	/** Exponential height fog for atmosphere */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UExponentialHeightFogComponent* PleromaFog;

	// ═══════════════════════════════════════════════════════════════════════════
	// EDEN DEFAULTS (The Spec)
	// ═══════════════════════════════════════════════════════════════════════════

	/** Bloom intensity - 0.65 for balanced bioluminescence */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "2.0"))
	float DefaultBloomIntensity;

	/** Bloom threshold - 1.1 for high-hottest spots only */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.5", ClampMax = "3.0"))
	float DefaultBloomThreshold;

	/** White balance temp - 5800K slightly warm/divine */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "1500", ClampMax = "15000"))
	float DefaultWhiteBalanceTemp;

	/** Global saturation - 1.25 for vibrant purples/cyans */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "2.0"))
	float DefaultSaturation;

	/** Global contrast - 1.15 to deepen Dark Void shadows */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.5", ClampMax = "2.0"))
	float DefaultContrast;

	/** Chromatic aberration - 0.35 for digital eye effect */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float DefaultChromaticAberration;

	/** Vignette intensity - 0.4 to focus center */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float DefaultVignetteIntensity;

	/** Default fog density - 0.02 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "0.5"))
	float DefaultFogDensity;

	/** Default fog color - Deep Teal/Void Blue */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec")
	FLinearColor DefaultFogColor;

	/** Gnostic LUT texture for color grading */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec")
	UTexture2D* GnosticLUT;

	/** LUT blend intensity */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Eden Spec", meta = (ClampMin = "0.0", ClampMax = "1.0"))
	float LUTIntensity;

private:
	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL STATE
	// ═══════════════════════════════════════════════════════════════════════════

	/** Singleton instance */
	static ADemiurgeEnvironmentManager* Instance;

	/** Current world state */
	EDemiurgeWorldState CurrentWorldState;

	/** Target world state (during transitions) */
	EDemiurgeWorldState TargetWorldState;

	/** Is currently transitioning? */
	bool bIsTransitioning;

	/** Transition elapsed time */
	float TransitionElapsed;

	/** Transition total duration */
	float TransitionDuration;

	/** Cached start settings for interpolation */
	FPostProcessSettings StartSettings;

	/** Cached target settings for interpolation */
	FPostProcessSettings TargetSettings;

	/** Start fog density for interpolation */
	float StartFogDensity;
	float TargetFogDensity;

	/** Start fog color for interpolation */
	FLinearColor StartFogColor;
	FLinearColor TargetFogColor;

	/** Bioluminescence pulse state */
	bool bIsPulsing;
	float PulseElapsed;
	float PulseDuration;
	float PulsePeakIntensity;
	float PulseOriginalIntensity;

	/** Flash state */
	bool bIsFlashing;
	float FlashElapsed;
	float FlashDuration;
	FLinearColor FlashColor;

	// ═══════════════════════════════════════════════════════════════════════════
	// INTERNAL METHODS
	// ═══════════════════════════════════════════════════════════════════════════

	/** Initialize the "Eden Spec" post-process settings */
	void InitializeEdenSettings();

	/** Get post-process settings for a world state */
	FPostProcessSettings GetSettingsForState(EDemiurgeWorldState State);

	/** Get fog settings for a world state */
	void GetFogSettingsForState(EDemiurgeWorldState State, float& OutDensity, FLinearColor& OutColor);

	/** Interpolate between two post-process settings */
	void InterpolateSettings(float Alpha);

	/** Apply current settings to the component */
	void ApplySettings(const FPostProcessSettings& Settings);

	/** Update pulse effect */
	void UpdatePulseEffect(float DeltaTime);

	/** Update flash effect */
	void UpdateFlashEffect(float DeltaTime);
};
