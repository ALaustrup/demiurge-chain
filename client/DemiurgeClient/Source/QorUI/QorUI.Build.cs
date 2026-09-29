// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

using UnrealBuildTool;

public class QorUI : ModuleRules
{
	public QorUI(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"UMG",
			"Slate",
			"SlateCore",
			"InputCore"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {
			"RenderCore",
			"RHI",
			"DemiurgeWeb3"  // For UDemiurgeNetworkManager
		});

		// Include paths
		PublicIncludePaths.AddRange(new string[] {
			// Allows #include "DemiurgeNetworkManager.h" from QorUI
		});
	}
}
