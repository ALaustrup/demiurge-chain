//! Qontrol's staging helper.
//!
//! # Why this is a separate process
//!
//! The launcher host holds the vault. Qontrol opens folders the user picks, and
//! will later open repositories from strangers, so it parses input an attacker
//! can influence. libgit2 is a large C library with a parser history. Linking it
//! into the process that holds the signing keys would put that parser one bug
//! away from them. It runs here instead, in a process that holds nothing.
//!
//! # Why libgit2 at all
//!
//! Qontrol is gitoxide everywhere else. gitoxide's own `crate-status.md`,
//! checked on 21 September 2026 against `gix` 0.87.1, marks
//! `add files with .gitignore handling`, `tree from index` and
//! `add and remove entries` as unimplemented, while marking status, rev-walk,
//! diff and `create new commit from tree` as done. The gap is **staging**, not
//! push or rebase.
//!
//! So the split is: gitoxide reads, this binary stages and writes a tree, and
//! gitoxide commits that tree and moves the ref. The index ends up matching the
//! new HEAD, which is the whole point — a commit that bypassed the index would
//! leave `git status` reporting files as modified that Qontrol had just
//! committed correctly.
//!
//! # Protocol
//!
//! One JSON request per line on stdin, one JSON response per line on stdout.
//! Line-delimited rather than length-prefixed because the messages are tiny and
//! a human needs to be able to read a transcript when this misbehaves.
//!
//! ```text
//! {"op":"stage_all","repo":"/path"}                  -> {"ok":true,"staged":3}
//! {"op":"stage","repo":"/path","paths":["a.txt"]}    -> {"ok":true,"staged":3}
//! {"op":"plan","repo":"/path","paths":null}          -> {"ok":true,"paths":["a.txt"]}
//! {"op":"write_tree","repo":"/path"}                 -> {"ok":true,"tree":"<40 hex>"}
//! {"op":"switch","repo":"/path","branch":"sketch"}   -> {"ok":true}
//! {"op":"discard","repo":"/path","paths":["a.txt"]}  -> {"ok":true}
//! {"op":"ping"}                                      -> {"ok":true}
//! ```
//!
//! # Paths are literal
//!
//! Every path a request names is matched literally, never as a glob: a file
//! called `take[1].wav` means that file, not `take1.wav` beside it. A path that
//! names a folder covers what is inside it, which is how an untracked folder of
//! new files is staged by the name the status list showed.
//!
//! # Switch and discard are here for the same reason staging is
//!
//! gitoxide 0.87 can check out a whole index into a folder, which is what a
//! clone needs, and nothing narrower: no switch that carries local changes
//! across and refuses the ones it would overwrite, and no restoring one path.
//! libgit2's safe checkout is both. A second implementation written here would
//! be a second set of answers about what gets overwritten.
//!
//! Every failure answers `{"ok":false,"error":"..."}` and the process stays up.
//! It exits 0 when stdin closes, which is how the host stops it.

use std::io::{BufRead, Write};

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
enum Request {
    /// Stage every change in the working tree, honouring the repository's own
    /// rules: `.gitignore`, `.gitattributes`, `core.autocrlf`, and case
    /// sensitivity. Those rules are libgit2's, which is the reason to be here —
    /// a second implementation of ignore handling is a second set of answers.
    StageAll {
        repo: String,
    },
    /// Stage only the named paths: additions, modifications and deletions.
    /// A per-file commit is this, then `write_tree`.
    Stage {
        repo: String,
        paths: Vec<String>,
    },
    /// What `stage_all` (no paths) or `stage` (paths) would add, without adding
    /// it; the index is not written. This is the list the host's guard reads,
    /// so the files it warns about are chosen by the same ignore rules that
    /// choose what is committed, never by a second implementation.
    Plan {
        repo: String,
        #[serde(default)]
        paths: Option<Vec<String>>,
    },
    /// Write a tree object from the index and return its id.
    WriteTree {
        repo: String,
    },
    /// Check out a local branch, carrying uncommitted changes across when they
    /// do not collide, and refusing with nothing touched when they would be
    /// overwritten.
    Switch {
        repo: String,
        branch: String,
    },
    /// Put the named tracked files back as the index holds them. A path git
    /// has never seen is refused: discarding it would mean deleting it, and
    /// this helper does not delete a creator's file.
    Discard {
        repo: String,
        paths: Vec<String>,
    },
    Ping,
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
enum Response {
    Staged { ok: bool, staged: usize },
    Tree { ok: bool, tree: String },
    Paths { ok: bool, paths: Vec<String> },
    Ok { ok: bool },
    Error { ok: bool, error: String },
}

impl Response {
    fn error(message: impl std::fmt::Display) -> Self {
        Response::Error {
            ok: false,
            error: message.to_string(),
        }
    }
}

fn stage_all(path: &str) -> Result<usize, git2::Error> {
    let repo = git2::Repository::open(path)?;
    let mut index = repo.index()?;

    // `add_all` with no pathspec filter stages additions, modifications and
    // deletions. It consults the repository's ignore rules and attributes, so a
    // file the creator ignored stays ignored and a file `.gitattributes` says
    // is text gets the line endings the repository asks for.
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)?;
    index.write()?;

    Ok(index.len())
}

/// Is `file` one of the named paths, or inside a named folder? Compared as
/// text, here, because libgit2's pathspec still matches `[` `]` `*` `?` as a glob
/// even under `DISABLE_PATHSPEC_MATCH` (measured: staging `take[1].txt` also
/// took `take1.txt`). libgit2 proposes; this decides.
fn named(file: &str, paths: &[String]) -> bool {
    paths.iter().any(|named| {
        let folder = named.trim_end_matches('/');
        file == folder
            || file
                .strip_prefix(folder)
                .is_some_and(|rest| rest.starts_with('/'))
    })
}

fn slashed(file: &std::path::Path) -> String {
    file.to_string_lossy().replace('\\', "/")
}

/// Stage exactly the named paths. `add_all` takes additions and modifications,
/// `update_all` takes deletions, and both honour the repository's ignore rules
/// and attributes as `stage_all` does; `named` turns away anything libgit2's
/// pattern matching offers beyond what was named.
fn stage(path: &str, paths: &[String]) -> Result<usize, git2::Error> {
    if paths.is_empty() {
        return Err(git2::Error::from_str("no paths were named to stage"));
    }
    let repo = git2::Repository::open(path)?;
    let mut index = repo.index()?;
    let mut only_named =
        |file: &std::path::Path, _spec: &[u8]| -> i32 { i32::from(!named(&slashed(file), paths)) };
    index.add_all(
        paths.iter(),
        git2::IndexAddOption::DISABLE_PATHSPEC_MATCH,
        Some(&mut only_named),
    )?;
    index.update_all(paths.iter(), Some(&mut only_named))?;
    index.write()?;
    Ok(index.len())
}

/// The files `stage_all` (no paths) or `stage` (paths) would add or update,
/// found by asking `add_all` and declining every one. Nothing is written.
fn plan(path: &str, paths: Option<&[String]>) -> Result<Vec<String>, git2::Error> {
    let repo = git2::Repository::open(path)?;
    let mut index = repo.index()?;
    let mut seen = Vec::new();
    let mut decline = |file: &std::path::Path, _spec: &[u8]| -> i32 {
        let file = slashed(file);
        if paths.is_none_or(|paths| named(&file, paths)) {
            seen.push(file);
        }
        // A positive answer skips the file: this is a dry run.
        1
    };
    match paths {
        Some(paths) => index.add_all(
            paths.iter(),
            git2::IndexAddOption::DISABLE_PATHSPEC_MATCH,
            Some(&mut decline),
        )?,
        None => index.add_all(
            ["*"].iter(),
            git2::IndexAddOption::DEFAULT,
            Some(&mut decline),
        )?,
    }
    seen.sort();
    seen.dedup();
    Ok(seen)
}

fn switch(path: &str, branch: &str) -> Result<(), git2::Error> {
    let repo = git2::Repository::open(path)?;
    let reference = repo
        .find_branch(branch, git2::BranchType::Local)?
        .into_reference();
    let name = reference.name()?.to_owned();
    let commit = reference.peel_to_commit()?;

    // Safe, not forced: a local change the switch would overwrite stops it
    // before a single file is written.
    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout.safe();
    repo.checkout_tree(commit.as_object(), Some(&mut checkout))?;
    repo.set_head(&name)?;
    Ok(())
}

fn discard(path: &str, paths: &[String]) -> Result<(), git2::Error> {
    if paths.is_empty() {
        return Err(git2::Error::from_str("no paths were named to discard"));
    }
    let repo = git2::Repository::open(path)?;
    let index = repo.index()?;
    for file in paths {
        if index.get_path(std::path::Path::new(file), 0).is_none() {
            return Err(git2::Error::from_str(&format!(
                "{file} has never been committed, so there is no earlier version to put back"
            )));
        }
    }

    let mut checkout = git2::build::CheckoutBuilder::new();
    checkout.force().disable_pathspec_match(true);
    for file in paths {
        checkout.path(file);
    }
    repo.checkout_index(None, Some(&mut checkout))?;
    Ok(())
}

fn write_tree(path: &str) -> Result<String, git2::Error> {
    let repo = git2::Repository::open(path)?;
    let mut index = repo.index()?;
    let tree = index.write_tree()?;
    Ok(tree.to_string())
}

fn handle(line: &str) -> Response {
    let request: Request = match serde_json::from_str(line) {
        Ok(request) => request,
        Err(error) => return Response::error(format!("bad request: {error}")),
    };

    match request {
        Request::Ping => Response::Ok { ok: true },
        Request::StageAll { repo } => match stage_all(&repo) {
            Ok(staged) => Response::Staged { ok: true, staged },
            Err(error) => Response::error(error.message()),
        },
        Request::Stage { repo, paths } => match stage(&repo, &paths) {
            Ok(staged) => Response::Staged { ok: true, staged },
            Err(error) => Response::error(error.message()),
        },
        Request::Plan { repo, paths } => match plan(&repo, paths.as_deref()) {
            Ok(paths) => Response::Paths { ok: true, paths },
            Err(error) => Response::error(error.message()),
        },
        Request::WriteTree { repo } => match write_tree(&repo) {
            Ok(tree) => Response::Tree { ok: true, tree },
            Err(error) => Response::error(error.message()),
        },
        Request::Switch { repo, branch } => match switch(&repo, &branch) {
            Ok(()) => Response::Ok { ok: true },
            Err(error) => Response::error(error.message()),
        },
        Request::Discard { repo, paths } => match discard(&repo, &paths) {
            Ok(()) => Response::Ok { ok: true },
            Err(error) => Response::error(error.message()),
        },
    }
}

fn main() {
    let stdin = std::io::stdin();
    let mut stdout = std::io::stdout();

    for line in stdin.lock().lines() {
        let Ok(line) = line else { break };
        if line.trim().is_empty() {
            continue;
        }

        let response = handle(&line);
        let encoded = serde_json::to_string(&response)
            .unwrap_or_else(|_| r#"{"ok":false,"error":"response could not be encoded"}"#.into());

        if writeln!(stdout, "{encoded}").is_err() || stdout.flush().is_err() {
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> (tempfile::TempDir, String) {
        let dir = tempfile::tempdir().expect("a temporary directory");
        let path = dir.path().to_string_lossy().to_string();
        let repo = git2::Repository::init(&path).expect("a repository");
        // A committer has to exist for anything downstream to write a commit.
        let mut config = repo.config().expect("config");
        config.set_str("user.name", "Qontrol Test").expect("name");
        config.set_str("user.email", "test@invalid").expect("email");
        (dir, path)
    }

    #[test]
    fn ping_answers() {
        let response = handle(r#"{"op":"ping"}"#);
        assert!(matches!(response, Response::Ok { ok: true }));
    }

    #[test]
    fn a_malformed_request_is_refused_and_does_not_panic() {
        let response = handle("not json at all");
        match response {
            Response::Error { ok: false, error } => assert!(error.contains("bad request")),
            other => panic!("expected an error, got {other:?}"),
        }
    }

    /// The operation this binary exists for, and the one gitoxide cannot do.
    #[test]
    fn staging_writes_an_index_and_a_tree() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/a.txt"), "hello").expect("write");

        let staged = stage_all(&path).expect("stage");
        assert_eq!(staged, 1, "one file staged");

        let tree = write_tree(&path).expect("tree");
        assert_eq!(tree.len(), 40, "a tree id is 40 hex characters");
    }

    /// The repository's own ignore rules are libgit2's, which is the reason
    /// staging lives here rather than being reimplemented. A second ignore
    /// implementation is a second set of answers, and they disagree silently.
    #[test]
    fn an_ignored_file_is_not_staged() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/.gitignore"), "secret.txt\n").expect("write ignore");
        std::fs::write(format!("{path}/secret.txt"), "not this").expect("write secret");
        std::fs::write(format!("{path}/kept.txt"), "this one").expect("write kept");

        stage_all(&path).expect("stage");

        let repo = git2::Repository::open(&path).expect("open");
        let index = repo.index().expect("index");
        let staged: Vec<String> = index
            .iter()
            .map(|entry| String::from_utf8_lossy(&entry.path).to_string())
            .collect();

        assert!(staged.iter().any(|p| p == "kept.txt"), "kept.txt staged");
        assert!(
            staged.iter().any(|p| p == ".gitignore"),
            ".gitignore staged"
        );
        assert!(
            !staged.iter().any(|p| p == "secret.txt"),
            "an ignored file must never be staged, got {staged:?}"
        );
    }

    #[test]
    fn a_deletion_is_staged_too() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/gone.txt"), "here").expect("write");
        stage_all(&path).expect("stage once");
        std::fs::remove_file(format!("{path}/gone.txt")).expect("remove");

        stage_all(&path).expect("stage again");

        let repo = git2::Repository::open(&path).expect("open");
        let index = repo.index().expect("index");
        assert_eq!(index.len(), 0, "the deletion is staged, not ignored");
    }

    /// Stage everything and commit it, the way the host does, so a test can
    /// start from a clean tree with history.
    fn commit_all(path: &str, message: &str) {
        stage_all(path).expect("stage");
        let repo = git2::Repository::open(path).expect("open");
        let tree_id = repo.index().expect("index").write_tree().expect("tree");
        let tree = repo.find_tree(tree_id).expect("find tree");
        let signature = repo.signature().expect("signature");
        let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
        let parents: Vec<&git2::Commit> = parent.iter().collect();
        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            &parents,
        )
        .expect("commit");
    }

    fn indexed(path: &str) -> Vec<String> {
        let repo = git2::Repository::open(path).expect("open");
        let index = repo.index().expect("index");
        index
            .iter()
            .map(|entry| String::from_utf8_lossy(&entry.path).to_string())
            .collect()
    }

    fn paths(list: &[&str]) -> Vec<String> {
        list.iter().map(|p| p.to_string()).collect()
    }

    /// A per-file commit stages what was chosen and nothing beside it.
    #[test]
    fn staging_named_paths_stages_only_those() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/chosen.txt"), "yes").expect("write");
        std::fs::write(format!("{path}/other.txt"), "not yet").expect("write");

        stage(&path, &paths(&["chosen.txt"])).expect("stage");

        assert_eq!(indexed(&path), vec!["chosen.txt".to_string()]);
    }

    /// A path is a name, never a pattern. `take[1].wav` as a glob matches
    /// `take1.wav`; as a path it matches only itself.
    #[test]
    fn a_named_path_is_literal_not_a_glob() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/take[1].txt"), "bracketed").expect("write");
        std::fs::write(format!("{path}/take1.txt"), "plain").expect("write");

        let planned = plan(&path, Some(&paths(&["take[1].txt"]))).expect("plan");
        assert_eq!(planned, vec!["take[1].txt".to_string()]);

        stage(&path, &paths(&["take[1].txt"])).expect("stage");
        assert_eq!(indexed(&path), vec!["take[1].txt".to_string()]);
    }

    /// The status list shows an untracked folder by its name, so that name has
    /// to stage what is inside it, still honouring the ignore rules.
    #[test]
    fn a_named_folder_stages_what_is_inside_it() {
        let (_dir, path) = fixture();
        std::fs::create_dir_all(format!("{path}/stems/drums")).expect("mkdir");
        std::fs::write(format!("{path}/stems/drums/kick.wav"), "k").expect("write");
        std::fs::write(format!("{path}/stems/bass.wav"), "b").expect("write");
        std::fs::write(format!("{path}/stems/.gitignore"), "*.tmp\n").expect("write");
        std::fs::write(format!("{path}/stems/scratch.tmp"), "t").expect("write");
        std::fs::write(format!("{path}/elsewhere.txt"), "e").expect("write");

        stage(&path, &paths(&["stems/"])).expect("stage");

        let mut staged = indexed(&path);
        staged.sort();
        assert_eq!(
            staged,
            paths(&["stems/.gitignore", "stems/bass.wav", "stems/drums/kick.wav"])
        );
    }

    #[test]
    fn a_named_deletion_is_staged() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/gone.txt"), "here").expect("write");
        std::fs::write(format!("{path}/stays.txt"), "here").expect("write");
        commit_all(&path, "first");
        std::fs::remove_file(format!("{path}/gone.txt")).expect("remove");
        std::fs::remove_file(format!("{path}/stays.txt")).expect("remove");

        stage(&path, &paths(&["gone.txt"])).expect("stage");

        assert_eq!(
            indexed(&path),
            vec!["stays.txt".to_string()],
            "only the named deletion is staged"
        );
    }

    /// The guard's list. It must be what staging would take, ignore rules
    /// included, and asking for it must change nothing.
    #[test]
    fn a_plan_lists_what_would_be_staged_and_writes_nothing() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/.gitignore"), "renders/\n").expect("write");
        std::fs::create_dir_all(format!("{path}/renders")).expect("mkdir");
        std::fs::write(format!("{path}/renders/mix.wav"), "r").expect("write");
        std::fs::create_dir_all(format!("{path}/stems")).expect("mkdir");
        std::fs::write(format!("{path}/stems/vox.wav"), "v").expect("write");

        let planned = plan(&path, None).expect("plan");

        assert_eq!(planned, paths(&[".gitignore", "stems/vox.wav"]));
        assert!(indexed(&path).is_empty(), "a plan stages nothing");
    }

    #[test]
    fn a_switch_carries_a_change_that_does_not_collide() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/song.txt"), "verse").expect("write");
        commit_all(&path, "first");
        let repo = git2::Repository::open(&path).expect("open");
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        repo.branch("sketch", &head, false).expect("branch");

        std::fs::write(format!("{path}/notes.txt"), "an idea").expect("write");
        switch(&path, "sketch").expect("switch");

        assert_eq!(repo.head().unwrap().shorthand().ok(), Some("sketch"));
        assert_eq!(
            std::fs::read_to_string(format!("{path}/notes.txt")).unwrap(),
            "an idea",
            "the uncommitted file came along"
        );
    }

    /// The case that loses work if it is got wrong: an edit the switch would
    /// overwrite. It must refuse, and leave the edit and the branch alone.
    #[test]
    fn a_switch_that_would_overwrite_a_change_is_refused_and_touches_nothing() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/song.txt"), "verse").expect("write");
        commit_all(&path, "first");
        let repo = git2::Repository::open(&path).expect("open");
        let head = repo.head().unwrap().peel_to_commit().unwrap();
        repo.branch("sketch", &head, false).expect("branch");

        switch(&path, "sketch").expect("switch");
        std::fs::write(format!("{path}/song.txt"), "verse, sketched").expect("write");
        commit_all(&path, "on sketch");
        switch(&path, "master")
            .or_else(|_| switch(&path, "main"))
            .expect("back");

        std::fs::write(format!("{path}/song.txt"), "verse, unsaved edit").expect("write");
        let refused = switch(&path, "sketch");

        assert!(refused.is_err(), "the switch must refuse");
        assert_ne!(repo.head().unwrap().shorthand().ok(), Some("sketch"));
        assert_eq!(
            std::fs::read_to_string(format!("{path}/song.txt")).unwrap(),
            "verse, unsaved edit",
            "the unsaved edit survives"
        );
    }

    #[test]
    fn a_discard_puts_back_the_committed_version() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/song.txt"), "verse").expect("write");
        std::fs::write(format!("{path}/other.txt"), "kept").expect("write");
        commit_all(&path, "first");
        std::fs::write(format!("{path}/song.txt"), "a mistake").expect("write");
        std::fs::write(format!("{path}/other.txt"), "also edited").expect("write");
        std::fs::remove_file(format!("{path}/gone.txt")).ok();

        discard(&path, &paths(&["song.txt"])).expect("discard");

        assert_eq!(
            std::fs::read_to_string(format!("{path}/song.txt")).unwrap(),
            "verse"
        );
        assert_eq!(
            std::fs::read_to_string(format!("{path}/other.txt")).unwrap(),
            "also edited",
            "a file not named is not touched"
        );
    }

    #[test]
    fn a_discarded_deletion_comes_back() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/song.txt"), "verse").expect("write");
        commit_all(&path, "first");
        std::fs::remove_file(format!("{path}/song.txt")).expect("remove");

        discard(&path, &paths(&["song.txt"])).expect("discard");

        assert_eq!(
            std::fs::read_to_string(format!("{path}/song.txt")).unwrap(),
            "verse"
        );
    }

    /// Discarding a file git has never seen would be deleting it. Refused,
    /// and the file is still there.
    #[test]
    fn discarding_an_untracked_file_is_refused_and_it_survives() {
        let (_dir, path) = fixture();
        std::fs::write(format!("{path}/song.txt"), "verse").expect("write");
        commit_all(&path, "first");
        std::fs::write(format!("{path}/new.txt"), "only copy").expect("write");

        let refused = discard(&path, &paths(&["new.txt"]));

        assert!(refused.is_err());
        assert_eq!(
            std::fs::read_to_string(format!("{path}/new.txt")).unwrap(),
            "only copy"
        );
    }

    #[test]
    fn a_path_that_is_not_a_repository_is_an_error_not_a_panic() {
        let dir = tempfile::tempdir().expect("dir");
        let response = handle(&format!(
            r#"{{"op":"stage_all","repo":{}}}"#,
            serde_json::to_string(&dir.path().to_string_lossy()).unwrap()
        ));
        assert!(matches!(response, Response::Error { ok: false, .. }));
    }
}
