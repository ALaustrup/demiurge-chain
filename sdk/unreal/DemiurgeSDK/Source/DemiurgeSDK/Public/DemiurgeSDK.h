// Copyright Demiurge-Cloud. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

DECLARE_LOG_CATEGORY_EXTERN(LogDemiurge, Log, All);

class FDemiurgeSDKModule : public IModuleInterface
{
public:
	/** IModuleInterface implementation */
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

	/**
	 * Singleton-like access to this module's interface
	 */
	static inline FDemiurgeSDKModule& Get()
	{
		return FModuleManager::LoadModuleChecked<FDemiurgeSDKModule>("DemiurgeSDK");
	}

	/**
	 * Checks if this module is loaded and ready
	 */
	static inline bool IsAvailable()
	{
		return FModuleManager::Get().IsModuleLoaded("DemiurgeSDK");
	}
};
