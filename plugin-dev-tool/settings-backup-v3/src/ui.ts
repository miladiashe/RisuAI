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
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
        z-index: 9999;
    `;

    const buttonStyle = `
        padding: 12px 20px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Export Settings';
    exportBtn.style.cssText = buttonStyle;
    exportBtn.onclick = options.onExport;

    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Import Settings';
    importBtn.style.cssText = buttonStyle + 'background: #2196F3;';
    importBtn.onclick = options.onImport;

    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    document.body.appendChild(container);

    return container;
}
