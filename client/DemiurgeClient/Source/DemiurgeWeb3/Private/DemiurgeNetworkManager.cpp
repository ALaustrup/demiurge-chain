// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeNetworkManager.h"
#include "IWebSocket.h"
#include "WebSocketsModule.h"
#include "Json.h"
#include "JsonUtilities.h"
#include "TimerManager.h"
#include "Engine/World.h"
#include "Engine/Engine.h"

UDemiurgeNetworkManager::UDemiurgeNetworkManager()
{
	// Default to Monad server (Pleroma) for production
	// Change to ws://127.0.0.1:9944 for local development
	CurrentNodeURL = TEXT("ws://51.210.209.112:9944");
	bIsConnected = false;
	NextRequestID = 1;
	bAutoReconnect = true;
	ReconnectDelay = 5.0f;
}

void UDemiurgeNetworkManager::Connect(const FString& NodeURL)
{
	// Disconnect existing connection if any
	if (WebSocket.IsValid() && WebSocket->IsConnected())
	{
		Disconnect();
	}

	CurrentNodeURL = NodeURL.IsEmpty() ? CurrentNodeURL : NodeURL;
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Connecting to node: %s"), *CurrentNodeURL);

	// Load WebSockets module
	FWebSocketsModule* WebSocketsModule = FModuleManager::Get().GetModulePtr<FWebSocketsModule>(TEXT("WebSockets"));
	if (!WebSocketsModule)
	{
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] WebSockets module not available!"));
		OnConnected.Broadcast(false);
		return;
	}

	// Determine protocol (ws vs wss)
	FString Protocol = TEXT("ws");
	if (CurrentNodeURL.StartsWith(TEXT("wss://")))
	{
		Protocol = TEXT("wss");
	}

	// Create WebSocket connection
	WebSocket = WebSocketsModule->CreateWebSocket(CurrentNodeURL, Protocol);

	if (!WebSocket.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] Failed to create WebSocket"));
		OnConnected.Broadcast(false);
		return;
	}

	// Bind event handlers
	WebSocket->OnConnected().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketConnected);
	WebSocket->OnConnectionError().AddLambda([this](const FString& Error) {
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] Connection error: %s"), *Error);
		bIsConnected = false;
		OnConnected.Broadcast(false);
		
		// Attempt reconnection if enabled
		if (bAutoReconnect)
		{
			AttemptReconnection();
		}
	});
	WebSocket->OnClosed().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketClosed);
	WebSocket->OnMessage().AddUObject(this, &UDemiurgeNetworkManager::OnWebSocketMessage);

	// Connect
	WebSocket->Connect();
}

void UDemiurgeNetworkManager::Disconnect()
{
	// Clear reconnection timer
	if (UWorld* World = GEngine->GetWorldFromContextObject(this, EGetWorldErrorMode::ReturnNull))
	{
		World->GetTimerManager().ClearTimer(ReconnectTimerHandle);
	}

	// Close WebSocket
	if (WebSocket.IsValid() && WebSocket->IsConnected())
	{
		WebSocket->Close();
	}
	
	WebSocket.Reset();
	bIsConnected = false;
	PendingRequests.Empty();
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Disconnected from node"));
}

void UDemiurgeNetworkManager::GetCGTBalance(const FString& AccountAddress)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	// Try custom RPC endpoint first (if implemented on node)
	TArray<FString> Params;
	Params.Add(AccountAddress);
	int32 RequestID = SendRPCRequest(TEXT("cgt_balance"), Params);
	
	// If custom endpoint fails, fallback to Substrate state_call
	// Note: This requires SCALE-encoding the account address
	// For now, rely on custom endpoint
	if (RequestID < 0)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Failed to send balance request"));
	}
}

void UDemiurgeNetworkManager::TransferCGT(const FString& ToAddress, int64 Amount)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Initiating CGT transfer: %lld sparks to %s"), Amount, *ToAddress);
	
	// NOTE: In production, this would:
	// 1. Construct the extrinsic call: Cgt::transfer(to, amount)
	// 2. Sign it with the account's private key
	// 3. Submit via author_submitExtrinsic
	// 4. Track the transaction hash for confirmation
	
	// For now, use a placeholder RPC call
	// In real implementation, this requires:
	// - Account key management (wallet integration)
	// - SCALE encoding of the call
	// - Transaction signing
	
	TArray<FString> Params;
	Params.Add(ToAddress);
	Params.Add(FString::Printf(TEXT("%lld"), Amount));
	SendRPCRequest(TEXT("cgt_transfer"), Params);
	
	UE_LOG(LogTemp, Warning, TEXT("[Demiurge] TransferCGT requires wallet integration - not yet implemented"));
}

void UDemiurgeNetworkManager::GetTotalBurned()
{
	TArray<FString> Params;
	SendRPCRequest(TEXT("cgt_totalBurned"), Params);
}

void UDemiurgeNetworkManager::RegisterQorID(const FString& Username)
{
	if (!bIsConnected)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Not connected to node"));
		return;
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Registering Qor ID: %s"), *Username);
	
	TArray<FString> Params;
	Params.Add(Username);
	SendRPCRequest(TEXT("qorId_register"), Params);
}

void UDemiurgeNetworkManager::LookupQorID(const FString& AccountAddress)
{
	TArray<FString> Params;
	Params.Add(AccountAddress);
	SendRPCRequest(TEXT("qorId_lookup"), Params);
}

void UDemiurgeNetworkManager::CheckUsernameAvailability(const FString& Username)
{
	TArray<FString> Params;
	Params.Add(Username);
	SendRPCRequest(TEXT("qorId_checkAvailability"), Params);
}

void UDemiurgeNetworkManager::GetInventory(const FString& AccountAddress)
{
	TArray<FString> Params;
	Params.Add(AccountAddress);
	SendRPCRequest(TEXT("drc369_getInventory"), Params);
}

void UDemiurgeNetworkManager::GetItem(const FString& ItemUUID)
{
	TArray<FString> Params;
	Params.Add(ItemUUID);
	SendRPCRequest(TEXT("drc369_getItem"), Params);
}

void UDemiurgeNetworkManager::InitiateTrade(const FString& ItemUUID, const FString& ReceiverAddress)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Initiating trade: Item %s to %s"), *ItemUUID, *ReceiverAddress);
	
	TArray<FString> Params;
	Params.Add(ItemUUID);
	Params.Add(ReceiverAddress);
	SendRPCRequest(TEXT("drc369_initiateTrade"), Params);
}

void UDemiurgeNetworkManager::AcceptTrade(const FString& OfferID)
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Accepting trade: %s"), *OfferID);
	
	TArray<FString> Params;
	Params.Add(OfferID);
	SendRPCRequest(TEXT("drc369_acceptTrade"), Params);
}

void UDemiurgeNetworkManager::CancelTrade(const FString& OfferID)
{
	TArray<FString> Params;
	Params.Add(OfferID);
	SendRPCRequest(TEXT("drc369_cancelTrade"), Params);
}

void UDemiurgeNetworkManager::GetChainInfo()
{
	if (!bIsConnected)
	{
		return;
	}
	
	// Use Substrate system_name and system_version RPC
	TArray<FString> EmptyParams;
	SendRPCRequest(TEXT("system_name"), EmptyParams);
	SendRPCRequest(TEXT("system_version"), EmptyParams);
	SendRPCRequest(TEXT("system_chain"), EmptyParams);
}

void UDemiurgeNetworkManager::SubscribeNewHeads()
{
	if (!bIsConnected)
	{
		return;
	}
	
	// Subscribe to new block headers
	// Substrate subscription format: chain_subscribeNewHeads
	TArray<FString> EmptyParams;
	SendRPCRequest(TEXT("chain_subscribeNewHeads"), EmptyParams);
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Subscribed to new block headers"));
}

void UDemiurgeNetworkManager::GetBlockNumber()
{
	if (!bIsConnected)
	{
		return;
	}
	
	// Get latest block number via chain_getHeader
	TArray<FString> EmptyParams;
	SendRPCRequest(TEXT("chain_getHeader"), EmptyParams);
}

int32 UDemiurgeNetworkManager::SendRPCRequest(const FString& Method, const TArray<FString>& Params)
{
	if (!bIsConnected || !WebSocket.IsValid() || !WebSocket->IsConnected())
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Cannot send RPC - not connected"));
		return -1;
	}

	// Generate request ID
	int32 RequestID = NextRequestID++;
	
	// Build JSON-RPC 2.0 request
	TSharedPtr<FJsonObject> RequestObject = MakeShareable(new FJsonObject);
	RequestObject->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
	RequestObject->SetNumberField(TEXT("id"), RequestID);
	RequestObject->SetStringField(TEXT("method"), Method);
	
	// Build params array
	TArray<TSharedPtr<FJsonValue>> ParamsArray;
	for (const FString& Param : Params)
	{
		ParamsArray.Add(MakeShareable(new FJsonValueString(Param)));
	}
	RequestObject->SetArrayField(TEXT("params"), ParamsArray);
	
	// Serialize to JSON string
	FString RequestString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestString);
	FJsonSerializer::Serialize(RequestObject.ToSharedRef(), Writer);
	
	// Track pending request
	PendingRequests.Add(RequestID, Method);
	
	// Send via WebSocket
	WebSocket->Send(RequestString);
	
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] RPC Request [%d]: %s"), RequestID, *Method);
	
	return RequestID;
}

int32 UDemiurgeNetworkManager::SendRPCRequestWithParams(const FString& Method, const TSharedPtr<FJsonObject>& ParamsObject)
{
	if (!bIsConnected || !WebSocket.IsValid() || !WebSocket->IsConnected())
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Cannot send RPC - not connected"));
		return -1;
	}

	// Generate request ID
	int32 RequestID = NextRequestID++;
	
	// Build JSON-RPC 2.0 request
	TSharedPtr<FJsonObject> RequestObject = MakeShareable(new FJsonObject);
	RequestObject->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
	RequestObject->SetNumberField(TEXT("id"), RequestID);
	RequestObject->SetStringField(TEXT("method"), Method);
	
	if (ParamsObject.IsValid())
	{
		RequestObject->SetObjectField(TEXT("params"), ParamsObject);
	}
	
	// Serialize to JSON string
	FString RequestString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&RequestString);
	FJsonSerializer::Serialize(RequestObject.ToSharedRef(), Writer);
	
	// Track pending request
	PendingRequests.Add(RequestID, Method);
	
	// Send via WebSocket
	WebSocket->Send(RequestString);
	
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] RPC Request [%d]: %s"), RequestID, *Method);
	
	return RequestID;
}

void UDemiurgeNetworkManager::ProcessMessage(const FString& Message)
{
	TSharedPtr<FJsonObject> JsonObject;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);
	
	if (!FJsonSerializer::Deserialize(Reader, JsonObject) || !JsonObject.IsValid())
	{
		UE_LOG(LogTemp, Error, TEXT("[Demiurge] Failed to parse JSON response: %s"), *Message);
		return;
	}
	
	// Check for JSON-RPC 2.0 format
	if (!JsonObject->HasField(TEXT("jsonrpc")))
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Received non-JSON-RPC message"));
		return;
	}
	
	// Get request ID
	int32 RequestID = -1;
	if (JsonObject->TryGetNumberField(TEXT("id"), RequestID))
	{
		// This is a response to a request
		if (JsonObject->HasField(TEXT("error")))
		{
			TSharedPtr<FJsonObject> ErrorObj = JsonObject->GetObjectField(TEXT("error"));
			HandleRPCError(RequestID, ErrorObj);
		}
		else if (JsonObject->HasField(TEXT("result")))
		{
			// Substrate can return results as:
			// 1. Direct value (string, number, bool)
			// 2. Object
			// 3. Array
			TSharedPtr<FJsonValue> ResultValue = JsonObject->TryGetField(TEXT("result"));
			
			if (ResultValue.IsValid())
			{
				// If result is an object, pass it directly
				if (ResultValue->Type == EJson::Object)
				{
					HandleRPCResponse(RequestID, ResultValue->AsObject());
				}
				// If result is a primitive, wrap it in an object
				else
				{
					TSharedPtr<FJsonObject> WrappedResult = MakeShareable(new FJsonObject);
					
					// Determine field name based on value type
					if (ResultValue->Type == EJson::String)
					{
						WrappedResult->SetStringField(TEXT("result"), ResultValue->AsString());
					}
					else if (ResultValue->Type == EJson::Number)
					{
						WrappedResult->SetNumberField(TEXT("result"), ResultValue->AsNumber());
					}
					else if (ResultValue->Type == EJson::Boolean)
					{
						WrappedResult->SetBoolField(TEXT("result"), ResultValue->AsBool());
					}
					else if (ResultValue->Type == EJson::Array)
					{
						WrappedResult->SetArrayField(TEXT("result"), ResultValue->AsArray());
					}
					
					HandleRPCResponse(RequestID, WrappedResult);
				}
			}
		}
	}
	else
	{
		// This might be a subscription notification (no ID)
		// Substrate subscriptions have "method" and "params" fields
		if (JsonObject->HasField(TEXT("method")))
		{
			FString Method;
			JsonObject->TryGetStringField(TEXT("method"), Method);
			
			UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Subscription notification: %s"), *Method);
			
			// Handle chain_subscribeNewHeads, state_subscribeStorage, etc.
			// For now, just log them
		}
		else
		{
			UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Received notification (no ID or method)"));
		}
	}
}

void UDemiurgeNetworkManager::HandleRPCResponse(int32 RequestID, const TSharedPtr<FJsonObject>& ResultObject)
{
	// Get the method name for this request
	FString* MethodPtr = PendingRequests.Find(RequestID);
	if (!MethodPtr)
	{
		UE_LOG(LogTemp, Warning, TEXT("[Demiurge] Received response for unknown request ID: %d"), RequestID);
		return;
	}

	FString Method = *MethodPtr;
	PendingRequests.Remove(RequestID);

	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] RPC Response [%d]: %s"), RequestID, *Method);

	// ═══════════════════════════════════════════════════════════════════════════
	// CGT BALANCE
	// ═══════════════════════════════════════════════════════════════════════════
	if (Method == TEXT("cgt_balance"))
	{
		// Substrate returns hex-encoded values or numbers
		FString BalanceStr;
		int64 Balance = 0;
		
		// Try string field (hex or decimal)
		if (ResultObject->TryGetStringField(TEXT("value"), BalanceStr) || 
		    ResultObject->TryGetStringField(TEXT("result"), BalanceStr) ||
		    ResultObject->TryGetStringField(TEXT("balance"), BalanceStr))
		{
			// Check if hex (starts with 0x)
			if (BalanceStr.StartsWith(TEXT("0x")))
			{
				Balance = FCString::Strtoui64(*BalanceStr + 2, nullptr, 16);
			}
			else
			{
				Balance = FCString::Strtoui64(*BalanceStr, nullptr, 10);
			}
		}
		// Try number field
		else
		{
			double BalanceDouble = 0.0;
			if (ResultObject->TryGetNumberField(TEXT("value"), BalanceDouble) || 
			    ResultObject->TryGetNumberField(TEXT("result"), BalanceDouble) ||
			    ResultObject->TryGetNumberField(TEXT("balance"), BalanceDouble))
			{
				Balance = static_cast<int64>(BalanceDouble);
			}
		}
		
		if (Balance > 0)
		{
			OnBalanceUpdated.Broadcast(Balance);
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// QOR ID LOOKUP
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("qorId_lookup"))
	{
		FString Username, QorKey;
		
		// Try nested object structure
		if (ResultObject->HasField(TEXT("identity")))
		{
			TSharedPtr<FJsonObject> IdentityObj = ResultObject->GetObjectField(TEXT("identity"));
			IdentityObj->TryGetStringField(TEXT("username"), Username);
			IdentityObj->TryGetStringField(TEXT("qorKey"), QorKey);
		}
		// Try flat structure
		else
		{
			ResultObject->TryGetStringField(TEXT("username"), Username);
			ResultObject->TryGetStringField(TEXT("qorKey"), QorKey);
		}
		
		if (!Username.IsEmpty() && !QorKey.IsEmpty())
		{
			OnQorIDUpdated.Broadcast(Username, QorKey);
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// USERNAME AVAILABILITY
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("qorId_checkAvailability"))
	{
		bool bAvailable = false;
		if (ResultObject->TryGetBoolField(TEXT("available"), bAvailable) ||
		    ResultObject->TryGetBoolField(TEXT("result"), bAvailable))
		{
			UE_LOG(LogTemp, Log, TEXT("[Demiurge] Username availability: %s"), 
				bAvailable ? TEXT("Available") : TEXT("Taken"));
			
			// Note: QorGlassPanel should listen to this via a delegate
			// For now, just log it
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// DRC-369 INVENTORY
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("drc369_getInventory"))
	{
		const TArray<TSharedPtr<FJsonValue>>* ItemsArray = nullptr;
		
		// Try different field names
		if (!ResultObject->TryGetArrayField(TEXT("items"), ItemsArray))
		{
			ResultObject->TryGetArrayField(TEXT("result"), ItemsArray);
		}
		
		if (ItemsArray)
		{
			for (const TSharedPtr<FJsonValue>& ItemValue : *ItemsArray)
			{
				if (ItemValue->Type == EJson::Object)
				{
					TSharedPtr<FJsonObject> ItemObj = ItemValue->AsObject();
					FDRC369Item Item;
					
					// Parse UUID (hex string)
					FString UUIDHex;
					if (ItemObj->TryGetStringField(TEXT("uuid"), UUIDHex))
					{
						Item.UUID = UUIDHex;
					}
					
					// Parse name
					ItemObj->TryGetStringField(TEXT("name"), Item.Name);
					
					// Parse creator info
					ItemObj->TryGetStringField(TEXT("creatorQorKey"), Item.CreatorQorKey);
					ItemObj->TryGetStringField(TEXT("creatorAddress"), Item.CreatorAddress);
					
					// Parse UE5 paths
					ItemObj->TryGetStringField(TEXT("ue5AssetPath"), Item.UE5AssetPath);
					ItemObj->TryGetStringField(TEXT("glassMaterial"), Item.GlassMaterial);
					ItemObj->TryGetStringField(TEXT("vfxSocket"), Item.VFXSocket);
					
					// Parse flags
					ItemObj->TryGetBoolField(TEXT("isSoulbound"), Item.bIsSoulbound);
					
					// Parse royalty
					int32 RoyaltyPercent = 0;
					if (ItemObj->TryGetNumberField(TEXT("royaltyFeePercent"), RoyaltyPercent))
					{
						Item.RoyaltyFeePercent = static_cast<uint8>(RoyaltyPercent);
					}
					
					// Parse block number
					int64 MintedAt = 0;
					if (ItemObj->TryGetNumberField(TEXT("mintedAtBlock"), MintedAt))
					{
						Item.MintedAtBlock = MintedAt;
					}
					
					// Parse owner
					ItemObj->TryGetStringField(TEXT("ownerAddress"), Item.OwnerAddress);
					
					OnItemReceived.Broadcast(Item);
				}
			}
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// DRC-369 SINGLE ITEM
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("drc369_getItem"))
	{
		FDRC369Item Item;
		
		// Parse UUID
		FString UUIDHex;
		if (ResultObject->TryGetStringField(TEXT("uuid"), UUIDHex))
		{
			Item.UUID = UUIDHex;
		}
		
		// Parse all fields (same as inventory item)
		ResultObject->TryGetStringField(TEXT("name"), Item.Name);
		ResultObject->TryGetStringField(TEXT("creatorQorKey"), Item.CreatorQorKey);
		ResultObject->TryGetStringField(TEXT("creatorAddress"), Item.CreatorAddress);
		ResultObject->TryGetStringField(TEXT("ue5AssetPath"), Item.UE5AssetPath);
		ResultObject->TryGetStringField(TEXT("glassMaterial"), Item.GlassMaterial);
		ResultObject->TryGetStringField(TEXT("vfxSocket"), Item.VFXSocket);
		ResultObject->TryGetBoolField(TEXT("isSoulbound"), Item.bIsSoulbound);
		
		int32 RoyaltyPercent = 0;
		if (ResultObject->TryGetNumberField(TEXT("royaltyFeePercent"), RoyaltyPercent))
		{
			Item.RoyaltyFeePercent = static_cast<uint8>(RoyaltyPercent);
		}
		
		int64 MintedAt = 0;
		if (ResultObject->TryGetNumberField(TEXT("mintedAtBlock"), MintedAt))
		{
			Item.MintedAtBlock = MintedAt;
		}
		
		ResultObject->TryGetStringField(TEXT("ownerAddress"), Item.OwnerAddress);
		
		OnItemReceived.Broadcast(Item);
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// CGT TOTAL BURNED
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("cgt_totalBurned"))
	{
		FString BurnedStr;
		int64 Burned = 0;
		
		if (ResultObject->TryGetStringField(TEXT("value"), BurnedStr) || 
		    ResultObject->TryGetStringField(TEXT("result"), BurnedStr))
		{
			if (BurnedStr.StartsWith(TEXT("0x")))
			{
				Burned = FCString::Strtoui64(*BurnedStr + 2, nullptr, 16);
			}
			else
			{
				Burned = FCString::Strtoui64(*BurnedStr, nullptr, 10);
			}
		}
		else
		{
			double BurnedDouble = 0.0;
			if (ResultObject->TryGetNumberField(TEXT("value"), BurnedDouble) || 
			    ResultObject->TryGetNumberField(TEXT("result"), BurnedDouble))
			{
				Burned = static_cast<int64>(BurnedDouble);
			}
		}
		
		UE_LOG(LogTemp, Log, TEXT("[Demiurge] Total CGT burned: %lld"), Burned);
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// SYSTEM RPC (Chain Info)
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("system_name") || Method == TEXT("system_version") || Method == TEXT("system_chain"))
	{
		FString Value;
		if (ResultObject->TryGetStringField(TEXT("result"), Value))
		{
			UE_LOG(LogTemp, Log, TEXT("[Demiurge] %s: %s"), *Method, *Value);
			// Chain info would be aggregated from multiple calls
			// For now, just log
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// CHAIN HEADER (Block Number)
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method == TEXT("chain_getHeader"))
	{
		// Parse block header to get number
		// Substrate returns header object with "number" field (hex)
		FString NumberHex;
		if (ResultObject->TryGetStringField(TEXT("number"), NumberHex))
		{
			int32 BlockNumber = FCString::Strtoui64(*NumberHex + 2, nullptr, 16);
			UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Current block: %d"), BlockNumber);
		}
	}
	// ═══════════════════════════════════════════════════════════════════════════
	// TRANSACTION CONFIRMATION
	// ═══════════════════════════════════════════════════════════════════════════
	else if (Method.Contains(TEXT("_transfer")) || Method.Contains(TEXT("_register")) || Method.Contains(TEXT("_trade")))
	{
		// Extract transaction hash if present
		FString TxHash;
		if (ResultObject->TryGetStringField(TEXT("txHash"), TxHash) ||
		    ResultObject->TryGetStringField(TEXT("hash"), TxHash) ||
		    ResultObject->TryGetStringField(TEXT("result"), TxHash))
		{
			OnTransactionConfirmed.Broadcast(TxHash, true);
		}
		else
		{
			// Assume success if no error
			OnTransactionConfirmed.Broadcast(FString::Printf(TEXT("RPC_%d"), RequestID), true);
		}
	}
	else
	{
		UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Unhandled RPC method: %s"), *Method);
	}
}

void UDemiurgeNetworkManager::HandleRPCError(int32 RequestID, const TSharedPtr<FJsonObject>& ErrorObject)
{
	FString* MethodPtr = PendingRequests.Find(RequestID);
	FString Method = MethodPtr ? *MethodPtr : TEXT("Unknown");
	PendingRequests.Remove(RequestID);

	FString ErrorMessage = TEXT("Unknown error");
	int32 ErrorCode = -1;
	
	ErrorObject->TryGetStringField(TEXT("message"), ErrorMessage);
	ErrorObject->TryGetNumberField(TEXT("code"), ErrorCode);

	UE_LOG(LogTemp, Error, TEXT("[Demiurge] RPC Error [%d] %s: Code %d - %s"), RequestID, *Method, ErrorCode, *ErrorMessage);
	
	// Broadcast error via delegate
	// For transaction methods, broadcast failure
	if (Method.Contains(TEXT("_transfer")) || Method.Contains(TEXT("_register")) || Method.Contains(TEXT("_trade")))
	{
		OnTransactionConfirmed.Broadcast(FString::Printf(TEXT("RPC_%d"), RequestID), false);
	}
	
	// For balance queries, broadcast zero balance on error
	if (Method == TEXT("cgt_balance"))
	{
		OnBalanceUpdated.Broadcast(0);
	}
}

void UDemiurgeNetworkManager::SetAutoReconnect(bool bEnabled, float DelaySeconds)
{
	bAutoReconnect = bEnabled;
	ReconnectDelay = FMath::Max(1.0f, DelaySeconds);
}

void UDemiurgeNetworkManager::AttemptReconnection()
{
	if (!bAutoReconnect || bIsConnected)
	{
		return;
	}

	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Attempting reconnection in %.1f seconds..."), ReconnectDelay);

	if (UWorld* World = GEngine->GetWorldFromContextObject(this, EGetWorldErrorMode::ReturnNull))
	{
		World->GetTimerManager().SetTimer(
			ReconnectTimerHandle,
			this,
			&UDemiurgeNetworkManager::Connect,
			ReconnectDelay,
			false
		);
	}
}

void UDemiurgeNetworkManager::OnWebSocketConnected()
{
	bIsConnected = true;
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] WebSocket connected to %s"), *CurrentNodeURL);
	OnConnected.Broadcast(true);
}

void UDemiurgeNetworkManager::OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
	bIsConnected = false;
	PendingRequests.Empty();
	
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] WebSocket closed: %s (Code: %d, Clean: %s)"), 
		*Reason, StatusCode, bWasClean ? TEXT("Yes") : TEXT("No"));
	
	OnDisconnected.Broadcast(Reason);
	
	// Attempt reconnection if enabled and not a clean close
	if (bAutoReconnect && !bWasClean)
	{
		AttemptReconnection();
	}
}

void UDemiurgeNetworkManager::OnWebSocketMessage(const FString& Message)
{
	UE_LOG(LogTemp, Verbose, TEXT("[Demiurge] Received: %s"), *Message);
	ProcessMessage(Message);
}
