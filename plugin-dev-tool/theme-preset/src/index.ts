/**
 * Theme Preset Manager Plugin for RisuAI
 *
 * A modular, TypeScript-based plugin for managing theme presets
 * with automatic character-based theme switching.
 */

import { INIT_DELAY } from './constants';
import { getShortcut, isShortcutMatch } from './shortcuts';
import { initAutoSwitch, stopAutoSwitch } from './auto-switch';
import { createFloatingWindow, toggleFloatingWindow, cleanupUI, ensureSettingsButton, setupSettingsObserver } from './ui';

console.log('🎨 Theme Preset Manager: Initializing...');

// MutationObserver instance
let settingsObserver: MutationObserver | null = null;

// Setup keyboard shortcut handler
function setupKeyboardShortcut(): void {
    const shortcut = getShortcut();
    console.log(`🎨 Keyboard shortcut configured: ${shortcut}`);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
        // Debug logging - show ALL keys with modifiers
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
            console.log(`🔑 Key: "${e.key}" (code: ${e.code}), Ctrl: ${e.ctrlKey}, Meta: ${e.metaKey}, Alt: ${e.altKey}, Shift: ${e.shiftKey}`);
        }

        if (isShortcutMatch(e, shortcut)) {
            console.log('✅ Shortcut matched!');
            e.preventDefault();
            toggleFloatingWindow();
        }
    });
}

// Initialize plugin
function init(): void {
    // Create the floating window (hidden initially)
    createFloatingWindow();

    // Setup keyboard shortcut
    setupKeyboardShortcut();

    // Initialize auto-switch if enabled
    initAutoSwitch();

    // Add button to Display Settings
    ensureSettingsButton();

    // Watch for DOM changes to re-inject button if needed
    settingsObserver = setupSettingsObserver();

    console.log('🎨 Theme Preset Manager: Ready!');
    console.log(`   Press ${getShortcut()} to open the theme manager`);
}

// Delayed initialization to ensure RisuAI is fully loaded
setTimeout(() => {
    init();
}, INIT_DELAY);

// Cleanup on plugin unload
onUnload(() => {
    console.log('🎨 Theme Preset Manager: Cleaning up...');
    stopAutoSwitch();
    cleanupUI();

    // Disconnect observer
    if (settingsObserver) {
        settingsObserver.disconnect();
    }
});
