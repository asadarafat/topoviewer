import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserStudioHost } from '../../src/hosts/browserHost';
import { buildProjection } from '../../src/session/projection';

class FakeFileHandle {
  readonly kind = 'file' as const;
  failNextWrite = false;
  beforeWrite?: () => void;
  writes = 0;
  constructor(
    readonly name: string,
    private content: Uint8Array,
    private readonly type = 'application/yaml'
  ) {}

  async createWritable() {
    let pending = this.content;
    return {
      abort: async () => undefined,
      close: async () => { this.content = pending; },
      write: async (value: ArrayBuffer) => {
        this.writes += 1;
        this.beforeWrite?.();
        if (this.failNextWrite) {
          this.failNextWrite = false;
          throw new DOMException('Interrupted write', 'UnknownError');
        }
        pending = new Uint8Array(value);
      }
    };
  }

  setText(text: string) {
    this.content = new TextEncoder().encode(text);
  }

  async getFile() {
    const content = this.content;
    return {
      arrayBuffer: async () => content.slice().buffer,
      name: this.name,
      size: content.byteLength,
      type: this.type
    } as File;
  }

  text() {
    return new TextDecoder().decode(this.content);
  }
}

class FakeDirectoryHandle {
  readonly kind = 'directory' as const;
  readonly entriesByName = new Map<string, FakeDirectoryHandle | FakeFileHandle>();
  permissionRequests = 0;
  failNextCreatedWrite = false;
  permission: PermissionState = 'granted';

  constructor(readonly name: string) {}

  async *entries() {
    for (const entry of [...this.entriesByName.entries()].sort(([left], [right]) => left.localeCompare(right))) yield entry;
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const current = this.entriesByName.get(name);
    if (current instanceof FakeDirectoryHandle) return current;
    if (!options?.create) throw new DOMException('missing', 'NotFoundError');
    const directory = new FakeDirectoryHandle(name);
    this.entriesByName.set(name, directory);
    return directory;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const current = this.entriesByName.get(name);
    if (current instanceof FakeFileHandle) return current;
    if (!options?.create) throw new DOMException('missing', 'NotFoundError');
    const file = new FakeFileHandle(name, new Uint8Array());
    file.failNextWrite = this.failNextCreatedWrite;
    this.failNextCreatedWrite = false;
    this.entriesByName.set(name, file);
    return file;
  }

  async removeEntry(name: string) { this.entriesByName.delete(name); }

  async queryPermission() {
    return 'prompt' as const;
  }
  async requestPermission() {
    this.permissionRequests += 1;
    return this.permission;
  }
}

// Native FileSystemHandles are structured-cloneable references. Model only that
// platform behavior; fake-indexeddb otherwise clones JS classes as plain objects.
const nativeClone = globalThis.structuredClone;
beforeEach(() => {
  vi.stubGlobal('structuredClone', (value: unknown, options?: StructuredSerializeOptions) => {
    const record = value as { directory?: FakeDirectoryHandle } | undefined;
    if (record?.directory instanceof FakeDirectoryHandle) {
      return { ...nativeClone({ ...record, directory: undefined }, options), directory: record.directory };
    }
    return nativeClone(value, options);
  });
});
afterEach(() => vi.unstubAllGlobals());

async function folderFixture(beforeCommit?: (operation: string) => void) {
  const directory = new FakeDirectoryHandle('edge-lab');
  const topology = new FakeFileHandle('topology.yaml', new TextEncoder().encode('graph:\n  id: edge-lab\n  nodes: []\n  links: []\n'));
  const stylesheet = new FakeFileHandle('stylesheet.yaml', new TextEncoder().encode('stylesheet: []\n'));
  directory.entriesByName.set('topology.yaml', topology);
  directory.entriesByName.set('stylesheet.yaml', stylesheet);
  const options = {
    beforeCommit,
    databaseName: `folder-${crypto.randomUUID()}`,
    directoryPicker: async () => directory as unknown as FileSystemDirectoryHandle,
    indexedDB: new IDBFactory(),
    storage: undefined
  };
  const host = new BrowserStudioHost(options);
  const opened = await host.openProjectFolder();
  if (!opened.ok) throw new Error(opened.error.message);
  const project = structuredClone(opened.value.project);
  project.documents.topology.text = project.documents.topology.text.replace('nodes: []', 'nodes:\n    - id: leaf1');
  return { directory, host, options, original: opened.value.project, project, stylesheet, topology };
}

describe('BrowserStudioHost folder capability', () => {
  it('round-trips BOM-prefixed YAML without reporting an external folder edit', async () => {
    const directory = new FakeDirectoryHandle('bom-project');
    const sources = {
      'topology.yaml': '\uFEFFgraph:\n  id: bom-project\n  nodes: []\n  links: []\n',
      'stylesheet.yaml': '\uFEFFstylesheet: []\n',
      'mapper.yaml': '\uFEFFversion: 1\nrules: []\n'
    };
    for (const [path, text] of Object.entries(sources)) {
      directory.entriesByName.set(path, new FakeFileHandle(path, new TextEncoder().encode(text)));
    }
    const options = {
      databaseName: `bom-folder-${crypto.randomUUID()}`,
      directoryPicker: async () => directory as unknown as FileSystemDirectoryHandle,
      indexedDB: new IDBFactory(), storage: undefined
    };
    const host = new BrowserStudioHost(options);
    const opened = await host.openProjectFolder();
    if (!opened.ok) throw new Error(opened.error.message);
    const project = opened.value.project;
    expect(buildProjection({
      topology: project.documents.topology.text,
      stylesheet: project.documents.stylesheet.text,
      mapper: project.documents.mapper?.text
    }).ok).toBe(true);
    for (const document of Object.values(project.documents)) {
      if (document) {
        expect(document.text.startsWith('\uFEFF')).toBe(true);
        document.text += '# edited in Studio\n';
      }
    }
    expect(await host.saveProject({ project })).toMatchObject({ ok: true });
    const reloaded = await new BrowserStudioHost(options).loadProject({ id: project.id });
    if (!reloaded.ok) throw new Error(reloaded.error.message);
    for (const document of Object.values(reloaded.value.project.documents)) {
      if (!document) continue;
      const file = await (await directory.getFileHandle(document.path)).getFile();
      expect(new Uint8Array(await file.arrayBuffer())).toEqual(new TextEncoder().encode(document.text));
      expect(document.text.startsWith('\uFEFF')).toBe(true);
    }
  });

  it('detects, explicitly grants, opens, and saves a local project folder', async () => {
    const directory = new FakeDirectoryHandle('edge-lab');
    directory.entriesByName.set('topology.yaml', new FakeFileHandle('topology.yaml', new TextEncoder().encode('graph:\n  id: edge-lab\n  nodes: []\n  links: []\n')));
    directory.entriesByName.set('stylesheet.yaml', new FakeFileHandle('stylesheet.yaml', new TextEncoder().encode('stylesheet: []\n')));
    const host = new BrowserStudioHost({
      databaseName: 'folder-host-test',
      directoryPicker: async () => directory as unknown as FileSystemDirectoryHandle,
      indexedDB: new IDBFactory(),
      storage: undefined
    });

    expect(host.capabilities.directoryProjects).toBe(true);
    const opened = await host.openProjectFolder();
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.value.project.name).toBe('edge-lab');
    expect(directory.permissionRequests).toBe(1);

    const project = structuredClone(opened.value.project);
    project.documents.topology.text = project.documents.topology.text.replace('nodes: []', 'nodes:\n    - id: leaf1');
    const saved = await host.saveProject({ expectedRevision: project.revision, project });
    expect(saved.ok).toBe(true);
    expect((directory.entriesByName.get('topology.yaml') as FakeFileHandle).text()).toContain('id: leaf1');
  });

  it('reports the optional capability as unavailable when no picker exists', () => {
    const host = new BrowserStudioHost({ databaseName: 'folder-host-none', indexedDB: new IDBFactory(), storage: undefined });
    expect(host.capabilities.directoryProjects).toBe(false);
  });
  it('rejects a stale revision before touching any folder file', async () => {
    const { host, project, topology } = await folderFixture();
    expect((await host.saveProject({ expectedRevision: project.revision, project })).ok).toBe(true);
    const writes = topology.writes;
    const stale = structuredClone(project);
    stale.documents.topology.text = stale.documents.topology.text.replace('leaf1', 'stale');
    expect(await host.saveProject({ expectedRevision: stale.revision, project: stale })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(topology.text()).toContain('leaf1');
    expect(topology.writes).toBe(writes);
  });

  it('preserves external disk edits and the current browser project on conflict', async () => {
    const { host, project, topology, original } = await folderFixture();
    topology.setText(original.documents.topology.text.replace('edge-lab', 'external'));
    expect(await host.saveProject({ project })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(topology.text()).toContain('external');
    expect(topology.writes).toBe(0);
    expect((await host.projects.loadProject(project.id)).documents.topology.text).toBe(original.documents.topology.text);
  });

  it('rolls back earlier file writes when a later write fails', async () => {
    const { host, project, topology, stylesheet, original } = await folderFixture();
    project.documents.stylesheet.text = 'stylesheet: []\n# changed\n';
    stylesheet.failNextWrite = true;
    expect((await host.saveProject({ project })).ok).toBe(false);
    expect(topology.text()).toBe(original.documents.topology.text);
    expect(stylesheet.text()).toBe(original.documents.stylesheet.text);
    expect((await host.projects.loadProject(project.id)).revision).toBe(original.revision);
  });

  it('rolls back file writes and new files when browser persistence fails', async () => {
    let interrupt = false;
    const { host, project, directory, topology, original } = await folderFixture((operation) => {
      if (interrupt && operation === 'save the project') throw new DOMException('Interrupted', 'AbortError');
    });
    project.documents.mapper = { contentHash: '', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nrules: []\n' };
    interrupt = true;
    expect(await host.saveProject({ project })).toMatchObject({ ok: false, error: { code: 'unavailable' } });
    expect(topology.text()).toBe(original.documents.topology.text);
    expect(directory.entriesByName.has('mapper.yaml')).toBe(false);
    expect((await host.projects.loadProject(project.id)).revision).toBe(original.revision);
  });

  it('restores the folder handle after a host reload and writes the original directory', async () => {
    const { options, project, topology } = await folderFixture();
    const reloadedHost = new BrowserStudioHost(options);
    const loaded = await reloadedHost.loadProject({ id: project.id });
    expect(loaded.ok).toBe(true);
    expect((await reloadedHost.saveProject({ project })).ok).toBe(true);
    expect(topology.text()).toContain('leaf1');
  });

  it('removes an empty file created by an interrupted first write', async () => {
    const { host, project, directory, topology, original } = await folderFixture();
    project.documents.mapper = { contentHash: '', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nrules: []\n' };
    directory.failNextCreatedWrite = true;
    const saved = await host.saveProject({ project });
    expect(saved.ok).toBe(false);
    if (!saved.ok) expect(saved.error.code).not.toBe('partial-failure');
    expect(directory.entriesByName.has('mapper.yaml')).toBe(false);
    expect(topology.text()).toBe(original.documents.topology.text);
  });

  it('keeps work unsaved when folder permission cannot be reacquired', async () => {
    const { directory, options, project, topology } = await folderFixture();
    directory.permission = 'denied';
    const reloadedHost = new BrowserStudioHost(options);
    expect(await reloadedHost.saveProject({ project })).toMatchObject({ ok: false, error: { code: 'permission-denied' } });
    expect(topology.writes).toBe(0);
  });

  it('serializes competing saves across hosts and rejects the losing revision', async () => {
    const { options, host, project, topology } = await folderFixture();
    const other = new BrowserStudioHost(options);
    const competitor = structuredClone(project);
    competitor.documents.topology.text = competitor.documents.topology.text.replace('leaf1', 'leaf2');
    const results = await Promise.all([host.saveProject({ project }), other.saveProject({ project: competitor })]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toMatchObject({ error: { code: 'conflict' } });
    const persisted = await host.projects.loadProject(project.id);
    expect(topology.text()).toBe(persisted.documents.topology.text);
  });

  it('removes a mapper file when the saved project removes its mapper', async () => {
    const { host, project, directory } = await folderFixture();
    project.documents.mapper = { contentHash: '', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nrules: []\n' };
    const saved = await host.saveProject({ project });
    if (!saved.ok) throw new Error(saved.error.message);
    const next = await host.projects.loadProject(project.id);
    delete next.documents.mapper;
    expect((await host.saveProject({ project: next })).ok).toBe(true);
    expect(directory.entriesByName.has('mapper.yaml')).toBe(false);
  });

  it('reports incomplete rollback while preserving a newer external edit', async () => {
    const { host, project, topology, stylesheet } = await folderFixture();
    project.documents.stylesheet.text += '# edited\n';
    stylesheet.beforeWrite = () => topology.setText('graph:\n  id: newer-external-work\n');
    stylesheet.failNextWrite = true;
    expect(await host.saveProject({ project })).toMatchObject({ ok: false, error: { code: 'partial-failure' } });
    expect(topology.text()).toContain('newer-external-work');
  });

  it('does not leave a detached browser import when remembering folder access fails', async () => {
    const { options } = await folderFixture();
    const host = new BrowserStudioHost({
      ...options,
      databaseName: `failed-binding-${crypto.randomUUID()}`,
      beforeCommit: (operation) => {
        if (operation === 'remember the project folder') throw new DOMException('Quota exhausted', 'QuotaExceededError');
      }
    });
    expect(await host.openProjectFolder()).toMatchObject({ ok: false, error: { code: 'quota-exceeded' } });
    expect(await host.listProjects()).toEqual({ ok: true, value: [] });
  });

});
