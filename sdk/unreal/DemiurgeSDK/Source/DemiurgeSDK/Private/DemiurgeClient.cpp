// Copyright Demiurge-Cloud. All Rights Reserved.

#include "DemiurgeClient.h"
#include "DemiurgeSDK.h"
#include "WebSocketsModule.h"
#include "IWebSocket.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "JsonObjectConverter.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonWriter.h"
#include "Engine/GameInstance.h"
#include "TimerManager.h"

void UDemiurgeClient::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	UE_LOG(LogDemiurge, Log, TEXT("DemiurgeClient subsystem initialized"));
}

void UDemiurgeClient::Deinitialize()
{
	Disconnect();
	Super::Deinitialize();
}

// ============================================================================
// CONNECTION
// ============================================================================

void UDemiurgeClient::Connect(const FString& RpcUrl, const FString& WsUrl)
{
	RpcEndpoint = RpcUrl;
	SetConnectionState(EDemiurgeConnectionState::Connecting);

	UE_LOG(LogDemiurge, Log, TEXT("Connecting to Demiurge at %s"), *RpcUrl);

	// Test connection with status call
	RefreshChainStatus();

	// Set up WebSocket if URL provided
	if (!WsUrl.IsEmpty())
	{
		FWebSocketsModule& WebSocketsModule = FModuleManager::LoadModuleChecked<FWebSocketsModule>(TEXT("WebSockets"));
		WebSocket = WebSocketsModule.CreateWebSocket(WsUrl, TEXT(""));

		WebSocket->OnConnected().AddLambda([this]()
		{
			UE_LOG(LogDemiurge, Log, TEXT("WebSocket connected"));
		});

		WebSocket->OnMessage().AddLambda([this](const FString& Message)
		{
			OnWebSocketMessage(Message);
		});

		WebSocket->OnConnectionError().AddLambda([this](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("WebSocket error: %s"), *Error);
		});

		WebSocket->Connect();
	}

	// Start status polling
	if (UGameInstance* GameInstance = GetGameInstance())
	{
		GameInstance->GetTimerManager().SetTimer(
			StatusPollTimer,
			this,
			&UDemiurgeClient::RefreshChainStatus,
			5.0f, // Poll every 5 seconds
			true
		);

		// Start usage flush timer
		GameInstance->GetTimerManager().SetTimer(
			UsageFlushTimer,
			this,
			&UDemiurgeClient::FlushUsageReports,
			30.0f, // Flush every 30 seconds
			true
		);
	}
}

void UDemiurgeClient::Disconnect()
{
	if (UGameInstance* GameInstance = GetGameInstance())
	{
		GameInstance->GetTimerManager().ClearTimer(StatusPollTimer);
		GameInstance->GetTimerManager().ClearTimer(UsageFlushTimer);
	}

	if (WebSocket.IsValid() && WebSocket->IsConnected())
	{
		WebSocket->Close();
	}
	WebSocket.Reset();

	Logout();
	SetConnectionState(EDemiurgeConnectionState::Disconnected);

	UE_LOG(LogDemiurge, Log, TEXT("Disconnected from Demiurge"));
}

void UDemiurgeClient::SetConnectionState(EDemiurgeConnectionState NewState)
{
	if (ConnectionState != NewState)
	{
		ConnectionState = NewState;
		OnConnectionStateChanged.Broadcast(NewState);
	}
}

// ============================================================================
// IDENTITY
// ============================================================================

void UDemiurgeClient::Login(const FString& Handle, const FString& Pin)
{
	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("handle"), Handle);
	Params->SetStringField(TEXT("pin"), Pin);

	RpcCall(TEXT("qor_login"), Params,
		[this](TSharedPtr<FJsonObject> Result)
		{
			SessionToken = Result->GetStringField(TEXT("token"));
			CurrentIdentity = ParseIdentity(Result->GetObjectField(TEXT("identity")));
			bIsAuthenticated = true;

			UE_LOG(LogDemiurge, Log, TEXT("Logged in as %s"), *CurrentIdentity.Handle);
			OnIdentityReady.Broadcast(CurrentIdentity);

			// Load owned assets
			GetOwnedAssets();
		},
		[this](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("Login failed: %s"), *Error);
			bIsAuthenticated = false;
		}
	);
}

void UDemiurgeClient::Logout()
{
	SessionToken.Empty();
	CurrentIdentity = FQorIdentity();
	bIsAuthenticated = false;
	CachedAssets.Empty();
	OptimisticStates.Empty();
}

void UDemiurgeClient::ResolveIdentity(const FString& Handle)
{
	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("handle"), Handle);

	RpcCall(TEXT("qor_resolveHandle"), Params,
		[this](TSharedPtr<FJsonObject> Result)
		{
			FQorIdentity Identity = ParseIdentity(Result);
			OnIdentityReady.Broadcast(Identity);
		},
		[](const FString& Error)
		{
			UE_LOG(LogDemiurge, Warning, TEXT("Failed to resolve identity: %s"), *Error);
		}
	);
}

// ============================================================================
// ASSETS
// ============================================================================

void UDemiurgeClient::GetOwnedAssets()
{
	if (!bIsAuthenticated)
	{
		UE_LOG(LogDemiurge, Warning, TEXT("Cannot get assets: not authenticated"));
		return;
	}

	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("owner"), CurrentIdentity.Address);

	RpcCall(TEXT("drc369_getOwnedAssets"), Params,
		[this](TSharedPtr<FJsonObject> Result)
		{
			CachedAssets.Empty();
			
			const TArray<TSharedPtr<FJsonValue>>* AssetsArray;
			if (Result->TryGetArrayField(TEXT("assets"), AssetsArray))
			{
				for (const auto& AssetValue : *AssetsArray)
				{
					FDrc369Asset Asset = ParseAsset(AssetValue->AsObject());
					CachedAssets.Add(Asset);
				}
			}

			UE_LOG(LogDemiurge, Log, TEXT("Loaded %d assets"), CachedAssets.Num());
			OnAssetsLoaded.Broadcast(CachedAssets);
		},
		[](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("Failed to get owned assets: %s"), *Error);
		}
	);
}

void UDemiurgeClient::GetAsset(const FString& TokenId)
{
	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("tokenId"), TokenId);

	RpcCall(TEXT("drc369_getAsset"), Params,
		[this, TokenId](TSharedPtr<FJsonObject> Result)
		{
			FDrc369Asset Asset = ParseAsset(Result);
			
			// Update cache
			for (int32 i = 0; i < CachedAssets.Num(); i++)
			{
				if (CachedAssets[i].TokenId == TokenId)
				{
					CachedAssets[i] = Asset;
					break;
				}
			}

			OnAssetLoaded.Broadcast(Asset);
		},
		[TokenId](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("Failed to get asset %s: %s"), *TokenId, *Error);
		}
	);
}

void UDemiurgeClient::AddAssetXP(const FString& TokenId, int64 XpAmount)
{
	// Optimistic update
	if (bOptimisticEnabled)
	{
		FDrc369Asset* OptimisticAsset = OptimisticStates.Find(TokenId);
		if (!OptimisticAsset)
		{
			FDrc369Asset CachedAsset;
			if (FindCachedAsset(TokenId, CachedAsset))
			{
				OptimisticStates.Add(TokenId, CachedAsset);
				OptimisticAsset = OptimisticStates.Find(TokenId);
			}
		}

		if (OptimisticAsset)
		{
			int32 OldLevel = OptimisticAsset->Level;
			OptimisticAsset->XP += XpAmount;
			
			// Calculate new level (simplified formula)
			int32 NewLevel = 1 + FMath::FloorToInt(FMath::Sqrt(OptimisticAsset->XP / 100.0f));
			OptimisticAsset->Level = NewLevel;

			OnAssetXPGained.Broadcast(TokenId, OptimisticAsset->XP);
			
			if (NewLevel > OldLevel)
			{
				OnAssetLevelUp.Broadcast(TokenId, NewLevel);
			}
		}
	}

	// Send to chain
	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("tokenId"), TokenId);
	Params->SetNumberField(TEXT("amount"), XpAmount);

	RpcCall(TEXT("drc369_addXP"), Params,
		[this, TokenId](TSharedPtr<FJsonObject> Result)
		{
			// Refresh asset to get confirmed state
			GetAsset(TokenId);
			OptimisticStates.Remove(TokenId);

			FDemiurgeTransactionResult TxResult;
			TxResult.bSuccess = true;
			TxResult.TxHash = Result->GetStringField(TEXT("txHash"));
			OnTransactionComplete.Broadcast(TxResult);
		},
		[this, TokenId](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("Failed to add XP: %s"), *Error);
			OptimisticStates.Remove(TokenId);

			FDemiurgeTransactionResult TxResult;
			TxResult.bSuccess = false;
			TxResult.ErrorMessage = Error;
			OnTransactionComplete.Broadcast(TxResult);
		}
	);
}

void UDemiurgeClient::TransferAsset(const FString& TokenId, const FString& ToAddress)
{
	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	Params->SetStringField(TEXT("tokenId"), TokenId);
	Params->SetStringField(TEXT("from"), CurrentIdentity.Address);
	Params->SetStringField(TEXT("to"), ToAddress);

	RpcCall(TEXT("drc369_transfer"), Params,
		[this, TokenId](TSharedPtr<FJsonObject> Result)
		{
			// Remove from cache
			CachedAssets.RemoveAll([&TokenId](const FDrc369Asset& Asset)
			{
				return Asset.TokenId == TokenId;
			});

			FDemiurgeTransactionResult TxResult;
			TxResult.bSuccess = true;
			TxResult.TxHash = Result->GetStringField(TEXT("txHash"));
			OnTransactionComplete.Broadcast(TxResult);
		},
		[](const FString& Error)
		{
			UE_LOG(LogDemiurge, Error, TEXT("Transfer failed: %s"), *Error);

			FDemiurgeTransactionResult TxResult;
			TxResult.bSuccess = false;
			TxResult.ErrorMessage = Error;
		}
	);
}

bool UDemiurgeClient::FindCachedAsset(const FString& TokenId, FDrc369Asset& OutAsset) const
{
	for (const FDrc369Asset& Asset : CachedAssets)
	{
		if (Asset.TokenId == TokenId)
		{
			OutAsset = Asset;
			return true;
		}
	}
	return false;
}

// ============================================================================
// OPTIMISTIC UPDATES
// ============================================================================

void UDemiurgeClient::EnableOptimisticUpdates(bool bEnable)
{
	bOptimisticEnabled = bEnable;
	if (!bEnable)
	{
		OptimisticStates.Empty();
	}
}

bool UDemiurgeClient::GetOptimisticAssetState(const FString& TokenId, FDrc369Asset& OutAsset) const
{
	const FDrc369Asset* Optimistic = OptimisticStates.Find(TokenId);
	if (Optimistic)
	{
		OutAsset = *Optimistic;
		return true;
	}
	return FindCachedAsset(TokenId, OutAsset);
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

void UDemiurgeClient::ReportAssetUsage(const FString& TokenId, bool bRendered, bool bInteracted)
{
	TPair<int32, int32>& Usage = PendingUsageReports.FindOrAdd(TokenId);
	if (bRendered) Usage.Key++;
	if (bInteracted) Usage.Value++;
}

void UDemiurgeClient::FlushUsageReports()
{
	if (PendingUsageReports.Num() == 0 || !bIsAuthenticated)
	{
		return;
	}

	TSharedPtr<FJsonObject> Params = MakeShared<FJsonObject>();
	TArray<TSharedPtr<FJsonValue>> UsageArray;

	for (const auto& Pair : PendingUsageReports)
	{
		TSharedPtr<FJsonObject> UsageObj = MakeShared<FJsonObject>();
		UsageObj->SetStringField(TEXT("tokenId"), Pair.Key);
		UsageObj->SetNumberField(TEXT("renders"), Pair.Value.Key);
		UsageObj->SetNumberField(TEXT("interactions"), Pair.Value.Value);
		UsageArray.Add(MakeShared<FJsonValueObject>(UsageObj));
	}

	Params->SetArrayField(TEXT("usage"), UsageArray);

	RpcCall(TEXT("drc369_reportUsage"), Params,
		[this](TSharedPtr<FJsonObject> Result)
		{
			UE_LOG(LogDemiurge, Verbose, TEXT("Usage report submitted"));
		},
		[](const FString& Error)
		{
			UE_LOG(LogDemiurge, Warning, TEXT("Failed to report usage: %s"), *Error);
		}
	);

	PendingUsageReports.Empty();
}

// ============================================================================
// CHAIN STATUS
// ============================================================================

void UDemiurgeClient::RefreshChainStatus()
{
	RpcCall(TEXT("system_health"), nullptr,
		[this](TSharedPtr<FJsonObject> Result)
		{
			ChainStatus.bIsOnline = true;
			ChainStatus.BlockNumber = Result->GetIntegerField(TEXT("blockNumber"));
			ChainStatus.TPS = Result->GetNumberField(TEXT("tps"));
			ChainStatus.Epoch = Result->GetIntegerField(TEXT("epoch"));
			ChainStatus.Version = Result->GetStringField(TEXT("version"));

			if (ConnectionState == EDemiurgeConnectionState::Connecting)
			{
				SetConnectionState(EDemiurgeConnectionState::Connected);
			}

			OnChainStatusUpdated.Broadcast(ChainStatus);
		},
		[this](const FString& Error)
		{
			ChainStatus.bIsOnline = false;
			if (ConnectionState == EDemiurgeConnectionState::Connected)
			{
				SetConnectionState(EDemiurgeConnectionState::Reconnecting);
			}
			else if (ConnectionState == EDemiurgeConnectionState::Connecting)
			{
				SetConnectionState(EDemiurgeConnectionState::Error);
			}
			OnChainStatusUpdated.Broadcast(ChainStatus);
		}
	);
}

// ============================================================================
// RPC
// ============================================================================

void UDemiurgeClient::RpcCall(
	const FString& Method,
	const TSharedPtr<FJsonObject>& Params,
	TFunction<void(TSharedPtr<FJsonObject>)> OnSuccess,
	TFunction<void(const FString&)> OnError)
{
	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
	Request->SetURL(RpcEndpoint);
	Request->SetVerb(TEXT("POST"));
	Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));

	if (!SessionToken.IsEmpty())
	{
		Request->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *SessionToken));
	}

	// Build JSON-RPC request
	TSharedPtr<FJsonObject> RpcRequest = MakeShared<FJsonObject>();
	RpcRequest->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
	RpcRequest->SetStringField(TEXT("method"), Method);
	RpcRequest->SetNumberField(TEXT("id"), FMath::Rand());
	
	if (Params.IsValid())
	{
		RpcRequest->SetObjectField(TEXT("params"), Params);
	}

	FString RequestBody;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestBody);
	FJsonSerializer::Serialize(RpcRequest.ToSharedRef(), Writer);

	Request->SetContentAsString(RequestBody);

	Request->OnProcessRequestComplete().BindLambda(
		[OnSuccess, OnError](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
		{
			if (!bWasSuccessful || !Response.IsValid())
			{
				if (OnError) OnError(TEXT("Network error"));
				return;
			}

			TSharedPtr<FJsonObject> JsonResponse;
			TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
			
			if (!FJsonSerializer::Deserialize(Reader, JsonResponse))
			{
				if (OnError) OnError(TEXT("Invalid JSON response"));
				return;
			}

			if (JsonResponse->HasField(TEXT("error")))
			{
				const TSharedPtr<FJsonObject>* ErrorObj;
				if (JsonResponse->TryGetObjectField(TEXT("error"), ErrorObj))
				{
					FString ErrorMessage = (*ErrorObj)->GetStringField(TEXT("message"));
					if (OnError) OnError(ErrorMessage);
				}
				return;
			}

			if (OnSuccess)
			{
				const TSharedPtr<FJsonObject>* Result;
				if (JsonResponse->TryGetObjectField(TEXT("result"), Result))
				{
					OnSuccess(*Result);
				}
				else
				{
					OnSuccess(MakeShared<FJsonObject>());
				}
			}
		}
	);

	Request->ProcessRequest();
}

void UDemiurgeClient::OnWebSocketMessage(const FString& Message)
{
	TSharedPtr<FJsonObject> JsonMessage;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);
	
	if (FJsonSerializer::Deserialize(Reader, JsonMessage))
	{
		FString EventType = JsonMessage->GetStringField(TEXT("type"));

		if (EventType == TEXT("asset_update"))
		{
			FString TokenId = JsonMessage->GetStringField(TEXT("tokenId"));
			GetAsset(TokenId);
		}
		else if (EventType == TEXT("xp_gained"))
		{
			FString TokenId = JsonMessage->GetStringField(TEXT("tokenId"));
			int64 NewXP = JsonMessage->GetIntegerField(TEXT("xp"));
			OnAssetXPGained.Broadcast(TokenId, NewXP);
		}
		else if (EventType == TEXT("level_up"))
		{
			FString TokenId = JsonMessage->GetStringField(TEXT("tokenId"));
			int32 NewLevel = JsonMessage->GetIntegerField(TEXT("level"));
			OnAssetLevelUp.Broadcast(TokenId, NewLevel);
		}
	}
}

// ============================================================================
// PARSING
// ============================================================================

FQorIdentity UDemiurgeClient::ParseIdentity(const TSharedPtr<FJsonObject>& Json)
{
	FQorIdentity Identity;
	
	if (!Json.IsValid()) return Identity;

	Identity.DID = Json->GetStringField(TEXT("did"));
	Identity.Handle = Json->GetStringField(TEXT("handle"));
	Identity.DisplayName = Json->GetStringField(TEXT("displayName"));
	Identity.AvatarUri = Json->GetStringField(TEXT("avatar"));
	Identity.Address = Json->GetStringField(TEXT("address"));
	Identity.CreatedAt = Json->GetIntegerField(TEXT("createdAt"));

	FString SchemeStr = Json->GetStringField(TEXT("signatureScheme"));
	if (SchemeStr == TEXT("Dilithium3"))
	{
		Identity.SignatureScheme = EDemiurgeSignatureScheme::Dilithium3;
		Identity.bIsQuantumSafe = true;
	}
	else if (SchemeStr == TEXT("HybridEdDilithium"))
	{
		Identity.SignatureScheme = EDemiurgeSignatureScheme::HybridEdDilithium;
		Identity.bIsQuantumSafe = true;
	}
	else
	{
		Identity.SignatureScheme = EDemiurgeSignatureScheme::Ed25519;
		Identity.bIsQuantumSafe = false;
	}

	return Identity;
}

FDrc369Asset UDemiurgeClient::ParseAsset(const TSharedPtr<FJsonObject>& Json)
{
	FDrc369Asset Asset;
	
	if (!Json.IsValid()) return Asset;

	Asset.TokenId = Json->GetStringField(TEXT("tokenId"));
	Asset.Owner = Json->GetStringField(TEXT("owner"));
	Asset.Name = Json->GetStringField(TEXT("name"));
	Asset.Description = Json->GetStringField(TEXT("description"));
	Asset.XP = Json->GetIntegerField(TEXT("xp"));
	Asset.Level = Json->GetIntegerField(TEXT("level"));
	Asset.bIsSoulbound = Json->GetBoolField(TEXT("soulbound"));
	Asset.RoyaltyPercent = Json->GetNumberField(TEXT("royaltyPercent"));
	Asset.CreatorAddress = Json->GetStringField(TEXT("creator"));

	// Parse rarity
	FString RarityStr = Json->GetStringField(TEXT("rarity"));
	if (RarityStr == TEXT("Uncommon")) Asset.Rarity = EDrc369Rarity::Uncommon;
	else if (RarityStr == TEXT("Rare")) Asset.Rarity = EDrc369Rarity::Rare;
	else if (RarityStr == TEXT("Epic")) Asset.Rarity = EDrc369Rarity::Epic;
	else if (RarityStr == TEXT("Legendary")) Asset.Rarity = EDrc369Rarity::Legendary;
	else if (RarityStr == TEXT("Mythic")) Asset.Rarity = EDrc369Rarity::Mythic;
	else if (RarityStr == TEXT("Unique")) Asset.Rarity = EDrc369Rarity::Unique;
	else Asset.Rarity = EDrc369Rarity::Common;

	// Parse physics
	const TSharedPtr<FJsonObject>* PhysicsObj;
	if (Json->TryGetObjectField(TEXT("physics"), PhysicsObj))
	{
		Asset.Physics.MassKg = (*PhysicsObj)->GetNumberField(TEXT("massKg"));
		Asset.Physics.Friction = (*PhysicsObj)->GetNumberField(TEXT("friction"));
		Asset.Physics.Restitution = (*PhysicsObj)->GetNumberField(TEXT("restitution"));
		Asset.Physics.bEnablePhysics = (*PhysicsObj)->GetBoolField(TEXT("enablePhysics"));
		Asset.Physics.bDestructible = (*PhysicsObj)->GetBoolField(TEXT("destructible"));
		Asset.Physics.Durability = (*PhysicsObj)->GetNumberField(TEXT("durability"));
	}

	// Parse resources
	const TArray<TSharedPtr<FJsonValue>>* ResourcesArray;
	if (Json->TryGetArrayField(TEXT("resources"), ResourcesArray))
	{
		for (const auto& ResourceValue : *ResourcesArray)
		{
			const TSharedPtr<FJsonObject>& ResObj = ResourceValue->AsObject();
			FDrc369Resource Resource;
			Resource.ResourceType = ResObj->GetStringField(TEXT("type"));
			Resource.Uri = ResObj->GetStringField(TEXT("uri"));
			Resource.MimeType = ResObj->GetStringField(TEXT("mimeType"));
			Resource.Hash = ResObj->GetStringField(TEXT("hash"));
			Asset.Resources.Add(Resource);
		}
	}

	return Asset;
}
