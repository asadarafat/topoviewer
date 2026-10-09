import type {
  StudioCreateProjectRequest,
  StudioAssetContent,
  StudioAssetRequest,
  StudioAssetResult,
  StudioDuplicateProjectRequest,
  StudioExportRequest,
  StudioHost,
  StudioHostError,
  StudioHostEvent,
  StudioLoadResult,
  StudioProjectReference,
  StudioProjectSummary,
  StudioRenameProjectRequest,
  StudioResult,
  StudioSaveRequest,
  StudioSaveResult
} from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../contracts/project';
import { stableProjectSourceRevision } from '../session/hash';
import { BrowserProjectStore, BrowserProjectStoreError, type BrowserProjectStoreOptions } from './browserProjectStore';
import { safeReadBrowserPreference, safeWriteBrowserPreference } from './browserPreferences';
import { createStarterProject } from './starterProject';
import { stableBytesHash, stableTextHash } from '../session/hash';
import { validateStudioAssetContent } from '../security/assetSecurity';
import { studioSecurityLimits } from '../security/limits';
import { readDirectoryFiles, requireDirectoryPermission, saveDirectoryProject, withFolderWriteLock } from './browserDirectory';
import { validateStudioProjectContent } from '../security/projectSecurity';

type DirectoryPicker = (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;

function globalDirectoryPicker(): DirectoryPicker | undefined {
  const scope = globalThis as typeof globalThis & {
    showDirectoryPicker?: DirectoryPicker;
  };
  return typeof scope.showDirectoryPicker === 'function' ? scope.showDirectoryPicker.bind(scope) : undefined;
}

export interface BrowserStudioHostOptions extends BrowserProjectStoreOptions {
  createInitialProject?: () => StudioProject;
  directoryPicker?: DirectoryPicker;
  storage?: Storage;
}

function sourceAsset(files: StudioAssetContent[], kind: 'topology' | 'stylesheet' | 'mapper') {
  const exact = `${kind}.yaml`;
  const suffix = kind === 'topology' ? /\.topo\.tv\.ya?ml$/i : kind === 'stylesheet' ? /\.style\.tv\.ya?ml$/i : /\.mapper\.tv\.ya?ml$/i;
  return files.find((file) => file.name === exact) || files.find((file) => suffix.test(file.name));
}

function success<T>(value: T): StudioResult<T> {
  return { ok: true, value };
}

function hostError(error: unknown): StudioHostError {
  if (error instanceof BrowserProjectStoreError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable
    };
  }
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : String(error),
    retryable: true
  };
}

async function result<T>(operation: () => Promise<T>): Promise<StudioResult<T>> {
  try {
    return success(await operation());
  } catch (error) {
    return { error: hostError(error), ok: false };
  }
}

export class BrowserStudioHost implements StudioHost {
  readonly capabilities: { directoryProjects: boolean; projectCatalog: true };
  readonly displayName = 'Browser storage';
  readonly kind = 'browser' as const;
  private readonly createInitialProject: () => StudioProject;
  private readonly directoryHandles = new Map<string, FileSystemDirectoryHandle>();
  private readonly directoryPicker?: DirectoryPicker;
  private initialProject?: Promise<string>;
  private readonly storage?: Storage;
  readonly projects: BrowserProjectStore;

  constructor(options: BrowserStudioHostOptions = {}) {
    this.createInitialProject = options.createInitialProject || (() => createStarterProject({ template: 'backbone' }));
    this.directoryPicker = options.directoryPicker || globalDirectoryPicker();
    this.capabilities = { directoryProjects: Boolean(this.directoryPicker), projectCatalog: true };
    this.projects = new BrowserProjectStore(options);
    this.storage =
      options.storage ??
      (() => {
        try {
          return globalThis.localStorage;
        } catch {
          return undefined;
        }
      })();
  }

  private ensureInitialProject(): Promise<string> {
    if (this.initialProject) return this.initialProject;
    this.initialProject = (async () => {
      const projects = await this.projects.listProjects();
      if (projects[0]) return projects[0].id;
      const project = this.createInitialProject();
      await this.projects.createProject(project);
      return project.id;
    })();
    return this.initialProject;
  }

  private projectId(): string {
    return `studio-${globalThis.crypto.randomUUID()}`;
  }

  private async loadResult(project: StudioProject): Promise<StudioLoadResult> {
    validateStudioProjectContent(project);
    const recovery = (await this.projects.recoverySnapshots(project.id)).find(
      (snapshot) =>
        snapshot.project.revision === project.revision &&
        snapshot.capturedAt > project.metadata.updatedAt &&
        (
          snapshot.sourceRevision !== stableProjectSourceRevision(project) ||
          Object.keys(snapshot.invalidDrafts || {}).length > 0 ||
          Object.keys(snapshot.sourceDrafts || {}).length > 0 ||
          Boolean(snapshot.stylesheetCandidate)
        )
    );
    if (recovery) recovery.project.name = project.name;
    return { project, ...(recovery ? { recovery } : {}) };
  }

  copyText(text: string): Promise<StudioResult<void>> {
    return result(async () => {
      if (!globalThis.navigator.clipboard?.writeText) {
        throw new BrowserProjectStoreError('unsupported', 'Clipboard access is not available in this browser.', true);
      }
      await globalThis.navigator.clipboard.writeText(text);
    });
  }

  chooseAssets(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>> {
    return new Promise((resolve) => {
      const input = globalThis.document.createElement('input');
      input.accept = request.accept.join(',');
      input.multiple = request.multiple;
      input.type = 'file';
      const finish = (value: StudioResult<StudioAssetResult>) => {
        input.remove();
        resolve(value);
      };
      input.addEventListener(
        'cancel',
        () =>
          finish({
            error: {
              code: 'cancelled',
              message: 'File selection was cancelled.',
              retryable: true
            },
            ok: false
          }),
        { once: true }
      );
      input.addEventListener(
        'change',
        () => {
          const files = [...(input.files || [])];
          if (!files.length) {
            finish({
              error: {
                code: 'cancelled',
                message: 'No file was selected.',
                retryable: true
              },
              ok: false
            });
            return;
          }
          void Promise.all(
            files.map(async (file) => {
              if (file.size > request.maximumBytes) throw new BrowserProjectStoreError('invalid-request', `File "${file.name}" exceeds the ${request.maximumBytes} byte limit.`);
              return {
                bytes: new Uint8Array(await file.arrayBuffer()),
                mediaType: file.type || 'application/octet-stream',
                name: file.name
              };
            })
          ).then(
            (assets) => finish(success({ assets })),
            (error) => finish({ error: hostError(error), ok: false })
          );
        },
        { once: true }
      );
      input.click();
    });
  }

  createProject(request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      const project = request.project ? structuredClone(request.project) : createStarterProject({ id: this.projectId(), name: request.name });
      const existingIds = new Set((await this.projects.listProjects()).map((candidate) => candidate.id));
      if (existingIds.has(project.id)) project.id = this.projectId();
      if (request.name?.trim()) project.name = request.name.trim();
      project.revision = 'browser-initial';
      let assets: StudioAssetContent[] | undefined;
      if (request.assets) assets = validateStudioProjectContent(project, request.assets);
      else validateStudioProjectContent(project);
      await this.projects.createProject(project, { assets });
      this.initialProject = Promise.resolve(project.id);
      return { project: await this.projects.loadProject(project.id) };
    });
  }

  deleteProject(reference: StudioProjectReference): Promise<StudioResult<void>> {
    return result(async () => {
      if (!reference.id) throw new BrowserProjectStoreError('invalid-request', 'A browser project ID is required for deletion.');
      await this.projects.deleteProject(reference.id);
      this.initialProject = undefined;
    });
  }

  duplicateProject(request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      const source = await this.projects.loadProject(request.id);
      const assets = await this.projects.projectAssets(request.id);
      const now = new Date().toISOString();
      const project = structuredClone(source);
      project.id = this.projectId();
      project.name = request.name?.trim() || `${source.name} copy`;
      project.revision = 'browser-initial';
      project.metadata = {
        ...project.metadata,
        createdAt: now,
        updatedAt: now
      };
      await this.projects.createProject(project, { assets });
      this.initialProject = Promise.resolve(project.id);
      return { project: await this.projects.loadProject(project.id) };
    });
  }

  exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>> {
    return result(async () => {
      const bytes = Uint8Array.from(request.artifact.bytes);
      const blob = new Blob([bytes.buffer], {
        type: request.artifact.mediaType
      });
      const url = URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');
      anchor.download = request.suggestedName;
      anchor.href = url;
      anchor.click();
      queueMicrotask(() => URL.revokeObjectURL(url));
    });
  }

  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      if (reference?.path && !reference.id) {
        throw new BrowserProjectStoreError('unsupported', 'Browser projects are addressed by project ID, not filesystem path.');
      }
      const projectId = reference?.id || (await this.ensureInitialProject());
      const project = await this.projects.loadProject(projectId);
      this.initialProject = Promise.resolve(project.id);
      if (reference?.recovery === 'discard') {
        await this.projects.discardRecoverySnapshots(project.id);
        return { project };
      }
      return this.loadResult(project);
    });
  }

  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> {
    return result(() => this.projects.listProjects());
  }

  openProjectFolder(): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      if (!this.directoryPicker) throw new BrowserProjectStoreError('unsupported', 'Folder access is not available in this browser.');
      let directory: FileSystemDirectoryHandle;
      try {
        directory = await this.directoryPicker({ mode: 'readwrite' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new BrowserProjectStoreError('cancelled', 'Folder selection was cancelled.', true);
        }
        throw error;
      }
      await requireDirectoryPermission(directory);
      const files = await readDirectoryFiles(directory);
      const topology = sourceAsset(files, 'topology');
      const stylesheet = sourceAsset(files, 'stylesheet');
      const mapper = sourceAsset(files, 'mapper');
      if (!topology || !stylesheet) {
        throw new BrowserProjectStoreError('invalid-request', 'Project folder must contain topology and stylesheet YAML files.');
      }
      // Keep a source BOM so byte comparisons use the original folder contents.
      const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
      if ([topology, stylesheet, mapper].some((file) => file && file.bytes.byteLength > studioSecurityLimits.sourceBytes)) {
        throw new BrowserProjectStoreError('quota-exceeded', 'Project YAML exceeds the supported source-size limit.');
      }
      const project = createStarterProject({
        id: this.projectId(),
        name: directory.name
      });
      project.documents.topology = {
        contentHash: `fnv1a-${stableTextHash(decoder.decode(topology.bytes))}`,
        kind: 'topology',
        path: topology.name,
        text: decoder.decode(topology.bytes)
      };
      project.documents.stylesheet = {
        contentHash: `fnv1a-${stableTextHash(decoder.decode(stylesheet.bytes))}`,
        kind: 'stylesheet',
        path: stylesheet.name,
        text: decoder.decode(stylesheet.bytes)
      };
      if (mapper)
        project.documents.mapper = {
          contentHash: `fnv1a-${stableTextHash(decoder.decode(mapper.bytes))}`,
          kind: 'mapper',
          path: mapper.name,
          text: decoder.decode(mapper.bytes)
        };
      const sourceNames = new Set([topology.name, stylesheet.name, mapper?.name].filter(Boolean));
      let assets: StudioAssetContent[];
      try {
        assets = files.filter((file) => !sourceNames.has(file.name)).map((asset) => validateStudioAssetContent(asset, { allowMediaTypeSniffing: true }));
      } catch (error) {
        throw new BrowserProjectStoreError('invalid-request', error instanceof Error ? error.message : String(error));
      }
      project.assets = assets.map((asset) => ({
        contentHash: `fnv1a-${stableBytesHash(asset.bytes)}`,
        mediaType: asset.mediaType,
        path: asset.name,
        size: asset.bytes.byteLength
      }));
      validateStudioProjectContent(project, assets);
      const created = await this.createProject({ assets, project });
      if (!created.ok) throw new BrowserProjectStoreError(created.error.code, created.error.message, created.error.retryable);
      try {
        await this.projects.bindDirectory(created.value.project.id, directory);
      } catch (error) {
        await this.projects.deleteProject(created.value.project.id);
        this.initialProject = undefined;
        throw error;
      }
      this.directoryHandles.set(created.value.project.id, directory);
      return created.value;
    });
  }

  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> {
    return Promise.resolve(safeReadBrowserPreference<T>(this.storage, key));
  }

  readProjectAssets(reference: StudioProjectReference): Promise<StudioResult<StudioAssetContent[]>> {
    if (!reference.id)
      return Promise.resolve({
        error: {
          code: 'invalid-request',
          message: 'A project ID is required to read assets.',
          retryable: false
        },
        ok: false
      });
    return result(async () => (await this.projects.projectAssets(reference.id!)).map((asset) => validateStudioAssetContent(asset, { allowMediaTypeSniffing: false })));
  }

  report(event: StudioHostEvent): void {
    if (import.meta.env.DEV) console.debug(`[topoviewer-studio:${event.category}] ${event.name}`, event.detail || {});
  }

  renameProject(request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      const name = request.name.trim();
      if (!name) throw new BrowserProjectStoreError('invalid-request', 'Project name cannot be empty.');
      const project = await this.projects.renameProject(request.id, name);
      this.initialProject = Promise.resolve(project.id);
      return this.loadResult(project);
    });
  }

  resetStorage(): Promise<StudioResult<void>> {
    return result(async () => {
      await this.projects.reset();
      this.initialProject = undefined;
      this.directoryHandles.clear();
    });
  }

  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> {
    return result(async () => {
      validateStudioProjectContent(request.project);
      const directory = this.directoryHandles.get(request.project.id) || await this.projects.directoryHandle(request.project.id);
      if (!directory) return this.projects.saveProject(request);
      return withFolderWriteLock(async () => {
        const previous = await this.projects.loadProject(request.project.id);
        if ((request.expectedRevision || request.project.revision) !== previous.revision) {
          throw new BrowserProjectStoreError('conflict', 'The project changed after it was opened. Reload or inspect the conflict before saving.');
        }
        const assets = await this.projects.projectAssets(request.project.id);
        return saveDirectoryProject(directory, previous, request.project, assets, () => this.projects.saveProject({
          ...request,
          expectedRevision: previous.revision
        }));
      });
    });
  }

  saveRecovery(snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> {
    return result(() => this.projects.saveRecovery(snapshot));
  }

  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> {
    return Promise.resolve(safeWriteBrowserPreference(this.storage, key, value));
  }
}
