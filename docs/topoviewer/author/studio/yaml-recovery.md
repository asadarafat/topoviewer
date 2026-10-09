# YAML Recovery

**Support status:** Beta Preview

Select `topology.yaml`, `stylesheet.yaml`, or the optional `mapper.yaml` in
project source to edit it. **Apply** accepts a source change into the project;
**Save project** persists accepted changes. **Revert** discards the pending
text for the selected document. These are different actions.

## Apply A Source Edit

1. Select the document in project source and edit its YAML.
2. Review inline diagnostics. Select a problem to locate the failing range.
3. Choose **Apply** in the editor footer.
4. Check the preview, then choose **Save project** when ready to persist the change.

A valid topology or mapper Apply creates one undoable change. Appearance controls
and stylesheet YAML share one pending stylesheet, called the *style draft*.
Its latest valid version previews immediately; Apply accepts it as one undoable
change. A clean document does not show Apply or Revert.

## Draft And Save Rules

| State | What you see | What you can do | Save and normal export |
| --- | --- | --- | --- |
| Applied changes (`Modified`) | Current accepted project | Edit normally; Undo and Redo operate on accepted changes | Save persists them; export uses them |
| Unapplied topology or mapper (`Source draft`) | Last applied topology or mapper | Apply valid text or Revert. Other commands and history that would change that document are blocked; a topology draft pauses canvas editing | Apply or Revert first |
| Invalid topology or mapper after Apply (`Invalid Draft`) | Last valid project, with invalid text still in the editor | Correct and Apply, or Revert. Commands and history cannot overwrite the invalid draft | Invalid text is not saved as project source; normal export is blocked until it is resolved |
| Valid pending stylesheet (`Style draft`) | Latest valid style draft | Apply to create a history entry, or Revert to applied style | Save and normal export apply the valid style draft first |
| Invalid or checking stylesheet (`Invalid Style draft` or `Checking Style draft`) | Latest valid style preview | Correct the text, wait for validation, or Revert | Resolve validation before Save or normal export |
| Restored work (`Recovery`) | Recovered accepted edits and any restored drafts | Inspect every changed document and resolve its draft state above | Save accepted work after review |

“Normal export” means the header's **Open export panel** and **Mapper actions >
Export mapper**. **Project menu > Export archive** is different: it packages
accepted project documents and excludes every unresolved draft, including a
valid style draft that has not been applied. Use the backup steps below.

Undo does not mean “discard what I am typing.” If Studio asks you to Apply or
Revert before changing history, resolve that document first. Editing another
unrelated document can remain available. See [Troubleshooting](troubleshooting.md#canvas-editing-or-undo-is-blocked).

## Recover An Invalid Draft

Invalid source does not replace the last valid project. Correct the highlighted
problem and Apply again, or use **Revert** (announced as **Revert invalid draft**
for an applied-invalid topology or mapper). Confirm that the raw text has been
replaced by the version you intended before continuing.

Browser recovery stores pending source separately from accepted source and can
restore it after interruption. Recovery is local to that browser profile; it is
not an external backup, and clearing site data removes it.

## Back Up Before Resetting Storage

If persistence fails, keep Studio open while you make an external copy:

1. Open each YAML document with pending or invalid work. Copy its full editor
   text into a separate local text file, including any pending stylesheet. Keep
   these copies even if the text does not yet validate.
2. Export a `.tvstudio` archive from the current project's row in **Project
   menu** to preserve the accepted source, metadata, and available local assets.
   The archive does not contain the unresolved text copied in step 1.
3. Check that the text files contain your latest edits and that the archive
   downloaded successfully. If export failed, do not reset storage; preserve
   the source copies and original asset files before attempting recovery.
4. Only clear browser site data once you have the copies you need. Reimport the
   archive, then restore and correct any separate draft text in its owning editor.

## Formatting And Editor Failures

Structured edits preserve untouched comments, quoting, line endings, and unknown
keys when a local edit is possible. If broader normalization is required,
review its diff before confirming. **Format** also leaves source pending until Apply.

If the rich editor fails to load, use its raw-source recovery control to copy
or edit the text. The last valid preview remains available, but draft protection
still applies. Reopening an editor must not be used as a reason to discard work.
