# Security

**Support status:** Beta Preview

Treat topology, stylesheet, mapper, labels, standalone text, Markdown, SVG, images, archives,
telemetry samples, and mounted files as untrusted input unless the host controls
their source.

Studio enforces bounded source size, archive size, file count, expansion ratio,
asset size, image dimensions, sample count, and renderer cardinality. Archive
paths are canonicalized and validated before any project is created. SVG and
image media types are inspected instead of trusting filenames.

Imported YAML cannot raise Studio's own renderer ceilings: 1,500 graph nodes,
3,000 edges, 1,600 path segments, 1,200 pins, and 250 regions. Lower document
limits still apply. Force-layout iterations must be a finite integer between
1 and 1,000. Projects that exceed these limits report diagnostics before the
canvas compiles them.

Pending stylesheet text passes the same validation, asset checks, and renderer
limits as applied source. Invalid text is recoverable but cannot be saved or
exported as the applied stylesheet. Follow the
[backup procedure](yaml-recovery.md#back-up-before-resetting-storage) to preserve
unresolved text separately from an archive.
Completion derives suggestions from the already loaded project and canonical
metadata; it does not query a network service or evaluate selector text as code.

Browser projects stay in local browser storage. Desktop Studio keeps file
access inside the chosen project directory and attempts to restore original
files if a save fails. Neither storage location is an encrypted vault.

Studio does not:

- evaluate YAML, mapper templates, labels, `diagram.texts`, or Markdown as JavaScript;
- fetch arbitrary remote assets during normal authoring or export;
- provide authentication, authorization, tenancy, or business policy;
- sandbox arbitrary hostile HTML supplied by a host application;
- encrypt browser or desktop project files.

Host applications remain responsible for identity, access control, workstation
security, and deciding which project sources users may open.

Report suspected vulnerabilities privately when possible. Do not publish
working exploit details in a public issue.
