// Copyright Demiurge-Cloud. All Rights Reserved.

#include "DemiurgeBlueprintLibrary.h"
#include "DemiurgeClient.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"
#include "Components/PrimitiveComponent.h"
#include "PhysicsEngine/BodyInstance.h"

UDemiurgeClient* UDemiurgeBlueprintLibrary::GetDemiurgeClient(UObject* WorldContextObject)
{
	if (!WorldContextObject) return nullptr;

	UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::LogAndReturnNull);
	if (!World) return nullptr;

	UGameInstance* GameInstance = World->GetGameInstance();
	if (!GameInstance) return nullptr;

	return GameInstance->GetSubsystem<UDemiurgeClient>();
}

// ============================================================================
// ASSET UTILITIES
// ============================================================================

int64 UDemiurgeBlueprintLibrary::GetXPForLevel(int32 Level)
{
	// XP formula: 100 * Level^2
	return 100 * static_cast<int64>(Level) * static_cast<int64>(Level);
}

int32 UDemiurgeBlueprintLibrary::GetLevelFromXP(int64 XP)
{
	// Inverse: Level = sqrt(XP / 100)
	return 1 + FMath::FloorToInt(FMath::Sqrt(static_cast<float>(XP) / 100.0f));
}

float UDemiurgeBlueprintLibrary::GetLevelProgress(int64 XP)
{
	int32 CurrentLevel = GetLevelFromXP(XP);
	int64 CurrentLevelXP = GetXPForLevel(CurrentLevel - 1);
	int64 NextLevelXP = GetXPForLevel(CurrentLevel);
	
	if (NextLevelXP == CurrentLevelXP) return 0.0f;
	
	return static_cast<float>(XP - CurrentLevelXP) / static_cast<float>(NextLevelXP - CurrentLevelXP);
}

bool UDemiurgeBlueprintLibrary::GetBestResource(const FDrc369Asset& Asset, FDrc369Resource& OutResource)
{
	// Priority order for Unreal Engine
	static const TArray<FString> PreferredTypes = {
		TEXT("unreal_asset"),
		TEXT("fbx"),
		TEXT("gltf"),
		TEXT("obj"),
		TEXT("three_js"),
		TEXT("pixel_2d")
	};

	for (const FString& Type : PreferredTypes)
	{
		for (const FDrc369Resource& Resource : Asset.Resources)
		{
			if (Resource.ResourceType.Equals(Type, ESearchCase::IgnoreCase))
			{
				OutResource = Resource;
				return true;
			}
		}
	}

	// Return first available if no preferred type found
	if (Asset.Resources.Num() > 0)
	{
		OutResource = Asset.Resources[0];
		return true;
	}

	return false;
}

bool UDemiurgeBlueprintLibrary::GetResourceByType(const FDrc369Asset& Asset, const FString& ResourceType, FDrc369Resource& OutResource)
{
	for (const FDrc369Resource& Resource : Asset.Resources)
	{
		if (Resource.ResourceType.Equals(ResourceType, ESearchCase::IgnoreCase))
		{
			OutResource = Resource;
			return true;
		}
	}
	return false;
}

FString UDemiurgeBlueprintLibrary::GetRarityDisplayName(EDrc369Rarity Rarity)
{
	switch (Rarity)
	{
		case EDrc369Rarity::Common: return TEXT("Common");
		case EDrc369Rarity::Uncommon: return TEXT("Uncommon");
		case EDrc369Rarity::Rare: return TEXT("Rare");
		case EDrc369Rarity::Epic: return TEXT("Epic");
		case EDrc369Rarity::Legendary: return TEXT("Legendary");
		case EDrc369Rarity::Mythic: return TEXT("Mythic");
		case EDrc369Rarity::Unique: return TEXT("Unique");
		default: return TEXT("Unknown");
	}
}

FLinearColor UDemiurgeBlueprintLibrary::GetRarityColor(EDrc369Rarity Rarity)
{
	switch (Rarity)
	{
		case EDrc369Rarity::Common: return FLinearColor(0.8f, 0.8f, 0.8f); // Gray
		case EDrc369Rarity::Uncommon: return FLinearColor(0.0f, 0.8f, 0.0f); // Green
		case EDrc369Rarity::Rare: return FLinearColor(0.0f, 0.5f, 1.0f); // Blue
		case EDrc369Rarity::Epic: return FLinearColor(0.6f, 0.0f, 1.0f); // Purple
		case EDrc369Rarity::Legendary: return FLinearColor(1.0f, 0.6f, 0.0f); // Orange
		case EDrc369Rarity::Mythic: return FLinearColor(1.0f, 0.0f, 0.3f); // Red
		case EDrc369Rarity::Unique: return FLinearColor(0.4f, 1.0f, 0.97f); // Cyan (Demiurge accent)
		default: return FLinearColor::White;
	}
}

// ============================================================================
// IDENTITY UTILITIES
// ============================================================================

FString UDemiurgeBlueprintLibrary::FormatAddress(const FString& Address, int32 Length)
{
	if (Address.Len() <= Length * 2 + 3)
	{
		return Address;
	}

	FString Prefix = Address.Left(Length + 2); // Include "0x" if present
	FString Suffix = Address.Right(Length);
	return FString::Printf(TEXT("%s...%s"), *Prefix, *Suffix);
}

FString UDemiurgeBlueprintLibrary::FormatHandle(const FString& Handle)
{
	if (Handle.StartsWith(TEXT("@")))
	{
		return Handle;
	}
	
	if (Handle.Contains(TEXT(".demiurge")))
	{
		return FString::Printf(TEXT("@%s"), *Handle);
	}
	
	return FString::Printf(TEXT("@%s.demiurge"), *Handle);
}

bool UDemiurgeBlueprintLibrary::IsQuantumSafe(EDemiurgeSignatureScheme Scheme)
{
	return Scheme == EDemiurgeSignatureScheme::Dilithium3 ||
		   Scheme == EDemiurgeSignatureScheme::HybridEdDilithium;
}

// ============================================================================
// PHYSICS UTILITIES
// ============================================================================

void UDemiurgeBlueprintLibrary::ApplyDrc369Physics(UPrimitiveComponent* Component, const FDrc369Physics& Physics)
{
	if (!Component) return;

	Component->SetSimulatePhysics(Physics.bEnablePhysics);
	Component->SetMassOverrideInKg(NAME_None, Physics.MassKg, true);
	
	// Set physics material properties
	if (UPhysicalMaterial* PhysMat = NewObject<UPhysicalMaterial>())
	{
		PhysMat->Friction = Physics.Friction;
		PhysMat->Restitution = Physics.Restitution;
		Component->SetPhysMaterialOverride(PhysMat);
	}
}

FBodyInstance UDemiurgeBlueprintLibrary::CreatePhysicsBody(const FDrc369Asset& Asset)
{
	FBodyInstance Body;
	Body.bSimulatePhysics = Asset.Physics.bEnablePhysics;
	Body.MassInKgOverride = Asset.Physics.MassKg;
	Body.bOverrideMass = true;
	return Body;
}

// ============================================================================
// FORMATTING
// ============================================================================

FString UDemiurgeBlueprintLibrary::FormatCGT(int64 Amount, int32 Decimals)
{
	// Assuming 18 decimal places (like ETH)
	double Value = static_cast<double>(Amount) / 1000000000000000000.0;
	
	FNumberFormattingOptions Options;
	Options.MinimumFractionalDigits = Decimals;
	Options.MaximumFractionalDigits = Decimals;
	Options.UseGrouping = true;
	
	return FString::Printf(TEXT("%s CGT"), *FText::AsNumber(Value, &Options).ToString());
}

FString UDemiurgeBlueprintLibrary::FormatBlockNumber(int64 BlockNumber)
{
	FNumberFormattingOptions Options;
	Options.UseGrouping = true;
	
	return FString::Printf(TEXT("BLK#%s"), *FText::AsNumber(BlockNumber, &Options).ToString());
}
