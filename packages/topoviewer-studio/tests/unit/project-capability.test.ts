import { describe, expect, it, vi } from 'vitest';
import type { StudioSaveRequest, StudioSaveResult, StudioResult } from '../../src/contracts/host';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioProjectCapability } from '../../src/features/projects/projectCapability';
import { MemoryStudioHost } from '../../src/hosts/memoryHost';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession, createStudioSourceDraftController, createStylesheetCandidateController } from '../../src/session';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function fixture() {
  const host = new MemoryStudioHost();
  const session = createStudioDocumentSession(createStarterProject());
  const dispatcher = createStudioCommandDispatcher(session);
  const sourceDrafts = createStudioSourceDraftController();
  const initial = session.snapshot();
  const stylesheetCandidate = createStylesheetCandidateController({
    appliedSourceRevision: initial.projection.sourceRevision,
    appliedStylesheetText: initial.project.documents.stylesheet.text,
    topologyText: initial.project.documents.topology.text
  });
  const options = {
    announce: vi.fn(), applyStylesheetCandidate: () => true, dispatcher, host,
    onReload: async () => undefined, refresh: vi.fn(), session, setError: vi.fn(),
    sourceDrafts, stylesheetCandidate, synchronizeAfterHistory: vi.fn()
  };
  const capability = () => createStudioProjectCapability(options);
  function edit(id: string) {
    dispatcher.dispatch({
      id, label: id,
      execute: () => ({
        mutations: [{ kind: 'set-value', document: 'topology', path: ['graph', 'id'], value: id }],
        summary: id
      })
    });
  }
  return { ...options, capability, edit };
}

describe('Studio project persistence interleavings', () => {
  it('keeps accepted edits made during save dirty and saves them against the acknowledged revision', async () => {
    const { host, session, capability, edit } = fixture();
    const writing = deferred<StudioResult<StudioSaveResult>>();
    const requests: StudioSaveRequest[] = [];
    host.saveProject = vi.fn(async (request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> => {
      requests.push(structuredClone(request));
      return requests.length === 1 ? writing.promise : { ok: true, value: { revision: 'revision-2', savedAt: '2026-10-03T12:00:02Z' } };
    });
    edit('before-save');
    const saving = capability().save();
    edit('after-save-started');
    // React constructs a fresh capability on every render; it must still share
    // the in-flight operation instead of starting a competing stale write.
    const overlappingSave = capability().save();
    expect(host.saveProject).toHaveBeenCalledTimes(1);
    writing.resolve({ ok: true, value: { revision: 'revision-1', savedAt: '2026-10-03T12:00:01Z' } });
    await Promise.all([saving, overlappingSave]);
    expect(requests[0].project.documents.topology.text).toContain('before-save');
    expect(session.snapshot()).toMatchObject({ project: { revision: 'revision-1' }, status: 'modified' });
    expect(session.snapshot().project.documents.topology.text).toContain('after-save-started');
    await capability().save();
    expect(requests[1].expectedRevision).toBe('revision-1');
    expect(requests[1].project.documents.topology.text).toContain('after-save-started');
    expect(session.snapshot().status).toBe('saved');
  });

  it('retains invalid source entered during a pending save', async () => {
    const { host, session, capability, edit } = fixture();
    const writing = deferred<StudioResult<StudioSaveResult>>();
    host.saveProject = () => writing.promise;
    edit('before-save');
    const saving = capability().save();
    session.replaceDraft('topology', 'graph: [');
    writing.resolve({ ok: true, value: { revision: 'saved', savedAt: '2026-10-03T12:00:01Z' } });
    await saving;
    expect(session.snapshot().status).toBe('invalid-draft');
    expect(session.snapshot().invalidDrafts.topology?.text).toBe('graph: [');
    expect(session.snapshot().project.revision).toBe('saved');
    capability().discardInvalidDraft('topology');
    expect(session.snapshot().status).toBe('saved');
  });

  it('waits for pending save before flushing the newer recovery for a project switch', async () => {
    const { host, capability, edit } = fixture();
    const writing = deferred<StudioResult<StudioSaveResult>>();
    host.saveProject = () => writing.promise;
    const recovery = vi.spyOn(host, 'saveRecovery');
    edit('saved-source');
    const saving = capability().save();
    edit('newer-source');
    const switching = capability().flushRecovery();
    expect(recovery).not.toHaveBeenCalled();
    writing.resolve({ ok: true, value: { revision: 'saved-revision', savedAt: '2026-10-03T12:00:01Z' } });
    await saving;
    expect(await switching).toBe(true);
    expect(recovery).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({ revision: 'saved-revision', documents: expect.objectContaining({
        topology: expect.objectContaining({ text: expect.stringContaining('newer-source') })
      }) })
    }));
  });

  it('keeps an external conflict raised during save recoverable after the save completes', async () => {
    const { host, session, capability, edit } = fixture();
    const writing = deferred<StudioResult<StudioSaveResult>>();
    host.saveProject = () => writing.promise;
    const recovery = vi.spyOn(host, 'saveRecovery');
    edit('local-source');
    const saving = capability().save();
    capability().markExternalConflict();
    writing.resolve({ ok: true, value: { revision: 'saved-revision', savedAt: '2026-10-03T12:00:01Z' } });
    expect(await saving).toBe(false);
    expect(session.snapshot().status).toBe('conflict');
    expect(await capability().flushRecovery()).toBe(true);
    expect(recovery).toHaveBeenCalledWith(expect.objectContaining({ project: expect.objectContaining({
      documents: expect.objectContaining({ topology: expect.objectContaining({ text: expect.stringContaining('local-source') }) })
    }) }));
  });

  it('preserves project name, save revision, and source history through rename, save, undo and redo', async () => {
    const { host, session, dispatcher, sourceDrafts, stylesheetCandidate, capability, edit } = fixture();
    edit('authored-source');
    session.setSelection([{ id: 'physical', kind: 'layer' }]);
    sourceDrafts.replace('topology', 'graph: [', session.snapshot().project.documents.topology.text);
    stylesheetCandidate.replaceRawText('stylesheet: [');
    capability().renameProject('Renamed project');
    expect(session.snapshot().project.name).toBe('Renamed project');
    expect(session.snapshot().status).toBe('modified');
    expect(session.snapshot().selection).toEqual([{ id: 'physical', kind: 'layer' }]);
    expect(sourceDrafts.getSnapshot().drafts.topology).toBe('graph: [');
    expect(stylesheetCandidate.getSnapshot().candidateText).toBe('stylesheet: [');
    expect(dispatcher.canUndo()).toBe(true);
    sourceDrafts.clear('topology');
    stylesheetCandidate.revert();
    host.saveProject = async () => ({ ok: true, value: { revision: 'saved-revision', savedAt: '2026-10-03T12:00:01Z' } });
    await capability().save();
    capability().undo();
    expect(session.snapshot()).toMatchObject({ project: { name: 'Renamed project', revision: 'saved-revision' }, status: 'modified' });
    capability().redo();
    expect(session.snapshot()).toMatchObject({ project: { name: 'Renamed project', revision: 'saved-revision' }, status: 'saved' });
    expect(session.snapshot().project.documents.topology.text).toContain('authored-source');
    stylesheetCandidate.dispose();
  });
});
