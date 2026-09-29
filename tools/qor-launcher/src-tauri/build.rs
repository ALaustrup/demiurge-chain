fn main() {
    // Embed a Windows manifest declaring PerMonitorV2 DPI awareness, so the
    // window, its non-client area and its child WebView2 agree on scaling and
    // re-scale correctly across monitors with different DPI. Tauri otherwise
    // leaves the process at PER_MONITOR_AWARE (v1).
    #[cfg(windows)]
    {
        let manifest = std::path::Path::new("qor-launcher.manifest");
        println!("cargo:rerun-if-changed=qor-launcher.manifest");

        let attributes = tauri_build::Attributes::new().windows_attributes(
            tauri_build::WindowsAttributes::new().app_manifest(
                std::fs::read_to_string(manifest).expect("qor-launcher.manifest is missing"),
            ),
        );

        tauri_build::try_build(attributes).expect("failed to run tauri-build");
    }

    #[cfg(not(windows))]
    tauri_build::build();
}
