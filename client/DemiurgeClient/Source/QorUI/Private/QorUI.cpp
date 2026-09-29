// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#include "QorUI.h"
#include "Modules/ModuleManager.h"

void FQorUIModule::StartupModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] QorUI module initialized - Cyber Glass Design System ready"));
}

void FQorUIModule::ShutdownModule()
{
	UE_LOG(LogTemp, Log, TEXT("[Demiurge] QorUI module shutdown"));
}

IMPLEMENT_MODULE(FQorUIModule, QorUI);
