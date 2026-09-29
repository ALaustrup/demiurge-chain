// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

using UnrealBuildTool;

public class DemiurgeWeb3 : ModuleRules
{
	public DemiurgeWeb3(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {
			"Json",
			"JsonUtilities",
			"WebSockets",
			"HTTP"
		});

		// Enable WebSocket support
		PublicDefinitions.Add("WITH_WEBSOCKETS=1");
	}
}
