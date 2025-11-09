/**
 * ResuAI - RisuAI Settings Backup & Restore Plugin
 *
 * Resume your AI journey anytime, anywhere
 *
 * Features:
 * - Export/Import settings as ZIP snapshots
 * - Cross-platform support (Web, Tauri, Capacitor)
 * - Service Worker cache recovery
 * - Module assets with proper folder structure
 * - Persona profile icons
 */

import { exportSettings } from './export';
import { importSettings } from './import';
import { createUI } from './ui';

console.log('ResuAI: Initializing...');

// Test getFileSrc availability
console.log('[Test] Checking getFileSrc availability...');
console.log('[Test] globalThis.getFileSrc:', typeof (globalThis as any).getFileSrc);
console.log('[Test] window.getFileSrc:', typeof (window as any).getFileSrc);
console.log('[Test] globalThis.__pluginApis__:', typeof (globalThis as any).__pluginApis__);

if ((globalThis as any).getFileSrc) {
    console.log('✅ [Test] getFileSrc found in globalThis!');
} else if ((window as any).getFileSrc) {
    console.log('✅ [Test] getFileSrc found in window!');
} else {
    console.log('❌ [Test] getFileSrc NOT FOUND');
}

// Create floating UI with Export/Import buttons
const uiContainer = createUI({
    onExport: exportSettings,
    onImport: importSettings
});

// Cleanup on plugin unload
onUnload(() => {
    console.log('ResuAI: Cleaning up...');
    if (document.body.contains(uiContainer)) {
        document.body.removeChild(uiContainer);
    }
});

console.log('ResuAI: Initialized successfully!');
