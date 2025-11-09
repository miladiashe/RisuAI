/**
 * Export settings with ZIP, module assets, persona icons, and SW cache fallback
 */

import JSZip from 'jszip';
import { createStorage } from './storage';
import { createLoadingOverlay, updateLoadingProgress, removeLoadingOverlay } from './ui';
export async function exportSettings() {
    console.log('Settings Backup v3: Starting export...');
    const overlay = createLoadingOverlay('💾 Exporting Settings');

    try {
        // @ts-ignore - getDatabase is a global function provided by RisuAI
        const db = getDatabase();

        // Collect module assets
        const moduleAssets: { [moduleId: string]: any[] } = {};
        if (db.modules && Array.isArray(db.modules)) {
            console.log(`Total modules: ${db.modules.length}`);
            for (const module of db.modules) {
                if (module.assets && Array.isArray(module.assets)) {
                    moduleAssets[module.id] = module.assets;
                    console.log(`Module ${module.id}: ${module.assets.length} assets`);
                }
            }
            console.log(`Modules with assets: ${Object.keys(moduleAssets).length}`);
        }

        // Collect persona icons
        const personaIcons: Array<{ index: number; name: string; icon: string }> = [];
        if (db.personas && Array.isArray(db.personas)) {
            for (let i = 0; i < db.personas.length; i++) {
                const persona = db.personas[i];
                if (persona.icon && persona.icon.startsWith('assets/')) {
                    personaIcons.push({
                        index: i,
                        name: persona.name || `Persona ${i}`,
                        icon: persona.icon
                    });
                }
            }
            console.log(`Personas with icons: ${personaIcons.length}`);
        }

        // Create settings backup (without characters and module assets)
        const settingsBackup = { ...db };
        delete settingsBackup.characters;
        delete settingsBackup.characterOrder;

        // Remove assets from modules in settings backup
        if (settingsBackup.modules && Array.isArray(settingsBackup.modules)) {
            settingsBackup.modules = settingsBackup.modules.map((module: any) => {
                const { assets, ...moduleWithoutAssets } = module;
                return moduleWithoutAssets;
            });
        }

        // Add export metadata
        (settingsBackup as any).exportDate = new Date().toISOString();
        (settingsBackup as any).exportVersion = '3.0.0';
        (settingsBackup as any).pluginName = 'settingsbackup-v3';

        // Create ZIP
        const zip = new JSZip();
        const jsonString = JSON.stringify(settingsBackup, null, 2);
        zip.file("settings.json", jsonString);

        // Export module assets
        const assetsFolder = zip.folder("module-assets");
        if (assetsFolder) {
            const storage = createStorage();
            const totalAssets = Object.values(moduleAssets).reduce((sum, assets) => sum + assets.length, 0);
            let processedAssets = 0;

            console.log(`Processing ${totalAssets} module assets...`);

            for (const [moduleId, assets] of Object.entries(moduleAssets)) {
                const moduleFolder = assetsFolder.folder(moduleId);
                if (!moduleFolder) {
                    console.warn(`Failed to create folder for module: ${moduleId}`);
                    continue;
                }

                for (let i = 0; i < assets.length; i++) {
                    processedAssets++;
                    updateLoadingProgress(processedAssets, totalAssets, "Processing module assets");

                    try {
                        const asset = assets[i];
                        if (!asset || !Array.isArray(asset)) continue;

                        const [assetId, storageKey, assetExt] = asset;

                        if (!assetId || !storageKey) {
                            console.warn(`Skipping invalid asset: ${moduleId}-${i}`);
                            continue;
                        }

                        // Get data from storage (with SW cache fallback!)
                        const assetData = await storage.getItem(storageKey);

                        if (!assetData) {
                            console.warn(`❌ Asset not found: ${storageKey} (not in storage or SW cache)`);
                            continue;
                        }

                        // Convert to base64
                        let base64Data: string;
                        if (assetData instanceof Uint8Array || assetData instanceof ArrayBuffer) {
                            const uint8Array = assetData instanceof ArrayBuffer ? new Uint8Array(assetData) : assetData;
                            const binaryString = Array.from(uint8Array)
                                .map((byte) => String.fromCharCode(byte))
                                .join("");
                            base64Data = btoa(binaryString);
                        } else if (typeof assetData === 'string') {
                            if (assetData.startsWith('data:')) {
                                const parts = assetData.split(',');
                                if (parts.length < 2) continue;
                                base64Data = parts[1];
                            } else {
                                base64Data = assetData;
                            }
                        } else {
                            console.warn(`Unknown data format for ${moduleId}-${i}`);
                            continue;
                        }

                        // Add to ZIP - check if extension already in assetId
                        const ext = assetExt || 'png';
                        const filename = assetId.endsWith(`.${ext}`) ? assetId : `${assetId}.${ext}`;
                        moduleFolder.file(filename, base64Data, { base64: true });
                        console.log(`✓ [${processedAssets}/${totalAssets}] ${moduleId}/${filename}`);

                    } catch (error) {
                    }
                }
            }

            console.log(`Completed processing ${processedAssets} module assets`);
        }

        // Export persona icons
        if (personaIcons.length > 0) {
            console.log(`Processing ${personaIcons.length} persona icons...`);
            const personaFolder = zip.folder("persona-icons");

            if (personaFolder) {
                const storage = createStorage();
                let processedIcons = 0;

                for (const personaInfo of personaIcons) {
                    processedIcons++;
                    updateLoadingProgress(processedIcons, personaIcons.length, "Processing persona icons");

                    try {
                        const storageKey = personaInfo.icon;
                        const iconData = await storage.getItem(storageKey);

                        if (!iconData) {
                            console.warn(`❌ Persona icon not found: ${storageKey}`);
                            continue;
                        }

                        // Convert to base64
                        let base64Data: string;
                        if (iconData instanceof Uint8Array || iconData instanceof ArrayBuffer) {
                            const uint8Array = iconData instanceof ArrayBuffer ? new Uint8Array(iconData) : iconData;
                            const binaryString = Array.from(uint8Array)
                                .map((byte) => String.fromCharCode(byte))
                                .join("");
                            base64Data = btoa(binaryString);
                        } else if (typeof iconData === 'string') {
                            if (iconData.startsWith('data:')) {
                                const parts = iconData.split(',');
                                if (parts.length < 2) continue;
                                base64Data = parts[1];
                            } else {
                                base64Data = iconData;
                            }
                        } else {
                            console.warn(`Unknown icon format for persona ${personaInfo.index}`);
                            continue;
                        }

                        const filename = `persona-${personaInfo.index}.png`;
                        personaFolder.file(filename, base64Data, { base64: true });
                        console.log(`✓ [${processedIcons}/${personaIcons.length}] ${filename} (${personaInfo.name})`);

                    } catch (error) {
                        console.warn(`Error processing persona icon ${personaInfo.index}:`, error);
                    }
                }

                console.log(`Completed processing ${processedIcons} persona icons`);
            }
        }

        // Generate ZIP file
        updateLoadingProgress(1, 1, "Generating ZIP file");
        const zipBlob = await zip.generateAsync({ type: "blob" });

        // Download with fallback strategies
        const filename = `risuai-settings-v3-${new Date().toISOString().split('T')[0]}.zip`;
        let downloadSuccessful = false;

        // Strategy 1: Web Share API (mobile HTTPS, Tauri)
        if (navigator.share) {
            try {
                const file = new File([zipBlob], filename, { type: 'application/zip' });

                // Try canShare if available, otherwise just try share
                const canShareFiles = navigator.canShare
                    ? navigator.canShare({ files: [file] })
                    : true; // Assume it can share if canShare not available

                if (canShareFiles) {
                    await navigator.share({
                        files: [file],
                        title: 'RisuAI Settings Backup',
                        text: 'Settings backup file'
                    });
                    downloadSuccessful = true;
                    console.log('Settings Backup v3: Exported via Web Share API');
                }
            } catch (error) {
                // User cancelled or share failed
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log('User cancelled share');
                    downloadSuccessful = true; // Don't fallback if user cancelled
                } else {
                    console.warn('Web Share API failed, trying fallback:', error);
                }
            }
        }

        // Strategy 2: a.click() download (desktop, most browsers)
        if (!downloadSuccessful) {
            try {
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);

                // Try multiple trigger methods for compatibility
                if (a.click) {
                    a.click();
                } else {
                    // Fallback for older browsers
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    a.dispatchEvent(clickEvent);
                }

                // Clean up after delay (mobile browsers need time)
                setTimeout(() => {
                    if (a.parentElement) {
                        document.body.removeChild(a);
                    }
                    URL.revokeObjectURL(url);
                }, 3000); // Increased to 3 seconds for slow mobile networks

                downloadSuccessful = true;
                console.log('Settings Backup v3: Exported via a.click()');
            } catch (error) {
                console.warn('a.click() download failed, trying window.open:', error);
            }
        }

        // Strategy 3: window.open() (last resort)
        if (!downloadSuccessful) {
            try {
                const url = URL.createObjectURL(zipBlob);
                const opened = window.open(url, '_blank');

                if (!opened) {
                    // Popup blocked, try direct navigation
                    window.location.href = url;
                }

                setTimeout(() => URL.revokeObjectURL(url), 3000);
                downloadSuccessful = true;
                console.log('Settings Backup v3: Exported via window.open()');
            } catch (error) {
                console.error('All download methods failed:', error);
                removeLoadingOverlay();
                alert('❌ Download failed. Your browser may be blocking downloads. Please check browser settings or try a different browser.');
                return;
            }
        }

        removeLoadingOverlay();
        console.log('Settings Backup v3: Export successful!');

        // Show appropriate message based on method used
        if (navigator.share && downloadSuccessful) {
            // Likely used Web Share API - don't show alert as share dialog already appeared
            console.log('Export completed via share dialog');
        } else {
            alert('✅ Settings exported successfully!\n\nCheck your Downloads folder for the ZIP file.');
        }

    } catch (error) {
        removeLoadingOverlay();
        console.error('Settings Backup v3: Export failed', error);
        alert('❌ Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
