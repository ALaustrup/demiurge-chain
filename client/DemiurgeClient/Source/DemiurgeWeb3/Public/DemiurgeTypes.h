// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "DemiurgeTypes.generated.h"

/**
 * FDRC369Item - C++ representation of on-chain DRC-369 item
 * 
 * This struct maps directly to the Rust `Drc369Metadata` structure.
 * Used for deserializing item data from the blockchain.
 * 
 * Rust Source: blockchain/pallets/pallet-drc369/src/lib.rs
 */
USTRUCT(BlueprintType)
struct DEMIURGEWEB3_API FDRC369Item
{
	GENERATED_BODY()

	/** Unique item identifier (32-byte blake2 hash, hex encoded) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString UUID;

	/** Item name (e.g., "Chronos Glaive") - max 64 chars */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString Name;

	/** Creator's Qor Key (e.g., "Q7A1:9F2") */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString CreatorQorKey;

	/** Creator's full account address (SS58 format) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString CreatorAddress;

	/** UE5 asset path for loading the mesh (e.g., "/Game/Items/Weapons/ChronosGlaive") */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString UE5AssetPath;

	/** Material instance path for Cyber Glass styling */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString GlassMaterial;

	/** VFX socket name for particle effects */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString VFXSocket;

	/** Is this item soulbound (cannot be traded)? */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	bool bIsSoulbound;

	/** Royalty fee percentage (0-100, where 25 = 2.5%) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	uint8 RoyaltyFeePercent;

	/** Block number when item was minted */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	int64 MintedAtBlock;

	/** Current owner's account address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "DRC369")
	FString OwnerAddress;

	FDRC369Item()
		: bIsSoulbound(false)
		, RoyaltyFeePercent(0)
		, MintedAtBlock(0)
	{
	}
};

/**
 * FDemiurgeTradeOffer - Trade offer data
 * 
 * Maps to Rust `TradeOffer` structure.
 */
USTRUCT(BlueprintType)
struct DEMIURGEWEB3_API FDemiurgeTradeOffer
{
	GENERATED_BODY()

	/** Unique offer ID (hex) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString OfferID;

	/** Item UUID being offered */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString ItemUUID;

	/** Sender's account address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString InitiatorAddress;

	/** Sender's username (if known) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString InitiatorUsername;

	/** Receiver's account address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString ReceiverAddress;

	/** Trade status: "Pending", "Accepted", "Cancelled" */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	FString Status;

	/** Block when offer was created */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Trade")
	int64 CreatedAtBlock;
};

/**
 * FQorIdentity - Qor ID identity data
 * 
 * Maps to Rust `QorIdentity` structure.
 */
USTRUCT(BlueprintType)
struct DEMIURGEWEB3_API FQorIdentity
{
	GENERATED_BODY()

	/** Username (globally unique, 3-20 chars) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	FString Username;

	/** Qor Key (visual short format: "Q7A1:9F2") */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	FString QorKey;

	/** Primary account address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	FString PrimaryAddress;

	/** Linked account addresses */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	TArray<FString> LinkedAddresses;

	/** Status: "Active", "Suspended", "Recovering" */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	FString Status;

	/** Block when registered */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "QorID")
	int64 RegisteredAtBlock;
};

/**
 * ECGTTransactionType - Types of CGT transactions
 */
UENUM(BlueprintType)
enum class ECGTTransactionType : uint8
{
	Transfer	UMETA(DisplayName = "Transfer"),
	Burn		UMETA(DisplayName = "Burn"),
	Mint		UMETA(DisplayName = "Mint"),
	Fee			UMETA(DisplayName = "Fee"),
	Royalty		UMETA(DisplayName = "Royalty")
};

/**
 * FCGTTransaction - CGT transaction record
 */
USTRUCT(BlueprintType)
struct DEMIURGEWEB3_API FCGTTransaction
{
	GENERATED_BODY()

	/** Transaction hash */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	FString TxHash;

	/** Transaction type */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	ECGTTransactionType Type;

	/** From address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	FString FromAddress;

	/** To address */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	FString ToAddress;

	/** Amount in sparks (1 CGT = 100,000,000 sparks) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	int64 AmountSparks;

	/** Block number */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	int64 BlockNumber;

	/** Timestamp */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "CGT")
	FDateTime Timestamp;

	/** Get amount as formatted CGT string (e.g., "1,234.56789012") */
	FString GetFormattedAmount() const
	{
		double CGT = static_cast<double>(AmountSparks) / 100000000.0;
		return FString::Printf(TEXT("%.8f CGT"), CGT);
	}
};
