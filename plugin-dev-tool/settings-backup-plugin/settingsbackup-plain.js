//@name settingsbackup
//@display-name Settings Backup & Restore
//@link https://github.com/miladiashe/risuai-plugin-builder Plugin Builder Repository

/**
 * RisuAI Settings Backup & Restore Plugin
 * Plain JavaScript version - no bundling needed
 */

console.log('Settings Backup Plugin: Initializing...');

// Debug: Check if functions are available
console.log('Debug: typeof getDatabase =', typeof getDatabase);
console.log('Debug: typeof setDatabase =', typeof setDatabase);
console.log('Debug: typeof onUnload =', typeof onUnload);

// Export Settings Function
function exportSettings() {
    console.log('Settings Backup: Exporting settings...');

    try {
        // Get current database
        const db = getDatabase();

        // Create a copy excluding characters
        const settingsBackup = {
            ...db,
            characters: undefined, // Exclude characters array
            exportDate: new Date().toISOString(),
            exportVersion: '1.0.0',
            pluginName: 'settingsbackup'
        };

        // Remove undefined to clean up JSON
        delete settingsBackup.characters;

        // Convert to JSON
        const jsonString = JSON.stringify(settingsBackup, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `risuai-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Cleanup
        URL.revokeObjectURL(url);

        console.log('Settings Backup: Export successful!');
        alert('✅ Settings exported successfully!');

    } catch (error) {
        console.error('Settings Backup: Export failed', error);
        alert('❌ Export failed: ' + (error instanceof Error ? error.message : String(error)));
    }
}

// Import Settings Function
function importSettings() {
    console.log('Settings Backup: Importing settings...');

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            // Debug: Check if functions are available in async context
            console.log('Debug (async): typeof getDatabase =', typeof getDatabase);
            console.log('Debug (async): typeof setDatabase =', typeof setDatabase);

            // Read file
            const text = await file.text();
            const importedSettings = JSON.parse(text);

            // Validate that this is a settings backup
            if (!importedSettings.pluginName || importedSettings.pluginName !== 'settingsbackup') {
                throw new Error('Invalid settings file. This does not appear to be a RisuAI settings backup.');
            }

            // Confirm import
            const confirmed = confirm(
                '⚠️ Import Settings?\n\n' +
                'This will replace your current settings (excluding characters).\n\n' +
                'Export Date: ' + (importedSettings.exportDate || 'Unknown') + '\n' +
                'Version: ' + (importedSettings.exportVersion || 'Unknown') + '\n\n' +
                'Continue?'
            );

            if (!confirmed) {
                console.log('Settings Backup: Import cancelled by user');
                return;
            }

            // Get current database
            const db = getDatabase();

            // Preserve current characters
            const currentCharacters = db.characters;

            // Remove export metadata
            delete importedSettings.exportDate;
            delete importedSettings.exportVersion;
            delete importedSettings.pluginName;

            // Merge imported settings with current characters
            const mergedDb = {
                ...importedSettings,
                characters: currentCharacters
            };

            // Save merged database
            setDatabase(mergedDb);

            console.log('Settings Backup: Import successful!');
            alert('✅ Settings imported successfully!\n\n⚠️ Please refresh the page to apply changes.');

        } catch (error) {
            console.error('Settings Backup: Import failed', error);
            alert('❌ Import failed: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    // Trigger file picker
    input.click();
}

// Create UI
let container = null;

function createUI() {
    // Create container
    container = document.createElement('div');
    container.id = 'settings-backup-ui';
    container.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Export Settings';
    exportBtn.style.cssText = `
        padding: 12px 20px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    exportBtn.onmouseenter = () => {
        exportBtn.style.background = '#059669';
        exportBtn.style.transform = 'translateY(-2px)';
        exportBtn.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
    };
    exportBtn.onmouseleave = () => {
        exportBtn.style.background = '#10b981';
        exportBtn.style.transform = 'translateY(0)';
        exportBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    };
    exportBtn.onclick = exportSettings;

    // Import button
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Import Settings';
    importBtn.style.cssText = `
        padding: 12px 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    importBtn.onmouseenter = () => {
        importBtn.style.background = '#2563eb';
        importBtn.style.transform = 'translateY(-2px)';
        importBtn.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
    };
    importBtn.onmouseleave = () => {
        importBtn.style.background = '#3b82f6';
        importBtn.style.transform = 'translateY(0)';
        importBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    };
    importBtn.onclick = importSettings;

    // Add buttons to container
    container.appendChild(exportBtn);
    container.appendChild(importBtn);

    // Add to page
    document.body.appendChild(container);

    console.log('Settings Backup: UI created');
}

function cleanupUI() {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        container = null;
        console.log('Settings Backup: UI cleaned up');
    }
}

// Initialize
createUI();

// Cleanup on plugin unload
onUnload(() => {
    cleanupUI();
    console.log('Settings Backup Plugin: Cleaning up...');
});

console.log('Settings Backup Plugin: Initialized successfully!');
