/**
 * RisuAI Settings Backup & Restore Plugin
 *
 * Exports and imports all RisuAI settings (excluding characters) as JSON.
 * Useful for:
 * - Transferring settings between devices
 * - Backing up configurations
 * - Quick settings restore
 */

import { exportSettings } from './export';
import { importSettings } from './import';
import { createUI } from './ui';

console.log('Settings Backup Plugin: Initializing...');

// Create floating UI with Export/Import buttons
createUI({
    onExport: exportSettings,
    onImport: importSettings
});

// Cleanup on plugin unload
onUnload(() => {
    console.log('Settings Backup Plugin: Cleaning up...');
    // UI cleanup will be handled in ui.ts
});

console.log('Settings Backup Plugin: Initialized successfully!');
