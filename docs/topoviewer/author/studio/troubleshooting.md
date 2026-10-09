# Troubleshooting

**Support status:** Beta Preview

Keep Studio open while diagnosing a failed save. Before clearing storage or
replacing source, follow [Back up before resetting storage](yaml-recovery.md#back-up-before-resetting-storage).
An archive alone does not preserve unresolved editor drafts.

## Canvas Editing Or Undo Is Blocked

**Likely cause:** pending topology or mapper YAML, even if its syntax is valid.
A topology draft pauses canvas authoring; commands and history cannot overwrite
a drafted document.

**Action:** open the document named in the message. Apply the intended text or
Revert it. For invalid text, fix the reported range before Apply. See the
[draft and save rules](yaml-recovery.md#draft-and-save-rules).

**Check:** the source draft message disappears and the intended canvas command
works again. Undo remains available after the conflicting draft is resolved;
it is not a substitute for Revert.

## The Canvas Is Blank

**Likely causes:** hidden layers, objects outside the current viewport, source
diagnostics, or a renderer failure.

**Action:** use the canvas **Fit** control, check layer visibility in project
source, then open **Problems** and select any reported source error. A renderer
failure displays its own recovery screen; preserve source before reloading.

**Check:** known node IDs from `topology.yaml` are visible. An invalid new draft
should leave the last valid preview available rather than erase the project.

## A Link Or Path Was Not Created

**Likely cause:** unsupported endpoints or no traversable route.

**Action:** select two distinct nodes and press `L` with focus on the canvas to
create a link. A callout-to-node connection creates a leader instead. For a
path, first create the necessary graph links and choose a reachable route in
[the Path workflow](palette-and-direct-manipulation.md#object-families).

**Check:** inspect `graph.links` or `graph.paths` in `topology.yaml`. Repeating a
valid node connection creates a separate parallel link with its own ID.

## A Region Does Not Capture A Node

**Likely cause:** the node has not entered the containment area, or overlapping
regions are being mistaken for nested groups.

**Action:** drag the node farther inside until membership preview appears, then
release. Use the explicit group action for nesting and **Release from region**
to remove membership.

**Check:** the region's `members` list contains the node ID. Moving the group
should move its members together.

## YAML Shows Invalid Draft

**Likely cause:** the attempted Apply did not pass validation.

**Action:** select a diagnostic to locate the error, correct it, and Apply again.
To abandon that text, choose **Revert** in the source footer. Copy anything you
want to keep before reverting.

**Check:** the invalid-draft status clears and the preview matches the accepted
source. [YAML Recovery](yaml-recovery.md) explains what remains recoverable.

## Save Or Export Failed

**Likely causes:** an unresolved source/style draft, folder permissions, changed
disk files, storage quota, or an export size limit. Read the specific error first.

**Action:** resolve drafts using the [state table](yaml-recovery.md#draft-and-save-rules).
For quota or storage errors, keep Studio open, copy unresolved YAML to local text
files, and export accepted source and assets using the
[backup procedure](yaml-recovery.md#back-up-before-resetting-storage).
Grant folder access again if requested. Do not clear site data to retry a save.

**Check:** a successful save reports **Saved · recovery current**. Check that an
exported file exists before relying on it; [Export](export.md) distinguishes
source archives from images and deployment bundles.

## Mapper Coverage Is Empty Or Unresolved

**Likely causes:** no rule, a metric mismatch, or a missing/mismatched join label.

**Action:** open **Telemetry rules > Coverage**, paste the
[known working node sample](telemetry-mapper.md#create-and-check-a-node-rule),
and choose **Analyze samples**. Check the rule's metric and the sample's nested
`labels.node_id` against the target's stable ID. For another rule, use its own
join label. Review ambiguous findings instead of guessing between identities.

**Check:** the working sample produces one resolved finding linked to the
expected object. Changing the join ID to a nonexistent ID produces an unresolved
finding, which confirms that analysis is using the sample you supplied.

## A Folder Project Reports An External Conflict

**Likely cause:** files changed outside Studio after the project was opened.
This can affect browser folder projects as well as Desktop Studio.

**Action:** choose **Inspect diff**. **Keep Studio draft** keeps your current
source and accepts the disk revision as the basis for a subsequent save;
**Reload disk** replaces the current source with the directory's files. Copy
unresolved editor text first if you may need it later. If the directory was moved,
deleted, or replaced by a symlink, reopen the intended directory.

**Check:** inspect the chosen source, save it, and reopen the directory to verify
which version is on disk. See [Browser Projects](browser-projects.md) and
[Desktop Studio](desktop-studio.md) for the storage differences.

## Desktop Studio Reports A Partial Save

**Likely cause:** a coordinated write failed; a second filesystem failure may
also have prevented rollback.

**Action:** stop editing the affected directory and keep Studio open. If the
error names a retained recovery backup, preserve its `.topoviewer-backup-*` file
before retrying or repairing files manually. Follow the source-backup procedure
above as well.

**Check:** inspect the original files and retained backup before retrying. A
successful rollback removes transaction files; a retained backup needs manual
review. A failed save must not be treated as proof that disk has the new version.

## Local Development Shows Older Behavior

After rebuilding the core package, restart `npm run studio:dev` so the server
loads the new dependency build. Confirm that the restarted server's URL is the
one open in your browser. See [Run Studio locally](index.md#run-studio-locally).
