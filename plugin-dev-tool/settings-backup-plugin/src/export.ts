/**
 * Export settings functionality
 */

export function exportSettings() {
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
        alert('❌ Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
