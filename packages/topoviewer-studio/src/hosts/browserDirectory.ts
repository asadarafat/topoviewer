import type { StudioAssetContent } from '../contracts/host';
import type { StudioProject } from '../contracts/project';
import { studioSecurityLimits } from '../security/limits';
import { canonicalStudioPath } from '../security/pathSecurity';
import { BrowserProjectStoreError } from './browserProjectStore';

interface PermissionDirectoryHandle extends FileSystemDirectoryHandle {
  queryPermission?(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
}

export async function requireDirectoryPermission(directory: PermissionDirectoryHandle): Promise<void> {
  const current = await directory.queryPermission?.({ mode: 'readwrite' });
  const permission = current === 'granted' ? current : await directory.requestPermission?.({ mode: 'readwrite' });
  if (permission && permission !== 'granted') {
    throw new BrowserProjectStoreError('permission-denied', 'Grant read/write access to the project folder before saving.', true);
  }
}

export async function readDirectoryFiles(directory: FileSystemDirectoryHandle, prefix = '', state = { bytes: 0, files: 0 }): Promise<StudioAssetContent[]> {
  const result: StudioAssetContent[] = [];
  const iterable = directory as FileSystemDirectoryHandle & { entries(): AsyncIterableIterator<[string, FileSystemHandle]> };
  for await (const [name, handle] of iterable.entries()) {
    const path = canonicalStudioPath(prefix ? `${prefix}/${name}` : name);
    if (handle.kind === 'directory') {
      result.push(...await readDirectoryFiles(handle as FileSystemDirectoryHandle, path, state));
      continue;
    }
    const file = await (handle as FileSystemFileHandle).getFile();
    state.files += 1;
    state.bytes += file.size;
    if (state.files > studioSecurityLimits.archiveFiles || state.bytes > studioSecurityLimits.archiveExpandedBytes || file.size > studioSecurityLimits.assetBytes) {
      throw new BrowserProjectStoreError('invalid-request', 'Project folder exceeds the supported file-count or size limits.');
    }
    result.push({ bytes: new Uint8Array(await file.arrayBuffer()), mediaType: file.type || 'application/octet-stream', name: path });
  }
  return result.sort((left, right) => left.name.localeCompare(right.name));
}

async function parentDirectory(directory: FileSystemDirectoryHandle, path: string, create: boolean) {
  const parts = canonicalStudioPath(path).split('/');
  const name = parts.pop()!;
  let parent = directory;
  for (const part of parts) parent = await parent.getDirectoryHandle(part, { create });
  return { name, parent };
}

async function readFile(directory: FileSystemDirectoryHandle, path: string): Promise<Uint8Array | undefined> {
  try {
    const { name, parent } = await parentDirectory(directory, path, false);
    const handle = await parent.getFileHandle(name);
    return new Uint8Array(await (await handle.getFile()).arrayBuffer());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') return undefined;
    throw error;
  }
}

async function writeFile(directory: FileSystemDirectoryHandle, path: string, bytes: Uint8Array | undefined) {
  const { name, parent } = await parentDirectory(directory, path, bytes !== undefined);
  if (bytes === undefined) {
    await parent.removeEntry(name);
    return;
  }
  const handle = await parent.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(Uint8Array.from(bytes).buffer);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

function equalBytes(left?: Uint8Array, right?: Uint8Array): boolean {
  return left === right || (left !== undefined && right !== undefined && left.length === right.length && left.every((value, index) => value === right[index]));
}

function sourceFiles(project: StudioProject, assets: StudioAssetContent[]): Map<string, Uint8Array> {
  const encoder = new TextEncoder();
  const files = new Map(assets.map((asset) => [asset.name, asset.bytes]));
  for (const document of Object.values(project.documents)) {
    if (document) files.set(document.path, encoder.encode(document.text));
  }
  return files;
}

function conflict(path: string) {
  return new BrowserProjectStoreError('conflict', `Project folder file "${path}" changed outside Studio. Reopen the folder or export your draft before resolving the conflict.`, true);
}

async function assertFolderFiles(directory: FileSystemDirectoryHandle, expected: Map<string, Uint8Array>): Promise<void> {
  const actual = new Map((await readDirectoryFiles(directory)).map((file) => [file.name, file.bytes]));
  for (const path of new Set([...expected.keys(), ...actual.keys()])) {
    if (!equalBytes(actual.get(path), expected.get(path))) throw conflict(path);
  }
}

// Web Locks coordinate tabs as well as multiple open projects targeting the same folder.
// The local queue supplies the same ordering for hosts without the Web Locks API.
let pendingFolderWrite: Promise<unknown> = Promise.resolve();
export async function withFolderWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  if (globalThis.navigator?.locks) return await globalThis.navigator.locks.request('topoviewer-studio-folder-write', operation);
  const next = pendingFolderWrite.then(operation, operation);
  pendingFolderWrite = next.catch(() => undefined);
  return next;
}

export async function saveDirectoryProject<T>(
  directory: FileSystemDirectoryHandle,
  previous: StudioProject,
  next: StudioProject,
  assets: StudioAssetContent[],
  commit: () => Promise<T>
): Promise<T> {
  await requireDirectoryPermission(directory);
  const before = sourceFiles(previous, assets);
  const after = sourceFiles(next, assets);
  await assertFolderFiles(directory, before);
  const changes = [...new Set([...before.keys(), ...after.keys()])]
    .filter((path) => !equalBytes(before.get(path), after.get(path)));
  const attempted: string[] = [];
  try {
    for (const path of changes) {
      if (!equalBytes(await readFile(directory, path), before.get(path))) throw conflict(path);
      attempted.push(path);
      await writeFile(directory, path, after.get(path));
    }
    await assertFolderFiles(directory, after);
    return await commit();
  } catch (error) {
    const failed: string[] = [];
    for (const path of attempted.reverse()) {
      try {
        const current = await readFile(directory, path);
        if (equalBytes(current, before.get(path))) continue;
        // Never overwrite a third-party edit while trying to recover our own write.
        const emptyCreatedFile = !before.has(path) && current?.byteLength === 0;
        if (!equalBytes(current, after.get(path)) && !emptyCreatedFile) throw conflict(path);
        await writeFile(directory, path, before.get(path));
      } catch {
        failed.push(path);
      }
    }
    if (failed.length) {
      throw new BrowserProjectStoreError('partial-failure', `Folder save failed and these files could not be restored: ${failed.join(', ')}. Your Studio draft is still available; export it before resolving the folder.`, true);
    }
    throw error;
  }
}
