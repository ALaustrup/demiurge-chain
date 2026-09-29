// Copyright Demiurge-Cloud. All Rights Reserved.

#include "DemiurgeSDK.h"

#define LOCTEXT_NAMESPACE "FDemiurgeSDKModule"

DEFINE_LOG_CATEGORY(LogDemiurge);

void FDemiurgeSDKModule::StartupModule()
{
	UE_LOG(LogDemiurge, Log, TEXT("Demiurge SDK initialized"));
}

void FDemiurgeSDKModule::ShutdownModule()
{
	UE_LOG(LogDemiurge, Log, TEXT("Demiurge SDK shutdown"));
}

#undef LOCTEXT_NAMESPACE
	
IMPLEMENT_MODULE(FDemiurgeSDKModule, DemiurgeSDK)
