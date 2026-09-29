// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

/**
 * Qor UI Module
 * 
 * Implements the Cyber Glass Design System.
 * Provides the visual foundation for all Demiurge UI elements.
 * 
 * Components:
 *   - UQorGlassPanel: Base widget with frosted glass effect
 *   - Style presets: Default, Pleroma, Archon, Warning
 *   - Animated transitions and edge glow effects
 */
class FQorUIModule : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

	/** Get the module singleton */
	static FQorUIModule& Get()
	{
		return FModuleManager::LoadModuleChecked<FQorUIModule>("QorUI");
	}

	/** Check if module is available */
	static bool IsAvailable()
	{
		return FModuleManager::Get().IsModuleLoaded("QorUI");
	}
};
