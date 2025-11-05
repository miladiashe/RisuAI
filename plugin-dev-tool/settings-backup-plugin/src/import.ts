/**
 * Import settings functionality
 */

export function importSettings() {
    console.log('Settings Backup: Importing settings...');

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
            return;
        }

        try {
            // Read file
            const text = await file.text();
            const importedSettings = JSON.parse(text);

            // Validate that this is a settings backup
            if (!importedSettings.pluginName || importedSettings.pluginName !== 'settingsbackup') {
                throw new Error('Invalid settings file. This does not appear to be a RisuAI settings backup.');
            }

            // Confirm import
            const confirmed = confirm(
                `⚠️ Import Settings?\n\n` +
                `This will replace your current settings (excluding characters).\n\n` +
                `Export Date: ${importedSettings.exportDate || 'Unknown'}\n` +
                `Version: ${importedSettings.exportVersion || 'Unknown'}\n\n` +
                `Continue?`
            );

            if (!confirmed) {
                console.log('Settings Backup: Import cancelled by user');
                return;
            }

            // Get current database
            const db = (globalThis as any).getDatabase();

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
            (globalThis as any).setDatabase(mergedDb);

            console.log('Settings Backup: Import successful!');
            alert('✅ Settings imported successfully!\n\n⚠️ Please refresh the page to apply changes.');

        } catch (error) {
            console.error('Settings Backup: Import failed', error);
            alert('❌ Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Trigger file picker
    input.click();
}
