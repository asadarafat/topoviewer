# Browser Projects

**Support status:** Beta Preview

Browser projects and recovery snapshots stay in this browser profile on this
machine. Studio does not upload them to a service. Use an archive to move a
project to another browser or computer.

Open **Project menu** to enter the **Projects** manager. Create, import, and
open-folder commands stay at the top. Each project row shows its last update
time and exposes rename, duplicate, export, and delete through its action menu.
The current project is marked explicitly, and search appears when more than one
project exists.

## Saved And Recovery State

Use the [draft and save rules](yaml-recovery.md#draft-and-save-rules) to distinguish
accepted changes, pending source, style drafts, and restored work. Recovery does
not replace Save or an external backup. Before clearing site data, follow
[Back up before resetting storage](yaml-recovery.md#back-up-before-resetting-storage):
unresolved editor text must be copied separately from a project archive.

Edits made while a save is running remain `Modified` until a later save includes
them. Renaming a project preserves its current edits, source drafts, and undo
history.

## Move A Project

Choose **Export archive** from a project row's action menu to write a
`.tvstudio` archive containing accepted source, metadata, and local assets.
**Open archive** validates all entries before creating a project. Duplicate
project IDs receive a new browser ID.

Apply any edits you want included first: the archive excludes pending topology,
mapper, and stylesheet drafts. Reopen it and inspect the result before removing
the original project; [First Project](first-project.md#export-and-reopen-the-archive)
walks through that check. Source text, including a UTF-8 BOM, is preserved.

## Work With A Folder

Browsers with the File System Access API may expose **Open folder**. Studio asks
for explicit read/write permission and keeps access inside the selected
directory. The folder handle is stored in IndexedDB and restored after reload;
the browser may ask you to grant access again. A denied permission leaves the
project unsaved. Archive import remains the portable fallback.

Folder saves check both the browser revision and current disk contents before
writing. External changes produce a conflict without overwriting those files.
If a write or browser-storage commit fails, Studio attempts to restore files
already changed by that save. A failed restoration is reported explicitly.
Keep Studio open, [back up accepted source and unresolved drafts](yaml-recovery.md#back-up-before-resetting-storage),
and inspect the folder before retrying. An interrupted save can require manual
recovery because browser file writes and browser storage are separate operations.

For quota, permission, or conflict messages, use [Troubleshooting](troubleshooting.md#save-or-export-failed).
