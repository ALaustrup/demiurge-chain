// Copyright Demiurge-Cloud. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "DemiurgeTypes.generated.h"

/**
 * Demiurge connection state
 */
UENUM(BlueprintType)
enum class EDemiurgeConnectionState : uint8
{
	Disconnected,
	Connecting,
	Connected,
	Reconnecting,
	Error
};

/**
 * Signature scheme for quantum-safe cryptography
 */
UENUM(BlueprintType)
enum class EDemiurgeSignatureScheme : uint8
{
	Ed25519 UMETA(DisplayName = "Ed25519 (Classical)"),
	Dilithium3 UMETA(DisplayName = "Dilithium3 (Quantum-Safe)"),
	HybridEdDilithium UMETA(DisplayName = "Hybrid (Classical + Quantum)")
};

/**
 * DRC-369 Asset Rarity
 */
UENUM(BlueprintType)
enum class EDrc369Rarity : uint8
{
	Common,
	Uncommon,
	Rare,
	Epic,
	Legendary,
	Mythic,
	Unique
};

/**
 * QOR ID - Sovereign Identity
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FQorIdentity
{
	GENERATED_BODY()

	/** Decentralized Identifier (DID) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	FString DID;

	/** Human-readable handle (e.g., @alice.demiurge) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	FString Handle;

	/** Display name */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	FString DisplayName;

	/** Avatar URI */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	FString AvatarUri;

	/** Transaction address (32 bytes hex) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	FString Address;

	/** Current signature scheme */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	EDemiurgeSignatureScheme SignatureScheme;

	/** Is quantum-safe */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	bool bIsQuantumSafe;

	/** Creation timestamp */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Identity")
	int64 CreatedAt;

	FQorIdentity()
		: SignatureScheme(EDemiurgeSignatureScheme::Ed25519)
		, bIsQuantumSafe(false)
		, CreatedAt(0)
	{}
};

/**
 * Physics properties for DRC-369 assets
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDrc369Physics
{
	GENERATED_BODY()

	/** Mass in kilograms */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	float MassKg;

	/** Friction coefficient (0-1) */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	float Friction;

	/** Restitution/bounciness (0-1) */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	float Restitution;

	/** Is rigid body simulation enabled */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	bool bEnablePhysics;

	/** Is destructible */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	bool bDestructible;

	/** Health/durability (0-100) */
	UPROPERTY(BlueprintReadWrite, Category = "Demiurge|Physics")
	float Durability;

	FDrc369Physics()
		: MassKg(1.0f)
		, Friction(0.5f)
		, Restitution(0.3f)
		, bEnablePhysics(true)
		, bDestructible(false)
		, Durability(100.0f)
	{}
};

/**
 * Resource variant for multi-platform assets
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDrc369Resource
{
	GENERATED_BODY()

	/** Resource type (e.g., "unreal_asset", "pixel_2d", "audio") */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString ResourceType;

	/** URI to the resource */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString Uri;

	/** MIME type */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString MimeType;

	/** Hash for integrity verification */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString Hash;
};

/**
 * DRC-369 Stateful Asset
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDrc369Asset
{
	GENERATED_BODY()

	/** Token ID (32 bytes hex) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString TokenId;

	/** Owner's QOR ID address */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString Owner;

	/** Asset name */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString Name;

	/** Asset description */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString Description;

	/** Current XP */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	int64 XP;

	/** Current level */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	int32 Level;

	/** Rarity */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	EDrc369Rarity Rarity;

	/** Is soulbound (non-transferable) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	bool bIsSoulbound;

	/** Physics properties */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FDrc369Physics Physics;

	/** Available resources/variants */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	TArray<FDrc369Resource> Resources;

	/** Custom attributes (JSON) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString CustomAttributes;

	/** Creator's royalty percentage (0-25) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	float RoyaltyPercent;

	/** Creator's address */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
	FString CreatorAddress;

	FDrc369Asset()
		: XP(0)
		, Level(1)
		, Rarity(EDrc369Rarity::Common)
		, bIsSoulbound(false)
		, RoyaltyPercent(5.0f)
	{}
};

/**
 * Transaction result
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeTransactionResult
{
	GENERATED_BODY()

	/** Was the transaction successful */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Transaction")
	bool bSuccess;

	/** Transaction hash */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Transaction")
	FString TxHash;

	/** Block number */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Transaction")
	int64 BlockNumber;

	/** Error message (if failed) */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Transaction")
	FString ErrorMessage;

	FDemiurgeTransactionResult()
		: bSuccess(false)
		, BlockNumber(0)
	{}
};

/**
 * Chain status
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeChainStatus
{
	GENERATED_BODY()

	/** Is chain connected */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Chain")
	bool bIsOnline;

	/** Current block number */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Chain")
	int64 BlockNumber;

	/** Transactions per second */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Chain")
	float TPS;

	/** Current epoch */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Chain")
	int64 Epoch;

	/** Chain version */
	UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Chain")
	FString Version;

	FDemiurgeChainStatus()
		: bIsOnline(false)
		, BlockNumber(0)
		, TPS(0.0f)
		, Epoch(0)
	{}
};

// Delegates for async operations
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnQorIdentityReady, const FQorIdentity&, Identity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDrc369AssetLoaded, const FDrc369Asset&, Asset);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDrc369AssetsLoaded, const TArray<FDrc369Asset>&, Assets);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTransactionComplete, const FDemiurgeTransactionResult&, Result);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnConnectionStateChanged, EDemiurgeConnectionState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnChainStatusUpdated, const FDemiurgeChainStatus&, Status);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnAssetXPGained, const FString&, TokenId, int64, NewXP);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnAssetLevelUp, const FString&, TokenId, int32, NewLevel);
