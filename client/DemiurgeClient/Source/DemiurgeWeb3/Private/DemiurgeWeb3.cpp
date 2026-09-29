// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeWeb3.h"
#include "Modules/ModuleManager.h"

void FDemiurgeWeb3Module::StartupModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Web3 module initialized - RPC bridge ready"));
}

void FDemiurgeWeb3Module::ShutdownModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Web3 module shutdown"));
}

IMPLEMENT_MODULE(FDemiurgeWeb3Module, DemiurgeWeb3);
