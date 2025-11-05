import type { PluginConfig } from '../types/plugin-config';

const config: PluginConfig = {
    // Plugin identifier (required)
    name: 'settingsbackup',

    // Display name shown in UI (optional)
    displayName: 'Settings Backup & Restore',

    // Plugin arguments (optional)
    arguments: {},

    // Plugin links (optional)
    links: [
        {
            url: 'https://github.com/miladiashe/risuai-plugin-builder',
            hoverText: 'Plugin Builder Repository'
        }
    ]
};

export default config;
