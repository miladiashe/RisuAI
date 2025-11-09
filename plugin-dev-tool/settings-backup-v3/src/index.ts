/**
 * RisuAI Settings Backup & Restore Plugin v3
 *
 * Features:
 * - Export/Import settings as ZIP
 * - Include module assets with proper folder structure
 * - Include persona profile icons
 * - Service Worker cache fallback for missing assets
 */

import { exportSettings } from './export';
import { importSettings } from './import';
import { createUI } from './ui';

console.log('Settings Backup v3: Initializing...');

// Create floating UI with Export/Import buttons
const uiContainer = createUI({
    onExport: exportSettings,
    onImport: importSettings
});

// Cleanup on plugin unload
onUnload(() => {
    console.log('Settings Backup v3: Cleaning up...');
    if (document.body.contains(uiContainer)) {
        document.body.removeChild(uiContainer);
    }
});

console.log('Settings Backup v3: Initialized successfully!');
