//! The Tauri commands the Projects surface calls.
//!
//! Every one of these reads the repository on disk and returns what it found.
//! None of them takes the interface's word for anything: the surface sends a
//! path and a message, and everything else — what changed, what the history is,
//! which branch is checked out — comes back from `.git`, freshly read, after
//! every action that could have altered it.
//!
//! Folder selection is a native dialog drawn by the host. The webview is denied
//! filesystem access by `capabilities/default.json`, and this does not widen
//! that: the interface never names a folder, it asks the host to ask the person.

use std::path::PathBuf;

use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

use crate::error::QorError;

use super::{Project, Scaffold};

/// Ask the person for a folder. Returns `None` when they cancel.
#[tauri::command]
pub async fn qontrol_pick_folder(app: tauri::AppHandle) -> Result<Option<String>, QorError> {
    let picked = tauri::async_runtime::spawn_blocking(move || {
        let mut dialog = app.dialog().file().set_title("Choose a project folder");
        if let Some(window) = app.get_webview_window("main") {
            dialog = dialog.set_parent(&window);
        }
        dialog.blocking_pick_folder()
    })
    .await
    .map_err(|e| QorError::Internal(format!("the folder dialog did not answer: {e}")))?;

    Ok(picked.map(|p| p.to_string()))
}

/// Open a folder as a project, creating the repository if it has none.
#[tauri::command]
pub async fn qontrol_open(path: String) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    super::open_or_init(&path)?;
    Ok(super::read(&path)?)
}

/// Lay out a new project of the given kind inside `parent`, then open it.
#[tauri::command]
pub async fn qontrol_create(
    parent: String,
    name: String,
    kind: Scaffold,
) -> Result<Project, QorError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(QorError::Qontrol("a project needs a name".into()));
    }
    // A name is a single folder, not a path. Without this, "../.." would walk
    // out of the folder the person chose.
    if name.contains(['/', '\\']) || name == "." || name == ".." {
        return Err(QorError::Qontrol(
            "a project name cannot contain a path separator".into(),
        ));
    }

    let parent = super::resolve(&parent)?;
    let path: PathBuf = parent.join(name);
    if path.exists() {
        return Err(QorError::Qontrol(format!("{name} already exists here")));
    }

    super::scaffold(&path, kind)?;
    Ok(super::read(&path)?)
}

/// Re-read a project from disk.
#[tauri::command]
pub async fn qontrol_read(path: String) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    Ok(super::read(&path)?)
}

/// What changed inside each changed file, line by line, or inside one.
#[tauri::command]
pub async fn qontrol_diff(
    path: String,
    file: Option<String>,
) -> Result<Vec<super::FileDiff>, QorError> {
    let path = super::resolve(&path)?;
    Ok(super::diff(&path, file.as_deref())?)
}

/// What a commit of `files` (or of everything) would hold that needs a yes
/// first: large files, and anything shaped like a credential. Stages nothing.
#[tauri::command]
pub async fn qontrol_check(
    path: String,
    files: Option<Vec<String>>,
) -> Result<Vec<super::guard::Warning>, QorError> {
    let path = super::resolve(&path)?;
    Ok(super::guard::check(&path, files.as_deref())?)
}

/// Stage `files` (or everything) and write a commit, then return the project as
/// it now is. Refused while any guard warning lacks a yes in `accepted`; the
/// host runs the guard again here rather than trusting that the interface did.
#[tauri::command]
pub async fn qontrol_commit(
    path: String,
    message: String,
    files: Option<Vec<String>>,
    accepted: Option<Vec<super::guard::Accepted>>,
) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    super::commit_selected(
        &path,
        &message,
        files.as_deref(),
        accepted.as_deref().unwrap_or_default(),
    )?;
    // Read back rather than adjusting what the interface holds. If the commit
    // did something other than what the surface expects, this is where it shows.
    Ok(super::read(&path)?)
}

/// Make a branch at HEAD, then return the project. It is not switched to.
#[tauri::command]
pub async fn qontrol_branch(path: String, name: String) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    super::create_branch(&path, &name)?;
    Ok(super::read(&path)?)
}

/// Switch to a local branch, then return the project.
#[tauri::command]
pub async fn qontrol_switch(path: String, branch: String) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    super::switch(&path, &branch)?;
    Ok(super::read(&path)?)
}

/// Put the named files back as they were last committed, then return the
/// project. The interface asks the person first; the host refuses a file that
/// has no earlier version.
#[tauri::command]
pub async fn qontrol_discard(path: String, files: Vec<String>) -> Result<Project, QorError> {
    let path = super::resolve(&path)?;
    super::discard(&path, &files)?;
    Ok(super::read(&path)?)
}
