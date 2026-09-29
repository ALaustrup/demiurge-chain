//! Publishing a version: the commit a project's HEAD points at, as an asset's
//! manifest (ADR-047; roadmap M4.1, the Qontrol blueprint's Phase 5).
//!
//! # A mint pins a commit, by hash
//!
//! What is minted is the tree of **one commit**, read from the repository's
//! object store — never the working folder, which can change while a dialog is
//! open, and never a branch, which can move after (ADR-047 decisions 8 and 9).
//! The branch is written into the manifest for a person reading it; the chain is
//! given the commit's id.
//!
//! A project with uncommitted changes is refused rather than minted without
//! them. Minting the last commit while the folder says something else would be
//! true and would still surprise the creator, who would find out later that the
//! asset is not what was on their screen.

use std::path::Path;

use crate::content::{CommitId, ContentError, ContentRef, Manifest, SourceRef, TemporaryStore};

use super::{current_branch, open, read_changes, QontrolError};

/// What a mint of this project would pin, computed before anyone is asked to
/// approve it.
#[derive(Debug, Clone)]
pub struct Snapshot {
    /// The project folder's name, which becomes the asset's name.
    pub name: String,
    pub commit: CommitId,
    pub branch: Option<String>,
    pub manifest: Manifest,
    /// The asset's reference: the manifest's fingerprint.
    pub reference: ContentRef,
    /// Each file's git blob and its fingerprint, so the bytes can be copied into
    /// the temporary store once the mint is approved, and not before.
    blobs: Vec<(gix::ObjectId, ContentRef)>,
}

impl From<ContentError> for QontrolError {
    fn from(error: ContentError) -> Self {
        QontrolError::Git(error.to_string())
    }
}

/// The commit HEAD points at, as a manifest. Reads; writes nothing.
pub fn snapshot(path: &Path) -> Result<Snapshot, QontrolError> {
    let repo = open(path)?;

    let pending = read_changes(&repo)?;
    if !pending.is_empty() {
        return Err(QontrolError::Git(format!(
            "{} {} changed since the last commit. A mint pins a commit, so commit first, \
             or the asset would not be what is on your screen.",
            pending.len(),
            if pending.len() == 1 {
                "file has"
            } else {
                "files have"
            },
        )));
    }

    let commit = repo.head_commit().map_err(|_| {
        QontrolError::Git(
            "there is no commit to mint yet. A mint pins a commit: make one first.".into(),
        )
    })?;
    let commit_id = CommitId::from_bytes(commit.id.as_bytes())?;
    let created = commit
        .time()
        .map(|time| time.seconds.max(0) as u64)
        .map_err(|e| QontrolError::Git(format!("the commit's time could not be read: {e}")))?;

    let tree = commit
        .tree()
        .map_err(|e| QontrolError::Git(format!("the commit's files could not be read: {e}")))?;
    let entries =
        tree.traverse().breadthfirst.files().map_err(|e| {
            QontrolError::Git(format!("the commit's files could not be walked: {e}"))
        })?;

    let mut files = Vec::new();
    let mut blobs = Vec::new();
    for entry in entries {
        if entry.mode.is_tree() {
            continue;
        }
        let path = String::from_utf8(entry.filepath.to_vec()).map_err(|_| {
            QontrolError::Git(format!(
                "{:?} is not a UTF-8 name, and an asset's manifest names every file in UTF-8",
                entry.filepath
            ))
        })?;
        if entry.mode.is_commit() {
            return Err(QontrolError::Git(format!(
                "{path} is a submodule. A project with a submodule cannot be minted yet: \
                 its files are in another repository."
            )));
        }
        let object = repo
            .find_object(entry.oid)
            .map_err(|e| QontrolError::Git(format!("{path} could not be read: {e}")))?;
        let reference = ContentRef::of(&object.data);
        files.push((path, reference));
        blobs.push((entry.oid, reference));
    }

    let manifest = Manifest::new(
        files,
        created,
        Some(SourceRef {
            commit: commit_id,
            branch: current_branch(&repo),
        }),
    )?;
    let reference = manifest.reference();

    Ok(Snapshot {
        name: path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string()),
        commit: commit_id,
        branch: current_branch(&repo),
        manifest,
        reference,
        blobs,
    })
}

impl Snapshot {
    /// How many files the asset is made of.
    pub fn files(&self) -> usize {
        self.manifest.entries.len()
    }

    /// Copy every file and the manifest into the temporary store, each under its
    /// own fingerprint. Called only once a mint is approved.
    pub fn write_to(&self, repo_path: &Path, store: &TemporaryStore) -> Result<(), QontrolError> {
        let repo = open(repo_path)?;
        for (oid, reference) in &self.blobs {
            let object = repo
                .find_object(*oid)
                .map_err(|e| QontrolError::Git(format!("a file could not be read again: {e}")))?;
            store.put(reference, &object.data)?;
        }
        store.put(&self.reference, &self.manifest.bytes())?;
        Ok(())
    }
}
