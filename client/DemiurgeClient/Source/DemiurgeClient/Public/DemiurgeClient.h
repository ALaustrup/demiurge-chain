// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

/**
 * Demiurge Client Module
 * 
 * Main game module for the Demiurge 3D Client.
 * Provides the HUD, GameMode, and core game logic.
 */
class FDemiurgeClientModule : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
