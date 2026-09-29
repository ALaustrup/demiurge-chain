// Copyright Demiurge-Cloud. All Rights Reserved.

using UnrealBuildTool;

public class DemiurgeSDK : ModuleRules
{
	public DemiurgeSDK(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;
		
		// C++17 for modern features
		CppStandard = CppStandardVersion.Cpp17;

		PublicIncludePaths.AddRange(
			new string[] {
				// ... add public include paths required here ...
			}
		);
				
		PrivateIncludePaths.AddRange(
			new string[] {
				// ... add other private include paths required here ...
			}
		);
			
		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"CoreUObject",
				"Engine",
				"HTTP",
				"Json",
				"JsonUtilities",
				"WebSockets",
			}
		);
			
		PrivateDependencyModuleNames.AddRange(
			new string[]
			{
				"Slate",
				"SlateCore",
			}
		);
		
		DynamicallyLoadedModuleNames.AddRange(
			new string[]
			{
				// ... add any modules that your module loads dynamically here ...
			}
		);

		// Enable IWYU (Include What You Use)
		bEnforceIWYU = true;

		// Disable unity builds for faster iteration
		bUseUnity = false;
	}
}
