// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

/**
 * Demiurge Web3 Module
 * 
 * Provides the blockchain RPC bridge for connecting to the Substrate node.
 * Handles CGT, Qor ID, and DRC-369 operations.
 */
class FDemiurgeWeb3Module : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

	/** Get the module singleton */
	static FDemiurgeWeb3Module& Get()
	{
		return FModuleManager::LoadModuleChecked<FDemiurgeWeb3Module>("DemiurgeWeb3");
	}

	/** Check if module is available */
	static bool IsAvailable()
	{
		return FModuleManager::Get().IsModuleLoaded("DemiurgeWeb3");
	}
};
