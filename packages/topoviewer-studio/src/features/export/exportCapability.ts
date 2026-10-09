import type { StudioHost } from '../../contracts/host';
import type { StudioDocumentSession, StudioSourceDraftController } from '../../session';

interface StudioExportCapabilityOptions {
  announce(message: string): void;
  applyStylesheetCandidate(): boolean;
  host: StudioHost;
  session: StudioDocumentSession;
  sourceDrafts: StudioSourceDraftController;
  setError(message?: string): void;
}

export function createStudioExportCapability({
  announce,
  applyStylesheetCandidate,
  host,
  session,
  sourceDrafts,
  setError
}: StudioExportCapabilityOptions) {
  function prepareExport() {
    const current = session.snapshot();
    const drafts = sourceDrafts.getSnapshot().drafts;
    const blocked = (['topology', 'mapper'] as const).find((document) => drafts[document] !== undefined || current.invalidDrafts[document]);
    if (blocked) {
      const message = `Apply or revert the ${blocked} source draft before exporting.`;
      setError(message);
      announce(message);
      return false;
    }
    return applyStylesheetCandidate();
  }

  return {
    prepareExport,
    async exportMapper() {
      if (!prepareExport()) return false;
      const mapper = session.snapshot().project.documents.mapper;
      if (!mapper) return false;
      const result = await host.exportArtifact({
        artifact: {
          bytes: new TextEncoder().encode(mapper.text),
          mediaType: 'application/yaml',
          name: mapper.path.split('/').at(-1) || 'mapper.yaml'
        },
        kind: 'files',
        suggestedName: mapper.path.split('/').at(-1) || 'mapper.yaml'
      });
      if (!result.ok) {
        const message = `Mapper export failed: ${result.error.message}`;
        setError(message);
        announce(message);
        return false;
      }
      setError(undefined);
      announce('Mapper exported');
      return true;
    }
  };
}
