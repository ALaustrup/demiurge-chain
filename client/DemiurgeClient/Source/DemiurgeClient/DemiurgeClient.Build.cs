// Copyright 2026 Demiurge-Cloud Project. All Rights Reserved.

using UnrealBuildTool;

public class DemiurgeClient : ModuleRules
{
	public DemiurgeClient(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"UMG",
			"Slate",
			"SlateCore",
			"DemiurgeWeb3",
			"QorUI"
		});

		PrivateDependencyModuleNames.AddRange(new string[] {
			"Json",
			"JsonUtilities",
			"RenderCore",  // For post-processing
			"RHI"          // For render hardware interface
		});
	}
}
