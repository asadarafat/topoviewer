import { describe, expect, it } from 'vitest';
import { openStudioProjectFolder } from '../../src/features/projects/projectLifecycle';

describe('project folder activation', () => {
  it('keeps native authority unchanged when the style-resolution guard cancels', async () => {
    let activeProject = 'old-project';
    let pending: (() => Promise<void>) | undefined;
    await openStudioProjectFolder('desktop', async () => {
      activeProject = 'new-project';
    }, async (activate) => { pending = activate; });

    expect(pending).toBeTypeOf('function');
    expect(activeProject).toBe('old-project');
    pending = undefined; // Cancel the pending dialog.
    expect(activeProject).toBe('old-project');
  });

  it('flushes recovery under the old native authority before opening the new folder', async () => {
    let activeProject = 'old-project';
    const recoveries: string[] = [];
    await openStudioProjectFolder('desktop', async () => {
      activeProject = 'new-project';
    }, async (activate) => {
      await Promise.resolve();
      recoveries.push(activeProject);
      await activate();
    });
    expect(recoveries).toEqual(['old-project']);
    expect(activeProject).toBe('new-project');
  });

  it('starts the browser picker immediately and guards only activation', async () => {
    const events: string[] = [];
    const opening = openStudioProjectFolder('browser', async (activate) => {
      events.push('picker');
      await Promise.resolve();
      await activate!(async () => { events.push('activate'); });
    }, async (activate) => {
      events.push('recovery');
      await activate();
    });
    expect(events).toEqual(['picker']);
    await opening;
    expect(events).toEqual(['picker', 'recovery', 'activate']);
  });
});
