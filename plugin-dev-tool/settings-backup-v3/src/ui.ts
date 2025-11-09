/**
 * UI helpers for loading overlays and buttons
 */

export function createLoadingOverlay(message: string): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.id = 'settings-backup-loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        flex-direction: column;
        justify-center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-size: 18px;
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = 'margin-bottom: 20px; font-size: 24px;';

    const progressEl = document.createElement('div');
    progressEl.id = 'export-loading-progress';
    progressEl.style.cssText = 'font-size: 16px; color: #aaa;';

    overlay.appendChild(messageEl);
    overlay.appendChild(progressEl);
    document.body.appendChild(overlay);

    return overlay;
}

export function updateLoadingProgress(current: number, total: number, message: string) {
    const progressEl = document.getElementById("export-loading-progress");
    if (progressEl) {
        progressEl.textContent = `${message} (${current}/${total})`;
    }
}

export function removeLoadingOverlay() {
    const overlay = document.getElementById('settings-backup-loading-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
}

export interface UIOptions {
    onExport: () => void;
    onImport: () => void;
}

export function createUI(options: UIOptions) {
    const container = document.createElement('div');
    container.id = 'settings-backup-v3-ui';
    container.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 10px;
        padding: 15px;
        background: rgba(76, 175, 80, 0.1);
        border: 2px dashed #4CAF50;
        border-radius: 8px;
    `;

    const pluginLabel = document.createElement('div');
    pluginLabel.textContent = '🔌 Plugin: Settings Backup v3';
    pluginLabel.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        font-weight: bold;
        color: #4CAF50;
        font-size: 13px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
    `;

    const buttonStyle = `
        padding: 10px 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
        transition: background 0.2s;
    `;

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Export';
    exportBtn.style.cssText = buttonStyle;
    exportBtn.onmouseenter = () => exportBtn.style.background = '#45a049';
    exportBtn.onmouseleave = () => exportBtn.style.background = '#4CAF50';
    exportBtn.onclick = options.onExport;

    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Import';
    importBtn.style.cssText = buttonStyle + 'background: #2196F3;';
    importBtn.onmouseenter = () => importBtn.style.background = '#1976D2';
    importBtn.onmouseleave = () => importBtn.style.background = '#2196F3';
    importBtn.onclick = options.onImport;

    buttonContainer.appendChild(exportBtn);
    buttonContainer.appendChild(importBtn);

    container.appendChild(pluginLabel);
    container.appendChild(buttonContainer);

    // Try to inject into settings page
    injectIntoSettingsPage(container);

    return container;
}

function injectIntoSettingsPage(container: HTMLElement) {
    // Check periodically for settings page
    const checkInterval = setInterval(() => {
        // Look for settings page indicators
        const settingsPage = document.querySelector('[data-page="settings"]') ||
                            document.querySelector('.settings-page') ||
                            Array.from(document.querySelectorAll('*')).find(el =>
                                el.textContent?.includes('계정 & 파일') ||
                                el.textContent?.includes('Account')
                            )?.closest('div');

        if (settingsPage && !document.getElementById('settings-backup-v3-ui')) {
            // Find a good insertion point
            const fileSection = Array.from(document.querySelectorAll('*')).find(el =>
                el.textContent?.includes('계정 & 파일') ||
                el.textContent?.includes('Account & File')
            );

            if (fileSection) {
                // Insert after the section header
                const parent = fileSection.parentElement;
                if (parent) {
                    parent.insertBefore(container, fileSection.nextSibling);
                    console.log('Settings Backup v3: UI injected into Settings page');
                    clearInterval(checkInterval);
                    return;
                }
            }

            // Fallback: append to settings page
            settingsPage.appendChild(container);
            console.log('Settings Backup v3: UI injected into Settings page (fallback)');
            clearInterval(checkInterval);
        }
    }, 500);

    // Stop checking after 30 seconds
    setTimeout(() => {
        clearInterval(checkInterval);
        // If still not injected, append to body as last resort
        if (!document.getElementById('settings-backup-v3-ui')) {
            console.warn('Settings Backup v3: Could not find settings page, appending to body');
            document.body.appendChild(container);
        }
    }, 30000);
}
