import { describe, expect, it, vi } from 'vitest';
import type { StudioCommand, StudioSourceMutation } from '../../src/contracts/commands';
import type { StudioSourceDraftRecovery } from '../../src/contracts/project';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioProjectCapability } from '../../src/features/projects/projectCapability';
import { createStudioCandidateStyleActions } from '../../src/features/styles/stylesheetCandidateActions';
import { MemoryStudioHost } from '../../src/hosts/memoryHost';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession, createStudioSourceDraftController, createStylesheetCandidateController } from '../../src/session';

function fixture(recovery?: StudioSourceDraftRecovery) {
  const project = createStarterProject({ template: 'backbone' });
  project.documents.mapper = {
    kind: 'mapper', path: 'mapper.yaml', contentHash: '',
    text: 'version: 1\nrules:\n  - id: health\n    metric: node_up\n    select: node[id = "edge-01"]\n    join: node_id\n'
  };
  const session = createStudioDocumentSession(project);
  const sourceDrafts = createStudioSourceDraftController(recovery);
  const dispatcher = createStudioCommandDispatcher(session, { sourceDrafts: () => sourceDrafts.getSnapshot().drafts });
  const candidate = createStylesheetCandidateController({
    appliedSourceRevision: session.snapshot().projection.sourceRevision,
    appliedStylesheetText: project.documents.stylesheet.text,
    topologyText: project.documents.topology.text
  });
  const setError = vi.fn();
  const announce = vi.fn();
  const execute = (command: StudioCommand) => {
    try { dispatcher.dispatch(command); return true; }
    catch (error) { setError((error as Error).message); return false; }
  };
  const actions = createStudioCandidateStyleActions({
    announce, candidate, execute, normalizationReviewOwner: { current: 'session' },
    refresh: vi.fn(), session, setError, setNormalizationReview: vi.fn()
  });
  const projectActions = createStudioProjectCapability({
    announce, applyStylesheetCandidate: () => true, dispatcher, host: new MemoryStudioHost(),
    onReload: async () => undefined, refresh: vi.fn(), session, setError, sourceDrafts,
    stylesheetCandidate: candidate, synchronizeAfterHistory: vi.fn()
  });
  const dispatch = (mutation: StudioSourceMutation) => dispatcher.dispatch({
    id: 'edit', label: 'Edit', execute: () => ({ mutations: [mutation], summary: 'Edit' })
  });
  const draft = (document: 'topology' | 'mapper', text?: string) => {
    const base = session.snapshot().project.documents[document]!.text;
    sourceDrafts.replace(document, text ?? `${base}# unapplied work\n`, base);
  };
  return { actions, announce, dispatch, dispatcher, draft, projectActions, session, setError, sourceDrafts };
}

const drag: StudioSourceMutation = { kind: 'set-value', document: 'topology', path: ['graph', 'nodes', 0, 'position', 0], value: 700 };

describe('Studio unapplied source guards', () => {
  it('prevents a visual drag from being silently overwritten when a topology draft is applied', () => {
    const { actions, dispatch, dispatcher, draft, session, sourceDrafts } = fixture();
    const base = session.snapshot();
    const text = base.project.documents.topology.text.replace('NOC Controller', 'Draft title');
    draft('topology', text);
    expect(() => dispatch(drag)).toThrow(/Apply or revert the unapplied topology source/);
    expect(session.snapshot()).toBe(base);
    expect(dispatcher.historyState().undoEntries).toBe(0);
    expect(actions.applySourceDraft('topology', text)).toBe(true);
    sourceDrafts.clear('topology');
    expect(session.snapshot().project.documents.topology.text).toContain('Draft title');
    dispatch(drag);
    expect(session.snapshot().projection.document.graph?.nodes?.[0].position).toEqual([700, 326]);
    expect(session.snapshot().project.documents.topology.text).toContain('Draft title');
  });

  it.each<StudioSourceMutation>([
    { kind: 'set-value', document: 'mapper', path: ['rules', 0, 'metric'], value: 'new_metric' },
    { kind: 'remove-document', document: 'mapper' },
    { kind: 'replace-source', document: 'mapper', text: 'version: 1\nrules: []\n' }
  ])('protects a mapper draft from $kind commands', (mutation) => {
    const { dispatch, draft, session, sourceDrafts } = fixture();
    draft('mapper');
    const before = session.snapshot();
    const savedDraft = sourceDrafts.getSnapshot();
    expect(() => dispatch(mutation)).toThrow(/unapplied mapper source/);
    expect(session.snapshot()).toBe(before);
    expect(sourceDrafts.getSnapshot()).toBe(savedDraft);
  });

  it('allows unrelated stylesheet edits and explicit mapper Apply', () => {
    const { actions, dispatch, draft, session, sourceDrafts } = fixture();
    const text = session.snapshot().project.documents.mapper!.text.replace('node_up', 'node_health');
    draft('mapper', text);
    dispatch({ kind: 'set-value', document: 'stylesheet', path: ['layout', 'width'], value: 1400 });
    expect(actions.applySourceDraft('mapper', sourceDrafts.getSnapshot().drafts.mapper!)).toBe(true);
    expect(session.snapshot().project.documents.mapper!.text).toContain('node_health');
    expect(session.snapshot().project.documents.stylesheet.text).toContain('width: 1400');
  });

  it('applies a topology ID rename atomically but protects another pending mapper draft', () => {
    const { actions, draft, session, sourceDrafts } = fixture();
    const before = session.snapshot();
    const text = before.project.documents.topology.text.replace('id: edge-01\n', 'id: router-01\n');
    draft('topology', text);
    draft('mapper');
    expect(actions.applySourceDraft('topology', text)).toBe(false);
    expect(session.snapshot()).toBe(before);
    expect(sourceDrafts.getSnapshot().drafts.topology).toBe(text);
    sourceDrafts.clear('mapper');
    expect(actions.applySourceDraft('topology', text)).toBe(true);
    expect(session.snapshot().project.documents.mapper!.text).toContain('node[id = "router-01"]');
    expect(session.snapshot().project.documents.topology.text).toContain('source: router-01');
  });

  it('guards undo and redo before consuming history, then resumes after draft revert', () => {
    const { dispatch, dispatcher, draft, session, sourceDrafts } = fixture();
    dispatch(drag);
    draft('topology');
    const edited = session.snapshot();
    expect(() => dispatcher.undo()).toThrow(/unapplied topology source/);
    expect(session.snapshot()).toBe(edited);
    expect(dispatcher.historyState()).toMatchObject({ undoEntries: 1, redoEntries: 0 });
    sourceDrafts.clear('topology');
    dispatcher.undo();
    draft('topology');
    const undone = session.snapshot();
    expect(() => dispatcher.redo()).toThrow(/unapplied topology source/);
    expect(session.snapshot()).toBe(undone);
    expect(dispatcher.historyState()).toMatchObject({ undoEntries: 0, redoEntries: 1 });
    sourceDrafts.clear('topology');
    dispatcher.redo();
    expect(session.snapshot().projection.document.graph?.nodes?.[0].position).toEqual([700, 326]);
  });

  it('allows history affecting only a different document', () => {
    const { dispatch, dispatcher, draft, session } = fixture();
    dispatch({ kind: 'set-value', document: 'stylesheet', path: ['layout', 'width'], value: 1400 });
    draft('topology');
    dispatcher.undo();
    expect(session.snapshot().project.documents.stylesheet.text).toContain('width: 1280');
    dispatcher.redo();
    expect(session.snapshot().project.documents.stylesheet.text).toContain('width: 1400');
  });

  it('announces a blocked history action through the application capability', () => {
    const { announce, dispatch, draft, projectActions, setError } = fixture();
    dispatch(drag);
    draft('topology');
    expect(() => projectActions.undo()).not.toThrow();
    expect(setError).toHaveBeenCalledWith(expect.stringContaining('unapplied topology source'));
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Apply or revert'));
  });

  it('protects drafts recovered after restart without needing an editor render', () => {
    const { dispatch } = fixture({ topology: '# recovered work\ngraph: {}\n' });
    expect(() => dispatch(drag)).toThrow(/unapplied topology source/);
  });

  it.each(['undo', 'redo'] as const)('protects an applied invalid draft during %s after editor reconciliation', (direction) => {
    const { actions, dispatch, dispatcher, draft, projectActions, session, sourceDrafts } = fixture();
    dispatch(drag);
    if (direction === 'redo') dispatcher.undo();
    const invalidText = 'graph:\n  nodes: [unfinished';
    draft('topology', invalidText);
    expect(actions.applySourceDraft('topology', invalidText)).toBe(false);
    sourceDrafts.reconcile('topology', session.snapshot().invalidDrafts.topology!.text);
    expect(sourceDrafts.getSnapshot().dirty).toBe(false);
    const before = session.snapshot();
    const history = dispatcher.historyState();
    expect(() => dispatcher[direction]()).toThrow(/Apply or revert the invalid topology draft/);
    expect(session.snapshot()).toBe(before);
    expect(session.snapshot().invalidDrafts.topology!.text).toBe(invalidText);
    expect(dispatcher.historyState()).toEqual(history);
    projectActions.discardInvalidDraft('topology');
    expect(dispatcher[direction]()).toBeDefined();
  });

  it('protects invalid text when unrelated stylesheet undo would restore a whole snapshot', () => {
    const { actions, dispatch, dispatcher, session } = fixture();
    dispatch({ kind: 'set-value', document: 'stylesheet', path: ['layout', 'width'], value: 1400 });
    const invalidText = 'graph:\n  nodes: [uncommitted';
    expect(actions.applySourceDraft('topology', invalidText)).toBe(false);
    const before = session.snapshot();
    expect(() => dispatcher.undo()).toThrow(/Apply or revert the invalid topology draft/);
    expect(session.snapshot()).toBe(before);
    expect(dispatcher.historyState().undoEntries).toBe(1);
  });

  it('does not replace newer invalid text with an older invalid draft captured by history', () => {
    const { actions, dispatch, dispatcher, session } = fixture();
    expect(actions.applySourceDraft('topology', 'graph: [older')).toBe(false);
    dispatch({ kind: 'set-value', document: 'stylesheet', path: ['layout', 'width'], value: 1400 });
    expect(actions.applySourceDraft('topology', 'graph: [newer')).toBe(false);
    const before = session.snapshot();
    expect(() => dispatcher.undo()).toThrow(/Apply or revert the invalid topology draft/);
    expect(session.snapshot()).toBe(before);
  });

  it.each<StudioSourceMutation>([
    { kind: 'remove-document', document: 'mapper' },
    { kind: 'replace-source', document: 'mapper', text: 'version: 1\nrules: []\n' }
  ])('protects a reconciled invalid mapper draft from $kind commands', (mutation) => {
    const { actions, dispatch, session } = fixture();
    expect(actions.applySourceDraft('mapper', 'rules: [unfinished')).toBe(false);
    const before = session.snapshot();
    expect(() => dispatch(mutation)).toThrow(/Apply or revert the invalid mapper draft/);
    expect(session.snapshot()).toBe(before);
    expect(actions.applySourceDraft('mapper', 'version: 1\nrules: []\n# corrected\n')).toBe(true);
  });
});
