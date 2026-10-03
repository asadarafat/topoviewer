import type { StudioHostKind } from '../../contracts/host';
import type { StudioProjectActivationGate } from './ProjectMenu';

export function openStudioProjectFolder(
  hostKind: StudioHostKind,
  openFolder: (activate?: StudioProjectActivationGate) => Promise<void>,
  guard: StudioProjectActivationGate
): Promise<void> {
  // Desktop opening changes the shared native authority. Resolve the current
  // session before invoking it. Browser picking needs the original user gesture
  // and only creates a separate project, so its activation can be guarded later.
  return hostKind === 'desktop'
    ? guard(() => openFolder())
    : openFolder(guard);
}
