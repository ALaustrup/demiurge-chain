// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "DemiurgeClient.h"
#include "Modules/ModuleManager.h"

void FDemiurgeClientModule::StartupModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Client module initialized"));
}

void FDemiurgeClientModule::ShutdownModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] Client module shutdown"));
}

IMPLEMENT_PRIMARY_GAME_MODULE(FDemiurgeClientModule, DemiurgeClient, "DemiurgeClient");
