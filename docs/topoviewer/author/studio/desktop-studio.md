# Desktop Studio

**Support status:** Experimental

Desktop Studio uses the same authoring workspace as browser Studio, with native
folder and file dialogs. It saves ordinary YAML and asset files in a directory
you choose and reports changes made to those files outside Studio.

Desktop Studio is built separately for each operating system and architecture.
There is no single executable that runs unchanged on macOS, Linux, and Windows.
Unsigned CI artifacts are internal validation candidates, not public releases.

## Run From Source

Desktop development requires Node.js 24, Go 1.26.9 or newer, and the native
toolchain for the host platform. Linux also requires GTK 3 and WebKitGTK 4.1.

```bash
npm ci
npm run desktop:prerequisites
npm run desktop:frontend:dev
```

The frontend development server uses a test native bridge. For a real native
artifact:

```bash
npm run desktop:check
npm run desktop:smoke
```

The executable is written under
`apps/topoviewer-studio-desktop/build/bin/`. Use `npm run desktop:package` for
the platform package path.

## Project Lifecycle

**New project** starts as an untitled draft. Save it to a directory before
relying on recovery across application restarts. The first save asks for
an empty directory and writes the project files there. Use **Open folder** for
an existing bundle.

Keep project files and assets inside the chosen directory; symlinks and paths
outside it are rejected. A failed save reports the error and attempts to restore
the original files. If restoration also fails, preserve any backup named in
the error before retrying.

External changes reload when you have no unsaved work. Otherwise Studio asks
you to resolve a conflict before replacing source.

The [draft and save rules](yaml-recovery.md#draft-and-save-rules) apply in both
desktop and browser Studio. For an external conflict or partial-save error,
follow [Troubleshooting](troubleshooting.md#a-folder-project-reports-an-external-conflict)
before replacing source or repairing files.

## Platform Notes

- **macOS:** use a build matching your architecture. Unsigned development
  builds can be blocked by Gatekeeper.
- **Windows:** WebView2 is required. The package command creates an NSIS installer.
- **Linux:** the executable is native but dynamically uses GTK 3 and
  WebKitGTK 4.1 from the target system; keep those runtime libraries installed.

For packaging and signing requirements, see [Desktop release candidates](../../maintainers/release.md#desktop-release-candidates).
