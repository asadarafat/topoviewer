import { describe, expect, it, vi } from 'vitest';
import { createStudioExportCapability } from '../../src/features/export/exportCapability';
import { MemoryStudioHost } from '../../src/hosts/memoryHost';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession, createStudioSourceDraftController } from '../../src/session';

function fixture() {
  const project = createStarterProject();
  project.documents.mapper = { kind: 'mapper', path: 'telemetry/mapper.yaml', contentHash: '', text: 'version: 1\nrules: []\n' };
  const session = createStudioDocumentSession(project);
  const sourceDrafts = createStudioSourceDraftController();
  const host = new MemoryStudioHost();
  const exportArtifact = vi.spyOn(host, 'exportArtifact');
  const applyStylesheetCandidate = vi.fn(() => true);
  const setError = vi.fn();
  const announce = vi.fn();
  const capability = createStudioExportCapability({ announce, applyStylesheetCandidate, host, session, setError, sourceDrafts });
  return { announce, applyStylesheetCandidate, capability, exportArtifact, session, setError, sourceDrafts };
}

describe('Studio export source consistency', () => {
  it.each(['topology', 'mapper'] as const)('blocks direct mapper and general export for an unapplied %s draft', async (document) => {
    const { announce, applyStylesheetCandidate, capability, exportArtifact, session, setError, sourceDrafts } = fixture();
    const base = session.snapshot().project.documents[document]!.text;
    sourceDrafts.replace(document, `${base}# new work\n`, base);
    expect(await capability.exportMapper()).toBe(false);
    expect(capability.prepareExport()).toBe(false);
    expect(exportArtifact).not.toHaveBeenCalled();
    expect(applyStylesheetCandidate).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith(`Apply or revert the ${document} source draft before exporting.`);
    expect(announce).not.toHaveBeenCalledWith('Mapper exported');
    expect(sourceDrafts.getSnapshot().drafts[document]).toContain('# new work');
  });

  it.each(['topology', 'mapper'] as const)('blocks a recovered invalid %s draft even without an editor draft', async (document) => {
    const { capability, exportArtifact, session } = fixture();
    expect(session.replaceDraft(document, 'invalid: [').status).toBe('invalid');
    expect(await capability.exportMapper()).toBe(false);
    expect(capability.prepareExport()).toBe(false);
    expect(exportArtifact).not.toHaveBeenCalled();
  });

  it('exports the accepted mapper after a draft is applied and cleared', async () => {
    const { capability, exportArtifact, session, sourceDrafts } = fixture();
    const base = session.snapshot().project.documents.mapper!.text;
    const accepted = `${base}# newly accepted content\n`;
    sourceDrafts.replace('mapper', accepted, base);
    expect(await capability.exportMapper()).toBe(false);
    expect(session.replaceDraft('mapper', accepted).status).toBe('applied');
    sourceDrafts.clear('mapper');
    expect(await capability.exportMapper()).toBe(true);
    expect(exportArtifact).toHaveBeenCalledOnce();
    const request = exportArtifact.mock.calls[0][0];
    expect(request.suggestedName).toBe('mapper.yaml');
    expect(new TextDecoder().decode(request.artifact!.bytes)).toBe(accepted);
  });

  it('retains stylesheet validation for exports', async () => {
    const { applyStylesheetCandidate, capability, exportArtifact } = fixture();
    applyStylesheetCandidate.mockReturnValue(false);
    expect(await capability.exportMapper()).toBe(false);
    expect(exportArtifact).not.toHaveBeenCalled();
  });
});
